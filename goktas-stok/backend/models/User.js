// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  
  // ✅ ANA ROL
  role: {
    type: String,
    enum: ['admin', 'branch_manager', 'production_manager', 'viewer'],
    required: true
  },
  
  // ✅ ŞUBE YETKİSİ
  branch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka', null],
    default: null
  },
  
  // ✅ ÜRETİM YETKİSİ (production_manager için)
  productionRole: {
    type: String,
    enum: ['planlama', 'uretim', 'paketleme', 'depo_hazirlik', 'sevk', null],
    default: null
  },
  
  // ✅ MALZEME DEPO YETKİSİ (YENİ)
  materialDepoAccess: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// ✅ Şifre hashleme - DÜZELTİLDİ
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Şifre karşılaştırma - DÜZELTİLDİ
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// ✅ MODULE EXPORTS - DÜZELTİLDİ
module.exports = mongoose.model('User', userSchema);