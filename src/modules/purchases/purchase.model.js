const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    subtotal: Number,
    total: Number,
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true, sparse: true },
    invoiceNumber: { type: String },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [purchaseItemSchema],
    totalAmount: Number,
    status: { type: String, enum: ['pending', 'received', 'cancelled'], default: 'pending' },
    purchaseDate: { type: Date, default: Date.now },
    expectedDelivery: Date,
    notes: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receivedAt: Date,
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ purchaseDate: 1 });
purchaseSchema.index({ recordedBy: 1 });
purchaseSchema.index({ status: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
