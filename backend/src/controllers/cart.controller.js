import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { HttpError } from '../middleware/error.middleware.js';

/**
 * Build the client-facing cart by joining the stored {productId, quantity}
 * against live Product data.
 *
 * This is why Cart stores no price or name: the basket persists, but what it
 * shows is always current. It also means the cart surfaces real-time stock and
 * flags anything that sold out while it was sitting there — the persistent
 * basket and the live stock indicator fall out of the same read.
 */
async function buildCartResponse(userId) {
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  if (!cart) return { items: [], subtotal: 0, hasIssues: false };

  const items = cart.items
    .filter((item) => item.productId) // product hard-deleted out from under us
    .map((item) => {
      const product = item.productId;
      const available = product.isActive && product.stock >= item.quantity;

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? null,
        quantity: item.quantity,
        stock: product.stock,
        isActive: product.isActive,
        available,
        lineTotal: product.price * item.quantity,
      };
    });

  // Only count what can actually be bought right now.
  const subtotal = items
    .filter((item) => item.available)
    .reduce((sum, item) => sum + item.lineTotal, 0);

  return { items, subtotal, hasIssues: items.some((item) => !item.available) };
}

export async function getCart(req, res) {
  res.json(await buildCartResponse(req.user._id));
}

/**
 * Replace the whole basket in one call.
 *
 * Wholesale replacement rather than add/remove/update endpoints: the frontend
 * already holds cart state, so it just PUTs the current array (debounced). One
 * endpoint instead of four, and no add-vs-update race between them.
 */
export async function replaceCart(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items)) throw new HttpError(400, 'items must be an array');

  // Merge duplicate lines so the same product can't appear twice.
  const merged = new Map();
  for (const item of items) {
    if (!mongoose.isValidObjectId(item?.productId)) {
      throw new HttpError(400, `Invalid productId: ${item?.productId}`);
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, 'quantity must be a positive integer');
    }
    const key = String(item.productId);
    merged.set(key, (merged.get(key) ?? 0) + quantity);
  }

  const normalized = [...merged].map(([productId, quantity]) => ({ productId, quantity }));

  // Reject unknown/inactive products rather than storing a dead reference.
  if (normalized.length > 0) {
    const ids = normalized.map((item) => item.productId);
    const found = await Product.countDocuments({ _id: { $in: ids }, isActive: true });
    if (found !== ids.length) throw new HttpError(400, 'Cart contains unavailable products');
  }

  // upsert + the unique index on userId means concurrent writes converge on
  // one cart instead of creating duplicates.
  await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { items: normalized } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json(await buildCartResponse(req.user._id));
}

export async function clearCart(req, res) {
  await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { items: [] } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ items: [], subtotal: 0, hasIssues: false });
}

export { buildCartResponse };
