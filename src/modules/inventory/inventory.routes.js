const express = require('express');
const { protect } = require('../../middleware/auth.middleware');
const { validate } = require('../../validators/auth.validator');
const { stockMovementRules } = require('./inventory.validation');
const c = require('./inventory.controller');

const router = express.Router();

router.use(protect);

router.get('/summary', c.getSummary);
router.get('/transactions', c.getAllTransactions);
router.get('/transactions/:medicineId', c.getTransactionsByMedicine);
router.post('/stock-movement', stockMovementRules, validate, c.recordStockMovement);
router.get('/', c.getAllInventory);
router.get('/:medicineId', c.getInventoryByMedicine);

module.exports = router;
