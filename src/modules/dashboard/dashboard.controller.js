const Sale = require('../sales/sale.model');
const Medicine = require('../medicines/medicine.model');
const Inventory = require('../inventory/inventory.model');
const Purchase = require('../purchases/purchase.model');

const getDateRange = (startDate, endDate) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

exports.getMetrics = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const { start: todayStart, end: todayEnd } = getToday();
    const periodMs = end - start;
    const prevStart = new Date(start - periodMs);
    const prevEnd = new Date(start - 1);

    const [current, previous, todaySales, lowStock, expiring, totalMedicines] = await Promise.all([
      Sale.aggregate([{ $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Sale.aggregate([{ $match: { createdAt: { $gte: prevStart, $lte: prevEnd }, status: 'completed' } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Sale.aggregate([{ $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: 'completed' } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
      Inventory.countDocuments({ expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gte: new Date() } }),
      Medicine.countDocuments({ isActive: true }),
    ]);

    const cogsAgg = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
      { $unwind: '$items' },
      { $lookup: { from: 'medicines', localField: 'items.medicine', foreignField: '_id', as: 'med' } },
      { $unwind: '$med' },
      { $group: { _id: null, cogs: { $sum: { $multiply: ['$items.quantity', '$med.purchasePrice'] } } } },
    ]);

    const totalRevenue = current[0]?.revenue || 0;
    const totalCOGS = cogsAgg[0]?.cogs || 0;
    const prevRevenue = previous[0]?.revenue || 0;
    const prevCount = previous[0]?.count || 0;
    const totalTransactions = current[0]?.count || 0;
    const revenueTrend = prevRevenue ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;
    const transactionsTrend = prevCount ? (((totalTransactions - prevCount) / prevCount) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalRevenue, todayRevenue: todaySales[0]?.revenue || 0,
        totalTransactions, todayTransactions: todaySales[0]?.count || 0,
        totalProfit: totalRevenue - totalCOGS, totalMedicines,
        lowStockCount: lowStock, expiringCount: expiring,
        trends: { revenueTrend: Number(revenueTrend), transactionsTrend: Number(transactionsTrend) },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load metrics' });
  }
};

exports.getRevenueChart = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const now = new Date();
    let start, groupFormat;

    if (period === '7d') { start = new Date(now - 7 * 864e5); groupFormat = '%Y-%m-%d'; }
    else if (period === '3m') { start = new Date(now - 90 * 864e5); groupFormat = '%Y-%m-%d'; }
    else if (period === '1y') { start = new Date(now.getFullYear(), 0, 1); groupFormat = '%Y-%m'; }
    else { start = new Date(now - 30 * 864e5); groupFormat = '%Y-%m-%d'; }

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start }, status: 'completed' } },
      { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, transactions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, transactions: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load revenue chart' });
  }
};

exports.getTopMedicines = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.medicine', totalQuantitySold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } } } },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'medicines', localField: '_id', foreignField: '_id', as: 'medicine' } },
      { $unwind: '$medicine' },
      { $project: { _id: 0, medicineId: '$_id', medicineName: '$medicine.name', totalQuantitySold: 1, totalRevenue: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load top medicines' });
  }
};

exports.getSalesByPayment = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const raw = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]);
    const grandTotal = raw.reduce((s, r) => s + r.total, 0);
    const data = raw.map((r) => ({ paymentMethod: r._id, count: r.count, total: r.total, percentage: grandTotal ? Number(((r.total / grandTotal) * 100).toFixed(1)) : 0 }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load payment breakdown' });
  }
};

exports.getProfitSummary = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const [revenueAgg, cogsAgg] = await Promise.all([
      Sale.aggregate([{ $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } }, { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
        { $unwind: '$items' },
        { $lookup: { from: 'medicines', localField: 'items.medicine', foreignField: '_id', as: 'med' } },
        { $unwind: '$med' },
        { $group: { _id: null, totalCOGS: { $sum: { $multiply: ['$items.quantity', '$med.purchasePrice'] } } } },
      ]),
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalCOGS = cogsAgg[0]?.totalCOGS || 0;
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;
    res.json({ success: true, data: { totalRevenue, totalCOGS, grossProfit, grossMargin } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load profit summary' });
  }
};

exports.getRecentSales = async (req, res) => {
  try {
    const data = await Sale.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(5).populate('soldBy', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load recent sales' });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const data = await Inventory.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } }).sort({ quantity: 1 }).limit(5).populate('medicine', 'name unit').lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load low stock' });
  }
};

exports.getExpiring = async (req, res) => {
  try {
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const data = await Inventory.find({ expiryDate: { $gte: new Date(), $lte: thirtyDays } }).sort({ expiryDate: 1 }).limit(5).populate('medicine', 'name unit').lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load expiring medicines' });
  }
};
