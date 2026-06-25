const { body } = require('express-validator');

const validateSale = [
  body('items')
    .exists({ checkNull: true }).withMessage('Items are required')
    .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.medicine')
    .exists({ checkNull: true }).withMessage('Medicine is required')
    .isMongoId().withMessage('Invalid medicine ID'),
  body('items.*.quantity')
    .exists({ checkNull: true }).withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice')
    .exists({ checkNull: true }).withMessage('Unit price is required')
    .isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
  body('paymentMethod')
    .exists({ checkNull: true }).withMessage('Payment method is required')
    .isIn(['cash', 'mobile_money', 'insurance']).withMessage('Invalid payment method'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be 0 or greater'),
  body('tax').optional().isFloat({ min: 0 }).withMessage('Tax must be 0 or greater'),
  body('customer.name').optional().isString().withMessage('Customer name must be a string'),
];

module.exports = { validateSale };
