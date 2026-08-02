const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Production = require('../models/Production');
const auth = require('../middleware/auth');

// 📌 TÜM SİPARİŞLERİ GETİR
router.get('/', auth, async (req, res) => {
  try {
    console.log('📥 GET /production isteği');
    const orders = await Production.find()
      .populate('createdBy', 'username name')
      .sort({ createdAt: -1 });
    console.log(`📥 ${orders.length} sipariş bulundu`);
    res.json(orders);
  } catch (error) {
    console.error('❌ GET hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 YENİ SİPARİŞ EKLE
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 POST /production isteği:', req.body);
    
    const { 
      orderNo, 
      customer, 
      model, 
      color, 
      quantity, 
      note, 
      startStage 
    } = req.body;
    
    // startStage kontrolü - frontend'den gelen değer
    const stage = startStage || 'planlama';
    
    // Geçerli aşama mı kontrol et
    const validStages = ['planlama', 'uretim', 'paketleme', 'depo_hazirlik', 'sevk_alani', 'tamamlandi'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ 
        message: `Geçersiz aşama: ${stage}. Geçerli aşamalar: ${validStages.join(', ')}` 
      });
    }
    
    const order = new Production({
      orderNo,
      customer,
      model,
      color,
      quantity: Number(quantity),
      note: note || '',
      stage: stage,
      createdBy: req.user._id,
    });
    
    // stageHistory'yi manuel olarak başlat
    order.stageHistory = new Map();
    order.stageHistory.set(stage, {
      startedAt: new Date(),
    });
    
    await order.save();
    console.log('✅ Sipariş eklendi:', order);
    
    const populatedOrder = await Production.findById(order._id)
      .populate('createdBy', 'username name');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('❌ POST hatası:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu sipariş numarası zaten kullanılıyor' });
    }
    res.status(400).json({ message: error.message });
  }
});

// 📌 SİPARİŞ AŞAMASINI GÜNCELLE
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('========================================');
    console.log('🔍 PUT isteği geldi!');
    console.log('📌 ID:', req.params.id);
    console.log('📌 Body:', req.body);
    console.log('========================================');
    
    const { stage } = req.body;
    const orderId = req.params.id;
    
    // ID geçerli mi kontrol et
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.log('❌ Geçersiz ID:', orderId);
      return res.status(400).json({ message: 'Geçersiz sipariş ID' });
    }
    
    // Siparişi bul
    const order = await Production.findById(orderId);
    if (!order) {
      console.log('❌ Sipariş bulunamadı:', orderId);
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }
    
    console.log('📌 Mevcut stage:', order.stage);
    console.log('📌 Yeni stage:', stage);
    
    // Geçerli aşama mı kontrol et
    const validStages = ['planlama', 'uretim', 'paketleme', 'depo_hazirlik', 'sevk_alani', 'tamamlandi'];
    if (!validStages.includes(stage)) {
      console.log('❌ Geçersiz aşama:', stage);
      return res.status(400).json({ 
        message: `Geçersiz aşama: ${stage}. Geçerli aşamalar: ${validStages.join(', ')}` 
      });
    }
    
    // Eski aşamayı tamamlandı olarak işaretle
    const oldStage = order.stage;
    if (order.stageHistory && order.stageHistory.get(oldStage)) {
      const history = order.stageHistory.get(oldStage);
      history.completedAt = new Date();
      order.stageHistory.set(oldStage, history);
    }
    
    // Yeni aşamayı ekle
    if (!order.stageHistory) {
      order.stageHistory = new Map();
    }
    if (!order.stageHistory.get(stage)) {
      order.stageHistory.set(stage, {
        startedAt: new Date(),
      });
    }
    
    // Aşamayı güncelle
    order.stage = stage;
    order.updatedAt = Date.now();
    await order.save();
    
    console.log('✅ Sipariş güncellendi:', order);
    
    const updatedOrder = await Production.findById(order._id)
      .populate('createdBy', 'username name');
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('❌ PUT hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 SİPARİŞ SİL
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`📤 DELETE /production/${req.params.id} isteği`);
    
    const order = await Production.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }
    
    await order.deleteOne();
    console.log('✅ Sipariş silindi');
    res.json({ message: 'Sipariş başarıyla silindi' });
  } catch (error) {
    console.error('❌ DELETE hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;