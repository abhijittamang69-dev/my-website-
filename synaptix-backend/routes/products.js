const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateProduct } = require('../middleware/validator');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products with optional filtering
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { 
    category, 
    inStock, 
    featured, 
    search, 
    sort = '-createdAt',
    page = 1, 
    limit = 50 
  } = req.query;

  // Build filter object
  const filter = {};

  if (category) filter.category = category;
  if (inStock !== undefined) filter.inStock = inStock === 'true';
  if (featured !== undefined) filter.featured = featured === 'true';

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      icon: p.icon,
      badge: p.badge,
      category: p.category,
      inStock: p.inStock,
      stockQuantity: p.stockQuantity,
      images: p.images,
      specifications: p.specifications,
      featured: p.featured,
      views: p.views,
      sales: p.sales,
      createdAt: p.createdAt
    }))
  });
}));

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true, inStock: true })
    .sort('-sales')
    .limit(8)
    .lean();

  res.json({
    success: true,
    count: products.length,
    data: products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      icon: p.icon,
      badge: p.badge,
      category: p.category,
      inStock: p.inStock
    }))
  });
}));

// @route   GET /api/products/categories
// @desc    Get all product categories with counts
// @access  Public
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { inStock: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const categoryLabels = {
    security: 'Security',
    accessories: 'Accessories',
    software: 'Software',
    web: 'Web Services',
    other: 'Other'
  };

  res.json({
    success: true,
    data: categories.map(c => ({
      id: c._id,
      name: categoryLabels[c._id] || c._id,
      count: c.count
    }))
  });
}));

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Increment view count
  await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.json({
    success: true,
    data: {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      icon: product.icon,
      badge: product.badge,
      category: product.category,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      images: product.images,
      specifications: product.specifications,
      featured: product.featured,
      views: product.views + 1,
      sales: product.sales,
      createdAt: product.createdAt
    }
  });
}));

// @route   POST /api/products
// @desc    Create a new product
// @access  Admin
router.post('/', protect, adminOnly, validateProduct, asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      icon: product.icon,
      badge: product.badge,
      category: product.category,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity
    }
  });
}));

// @route   PATCH /api/products/:id
// @desc    Update a product
// @access  Admin
router.patch('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      icon: product.icon,
      badge: product.badge,
      category: product.category,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity
    }
  });
}));

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

module.exports = router;
