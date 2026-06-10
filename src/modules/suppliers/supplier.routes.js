const express = require('express');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const c = require('./supplier.controller');

const router = express.Router();

router.use(protect);

router.get('/', c.getSuppliers);
router.get('/:id', c.getSupplierById);
router.post('/', restrictTo('owner', 'pharmacist'), c.createSupplier);
router.patch('/:id', restrictTo('owner', 'pharmacist'), c.updateSupplier);
router.delete('/:id', restrictTo('owner'), c.deleteSupplier);

module.exports = router;
