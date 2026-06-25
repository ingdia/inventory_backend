const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, unique: true },
    quantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10 },
    expiryDate: { type: Date },
    batchNumber: { type: String },
    lastRestockedAt: Date,
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
