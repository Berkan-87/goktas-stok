const router = require('express').Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { isAdmin, canModifyStation, isViewerOrAbove } = require('../middleware/authorize');

// Tüm siparişleri getir (viewer ve üstü)
router.get('/', auth, isViewerOrAbove, async (req, res) => {
  try {
    const orders = await Order.find().populate('stationHistory.user', 'username');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni sipariş ekle (sadece admin veya planlama)
router.post('/', auth, (req, res, next) => {
  if (req.user.role === 'admin' || (req.user.role === 'station_user' && req.user.station === 'planlama')) {
    next();
  } else {
    res.status(403).json({ error: 'Sipariş ekleme yetkiniz yok' });
  }
}, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      stationHistory: [{
        station: 'planlama',
        enteredAt: new Date(),
        user: req.user.userId
      }]
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sipariş durumunu güncelle
router.put('/:id/station', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    const { nextStation } = req.body;
    const stationOrder = ['planlama', 'cnc', 'tutkal', 'vakum', 'pres', 'kenarbant', 'kilit', 'lake', 'paketleme', 'tamamlandi'];
    
    // Yetki kontrolü
    if (req.user.role !== 'admin' && req.user.station !== order.currentStation) {
      return res.status(403).json({ error: 'Bu istasyonda işlem yapma yetkiniz yok' });
    }

    // İstasyon geçişini güncelle
    const historyEntry = order.stationHistory.find(h => h.station === order.currentStation && !h.exitedAt);
    if (historyEntry) {
      historyEntry.exitedAt = new Date();
    }

    order.stationHistory.push({
      station: nextStation,
      enteredAt: new Date(),
      user: req.user.userId
    });

    order.currentStation = nextStation;
    order.status = nextStation;
    order.updatedAt = new Date();

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sipariş sil (sadece admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sipariş silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;