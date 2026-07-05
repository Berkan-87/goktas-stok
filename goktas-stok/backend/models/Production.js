const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  note: String,
  stage: {
    type: String,
    enum: ['planlama', 'uretim', 'paketleme', 'hazir', 'tamamlandi'],
    default: 'planlama'
  },
  stageHistory: {
    planlama: {
      startedAt: Date,
      endedAt: Date,
      duration: Number
    },
    uretim: {
      startedAt: Date,
      endedAt: Date,
      duration: Number
    },
    paketleme: {
      startedAt: Date,
      endedAt: Date,
      duration: Number
    },
    hazir: {
      startedAt: Date,
      endedAt: Date,
      duration: Number
    },
    tamamlandi: {
      startedAt: Date,
      endedAt: Date,
      duration: Number
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Aşama geçişinde zaman hesaplama
productionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Production', productionSchema);