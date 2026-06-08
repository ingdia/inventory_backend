const { body } = require('express-validator');

const stockMovementRules = [
  body('medicineId').isMongoId().withMessage('Valid medicine ID is required'),
  body('type')
    .isIn(['stock_in', 'stock_out', 'adjustment'])
    .withMessage('Type must be stock_in, stock_out, or adjustment'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('reason').optional().trim(),
];

module.exports = { stockMovementRules };
