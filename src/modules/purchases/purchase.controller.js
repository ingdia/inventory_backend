const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Purchase = require('./purchase.model');
const Medicine = require('../medicines/medicine.model');
const { recordStockMovement } = require('../inventory/inventory.service');
const { sendSuccess, sendError } = require('../../utils/response');

exports.createPurchase = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 422, 'Validation failed', errors.array());

  try {
    const processedItems = [];

    for (const item of req.body.items) {
      const medicine = await Medicine.findById(item.medicine).select('name');
      if (!medicine) return sendError(res, 404, `Medicine not found: ${item.medicine}`);

      processedItems.push({
        medicine: item.medicine,
        medicineName: medicine.name,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        subtotal: item.quantity * item.purchasePrice,
      });
    }

    const totalAmount = processedItems.reduce((sum, i) => sum + i.subtotal, 0);

    const purchase = await Purchase.create({
      invoiceNumber: req.body.invoiceNumber,
      supplier: req.body.supplier,
      items: processedItems,
      totalAmount,
      status: 'pending',
      purchaseDate: req.body.purchaseDate,
      expectedDelivery: req.body.expectedDelivery,
      notes: req.body.notes,
      recordedBy: req.user._id,
    });

    await purchase.populate([
      { path: 'supplier', select: 'name' },
      { path: 'recordedBy', select: 'firstName lastName' },
    ]);

    return sendSuccess(res, 201, 'Purchase created successfully.', { purchase });
  } catch (err) {
    next(err);
  }
};

exports.getPurchases = async (req, res, next) => {
  try {
    const { startDate, endDate, supplier, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (search) filter.invoiceNumber = { $regex: search, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .populate('supplier', 'name')
        .populate('recordedBy', 'firstName lastName')
        .sort({ purchaseDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Purchase.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Purchases retrieved.', {
      purchases,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name contactPerson phone')
      .populate('recordedBy', 'firstName lastName')
      .populate('receivedBy', 'firstName lastName')
      .populate('items.medicine', 'name unit');
    if (!purchase) return sendError(res, 404, 'Purchase not found.');
    return sendSuccess(res, 200, 'Purchase retrieved.', { purchase });
  } catch (err) {
    next(err);
  }
};

exports.receivePurchase = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchase = await Purchase.findById(req.params.id).session(session);

    if (!purchase) {
      await session.abortTransaction();
      return sendError(res, 404, 'Purchase not found.');
    }
    if (purchase.status !== 'pending') {
      await session.abortTransaction();
      return sendError(res, 400, 'Purchase already marked as received.');
    }

    for (const item of purchase.items) {
      await recordStockMovement({
        medicine: item.medicine,
        type: 'stock_in',
        quantity: item.quantity,
        reason: 'purchase',
        performedBy: req.user._id,
        session,
      });
    }

    purchase.status = 'received';
    purchase.receivedAt = new Date();
    purchase.receivedBy = req.user._id;
    await purchase.save({ session });

    await session.commitTransaction();

    await purchase.populate([
      { path: 'supplier', select: 'name contactPerson phone' },
      { path: 'recordedBy', select: 'firstName lastName' },
      { path: 'receivedBy', select: 'firstName lastName' },
      { path: 'items.medicine', select: 'name unit' },
    ]);

    return sendSuccess(res, 200, 'Purchase received successfully.', { purchase });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.cancelPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return sendError(res, 404, 'Purchase not found.');
    if (purchase.status === 'received') return sendError(res, 400, 'Cannot cancel a purchase that has already been received.');
    if (purchase.status === 'cancelled') return sendError(res, 400, 'Purchase is already cancelled.');

    purchase.status = 'cancelled';
    await purchase.save();

    return sendSuccess(res, 200, 'Purchase cancelled successfully.', { purchase });
  } catch (err) {
    next(err);
  }
};
