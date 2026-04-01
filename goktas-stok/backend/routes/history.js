const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Tüm işlem geçmişini getir
router.get('/', auth, async (req, res) => {
  try {
    const { branch, type, startDate, endDate, productId } = req.query;
    
    let filter = {};
    
    if (branch) {
      filter.$or = [{ fromBranch: branch }, { toBranch: branch }];
    }
    
    if (type) filter.type = type;
    if (productId) filter.productId = productId;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(filter)
      .populate('productId', 'code name')
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .limit(1000);
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli bir şubenin geçmişini getir
router.get('/branch/:branch', auth, async (req, res) => {
  try {
    const { branch } = req.params;
    const transactions = await Transaction.find({
      $or: [{ fromBranch: branch }, { toBranch: branch }]
    })
      .populate('productId', 'code name')
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .limit(500);
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;