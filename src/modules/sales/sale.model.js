const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    unit: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: Number,
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, unique: true, required: true, index: true },
    receiptNo: { type: String },
    customer: { name: String },
    customerName: { type: String },
    items: [saleItemSchema],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: Number,
    totalAmount: Number,
    paymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'insurance'],
      required: true,
    },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['completed', 'cancelled', 'refunded', 'voided'], default: 'completed' },
  },
  { timestamps: true }
);

saleSchema.pre('save', function (next) {
  let subtotal = 0;
  for (const item of this.items) {
    item.subtotal = item.quantity * item.unitPrice;
    subtotal += item.subtotal;
  }
  this.subtotal = subtotal;
  this.total = subtotal - this.discount + this.tax;
  this.totalAmount = this.total;
  if (!this.receiptNo) this.receiptNo = this.receiptNumber;
  next();
});

saleSchema.index({ createdAt: 1 });
saleSchema.index({ paymentMethod: 1 });
saleSchema.index({ soldBy: 1, createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
