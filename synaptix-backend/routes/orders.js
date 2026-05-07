const express = require('express');
const router = express.Router();
const { Order, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateOrder } = require('../middleware/validator');
const { protect, adminOnly } = require('../middleware/auth');

// Generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `SYN-${timestamp}${random}`;
};

// @route   GET /api/orders
// @desc    Get all orders (admin) or user's orders
// @access  Private/Admin
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, paymentStatus, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};

  // Non-admin users can only see their own orders (by phone)
  if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
    filter['customer.phone'] = req.user.phone;
  }

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (search) {
    filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.phone': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments(filter)
  ]);

  res.json({
    success: true,
    count: orders.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: orders.map(o => ({
      id: o.orderId,
      customer: o.customer,
      items: o.items.map(item => ({
        id: item.product?.toString() || item._id?.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        icon: item.icon
      })),
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      shipping: o.shipping,
      timeline: o.timeline,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    }))
  });
}));

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private/Admin or Order Owner
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.id }).lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check authorization
  if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
    if (order.customer.phone !== req.user.phone) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
  }

  res.json({
    success: true,
    data: {
      id: order.orderId,
      customer: order.customer,
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentDetails: order.paymentDetails,
      status: order.status,
      shipping: order.shipping,
      timeline: order.timeline,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }
  });
}));

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public
router.post('/', validateOrder, asyncHandler(async (req, res) => {
  const { customer, items, total, paymentMethod, notes } = req.body;

  // Validate that products exist and have sufficient stock
  const productIds = items.map(item => item.id);
  const products = await Product.find({ _id: { $in: productIds } });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  for (const item of items) {
    const product = productMap.get(item.id);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Product not found: ${item.name}`
      });
    }
    if (!product.inStock || product.stockQuantity < item.qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for: ${product.name}. Available: ${product.stockQuantity}`
      });
    }
  }

  // Create order items with proper structure
  const orderItems = items.map(item => {
    const product = productMap.get(item.id);
    return {
      product: item.id,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      icon: item.icon || product?.icon || 'fa-box'
    };
  });

  // Create the order
  const order = await Order.create({
    orderId: generateOrderId(),
    customer: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address,
      notes: notes || customer.notes || ''
    },
    items: orderItems,
    total,
    paymentMethod,
    status: 'pending',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
  });

  // Update product stock and sales
  for (const item of items) {
    await Product.findByIdAndUpdate(item.id, {
      $inc: { 
        stockQuantity: -item.qty,
        sales: item.qty 
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: {
      id: order.orderId,
      customer: order.customer,
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt
    }
  });
}));

// @route   PATCH /api/orders/:id
// @desc    Update order status
// @access  Admin
router.patch('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { status, paymentStatus, shipping } = req.body;

  const updateData = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (shipping) updateData.shipping = shipping;

  const order = await Order.findOneAndUpdate(
    { orderId: req.params.id },
    { 
      $set: updateData,
      $push: { 
        timeline: { 
          status: status || paymentStatus || 'updated', 
          note: `Status updated to ${status || paymentStatus}`,
          timestamp: new Date()
        } 
      }
    },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    message: 'Order updated successfully',
    data: {
      id: order.orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      timeline: order.timeline
    }
  });
}));

// @route   DELETE /api/orders/:id
// @desc    Delete an order
// @access  Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const order = await Order.findOneAndDelete({ orderId: req.params.id });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 
        stockQuantity: item.quantity,
        sales: -item.quantity 
      }
    });
  }

  res.json({
    success: true,
    message: 'Order deleted successfully'
  });
}));

module.exports = router;
