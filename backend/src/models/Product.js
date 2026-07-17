import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
    images: { type: [String], default: [] },

    // min: 0 is a last-resort guard. The real protection against overselling
    // is the conditional update in services/stock.service.js.
    stock: { type: Number, required: true, default: 0, min: 0 },

    // Soft delete. Products referenced by past orders must never be removed,
    // or order history loses its product links.
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
