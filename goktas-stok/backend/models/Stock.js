const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  branch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
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

stockSchema.index({ productId: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);