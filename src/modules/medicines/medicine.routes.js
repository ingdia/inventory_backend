const express = require('express');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const { validate } = require('../../validators/auth.validator');
const { medicineRules, updateMedicineRules } = require('./medicine.validation');
const c = require('./medicine.controller');

const router = express.Router();

router.use(protect);

// Specific routes before :id to avoid conflicts
router.get('/low-stock', c.getLowStock);
router.get('/expiring', c.getExpiringMedicines);
router.get('/expired', c.getExpiredMedicines);

router.get('/', c.getMedicines);
router.post('/', restrictTo('owner', 'pharmacist'), medicineRules, validate, c.createMedicine);

router.get('/:id', c.getMedicine);
router.put('/:id', restrictTo('owner', 'pharmacist'), updateMedicineRules, validate, c.updateMedicine);
router.delete('/:id', restrictTo('owner'), c.deleteMedicine);

module.exports = router;
