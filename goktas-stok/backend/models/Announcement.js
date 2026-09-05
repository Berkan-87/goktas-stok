// backend/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Duyuru başlığı zorunludur'],
    trim: true,
    maxlength: [100, 'Başlık en fazla 100 karakter olabilir']
  },
  content: {
    type: String,
    required: [true, 'Duyuru içeriği zorunludur'],
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true // ✅ performans için index eklendi
  }
}, { timestamps: true });

// ✅ Aktif ve süresi dolmamış duyuruları getir (limit opsiyonel)
announcementSchema.statics.getActive = async function(limit = 10) {
  const now = new Date();
  const query = {
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  };
  
  let q = this.find(query)
    .populate('createdBy', 'name username')
    .sort({ priority: -1, createdAt: -1 }); // Yüksek öncelik önce, sonra en yeni
  
  if (limit) q = q.limit(limit);
  
  return q;
};

module.exports = mongoose.model('Announcement', announcementSchema);