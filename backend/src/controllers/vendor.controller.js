import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order, { ORDER_STATUS } from '../models/Order.js';
import { HttpError } from '../middleware/error.middleware.js';

/* ------------------------------- catalog CRUD ------------------------------ */

export async function listOwnProducts(req, res) {
  const products = await Product.find({ vendorId: req.user._id, isActive: true }).sort({
    createdAt: -1,
  });
  res.json({ products });
}

export async function createProduct(req, res) {
  const { name, description, price, category, images, stock } = req.body;

  const product = await Product.create({
    vendorId: req.user._id, // never trusted from the body
    name,
    description,
    price,
    category,
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    stock,
  });

  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid product id');

  const { name, description, price, category, images, stock } = req.body;

  // vendorId in the filter is the ownership guard: a vendor cannot edit another
  // vendor's listing by guessing its id.
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user._id },
    {
      $set: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(category !== undefined && { category }),
        ...(images !== undefined && { images: Array.isArray(images) ? images.filter(Boolean) : [] }),
        ...(stock !== undefined && { stock }),
      },
    },
    { new: true, runValidators: true }
  );

  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ product });
}

/**
 * Soft delete. Past orders reference this product, so the document must stay;
 * isActive: false removes it from the catalog without breaking order history.
 */
export async function deleteProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid product id');

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user._id },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ product });
}

/* -------------------------------- orders ---------------------------------- */

export async function listVendorOrders(req, res) {
  const orders = await Order.find({
    'items.vendorId': req.user._id,
    status: { $ne: ORDER_STATUS.PENDING_PAYMENT }, // unpaid carts aren't the vendor's business
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('customerId', 'name email');

  // Show each vendor only their own lines of a shared order.
  const scoped = orders.map((order) => ({
    _id: order._id,
    status: order.status,
    createdAt: order.createdAt,
    customer: order.customerId,
    items: order.items.filter((item) => String(item.vendorId) === String(req.user._id)),
    vendorTotal: order.items
      .filter((item) => String(item.vendorId) === String(req.user._id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0),
  }));

  res.json({ orders: scoped });
}

// The fulfilment pipeline a vendor can advance an order through.
const ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.COMPLETED],
};

export async function updateOrderStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid order id');

  const { status } = req.body;

  // 'items.vendorId' in the filter guards ownership.
  const order = await Order.findOne({ _id: req.params.id, 'items.vendorId': req.user._id });
  if (!order) throw new HttpError(404, 'Order not found');

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw new HttpError(400, `Cannot move an order from '${order.status}' to '${status}'`);
  }

  order.status = status;
  await order.save();

  res.json({ order });
}

/* ------------------------------- dashboard -------------------------------- */

const REVENUE_STATUSES = [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING, ORDER_STATUS.COMPLETED];

/**
 * The three numbers the brief names, plus a 7-day series for the chart.
 *
 * The $match before $unwind uses the {'items.vendorId': 1, status: 1} index to
 * cut the candidate orders; the $match after it drops the other vendors' lines
 * from a shared order so revenue is attributed correctly.
 */
export async function dashboard(req, res) {
  const vendorId = req.user._id;

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [byStatus, daily, productCount] = await Promise.all([
    Order.aggregate([
      { $match: { 'items.vendorId': vendorId } },
      { $unwind: '$items' },
      { $match: { 'items.vendorId': vendorId } },
      {
        $group: {
          _id: '$status',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' },
          orderIds: { $addToSet: '$_id' },
        },
      },
      { $project: { _id: 0, status: '$_id', revenue: 1, units: 1, orders: { $size: '$orderIds' } } },
    ]),

    Order.aggregate([
      {
        $match: {
          'items.vendorId': vendorId,
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: since },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.vendorId': vendorId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderIds: { $addToSet: '$_id' },
        },
      },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: { $size: '$orderIds' } } },
      { $sort: { date: 1 } },
    ]),

    Product.countDocuments({ vendorId, isActive: true }),
  ]);

  const pick = (statuses) => byStatus.filter((row) => statuses.includes(row.status));
  const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);

  // Fill gaps so the chart shows a continuous 7 days rather than only days with sales.
  const series = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(since);
    day.setDate(since.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const found = daily.find((row) => row.date === key);
    series.push({ date: key, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 });
  }

  res.json({
    summary: {
      // "gross order totals"
      grossRevenue: sum(pick(REVENUE_STATUSES), 'revenue'),
      grossOrders: sum(pick(REVENUE_STATUSES), 'orders'),
      // "active processing pipelines"
      activeOrders: sum(pick([ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING]), 'orders'),
      activeRevenue: sum(pick([ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING]), 'revenue'),
      // "completed customer transactions"
      completedOrders: sum(pick([ORDER_STATUS.COMPLETED]), 'orders'),
      completedRevenue: sum(pick([ORDER_STATUS.COMPLETED]), 'revenue'),
      unitsSold: sum(pick(REVENUE_STATUSES), 'units'),
      activeListings: productCount,
    },
    byStatus,
    series,
  });
}
