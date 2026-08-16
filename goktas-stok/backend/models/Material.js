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
    enum: ['mdf', 'glue', 'edgeband', 'pvc'],
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
  
  // Tutkal - glueType kaldırıldı, isim ile belirlenecek
  // Kenar Bant / PVC
  color: { type: String, default: null },
  colorName: { type: String, trim: true, default: null },
  
  // Stok
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
    default: 10,
    min: 1
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Benzersiz indeks
materialSchema.index({ category: 1, name: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Material', materialSchema);