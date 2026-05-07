const express = require('express');
const router = express.Router();
const { Booking } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateBooking } = require('../middleware/validator');
const { protect, adminOnly, supervisorOrAdmin } = require('../middleware/auth');

// Generate unique booking ID
const generateBookingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `BK-${timestamp}${random}`;
};

// @route   GET /api/bookings
// @desc    Get all bookings
// @access  Admin/Supervisor
router.get('/', protect, supervisorOrAdmin, asyncHandler(async (req, res) => {
  const { status, service, dateFrom, dateTo, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};

  if (status) filter.status = status;
  if (service) filter.service = service;

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  if (search) {
    filter.$or = [
      { bookingId: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Booking.countDocuments(filter)
  ]);

  res.json({
    success: true,
    count: bookings.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: bookings.map(b => ({
      id: b.bookingId,
      name: b.name,
      phone: b.phone,
      email: b.email,
      address: b.address,
      service: b.serviceLabel,
      property: b.propertyLabel,
      date: b.formattedDate,
      time: b.timeLabel,
      notes: b.notes,
      status: b.status,
      assignedTo: b.assignedTo,
      estimatedCost: b.estimatedCost,
      finalCost: b.finalCost,
      timeline: b.timeline,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }))
  });
}));

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Admin/Supervisor
router.get('/:id', protect, supervisorOrAdmin, asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ bookingId: req.params.id }).lean();

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    data: {
      id: booking.bookingId,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      address: booking.address,
      service: booking.service,
      serviceLabel: booking.serviceLabel,
      property: booking.property,
      propertyLabel: booking.propertyLabel,
      date: booking.formattedDate,
      time: booking.time,
      timeLabel: booking.timeLabel,
      notes: booking.notes,
      status: booking.status,
      assignedTo: booking.assignedTo,
      estimatedCost: booking.estimatedCost,
      finalCost: booking.finalCost,
      timeline: booking.timeline,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }
  });
}));

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Public
router.post('/', validateBooking, asyncHandler(async (req, res) => {
  const { name, phone, email, address, service, property, date, time, notes } = req.body;

  // Check for duplicate booking (same phone + same date + same time)
  const existingBooking = await Booking.findOne({
    phone,
    date: new Date(date),
    time,
    status: { $nin: ['cancelled', 'completed'] }
  });

  if (existingBooking) {
    return res.status(409).json({
      success: false,
      message: 'You already have a booking for this date and time slot. Please choose a different time or date.'
    });
  }

  const booking = await Booking.create({
    bookingId: generateBookingId(),
    name,
    phone,
    email: email || '',
    address,
    service,
    property,
    date: new Date(date),
    time,
    notes: notes || ''
  });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: {
      id: booking.bookingId,
      name: booking.name,
      phone: booking.phone,
      service: booking.serviceLabel,
      property: booking.propertyLabel,
      date: booking.formattedDate,
      time: booking.timeLabel,
      status: booking.status,
      createdAt: booking.createdAt
    }
  });
}));

// @route   PATCH /api/bookings/:id
// @desc    Update booking status
// @access  Admin/Supervisor
router.patch('/:id', protect, supervisorOrAdmin, asyncHandler(async (req, res) => {
  const { status, assignedTo, estimatedCost, finalCost, notes } = req.body;

  const updateData = {};
  if (status) updateData.status = status;
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
  if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
  if (finalCost !== undefined) updateData.finalCost = finalCost;
  if (notes !== undefined) updateData.notes = notes;

  const booking = await Booking.findOneAndUpdate(
    { bookingId: req.params.id },
    { 
      $set: updateData,
      $push: { 
        timeline: { 
          status: status || 'updated', 
          note: notes || `Status updated to ${status}`,
          timestamp: new Date()
        } 
      }
    },
    { new: true }
  );

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: {
      id: booking.bookingId,
      status: booking.status,
      assignedTo: booking.assignedTo,
      estimatedCost: booking.estimatedCost,
      finalCost: booking.finalCost,
      timeline: booking.timeline
    }
  });
}));

// @route   DELETE /api/bookings/:id
// @desc    Delete a booking
// @access  Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const booking = await Booking.findOneAndDelete({ bookingId: req.params.id });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    message: 'Booking deleted successfully'
  });
}));

module.exports = router;
