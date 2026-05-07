const express = require('express');
const router = express.Router();
const { Order, Booking, Product, Contact, Payment } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/dashboard
// @desc    Get dashboard statistics
// @access  Admin
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel
  const [
    totalOrders,
    totalBookings,
    totalProducts,
    totalContacts,
    totalRevenue,
    monthlyRevenue,
    weeklyRevenue,
    pendingOrders,
    pendingBookings,
    recentOrders,
    recentBookings,
    recentContacts,
    paymentStats,
    orderStatusStats,
    bookingStatusStats,
    topProducts,
    dailySales
  ] = await Promise.all([
    // Counts
    Order.countDocuments(),
    Booking.countDocuments(),
    Product.countDocuments(),
    Contact.countDocuments(),

    // Revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),

    // Pending counts
    Order.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'pending' }),

    // Recent items
    Order.find()
      .sort('-createdAt')
      .limit(10)
      .select('orderId customer total status paymentStatus createdAt')
      .lean(),
    Booking.find()
      .sort('-createdAt')
      .limit(10)
      .select('bookingId name service status date createdAt')
      .lean(),
    Contact.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email serviceType status createdAt')
      .lean(),

    // Payment statistics
    Payment.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]),

    // Order status breakdown
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Booking status breakdown
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Top selling products
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]),

    // Daily sales for last 30 days
    Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalOrders,
        totalBookings,
        totalProducts,
        totalContacts,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        weeklyRevenue: weeklyRevenue[0]?.total || 0,
        pendingOrders,
        pendingBookings
      },
      recentActivity: {
        orders: recentOrders.map(o => ({
          id: o.orderId,
          type: 'order',
          customer: o.customer?.name || 'N/A',
          amount: o.total,
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt
        })),
        bookings: recentBookings.map(b => ({
          id: b.bookingId,
          type: 'booking',
          customer: b.name,
          service: b.service,
          status: b.status,
          createdAt: b.createdAt
        })),
        contacts: recentContacts.map(c => ({
          id: c._id,
          type: 'contact',
          name: c.name,
          email: c.email,
          serviceType: c.serviceType,
          status: c.status,
          createdAt: c.createdAt
        }))
      },
      statistics: {
        payments: paymentStats.reduce((acc, stat) => {
          acc[stat._id] = { count: stat.count, amount: stat.amount };
          return acc;
        }, {}),
        orderStatus: orderStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        bookingStatus: bookingStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      topProducts: topProducts.map(p => ({
        name: p._id,
        totalSold: p.totalSold,
        revenue: p.revenue
      })),
      dailySales: dailySales.map(d => ({
        date: d._id,
        orders: d.orders,
        revenue: d.revenue
      }))
    }
  });
}));

// @route   GET /api/dashboard/summary
// @desc    Get quick summary for navbar badges
// @access  Admin
router.get('/summary', protect, adminOnly, asyncHandler(async (req, res) => {
  const [totalOrders, totalBookings, totalProducts, pendingOrders, pendingBookings] = await Promise.all([
    Order.countDocuments(),
    Booking.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'pending' })
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalBookings,
      totalProducts,
      pendingOrders,
      pendingBookings,
      totalPending: pendingOrders + pendingBookings
    }
  });
}));

// @route   GET /api/dashboard/revenue
// @desc    Get revenue analytics
// @access  Admin
router.get('/revenue', protect, adminOnly, asyncHandler(async (req, res) => {
  const { period = 'monthly' } = req.query;

  let groupFormat;
  let dateRange;

  switch (period) {
    case 'daily':
      groupFormat = '%Y-%m-%d';
      dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      groupFormat = '%Y-W%U';
      dateRange = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'yearly':
      groupFormat = '%Y';
      dateRange = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
      break;
    default: // monthly
      groupFormat = '%Y-%m';
      dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  }

  const revenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: dateRange } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: revenue.map(r => ({
      period: r._id,
      revenue: r.revenue,
      orders: r.orders
    }))
  });
}));

module.exports = router;
