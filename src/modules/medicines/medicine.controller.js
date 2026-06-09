const Medicine = require('./medicine.model');
const Inventory = require('../inventory/inventory.model');
const { sendSuccess, sendError } = require('../../utils/response');

const POPULATE = [
  { path: 'category', select: 'name' },
  { path: 'supplier', select: 'name' },
  { path: 'createdBy', select: 'firstName lastName' },
];

exports.createMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create({ ...req.body, createdBy: req.user._id });
    await Inventory.create({ medicine: medicine._id, lastUpdatedBy: req.user._id });
    sendSuccess(res, 201, 'Medicine created', medicine);
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, 'Medicine already exists');
    sendError(res, 500, err.message);
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const {
      search, category, supplier, status,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
    ];
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(Number(limit)),
      Medicine.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Medicines fetched', {
      medicines,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate(POPULATE);
    if (!medicine) return sendError(res, 404, 'Medicine not found');
    sendSuccess(res, 200, 'Medicine fetched', medicine);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate(POPULATE);
    if (!medicine) return sendError(res, 404, 'Medicine not found');
    sendSuccess(res, 200, 'Medicine updated', medicine);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return sendError(res, 404, 'Medicine not found');
    await Inventory.deleteOne({ medicine: req.params.id });
    sendSuccess(res, 200, 'Medicine deleted');
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const medicines = await Medicine.find({ status: 'active' }).populate(POPULATE).lean();
    const inventories = await Inventory.find().lean();
    const invMap = Object.fromEntries(inventories.map((i) => [i.medicine.toString(), i.quantity]));

    const lowStock = medicines.filter((m) => (invMap[m._id.toString()] ?? 0) <= m.reorderLevel);
    sendSuccess(res, 200, 'Low stock medicines', lowStock);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getExpiringMedicines = async (req, res) => {
  try {
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const medicines = await Medicine.find({
      expiryDate: { $gt: new Date(), $lte: in30Days },
    }).populate(POPULATE);
    sendSuccess(res, 200, 'Expiring medicines', medicines);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getExpiredMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ expiryDate: { $lt: new Date() } }).populate(POPULATE);
    sendSuccess(res, 200, 'Expired medicines', medicines);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
