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
  role: {
    type: String,
    enum: ['admin', 'branch_manager', 'production_manager', 'viewer'], // 'production_manager' eklendi
    required: true
  },
  branch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka', null],
    default: null
  },
  // Üretim yetkisi için yeni alan
  productionRole: {
    type: String,
    enum: ['planlama', 'uretim', 'paketleme', 'hazir', null],
    default: null,
    description: 'Hangi üretim aşamasında yetkili olduğunu belirtir'
  },
  name: {
    type: String,
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

// Şifre hashleme
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Şifre karşılaştırma
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);