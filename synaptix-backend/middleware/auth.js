const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - Invalid token'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in auth middleware',
      error: error.message
    });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized - Admin access required'
    });
  }
};

// Supervisor or Admin middleware
exports.supervisorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized - Supervisor or Admin access required'
    });
  }
};

// Simple password check for admin panel (for your current HTML-based admin)
exports.checkAdminPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid admin password'
    });
  }
};
