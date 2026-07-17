import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { escapeRegex } from '../utils/regex.js';
import { HttpError } from '../middleware/error.middleware.js';

/**
 * Public catalog: search, category filter, pagination.
 *
 * Substring regex rather than a text index, deliberately: a text index only
 * matches whole words, so "lap" would not find "Laptop" — which is exactly what
 * someone typing into a search box expects. Fine at this catalog size; Atlas
 * Search would be the answer at scale.
 */
export async function listProducts(req, res) {
  const { category, search } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('vendorId', 'name'),
    Product.countDocuments(filter),
  ]);

  res.json({
    items,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    // The catalog is polled every few seconds for live stock; this timestamp
    // makes it obvious in the UI that the numbers are fresh.
    fetchedAt: new Date().toISOString(),
  });
}

/** Powers the category filter UI. Must be routed before /:id. */
export async function listCategories(req, res) {
  const categories = await Product.distinct('category', { isActive: true });
  res.json({ categories: categories.sort() });
}

export async function getProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid product id');

  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate(
    'vendorId',
    'name'
  );
  if (!product) throw new HttpError(404, 'Product not found');

  res.json({ product, fetchedAt: new Date().toISOString() });
}
