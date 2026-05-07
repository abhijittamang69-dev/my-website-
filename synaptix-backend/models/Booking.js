const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
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
    required: [true, 'Installation address is required'],
    trim: true
  },
  service: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['cctv', 'access', 'egate', 'alarm', 'combo', 'other']
  },
  serviceLabel: {
    type: String,
    default: function() {
      const labels = {
        cctv: 'CCTV Installation',
        access: 'Access Control System',
        egate: 'E-Gate / Automatic Gate',
        alarm: 'Alarm System',
        combo: 'Complete Security Package',
        other: 'Other / Custom'
      };
      return labels[this.service] || this.service;
    }
  },
  property: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['home', 'office', 'factory', 'shop', 'apartment', 'other']
  },
  propertyLabel: {
    type: String,
    default: function() {
      const labels = {
        home: 'Home / Residence',
        office: 'Office / Commercial',
        factory: 'Factory / Warehouse',
        shop: 'Shop / Retail',
        apartment: 'Apartment Complex',
        other: 'Other'
      };
      return labels[this.property] || this.property;
    }
  },
  date: {
    type: Date,
    required: [true, 'Preferred date is required']
  },
  time: {
    type: String,
    required: [true, 'Preferred time is required'],
    enum: ['morning', 'afternoon', 'evening']
  },
  timeLabel: {
    type: String,
    default: function() {
      const labels = {
        morning: 'Morning (9:00 AM - 12:00 PM)',
        afternoon: 'Afternoon (12:00 PM - 3:00 PM)',
        evening: 'Evening (3:00 PM - 6:00 PM)'
      };
      return labels[this.time] || this.time;
    }
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  assignedTo: {
    type: String,
    trim: true
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  finalCost: {
    type: Number,
    default: 0
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
bookingSchema.virtual('id').get(function() {
  return this.bookingId;
});

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  return this.date ? this.date.toISOString().split('T')[0] : '';
});

// Indexes
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ createdAt: -1 });

// Pre-save hook
bookingSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      status: 'pending',
      note: 'Booking request received'
    });
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
