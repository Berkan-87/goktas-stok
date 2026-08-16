// backend/models/History.js
const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['in', 'out', 'transfer'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// İndeksler
historySchema.index({ productId: 1, branch: 1 });
historySchema.index({ createdAt: -1 });

module.exports = mongoose.model('History', historySchema);