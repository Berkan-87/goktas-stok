const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Ürün kodu zorunludur'], // Hata mesajı netleştirildi
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'], // Hata mesajı netleştirildi
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
    required: [true, 'Kategori seçilmesi zorunludur']
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

// ✅ Veritabanı performansı ve benzersizlik garantisi için indeks ekledik
productSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);