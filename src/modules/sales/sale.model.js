const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  medicine:  { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  total:     { type: Number, required: true },
});

const saleSchema = new mongoose.Schema({
  receiptNo:     { type: String, unique: true },
  customerName:  { type: String },
  items:         [saleItemSchema],
  subtotal:      { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'insurance'], required: true },
  status:        { type: String, enum: ['completed', 'cancelled', 'refunded'], default: 'completed' },
  soldBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

saleSchema.pre('save', async function (next) {
  if (!this.receiptNo) {
    const count = await mongoose.model('Sale').countDocuments();
    this.receiptNo = `RCP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

saleSchema.index({ createdAt: 1 });
saleSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Sale', saleSchema);
