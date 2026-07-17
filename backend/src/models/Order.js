import mongoose from 'mongoose';

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Statuses whose stock is currently held out of circulation. Cancelling an
// order in one of these must give the stock back; cancelling any other must not.
export const STOCK_HOLDING_STATUSES = [
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.PAID,
  ORDER_STATUS.PROCESSING,
];

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

    // Denormalised so the vendor dashboard aggregates without a join, and so
    // a multi-vendor cart resolves to the right seller per line.
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Snapshot at purchase time. If the vendor later edits the price or name,
    // this order must still show what the customer actually agreed to pay.
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING_PAYMENT,
      index: true,
    },

    paymentProvider: { type: String, enum: ['simulated', 'razorpay'], default: 'simulated' },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String },

    // Guard against double-restoring stock if cancel is called twice
    // (double-clicked button, retried request, sweeper racing a manual cancel).
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Drives GET /api/vendor/orders and the dashboard aggregation.
orderSchema.index({ 'items.vendorId': 1, status: 1 });

export default mongoose.model('Order', orderSchema);
