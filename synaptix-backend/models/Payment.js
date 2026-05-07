const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['khalti', 'esewa', 'cod', 'bank_transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'success', 'failed', 'cancelled', 'refunded'],
    default: 'initiated'
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  verifiedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
