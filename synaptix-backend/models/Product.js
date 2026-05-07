const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [1, 'Price must be at least 1 NPR']
  },
  icon: {
    type: String,
    default: 'fa-box',
    trim: true
  },
  badge: {
    type: String,
    enum: ['', 'Popular', 'New', 'Hot', 'Sale', 'Bestseller'],
    default: ''
  },
  category: {
    type: String,
    enum: ['security', 'accessories', 'software', 'web', 'other'],
    default: 'security'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 100,
    min: 0
  },
  images: [{
    type: String,
    trim: true
  }],
  specifications: [{
    key: String,
    value: String
  }],
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted ID
productSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Index for search
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ featured: 1 });

module.exports = mongoose.model('Product', productSchema);
