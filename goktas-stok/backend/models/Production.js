const mongoose = require('mongoose');

const ProductionSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: [true, 'Sipariş numarası zorunludur'],
    unique: true,
    trim: true,
  },
  customer: {
    type: String,
    required: [true, 'Müşteri adı zorunludur'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Model zorunludur'],
    trim: true,
  },
  color: {
    type: String,
    required: [true, 'Renk zorunludur'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Miktar zorunludur'],
    min: [1, 'Miktar en az 1 olmalıdır'],
  },
  note: {
    type: String,
    default: '',
    trim: true,
  },
  stage: {
    type: String,
    enum: {
      values: ['planlama', 'uretim', 'paketleme', 'depo_hazirlik', 'sevk_alani', 'tamamlandi'],
      message: 'Geçersiz aşama: {VALUE}',
    },
    default: 'planlama',
  },
  stageHistory: {
    type: Map,
    of: {
      startedAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: Date,
    },
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Her güncellemede updatedAt'i güncelle
ProductionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Yeni sipariş oluşturulurken stageHistory'yi başlat
ProductionSchema.pre('save', function(next) {
  if (this.isNew && this.stage) {
    if (!this.stageHistory || this.stageHistory.size === 0) {
      this.stageHistory = new Map();
    }
    if (!this.stageHistory.get(this.stage)) {
      this.stageHistory.set(this.stage, {
        startedAt: new Date(),
      });
    }
  }
  next();
});

module.exports = mongoose.model('Production', ProductionSchema);