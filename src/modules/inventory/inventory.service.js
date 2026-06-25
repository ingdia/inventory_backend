const Medicine = require('../medicines/medicine.model');

async function recordStockMovement({ medicine, type, quantity, reason, performedBy, session }) {
  const delta = type === 'stock_in' ? quantity : -quantity;

  const updated = await Medicine.findByIdAndUpdate(
    medicine,
    { $inc: { stock: delta } },
    { new: true, session }
  );

  if (!updated) throw new Error(`Medicine not found: ${medicine}`);
  if (updated.stock < 0) throw new Error(`Insufficient stock for ${updated.name}`);

  return updated;
}

module.exports = { recordStockMovement };
