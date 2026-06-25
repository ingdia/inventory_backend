const express = require('express');
const { protect } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { stockMovementRules } = require('./inventory.validation');
const c = require('./inventory.controller');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management
 */

/**
 * @swagger
 * /inventory/summary:
 *   get:
 *     summary: Get inventory summary stats
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Inventory summary
 */
router.get('/summary', c.getSummary);

/**
 * @swagger
 * /inventory/transactions:
 *   get:
 *     summary: Get all stock transactions
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of stock transactions
 */
router.get('/transactions', c.getAllTransactions);

/**
 * @swagger
 * /inventory/transactions/{medicineId}:
 *   get:
 *     summary: Get transactions for a specific medicine
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: medicineId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transactions for the medicine
 */
router.get('/transactions/:medicineId', c.getTransactionsByMedicine);

/**
 * @swagger
 * /inventory/stock-movement:
 *   post:
 *     summary: Record a stock movement (in/out)
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [medicine, type, quantity]
 *             properties:
 *               medicine: { type: string, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *               type:     { type: string, enum: [in, out, adjustment] }
 *               quantity: { type: number, example: 100 }
 *               note:     { type: string, example: Restock from supplier }
 *     responses:
 *       200:
 *         description: Stock movement recorded
 */
router.post('/stock-movement', stockMovementRules, validate, c.recordStockMovement);

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: List of inventory items
 */
router.get('/', c.getAllInventory);

/**
 * @swagger
 * /inventory/{medicineId}:
 *   get:
 *     summary: Get inventory for a specific medicine
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: medicineId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Inventory item
 */
router.get('/:medicineId', c.getInventoryByMedicine);

module.exports = router;
