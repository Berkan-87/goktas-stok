// models/Transfer.js
const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  // Talep eden şube
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Talep edilen şube (fabrika veya başka bir şube)
  sourceBranch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    required: true
  },
  // Talep eden şube
  targetBranch: {
    type: String,
    enum: ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  note: {
    type: String,
    trim: true
  },
  // Transfer durumu: pending, approved, completed, rejected, cancelled
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  // Onaylayan kişi (fabrika yetkilisi)
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  // Tamamlayan kişi
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  // Reddeden kişi
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// İndeksler
transferSchema.index({ sourceBranch: 1, targetBranch: 1 });
transferSchema.index({ productId: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transfer', transferSchema);