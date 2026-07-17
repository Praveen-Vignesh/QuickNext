import Product from '../models/Product.js';
import Order, { ORDER_STATUS, STOCK_HOLDING_STATUSES } from '../models/Order.js';

export class OutOfStockError extends Error {
  constructor(product, requested) {
    super(`Insufficient stock for "${product?.name ?? 'item'}"`);
    this.name = 'OutOfStockError';
    this.productId = product?._id;
    this.productName = product?.name;
    this.requested = requested;
    this.available = product?.stock ?? 0;
  }
}

/**
 * Reserve stock for one line, atomically.
 *
 * The `stock: { $gte: quantity }` filter and the `$inc` are evaluated together
 * inside a single MongoDB document update, so the read and the write cannot be
 * interleaved by another request. Two customers racing for the last unit both
 * match the filter at most once — one update succeeds, the other matches no
 * document and returns null. This is what prevents overselling.
 *
 * Returns the updated product, or null if there wasn't enough stock.
 */
function reserveOne(productId, quantity) {
  return Product.findOneAndUpdate(
    { _id: productId, isActive: true, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );
}

/** Give stock back for a set of lines. Best-effort and safe to call twice. */
export async function releaseStock(lines) {
  await Promise.all(
    lines.map((line) =>
      Product.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity } }).catch((err) =>
        // A failed compensation must not mask the original error, but it does
        // leave stock understated — so make sure it's visible in the logs.
        console.error('[stock] compensation failed for', line.productId, err.message)
      )
    )
  );
}

/**
 * Reserve stock for every line, or none of them.
 *
 * Each line is atomic on its own, but a multi-item cart is not: if line 3 fails
 * after lines 1 and 2 were already decremented, those two must be given back or
 * that stock is destroyed. We compensate by re-incrementing what succeeded.
 *
 * (Compensating writes rather than a multi-document transaction: Atlas M0 is a
 * replica set, but the free-tier docs don't guarantee transaction support, and
 * this is the headline feature — it shouldn't rest on an uncertain capability.)
 *
 * @param {{productId: string, quantity: number}[]} lines
 * @throws {OutOfStockError}
 */
export async function reserveStock(lines) {
  const reserved = [];

  for (const line of lines) {
    const updated = await reserveOne(line.productId, line.quantity);

    if (!updated) {
      await releaseStock(reserved);
      // Re-read to report what's actually available, for a useful message.
      const product = await Product.findById(line.productId);
      throw new OutOfStockError(product, line.quantity);
    }

    reserved.push(line);
  }

  return reserved;
}

/**
 * Cancel an order and return its stock to the catalog.
 *
 * The findOneAndUpdate claims the cancellation atomically: it only matches an
 * order that is still holding stock and hasn't been restored yet, and flips
 * both flags in the same operation. A double-clicked cancel button, a retried
 * request, or a sweeper racing a manual cancel will find no document on the
 * second pass and credit the stock exactly once.
 *
 * Returns the cancelled order, or null if it wasn't holding stock.
 */
export async function cancelOrderAndRestoreStock(orderId, { customerId } = {}) {
  const filter = {
    _id: orderId,
    stockRestored: false,
    status: { $in: STOCK_HOLDING_STATUSES },
  };
  if (customerId) filter.customerId = customerId;

  const order = await Order.findOneAndUpdate(
    filter,
    { $set: { stockRestored: true, status: ORDER_STATUS.CANCELLED } },
    { new: true }
  );

  if (!order) return null;

  await releaseStock(
    order.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
  );

  return order;
}
