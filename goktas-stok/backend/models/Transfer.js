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
  
  // ✅ productId artık required değil (özel ürünler için null olabilir)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  
  // ✅ ÖZEL ÜRÜN ALANLARI (YENİ)
  isCustom: {
    type: Boolean,
    default: false
  },
  customName: {
    type: String,
    trim: true,
    default: ''
  },
  
  // ✅ Transfer durumu
  status: {
    type: String,
    enum: ['pending', 'approved', 'partially_fulfilled', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Kısmi karşılama alanları
  partialQuantity: {
    type: Number,
    default: null,
    min: 0
  },
  partialNote: {
    type: String,
    trim: true,
    default: ''
  },
  partialFulfilled: {
    type: Boolean,
    default: false
  },
  partialFulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  partialFulfilledAt: {
    type: Date
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
    type: String,
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// ✅ İndeksler
transferSchema.index({ sourceBranch: 1, targetBranch: 1 });
transferSchema.index({ productId: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ createdAt: -1 });
transferSchema.index({ isCustom: 1 }); // ✅ Özel ürün sorguları için
transferSchema.index({ partialFulfilled: 1, status: 1 });

// ✅ Virtual field - Kalan miktar
transferSchema.virtual('remainingQuantity').get(function() {
  if (this.status === 'partially_fulfilled' && this.partialQuantity) {
    return this.quantity - this.partialQuantity;
  }
  return this.quantity;
});

// ✅ Virtual field - Karşılanma yüzdesi
transferSchema.virtual('fulfillmentPercentage').get(function() {
  if (this.status === 'partially_fulfilled' && this.partialQuantity) {
    return Math.round((this.partialQuantity / this.quantity) * 100);
  }
  if (this.status === 'completed') {
    return 100;
  }
  return 0;
});

// ✅ Statik metod - Bekleyen kısmi karşılamalar
transferSchema.statics.getPendingPartialFulfillments = async function() {
  return this.find({ 
    status: 'approved',
    $or: [
      { partialQuantity: { $eq: null } },
      { partialQuantity: 0 }
    ]
  }).populate('productId', 'name category color');
};

// ✅ Statik metod - Kısmi karşılanmış transferler
transferSchema.statics.getPartialFulfilled = async function() {
  return this.find({ 
    status: 'partially_fulfilled',
    partialFulfilled: true
  }).populate('productId', 'name category color');
};

// ✅ Pre-save middleware - Durum kontrolü
transferSchema.pre('save', function(next) {
  // Eğer partialQuantity varsa ve status henüz partially_fulfilled değilse
  if (this.partialQuantity && this.partialQuantity > 0 && this.status === 'approved') {
    if (this.partialQuantity < this.quantity) {
      this.status = 'partially_fulfilled';
      this.partialFulfilled = true;
    } else if (this.partialQuantity === this.quantity) {
      this.status = 'completed';
    }
  }
  next();
});

// ✅ JSON dönüşümünde virtual alanları dahil et
transferSchema.set('toJSON', { virtuals: true });
transferSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Transfer', transferSchema);