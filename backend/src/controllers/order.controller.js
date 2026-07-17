import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order, { ORDER_STATUS } from '../models/Order.js';
import { HttpError } from '../middleware/error.middleware.js';
import {
  reserveStock,
  releaseStock,
  cancelOrderAndRestoreStock,
  OutOfStockError,
} from '../services/stock.service.js';
import {
  createPaymentIntent,
  verifyRazorpaySignature,
  paymentProvider,
} from '../services/payment.service.js';

/**
 * Checkout.
 *
 * Order of operations matters. Stock is reserved *before* the order exists and
 * before the payment provider is called, because reserving is the only step
 * that can legitimately fail on a race — better to lose the race before taking
 * anyone's money. Every step after the reservation compensates on failure, or
 * that stock is silently destroyed.
 */
export async function createOrder(req, res) {
  const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart || cart.items.length === 0) throw new HttpError(400, 'Cart is empty');

  const lines = cart.items
    .filter((item) => item.productId && item.productId.isActive)
    .map((item) => ({
      productId: item.productId._id,
      vendorId: item.productId.vendorId,
      name: item.productId.name,
      price: item.productId.price, // snapshot: taken here, at purchase time
      quantity: item.quantity,
    }));

  if (lines.length === 0) throw new HttpError(400, 'No purchasable items in cart');

  // 1. Reserve stock atomically, all-or-nothing.
  let reserved;
  try {
    reserved = await reserveStock(
      lines.map((line) => ({ productId: line.productId, quantity: line.quantity }))
    );
  } catch (err) {
    if (err instanceof OutOfStockError) {
      throw new HttpError(409, err.message, {
        productId: err.productId,
        productName: err.productName,
        requested: err.requested,
        available: err.available,
      });
    }
    throw err;
  }

  const totalAmount = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  // 2. Create the order. If this throws, the stock from step 1 is already gone.
  let order;
  try {
    order = await Order.create({
      customerId: req.user._id,
      items: lines,
      totalAmount,
      status: ORDER_STATUS.PENDING_PAYMENT,
      paymentProvider: paymentProvider(),
    });
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }

  // 3. Ask the provider for a payment intent. If Razorpay is down, cancel the
  //    order and give the stock back rather than stranding it.
  let payment;
  try {
    payment = await createPaymentIntent(order);
  } catch (err) {
    console.error('[payment] intent creation failed:', err.message);
    await cancelOrderAndRestoreStock(order._id);
    throw new HttpError(502, 'Payment provider is unavailable, please retry');
  }

  if (payment.razorpayOrderId) {
    order.razorpayOrderId = payment.razorpayOrderId;
    await order.save();
  }

  res.status(201).json({ order, payment });
}

/**
 * Confirm payment and mark the order paid.
 *
 * On the Razorpay path this is the security boundary: the browser saying
 * "it worked" means nothing, so we recompute the HMAC over
 * `<order_id>|<payment_id>` with the key secret and compare. We also check the
 * returned razorpay_order_id belongs to *this* order, so a valid signature from
 * some other (cheaper) order can't be replayed against this one.
 */
export async function confirmPayment(req, res) {
  const { orderId, razorpayOrderId, razorpayPaymentId, signature } = req.body;
  if (!mongoose.isValidObjectId(orderId)) throw new HttpError(400, 'Invalid order id');

  const order = await Order.findOne({ _id: orderId, customerId: req.user._id });
  if (!order) throw new HttpError(404, 'Order not found');

  // Idempotent: a retried confirm on an already-paid order is not an error.
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    return res.json({ order, alreadyProcessed: true });
  }

  if (order.paymentProvider === 'razorpay') {
    if (razorpayOrderId !== order.razorpayOrderId) {
      throw new HttpError(400, 'Payment does not belong to this order');
    }
    const valid = verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature });
    if (!valid) throw new HttpError(400, 'Payment signature verification failed');

    order.razorpayPaymentId = razorpayPaymentId;
  }
  // On the simulated provider there is no signature to check — the order is
  // simply confirmed. Stock was already reserved at step 1 of createOrder.

  order.status = ORDER_STATUS.PAID;
  await order.save();

  // Basket is only emptied once the money is confirmed, so a failed payment
  // leaves the customer's cart intact to retry.
  await Cart.updateOne({ userId: req.user._id }, { $set: { items: [] } });

  res.json({ order });
}

/**
 * Customer-initiated cancel — the "user dismissed the payment modal" path.
 * Returns the reserved stock to the catalog.
 */
export async function cancelOrder(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid order id');

  const order = await cancelOrderAndRestoreStock(req.params.id, { customerId: req.user._id });
  if (!order) {
    throw new HttpError(409, 'Order is already paid, cancelled, or does not exist');
  }

  res.json({ order });
}

export async function myOrders(req, res) {
  const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ orders });
}
