const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    type: { type: String, enum: ['stock_in', 'stock_out', 'adjustment'], required: true },
    quantity: { type: Number, required: true },
    previousQuantity: Number,
    newQuantity: Number,
    reason: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
