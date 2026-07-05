const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // ✅ Product modeline referans
    required: true
  },
  branch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    required: true
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  criticalLevel: {
    type: Number,
    default: 10
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Her güncellemede tarihi güncelle
stockSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Stock', stockSchema);