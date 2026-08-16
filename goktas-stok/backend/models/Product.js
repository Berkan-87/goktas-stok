const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true,
    unique: true // ✅ Sadece name benzersiz olsun
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
    enum: ['kanat', 'kasa', 'baslik'],
    default: 'kanat',
    required: [true, 'Kategori seçilmesi zorunludur']
  },
  color: {
    type: String,
    enum: ['bute_beyaz', 'koyu_gri', 'acik_gri', 'tas_gri', null],
    default: null,
    // ✅ Kasa ve Başlık için renk zorunlu (validate ile kontrol)
    validate: {
      validator: function(value) {
        // Eğer kategori kasa veya baslik ise renk zorunlu
        if (this.category === 'kasa' || this.category === 'baslik') {
          return value !== null && value !== undefined && value !== '';
        }
        return true; // Kanat için renk zorunlu değil
      },
      message: 'Kasa ve Başlık kategorileri için renk seçimi zorunludur'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true
});

// ✅ Sadece name için benzersiz indeks
productSchema.index({ name: 1 }, { unique: true });

// ✅ Kategori + renk için indeks (sorguları hızlandırmak için)
productSchema.index({ category: 1, color: 1 });

// ✅ Pre-save middleware ile ek renk kontrolü (opsiyonel)
productSchema.pre('save', function(next) {
  // Kasa veya Başlık için renk kontrolü
  if ((this.category === 'kasa' || this.category === 'baslik') && !this.color) {
    return next(new Error('Kasa ve Başlık kategorileri için renk seçimi zorunludur'));
  }
  
  // Kanat için renk null yap (gereksiz renk verisi olmasın)
  if (this.category === 'kanat') {
    this.color = null;
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);