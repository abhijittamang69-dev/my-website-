const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Product validation
exports.validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 1 }).withMessage('Price must be at least 1 NPR'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  body('category')
    .optional()
    .isIn(['security', 'accessories', 'software', 'web', 'other'])
    .withMessage('Invalid category'),
  handleValidationErrors
];

// Order validation
exports.validateOrder = [
  body('customer.name')
    .trim()
    .notEmpty().withMessage('Customer name is required'),
  body('customer.phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s]{7,20}$/).withMessage('Invalid phone number format'),
  body('customer.email')
    .optional()
    .isEmail().withMessage('Invalid email address'),
  body('customer.address')
    .trim()
    .notEmpty().withMessage('Delivery address is required'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.id')
    .notEmpty().withMessage('Product ID is required'),
  body('items.*.name')
    .notEmpty().withMessage('Product name is required'),
  body('items.*.price')
    .isFloat({ min: 0 }).withMessage('Invalid price'),
  body('items.*.qty')
    .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),
  body('total')
    .isFloat({ min: 0 }).withMessage('Invalid total amount'),
  body('paymentMethod')
    .isIn(['cod', 'khalti', 'esewa', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// Booking validation
exports.validateBooking = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s]{7,20}$/).withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email address'),
  body('address')
    .trim()
    .notEmpty().withMessage('Installation address is required'),
  body('service')
    .notEmpty().withMessage('Service type is required')
    .isIn(['cctv', 'access', 'egate', 'alarm', 'combo', 'other'])
    .withMessage('Invalid service type'),
  body('property')
    .notEmpty().withMessage('Property type is required')
    .isIn(['home', 'office', 'factory', 'shop', 'apartment', 'other'])
    .withMessage('Invalid property type'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('time')
    .notEmpty().withMessage('Time slot is required')
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('Invalid time slot'),
  handleValidationErrors
];

// Contact form validation
exports.validateContact = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  handleValidationErrors
];
