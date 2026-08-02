const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  branch: {
    type: String,
    required: true,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka']
  },
  type: {
    type: String,
    required: true,
    enum: ['in', 'out', 'transfer']
  },
  quantity: {
    type: Number,
    required: true
  },
  fromBranch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    default: null
  },
  toBranch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// İndeksler - sorguları hızlandırır
historySchema.index({ branch: 1, createdAt: -1 });
historySchema.index({ productId: 1 });
historySchema.index({ user: 1 });
historySchema.index({ type: 1 });

module.exports = mongoose.model('History', historySchema);