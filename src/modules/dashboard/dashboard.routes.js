const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const ctrl = require('./dashboard.controller');

router.use(protect, restrictTo('owner'));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Owner dashboard KPI and analytics (owner only)
 */

/**
 * @swagger
 * /dashboard/metrics:
 *   get:
 *     summary: Key business metric cards
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: KPI metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Metrics'
 */
router.get('/metrics', ctrl.getMetrics);

/**
 * @swagger
 * /dashboard/revenue-chart:
 *   get:
 *     summary: Revenue over time chart data
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 3m, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Array of date + revenue + transactions
 */
router.get('/revenue-chart', ctrl.getRevenueChart);

/**
 * @swagger
 * /dashboard/top-medicines:
 *   get:
 *     summary: Top 10 best selling medicines
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Top medicines by quantity sold
 */
router.get('/top-medicines', ctrl.getTopMedicines);

/**
 * @swagger
 * /dashboard/sales-by-payment:
 *   get:
 *     summary: Sales breakdown by payment method
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Payment method breakdown with percentages
 */
router.get('/sales-by-payment', ctrl.getSalesByPayment);

/**
 * @swagger
 * /dashboard/profit-summary:
 *   get:
 *     summary: Revenue, COGS, Gross Profit and Margin
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Profit summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/ProfitSummary'
 */
router.get('/profit-summary', ctrl.getProfitSummary);

/**
 * @swagger
 * /dashboard/recent-sales:
 *   get:
 *     summary: Last 5 completed sales
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent sales list
 */
router.get('/recent-sales', ctrl.getRecentSales);

/**
 * @swagger
 * /dashboard/low-stock:
 *   get:
 *     summary: Top 5 medicines below reorder level
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Low stock items
 */
router.get('/low-stock', ctrl.getLowStock);

/**
 * @swagger
 * /dashboard/expiring:
 *   get:
 *     summary: Medicines expiring within 30 days
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Expiring medicines
 */
router.get('/expiring', ctrl.getExpiring);

module.exports = router;
