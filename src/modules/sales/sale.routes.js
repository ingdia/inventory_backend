const express = require('express');
const { protect } = require('../../middleware/auth.middleware');
const { validateSale } = require('./sale.validation');
const c = require('./sale.controller');

const router = express.Router();

router.use(protect);

router.get('/summary/today', c.getTodaySummary);
router.get('/summary/range', c.getSummaryByRange);
router.get('/', c.getSales);
router.get('/:id', c.getSaleById);
router.post('/', validateSale, c.createSale);

module.exports = router;
