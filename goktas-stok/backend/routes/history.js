// backend/routes/history.js
const express = require('express');
const router = express.Router();
const History = require('../models/History');
const auth = require('../middleware/auth');

// 📌 Geçmiş verilerini getir
router.get('/', auth, async (req, res) => {
  try {
    const { type, branch, dateRange } = req.query;
    const filter = {};

    // İşlem tipi filtresi
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Şube filtresi
    if (branch && branch !== 'all') {
      filter.branch = branch;
    }

    // Tarih filtresi
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch(dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          break;
      }
      
      filter.createdAt = { $gte: startDate };
    }

    // Admin değilse sadece kendi şubesini görsün
    if (req.user.role !== 'admin' && req.user.branch) {
      filter.branch = req.user.branch;
    }

    const history = await History.find(filter)
      .populate('productId', 'name category color')
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .limit(1000);

    console.log(`📊 ${history.length} geçmiş kaydı gönderildi`);
    res.json(history);
  } catch (error) {
    console.error('❌ Geçmiş verileri alınamadı:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;