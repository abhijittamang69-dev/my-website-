const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Admin
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { role, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: users
  });
}));

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Admin
router.get('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
}));

// @route   PATCH /api/users/:id
// @desc    Update user
// @access  Admin
router.patch('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { name, phone, role, isActive, permissions } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (permissions) updateData.permissions = permissions;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

module.exports = router;
