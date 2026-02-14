const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'istasyon', 'stok', 'izleyici'],
    required: true
  },
  station: {
    type: String,
    enum: ['planlama', 'cnc', 'tutkal', 'pvc', 'pres', 'kenarbant', 'kilit', 'lake', 'paketleme', 'stok', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Şifreyi hash'leme (kaydetmeden önce) - DÜZELTİLMİŞ VERSİYON
userSchema.pre('save', async function(next) {
  try {
    // Şifre değişmemişse devam et
    if (!this.isModified('password')) {
      return next();
    }
    
    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);