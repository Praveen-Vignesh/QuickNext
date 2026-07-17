import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayEnabled } from '../config/env.js';

// Only constructed when keys are present. Without them the whole app still
// runs on the simulated path — that keeps checkout demoable from hour one and
// doubles as the fallback if venue wifi can't reach checkout.razorpay.com.
const client = razorpayEnabled
  ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  : null;

export function paymentProvider() {
  return razorpayEnabled ? 'razorpay' : 'simulated';
}

/** Razorpay bills in the smallest currency unit — paise, not rupees. */
function toPaise(rupees) {
  return Math.round(rupees * 100);
}

/**
 * Create the provider-side intent for an order.
 *
 * Returns the shape the frontend needs to open checkout. On the simulated
 * provider there is nothing to create — the frontend just calls the confirm
 * endpoint directly.
 */
export async function createPaymentIntent(order) {
  if (!razorpayEnabled) {
    return {
      provider: 'simulated',
      orderId: order._id.toString(),
      amount: toPaise(order.totalAmount),
      currency: 'INR',
    };
  }

  const rpOrder = await client.orders.create({
    amount: toPaise(order.totalAmount),
    currency: 'INR',
    receipt: order._id.toString(), // Razorpay caps receipt at 40 chars; an ObjectId is 24.
    notes: { orderId: order._id.toString() },
  });

  return {
    provider: 'razorpay',
    orderId: order._id.toString(),
    razorpayOrderId: rpOrder.id,
    amount: rpOrder.amount,
    currency: rpOrder.currency,
    keyId: env.RAZORPAY_KEY_ID, // publishable; safe to send to the browser
  };
}

/**
 * Verify a Razorpay callback.
 *
 * Razorpay signs `<razorpay_order_id>|<razorpay_payment_id>` with the key
 * secret. Recomputing that HMAC server-side is what proves the callback came
 * from Razorpay and wasn't forged by the browser — never trust the client's
 * word that a payment succeeded.
 */
export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!razorpayEnabled) return false;
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');

  // timingSafeEqual throws on length mismatch, so check that first.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
