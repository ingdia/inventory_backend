const Category = require('./category.model');
const { sendSuccess, sendError } = require('../../utils/response');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    sendSuccess(res, 200, 'Categories retrieved.', { categories });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    sendSuccess(res, 201, 'Category created.', { category });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, 'Category already exists.');
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return sendError(res, 404, 'Category not found.');
    sendSuccess(res, 200, 'Category updated.', { category });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return sendError(res, 404, 'Category not found.');
    sendSuccess(res, 200, 'Category deleted.');
  } catch (err) { next(err); }
};
