const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const c = require('./category.controller');

router.use(protect);

router.get('/', c.getCategories);
router.post('/', restrictTo('owner', 'pharmacist'), c.createCategory);
router.patch('/:id', restrictTo('owner', 'pharmacist'), c.updateCategory);
router.delete('/:id', restrictTo('owner'), c.deleteCategory);

module.exports = router;
