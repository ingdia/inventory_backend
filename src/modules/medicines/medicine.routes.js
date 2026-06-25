const express = require('express');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { medicineRules, updateMedicineRules } = require('./medicine.validation');
const c = require('./medicine.controller');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Medicines
 *   description: Medicine management
 */

/**
 * @swagger
 * /medicines/low-stock:
 *   get:
 *     summary: Get medicines below reorder level
 *     tags: [Medicines]
 *     responses:
 *       200:
 *         description: Low stock medicines
 */
router.get('/low-stock', c.getLowStock);

/**
 * @swagger
 * /medicines/expiring:
 *   get:
 *     summary: Get medicines expiring soon
 *     tags: [Medicines]
 *     responses:
 *       200:
 *         description: Expiring medicines
 */
router.get('/expiring', c.getExpiringMedicines);

/**
 * @swagger
 * /medicines/expired:
 *   get:
 *     summary: Get expired medicines
 *     tags: [Medicines]
 *     responses:
 *       200:
 *         description: Expired medicines
 */
router.get('/expired', c.getExpiredMedicines);

/**
 * @swagger
 * /medicines:
 *   get:
 *     summary: Get all medicines
 *     tags: [Medicines]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of medicines
 *   post:
 *     summary: Create a new medicine (owner/pharmacist)
 *     tags: [Medicines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, unit, purchasePrice, sellingPrice]
 *             properties:
 *               name:          { type: string, example: Paracetamol }
 *               genericName:   { type: string, example: Acetaminophen }
 *               category:      { type: string, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *               unit:          { type: string, enum: [tablet, capsule, syrup, injection, cream, drops, other] }
 *               purchasePrice: { type: number, example: 500 }
 *               sellingPrice:  { type: number, example: 800 }
 *               reorderLevel:  { type: number, example: 10 }
 *     responses:
 *       201:
 *         description: Medicine created
 */
router.get('/', c.getMedicines);
router.post('/', restrictTo('owner', 'pharmacist'), medicineRules, validate, c.createMedicine);

/**
 * @swagger
 * /medicines/{id}:
 *   get:
 *     summary: Get medicine by ID
 *     tags: [Medicines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Medicine data
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update medicine (owner/pharmacist)
 *     tags: [Medicines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:          { type: string }
 *               purchasePrice: { type: number }
 *               sellingPrice:  { type: number }
 *               reorderLevel:  { type: number }
 *     responses:
 *       200:
 *         description: Medicine updated
 *   delete:
 *     summary: Delete medicine (owner only)
 *     tags: [Medicines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Medicine deleted
 */
router.get('/:id', c.getMedicine);
router.put('/:id', restrictTo('owner', 'pharmacist'), updateMedicineRules, validate, c.updateMedicine);
router.delete('/:id', restrictTo('owner'), c.deleteMedicine);

module.exports = router;
