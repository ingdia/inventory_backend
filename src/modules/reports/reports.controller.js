const Sale = require('../sales/sale.model');
const Purchase = require('../purchases/purchase.model');
const Medicine = require('../medicines/medicine.model');
const Inventory = require('../inventory/inventory.model');

const getDateRange = (startDate, endDate) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, soldBy, page = 1, limit = 20 } = req.query;
    const { start, end } = getDateRange(startDate, endDate);
    const match = { createdAt: { $gte: start, $lte: end }, status: 'completed' };
    if (paymentMethod) match.paymentMethod = paymentMethod;
    if (soldBy) match.soldBy = soldBy;
    const skip = (Number(page) - 1) * Number(limit);

    const [summary, sales, total] = await Promise.all([
      Sale.aggregate([{ $match: match }, { $group: { _id: null, totalSales: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' }, totalDiscount: { $sum: '$discount' }, netRevenue: { $sum: { $subtract: ['$totalAmount', { $ifNull: ['$discount', 0] }] } } } }]),
      Sale.find(match).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('soldBy', 'firstName lastName').lean(),
      Sale.countDocuments(match),
    ]);

    res.json({
      success: true,
      summary: summary[0] || { totalSales: 0, totalRevenue: 0, totalDiscount: 0, netRevenue: 0 },
      data: { sales, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load sales report' });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const { category, status } = req.query;
    const now = new Date();
    const medicineMatch = { isActive: true };
    if (category) medicineMatch.category = category;

    const inventory = await Inventory.find()
      .populate({ path: 'medicine', match: medicineMatch, select: 'name category unit purchasePrice reorderLevel' })
      .lean();

    const rows = inventory.filter((i) => i.medicine).map((i) => {
      const qty = i.quantity || 0;
      const reorder = i.medicine.reorderLevel || 0;
      const expired = i.expiryDate && i.expiryDate < now;
      let itemStatus = 'in_stock';
      if (expired) itemStatus = 'expired';
      else if (qty === 0) itemStatus = 'out_of_stock';
      else if (qty <= reorder) itemStatus = 'low_stock';
      return { medicine: i.medicine.name, category: i.medicine.category, quantity: qty, unit: i.medicine.unit, reorderLevel: reorder, stockValue: qty * (i.medicine.purchasePrice || 0), status: itemStatus, expiryDate: i.expiryDate };
    });

    const statusFiltered = status ? rows.filter((r) => r.status === status) : rows;
    const summary = {
      totalStockValue: statusFiltered.reduce((s, r) => s + r.stockValue, 0),
      totalItems: statusFiltered.length,
      lowStockCount: rows.filter((r) => r.status === 'low_stock').length,
      expiredCount: rows.filter((r) => r.status === 'expired').length,
    };

    res.json({ success: true, summary, data: statusFiltered });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load inventory report' });
  }
};

exports.getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    const { start, end } = getDateRange(startDate, endDate);
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const [revenueAgg, cogsAgg] = await Promise.all([
      Sale.aggregate([{ $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } }, { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } }, { $sort: { _id: 1 } }]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
        { $unwind: '$items' },
        { $lookup: { from: 'medicines', localField: 'items.medicine', foreignField: '_id', as: 'med' } },
        { $unwind: '$med' },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, cogs: { $sum: { $multiply: ['$items.quantity', '$med.purchasePrice'] } } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const cogsMap = Object.fromEntries(cogsAgg.map((c) => [c._id, c.cogs]));
    const breakdown = revenueAgg.map((r) => {
      const cogs = cogsMap[r._id] || 0;
      const grossProfit = r.revenue - cogs;
      return { period: r._id, revenue: r.revenue, cogs, grossProfit, margin: r.revenue ? Number(((grossProfit / r.revenue) * 100).toFixed(1)) : 0 };
    });

    const totalRevenue = breakdown.reduce((s, r) => s + r.revenue, 0);
    const totalCOGS = breakdown.reduce((s, r) => s + r.cogs, 0);
    const grossProfit = totalRevenue - totalCOGS;
    res.json({ success: true, summary: { totalRevenue, totalCOGS, grossProfit, grossMargin: totalRevenue ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0 }, data: breakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load profit & loss report' });
  }
};

exports.getPurchasesReport = async (req, res) => {
  try {
    const { startDate, endDate, supplier, status, page = 1, limit = 20 } = req.query;
    const { start, end } = getDateRange(startDate, endDate);
    const match = { purchaseDate: { $gte: start, $lte: end } };
    if (supplier) match.supplier = supplier;
    if (status) match.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [summary, purchases, total] = await Promise.all([
      Purchase.aggregate([{ $match: match }, { $group: { _id: null, totalPurchases: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' }, pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, receivedCount: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] } } } }]),
      Purchase.find(match).sort({ purchaseDate: -1 }).skip(skip).limit(Number(limit)).populate('supplier', 'name').populate('recordedBy', 'firstName lastName').lean(),
      Purchase.countDocuments(match),
    ]);

    res.json({
      success: true,
      summary: summary[0] || { totalPurchases: 0, totalAmount: 0, pendingCount: 0, receivedCount: 0 },
      data: { purchases, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load purchases report' });
  }
};
