const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  medicine:  { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitCost:  { type: Number, required: true },
  total:     { type: Number, required: true },
});

const purchaseSchema = new mongoose.Schema({
  invoiceNo:    { type: String, unique: true, sparse: true },
  supplier:     { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items:        [purchaseItemSchema],
  totalAmount:  { type: Number, required: true },
  status:       { type: String, enum: ['pending', 'received', 'cancelled'], default: 'pending' },
  purchaseDate: { type: Date, default: Date.now },
  recordedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

purchaseSchema.index({ purchaseDate: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
