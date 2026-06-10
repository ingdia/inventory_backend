const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Sale = require('./sale.model');
const { generateReceiptNumber } = require('./receiptNumber.util');
const Medicine = require('../medicines/medicine.model');
const { recordStockMovement } = require('../inventory/inventory.service');
const { sendSuccess, sendError } = require('../../utils/response');

exports.createSale = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 422, 'Validation failed', errors.array());

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const processedItems = [];

    for (const item of req.body.items) {
      const medicine = await Medicine.findById(item.medicine)
        .select('name unit stock isActive')
        .session(session);

      if (!medicine || !medicine.isActive) {
        await session.abortTransaction();
        return sendError(res, 404, `Medicine not found or inactive: ${item.medicine}`);
      }

      if (medicine.stock < item.quantity) {
        await session.abortTransaction();
        return sendError(
          res, 400,
          `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}`
        );
      }

      processedItems.push({
        medicine: item.medicine,
        medicineName: medicine.name,
        unit: medicine.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      });
    }

    const subtotal = processedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = req.body.discount || 0;
    const tax = req.body.tax || 0;
    const total = subtotal - discount + tax;
    const receiptNumber = await generateReceiptNumber();

    const [sale] = await Sale.create(
      [{ receiptNumber, customer: req.body.customer, items: processedItems, subtotal, discount, tax, total, paymentMethod: req.body.paymentMethod, soldBy: req.user._id }],
      { session }
    );

    for (const item of processedItems) {
      await recordStockMovement({ medicine: item.medicine, type: 'stock_out', quantity: item.quantity, reason: 'sale', performedBy: req.user._id, session });
    }

    await session.commitTransaction();
    await sale.populate('soldBy', 'firstName lastName email');

    return sendSuccess(res, 201, 'Sale created successfully.', { sale });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, paymentMethod, status, soldBy, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;
    if (soldBy) filter.soldBy = soldBy;
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      Sale.find(filter).populate('soldBy', 'firstName lastName').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Sale.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Sales retrieved.', {
      sales,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('soldBy', 'firstName lastName email')
      .populate('items.medicine', 'name');
    if (!sale) return sendError(res, 404, 'Sale not found.');
    return sendSuccess(res, 200, 'Sale retrieved.', { sale });
  } catch (err) {
    next(err);
  }
};

exports.getTodaySummary = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [summary] = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, transactionCount: { $sum: 1 }, averageSaleValue: { $avg: '$total' } } },
    ]);

    return sendSuccess(res, 200, "Today's summary retrieved.", {
      totalRevenue: summary?.totalRevenue ?? 0,
      transactionCount: summary?.transactionCount ?? 0,
      averageSaleValue: summary?.averageSaleValue ?? 0,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSummaryByRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return sendError(res, 422, 'startDate and endDate are required');

    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    const [summary, dailyBreakdown] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' }, transactionCount: { $sum: 1 }, averageSaleValue: { $avg: '$total' } } },
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
        { $project: { _id: 0, date: '$_id', revenue: 1, count: 1 } },
        { $sort: { date: 1 } },
      ]),
    ]);

    return sendSuccess(res, 200, 'Summary retrieved.', {
      totalRevenue: summary[0]?.totalRevenue ?? 0,
      transactionCount: summary[0]?.transactionCount ?? 0,
      averageSaleValue: summary[0]?.averageSaleValue ?? 0,
      dailyBreakdown,
    });
  } catch (err) {
    next(err);
  }
};
