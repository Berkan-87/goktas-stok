// models/Material.js - KESİN ÇÖZÜM
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
  
  // Tutkal
  glueType: {
    type: String,
    enum: ['iskelet', 'laminasyon', 'kenar_bant'],
    default: null
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

// ✅ Pre-save middleware
materialSchema.pre('save', function(next) {
  // Kategoriye göre gereksiz alanları temizle
  if (this.category !== 'mdf') {
    this.thickness = null;
    this.size = null;
  }
  if (this.category !== 'glue') {
    this.glueType = null;
  }
  if (this.category !== 'edgeband' && this.category !== 'pvc') {
    this.color = null;
    this.colorName = null;
  }
  next();
});

// ✅ POST-save hata yakalama için statik metod
materialSchema.statics.createWithValidation = async function(data) {
  try {
    // Kategoriye göre validasyon
    if (data.category === 'glue' && !data.glueType) {
      throw new Error('Tutkal tipi seçimi zorunludur');
    }
    if ((data.category === 'edgeband' || data.category === 'pvc') && !data.color) {
      throw new Error('Renk seçimi zorunludur');
    }
    
    const material = new this(data);
    return await material.save();
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Material', materialSchema);