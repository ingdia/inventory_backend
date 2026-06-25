const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const ctrl = require('./reports.controller');

router.use(protect, restrictTo('owner'));

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Owner-only reporting endpoints
 */

/**
 * @swagger
 * /reports/sales:
 *   get:
 *     summary: Paginated sales report with summary
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, mobile_money, insurance]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Sales report with summary and pagination
 */
router.get('/sales', ctrl.getSalesReport);

/**
 * @swagger
 * /reports/inventory:
 *   get:
 *     summary: Current inventory snapshot report
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_stock, low_stock, out_of_stock, expired]
 *     responses:
 *       200:
 *         description: Inventory snapshot with summary
 */
router.get('/inventory', ctrl.getInventoryReport);

/**
 * @swagger
 * /reports/profit-loss:
 *   get:
 *     summary: Profit and Loss report
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month]
 *           default: month
 *     responses:
 *       200:
 *         description: P&L summary and breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 summary:
 *                   $ref: '#/components/schemas/ProfitSummary'
 */
router.get('/profit-loss', ctrl.getProfitLoss);

/**
 * @swagger
 * /reports/purchases:
 *   get:
 *     summary: Paginated purchases report with summary
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: supplier
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, received, cancelled]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Purchases report with summary and pagination
 */
router.get('/purchases', ctrl.getPurchasesReport);

module.exports = router;
