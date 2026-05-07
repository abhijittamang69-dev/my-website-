const express = require('express');
const router = express.Router();
const { Contact } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateContact } = require('../middleware/validator');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/contacts
// @desc    Get all contact submissions
// @access  Admin
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { status, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Contact.countDocuments(filter)
  ]);

  res.json({
    success: true,
    count: contacts.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: contacts
  });
}));

// @route   POST /api/contacts
// @desc    Submit contact form
// @access  Public
router.post('/', validateContact, asyncHandler(async (req, res) => {
  const { name, email, phone, serviceType, budgetRange, message } = req.body;

  const contact = await Contact.create({
    name,
    email,
    phone: phone || '',
    serviceType: serviceType || '',
    budgetRange: budgetRange || '',
    message,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully! We will get back to you soon.',
    data: {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      status: contact.status,
      createdAt: contact.createdAt
    }
  });
}));

// @route   PATCH /api/contacts/:id
// @desc    Update contact status
// @access  Admin
router.patch('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { status } = req.body;

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  res.json({
    success: true,
    message: 'Contact status updated',
    data: contact
  });
}));

// @route   DELETE /api/contacts/:id
// @desc    Delete a contact
// @access  Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  res.json({
    success: true,
    message: 'Contact deleted successfully'
  });
}));

module.exports = router;
