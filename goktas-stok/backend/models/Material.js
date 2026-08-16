// models/Material.js
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  // Ortak alanlar
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['mdf', 'glue', 'edgeband', 'pvc'],
    required: true
  },
  unit: {
    type: String,
    enum: ['adet', 'metre', 'kg', 'lt'],
    default: 'adet'
  },
  
  // MDF'ye özel alanlar
  thickness: {
    type: Number,
    default: null
  },
  size: {
    type: String,
    default: null
  },
  
  // Tutkal'a özel alanlar
  glueType: {
    type: String,
    enum: ['iskelet', 'laminasyon', 'kenar_bant', null],
    default: null
  },
  
  // Kenar Bant ve PVC'ye özel alanlar
  color: {
    type: String,
    default: null
  },
  colorName: {
    type: String,
    default: null
  },
  
  // Stok bilgileri (tek modelde)
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  branch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    default: 'fabrika'
  },
  criticalLevel: {
    type: Number,
    default: 10
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Kategori + isim benzersiz olsun
materialSchema.index({ category: 1, name: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Material', materialSchema);