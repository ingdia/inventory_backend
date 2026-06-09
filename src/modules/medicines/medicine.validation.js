const { body } = require('express-validator');

const medicineRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('unit')
    .isIn(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'other'])
    .withMessage('Invalid unit'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be >= 0'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be >= 0'),
  body('supplier').optional().isMongoId().withMessage('Valid supplier ID required'),
  body('reorderLevel').optional().isInt({ min: 0 }),
  body('expiryDate').optional().isISO8601().withMessage('Valid date required'),
  body('status').optional().isIn(['active', 'inactive']),
];

const updateMedicineRules = medicineRules.map((rule) => rule.optional());

module.exports = { medicineRules, updateMedicineRules };
