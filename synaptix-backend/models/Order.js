const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  icon: {
    type: String,
    default: 'fa-box'
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'khalti', 'esewa', 'bank_transfer'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentDetails: {
    khaltiToken: String,
    khaltiPidx: String,
    esewaRefId: String,
    esewaTransactionUuid: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  shipping: {
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  timeline: [{
    status: String,
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted ID
orderSchema.virtual('id').get(function() {
  return this.orderId;
});

// Indexes
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });

// Pre-save hook to add timeline entry
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      status: 'pending',
      note: 'Order placed successfully'
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
