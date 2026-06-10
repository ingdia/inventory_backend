const Supplier = require('./supplier.model');
const { sendSuccess, sendError } = require('../../utils/response');

exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const filter = { isActive: true };

    if (search) filter.name = { $regex: search, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 100);
    const skip = (pageNum - 1) * limitNum;

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
      Supplier.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Suppliers retrieved.', {
      suppliers,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return sendError(res, 404, 'Supplier not found.');
    return sendSuccess(res, 200, 'Supplier retrieved.', { supplier });
  } catch (err) {
    next(err);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body;
    const supplier = await Supplier.create({ name, contactPerson, phone, email, address });
    return sendSuccess(res, 201, 'Supplier created successfully.', { supplier });
  } catch (err) {
    next(err);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, isActive } = req.body;
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name, contactPerson, phone, email, address, isActive },
      { new: true, runValidators: true }
    );
    if (!supplier) return sendError(res, 404, 'Supplier not found.');
    return sendSuccess(res, 200, 'Supplier updated successfully.', { supplier });
  } catch (err) {
    next(err);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!supplier) return sendError(res, 404, 'Supplier not found.');
    return sendSuccess(res, 200, 'Supplier deactivated successfully.');
  } catch (err) {
    next(err);
  }
};
