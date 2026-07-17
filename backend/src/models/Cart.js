import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    // One cart per user. The unique index is what makes the upsert in
    // cart.controller.js safe under concurrent writes.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Deliberately stores no price or name. A cart must reflect live price
    // and live stock, so GET /api/cart populates those from Product at read
    // time. Snapshotting belongs at order time only — see Order.items.
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
