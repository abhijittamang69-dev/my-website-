const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Trust proxy for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://dev.khalti.com", "https://rc-epay.esewa.com.np"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'https://synaptixsolutions.vercel.app',
      'https://www.synaptixsolutions.vercel.app'
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// STATIC FILES (Serve your HTML/CSS/JS frontend)
// ============================================

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Also serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// DATABASE CONNECTION
// ============================================

connectDB();

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Synaptix API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Product routes
app.use('/api/products', require('./routes/products'));

// Order routes
app.use('/api/orders', require('./routes/orders'));

// Booking routes
app.use('/api/bookings', require('./routes/bookings'));

// Payment routes (Khalti & eSewa)
app.use('/api/payment', require('./routes/payments'));

// Dashboard/Analytics routes
app.use('/api/dashboard', require('./routes/dashboard'));

// Contact routes
app.use('/api/contacts', require('./routes/contacts'));

// User management routes
app.use('/api/users', require('./routes/users'));

// ============================================
// FRONTEND ROUTES (Serve HTML files)
// ============================================

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve specific pages
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Synaptix Solutions Ltd - Backend Server                 ║
║                                                              ║
║   Server running on port: ${PORT}${' '.repeat(32 - PORT.toString().length)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(39)}║
║   API Base: http://localhost:${PORT}/api${' '.repeat(21 - PORT.toString().length)}║
║    API Base:https://my-website-vxa6.onrender.com                                                           ║
║   Available Endpoints:                                       ║
║   • GET  /api/health        - Health check                   ║
║   • POST /api/auth/login    - User login                     ║
║   • POST /api/auth/register - User registration              ║
║   • GET  /api/products      - List products                  ║
║   • POST /api/orders        - Create order                   ║
║   • POST /api/bookings      - Create booking                 ║
║   • POST /api/payment/...   - Payment gateways               ║
║   • GET  /api/dashboard     - Admin analytics                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
