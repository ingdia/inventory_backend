const { body } = require('express-validator');

const validatePurchase = [
  body('supplier')
    .exists({ checkNull: true }).withMessage('Supplier is required')
    .isMongoId().withMessage('Invalid supplier ID'),
  body('invoiceNumber')
    .exists({ checkNull: true }).withMessage('Invoice number is required')
    .isString().notEmpty().withMessage('Invoice number cannot be empty'),
  body('purchaseDate')
    .exists({ checkNull: true }).withMessage('Purchase date is required')
    .isISO8601().withMessage('Purchase date must be a valid ISO 8601 date'),
  body('expectedDelivery').optional().isISO8601().withMessage('Expected delivery must be a valid date'),
  body('items')
    .exists({ checkNull: true }).withMessage('Items are required')
    .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.medicine')
    .exists({ checkNull: true }).withMessage('Medicine is required')
    .isMongoId().withMessage('Invalid medicine ID'),
  body('items.*.quantity')
    .exists({ checkNull: true }).withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.purchasePrice')
    .exists({ checkNull: true }).withMessage('Purchase price is required')
    .isFloat({ min: 0 }).withMessage('Purchase price must be 0 or greater'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
];

module.exports = { validatePurchase };
