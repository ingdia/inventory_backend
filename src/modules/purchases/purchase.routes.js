const express = require('express');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const { validatePurchase } = require('./purchase.validation');
const c = require('./purchase.controller');

const router = express.Router();

router.use(protect);

router.get('/', c.getPurchases);
router.get('/:id', c.getPurchaseById);
router.post('/', validatePurchase, c.createPurchase);
router.put('/:id/receive', c.receivePurchase);
router.put('/:id/cancel', restrictTo('owner'), c.cancelPurchase);

module.exports = router;
