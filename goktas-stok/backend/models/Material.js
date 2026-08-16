// models/Material.js
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Malzeme adı zorunludur'],
    trim: true
  },
  category: {
    type: String,
    enum: {
      values: ['mdf', 'glue', 'edgeband', 'pvc'],
      message: 'Geçersiz kategori'
    },
    required: [true, 'Kategori seçimi zorunludur']
  },
  unit: {
    type: String,
    enum: ['adet', 'metre', 'kg', 'lt'],
    default: 'adet'
  },
  
  // MDF
  thickness: { type: Number, default: null },
  size: { type: String, trim: true, default: null },
  
  // ✅ Tutkal - DÜZELTİLDİ
  glueType: {
    type: String,
    enum: ['iskelet', 'laminasyon', 'kenar_bant'],
    default: null,
    validate: {
      validator: function(value) {
        // Sadece glue kategorisi için zorunlu
        if (this.category === 'glue') {
          return value !== null && value !== undefined && value !== '';
        }
        return true;
      },
      message: 'Tutkal tipi seçimi zorunludur'
    }
  },
  
  // Kenar Bant / PVC
  color: { type: String, default: null },
  colorName: { type: String, trim: true, default: null },
  
  // Stok
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stok miktarı negatif olamaz']
  },
  branch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    default: 'fabrika'
  },
  criticalLevel: {
    type: Number,
    default: 10,
    min: [1, 'Kritik seviye en az 1 olmalıdır']
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// ✅ Benzersiz indeks
materialSchema.index({ category: 1, name: 1, branch: 1 }, { unique: true });

// ✅ Pre-save middleware - Kategoriye göre gereksiz alanları temizle
materialSchema.pre('save', function(next) {
  // MDF değilse thickness ve size'ı temizle
  if (this.category !== 'mdf') {
    this.thickness = null;
    this.size = null;
  }
  
  // Tutkal değilse glueType'ı temizle
  if (this.category !== 'glue') {
    this.glueType = null;
  }
  
  // Kenar Bant veya PVC değilse renk alanlarını temizle
  if (this.category !== 'edgeband' && this.category !== 'pvc') {
    this.color = null;
    this.colorName = null;
  }
  
  // Tutkal ise glueType kontrol et
  if (this.category === 'glue' && !this.glueType) {
    return next(new Error('Tutkal tipi seçimi zorunludur'));
  }
  
  next();
});

module.exports = mongoose.model('Material', materialSchema);