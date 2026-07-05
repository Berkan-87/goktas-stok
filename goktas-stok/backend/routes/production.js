const express = require('express');
const router = express.Router();
const Production = require('../models/Production'); // ✅ SADECE Production
const auth = require('../middleware/auth');
const { admin } = require('../middleware/authorize');

// Tüm siparişleri getir
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Production.find()
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Sipariş listesi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli aşamadaki siparişleri getir
router.get('/stage/:stage', auth, async (req, res) => {
  try {
    const { stage } = req.params;
    const orders = await Production.find({ stage })
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Aşama listesi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni sipariş ekle
router.post('/', auth, async (req, res) => {
  try {
    const { orderNo, customer, model, color, quantity, note } = req.body;

    const existing = await Production.findOne({ orderNo });
    if (existing) {
      return res.status(400).json({ message: 'Bu sipariş numarası zaten mevcut' });
    }

    const order = new Production({
      orderNo,
      customer,
      model,
      color,
      quantity: parseInt(quantity),
      note,
      createdBy: req.user._id,
      stageHistory: {
        planlama: {
          startedAt: new Date()
        }
      }
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Sipariş ekleme hatası:', error);
    res.status(500).json({ message: 'Sipariş eklenemedi' });
  }
});

// Sipariş aşamasını güncelle
router.put('/:id/stage', auth, async (req, res) => {
  try {
    const { stage } = req.body;
    const order = await Production.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    const validStages = ['planlama', 'uretim', 'paketleme', 'hazir', 'tamamlandi'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ message: 'Geçersiz aşama' });
    }

    if (order.stageHistory[order.stage]) {
      order.stageHistory[order.stage].endedAt = new Date();
      order.stageHistory[order.stage].duration = 
        new Date(order.stageHistory[order.stage].endedAt) - 
        new Date(order.stageHistory[order.stage].startedAt);
    }

    order.stage = stage;
    if (!order.stageHistory[stage]) {
      order.stageHistory[stage] = {};
    }
    order.stageHistory[stage].startedAt = new Date();

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Aşama güncelleme hatası:', error);
    res.status(500).json({ message: 'Aşama güncellenemedi' });
  }
});

// Sipariş sil (sadece admin)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    await Production.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sipariş silindi' });
  } catch (error) {
    console.error('Sipariş silme hatası:', error);
    res.status(500).json({ message: 'Silme işlemi başarısız' });
  }
});

module.exports = router;