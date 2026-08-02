const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  unit: {
    type: String,
    default: 'adet'
  },
  category: {
    type: String,
    enum: ['kanat', 'kasa'],
    default: 'kanat',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ `isActive` alanını kontrol eden metod
productSchema.methods.isProductActive = function() {
  return this.isActive !== false;
};

// ✅ Kategori bazında filtreleme için statik metod
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

// ✅ Aktif ürünleri getir
productSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('Product', productSchema);