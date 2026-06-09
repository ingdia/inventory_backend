const Inventory = require('./inventory.model');
const InventoryTransaction = require('./inventoryTransaction.model');
const Medicine = require('../medicines/medicine.model');
const { sendSuccess, sendError } = require('../../utils/response');

const MEDICINE_POPULATE = { path: 'medicine', select: 'name genericName unit reorderLevel purchasePrice sellingPrice expiryDate' };

exports.getAllInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [inventory, total] = await Promise.all([
      Inventory.find().populate(MEDICINE_POPULATE).skip(skip).limit(Number(limit)),
      Inventory.countDocuments(),
    ]);

    sendSuccess(res, 200, 'Inventory fetched', {
      inventory,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getInventoryByMedicine = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ medicine: req.params.medicineId }).populate(MEDICINE_POPULATE);
    if (!inventory) return sendError(res, 404, 'Inventory record not found');
    sendSuccess(res, 200, 'Inventory fetched', inventory);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.recordStockMovement = async (req, res) => {
  try {
    const { medicineId, type, quantity, reason } = req.body;

    const inventory = await Inventory.findOne({ medicine: medicineId });
    if (!inventory) return sendError(res, 404, 'Inventory record not found for this medicine');

    const previousQuantity = inventory.quantity;
    let newQuantity;

    if (type === 'stock_in') {
      newQuantity = previousQuantity + quantity;
    } else if (type === 'stock_out') {
      if (previousQuantity - quantity < 0) return sendError(res, 400, 'Insufficient stock');
      newQuantity = previousQuantity - quantity;
    } else {
      // adjustment: set directly
      newQuantity = quantity;
    }

    inventory.quantity = newQuantity;
    inventory.lastUpdatedBy = req.user._id;
    if (type === 'stock_in') inventory.lastRestockedAt = new Date();
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      medicine: medicineId,
      type,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
      performedBy: req.user._id,
    });

    sendSuccess(res, 201, 'Stock movement recorded', { inventory, transaction });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      InventoryTransaction.find()
        .populate(MEDICINE_POPULATE)
        .populate({ path: 'performedBy', select: 'firstName lastName' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InventoryTransaction.countDocuments(),
    ]);

    sendSuccess(res, 200, 'Transactions fetched', {
      transactions,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getTransactionsByMedicine = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { medicine: req.params.medicineId };
    const [transactions, total] = await Promise.all([
      InventoryTransaction.find(filter)
        .populate({ path: 'performedBy', select: 'firstName lastName' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InventoryTransaction.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Transactions fetched', {
      transactions,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [totalMedicines, inventories, medicines] = await Promise.all([
      Medicine.countDocuments({ status: 'active' }),
      Inventory.find().lean(),
      Medicine.find({ status: 'active' }).select('purchasePrice reorderLevel expiryDate').lean(),
    ]);

    const invMap = Object.fromEntries(inventories.map((i) => [i.medicine.toString(), i.quantity]));

    let totalStockValue = 0;
    let lowStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let outOfStockCount = 0;

    for (const m of medicines) {
      const qty = invMap[m._id.toString()] ?? 0;
      totalStockValue += qty * m.purchasePrice;
      if (qty === 0) outOfStockCount++;
      if (qty <= m.reorderLevel) lowStockCount++;
      if (m.expiryDate) {
        if (m.expiryDate < now) expiredCount++;
        else if (m.expiryDate <= in30Days) expiringCount++;
      }
    }

    sendSuccess(res, 200, 'Inventory summary', {
      totalMedicines,
      totalStockValue,
      lowStockCount,
      expiringCount,
      expiredCount,
      outOfStockCount,
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
