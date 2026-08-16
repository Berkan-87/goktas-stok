// routes/transfer.js
const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// 📌 Tüm transfer taleplerini getir
router.get('/', auth, async (req, res) => {
  try {
    const transfers = await Transfer.find()
      .populate('requestedBy', 'name username')
      .populate('approvedBy', 'name username')
      .populate('completedBy', 'name username')
      .populate('rejectedBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Şubeye göre transfer taleplerini getir
router.get('/branch/:branch', auth, async (req, res) => {
  try {
    const { branch } = req.params;
    const transfers = await Transfer.find({
      $or: [
        { sourceBranch: branch },
        { targetBranch: branch }
      ]
    })
      .populate('requestedBy', 'name username')
      .populate('approvedBy', 'name username')
      .populate('completedBy', 'name username')
      .populate('rejectedBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni transfer talebi oluştur (ŞUBE TALEBİ)
router.post('/', auth, async (req, res) => {
  try {
    const { sourceBranch, targetBranch, productId, quantity, note } = req.body;

    // Validasyonlar
    if (sourceBranch === targetBranch) {
      return res.status(400).json({ message: 'Kaynak ve hedef şube aynı olamaz' });
    }

    // Ürün kontrolü
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Kaynak şubede stok kontrolü (sadece fabrika için değil, tüm şubeler için)
    const sourceStock = await Stock.findOne({ productId, branch: sourceBranch });
    if (!sourceStock || sourceStock.quantity < quantity) {
      return res.status(400).json({ 
        message: `Yeterli stok yok. Mevcut: ${sourceStock?.quantity || 0}` 
      });
    }

    // Transfer talebi oluştur
    const transfer = new Transfer({
      requestedBy: req.user._id,
      sourceBranch,
      targetBranch,
      productId,
      quantity,
      note,
      status: 'pending'
    });

    await transfer.save();
    await transfer.populate('requestedBy', 'name username');
    await transfer.populate('productId', 'name category color');

    res.status(201).json(transfer);
  } catch (error) {
    console.error('Transfer talebi hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Transfer talebini onayla (FABRİKA ONAYI)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer bulunamadı' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Bu transfer zaten işleme alınmış' });
    }

    // Sadece fabrika yetkilisi veya admin onaylayabilir
    if (req.user.role !== 'admin' && req.user.branch !== 'fabrika') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Kaynak şubede stok kontrolü
    const sourceStock = await Stock.findOne({ 
      productId: transfer.productId, 
      branch: transfer.sourceBranch 
    });
    
    if (!sourceStock || sourceStock.quantity < transfer.quantity) {
      return res.status(400).json({ 
        message: `Yeterli stok yok! Mevcut: ${sourceStock?.quantity || 0}` 
      });
    }

    // Stok işlemleri
    // 1. Kaynak şubeden düş
    sourceStock.quantity -= transfer.quantity;
    await sourceStock.save();

    // 2. Hedef şubeye ekle (yoksa oluştur)
    let targetStock = await Stock.findOne({ 
      productId: transfer.productId, 
      branch: transfer.targetBranch 
    });
    
    if (!targetStock) {
      targetStock = new Stock({
        productId: transfer.productId,
        branch: transfer.targetBranch,
        quantity: 0,
        criticalLevel: 10
      });
    }
    targetStock.quantity += transfer.quantity;
    await targetStock.save();

    // Transfer durumunu güncelle
    transfer.status = 'approved';
    transfer.approvedBy = req.user._id;
    transfer.approvedAt = new Date();
    await transfer.save();

    await transfer.populate('requestedBy', 'name username');
    await transfer.populate('approvedBy', 'name username');
    await transfer.populate('productId', 'name category color');

    res.json({ 
      message: 'Transfer onaylandı ve stoklar güncellendi', 
      transfer 
    });
  } catch (error) {
    console.error('Transfer onay hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Transfer talebini reddet
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer bulunamadı' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Bu transfer zaten işleme alınmış' });
    }

    // Sadece fabrika yetkilisi veya admin reddedebilir
    if (req.user.role !== 'admin' && req.user.branch !== 'fabrika') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    transfer.status = 'rejected';
    transfer.rejectedBy = req.user._id;
    transfer.rejectedAt = new Date();
    transfer.rejectionReason = reason || 'Belirtilmedi';
    await transfer.save();

    await transfer.populate('requestedBy', 'name username');
    await transfer.populate('rejectedBy', 'name username');
    await transfer.populate('productId', 'name category color');

    res.json({ message: 'Transfer reddedildi', transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Transfer talebini tamamla (ŞUBE TESLİM ALDI)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer bulunamadı' });
    }

    if (transfer.status !== 'approved') {
      return res.status(400).json({ message: 'Sadece onaylanmış transferler tamamlanabilir' });
    }

    // Sadece hedef şube veya admin tamamlayabilir
    if (req.user.role !== 'admin' && req.user.branch !== transfer.targetBranch) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    transfer.status = 'completed';
    transfer.completedBy = req.user._id;
    transfer.completedAt = new Date();
    await transfer.save();

    await transfer.populate('requestedBy', 'name username');
    await transfer.populate('completedBy', 'name username');
    await transfer.populate('productId', 'name category color');

    res.json({ message: 'Transfer tamamlandı', transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Transfer talebini iptal et (TALEP EDEN İPTAL EDEBİLİR)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer bulunamadı' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Sadece bekleyen transferler iptal edilebilir' });
    }

    // Sadece talep eden veya admin iptal edebilir
    if (req.user.role !== 'admin' && transfer.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    transfer.status = 'cancelled';
    await transfer.save();

    await transfer.populate('requestedBy', 'name username');
    await transfer.populate('productId', 'name category color');

    res.json({ message: 'Transfer iptal edildi', transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Bekleyen transfer taleplerini getir (FABRİKA PANELİ İÇİN)
router.get('/pending', auth, async (req, res) => {
  try {
    const transfers = await Transfer.find({ 
      status: 'pending',
      sourceBranch: 'fabrika' // Sadece fabrikadan yapılan talepler
    })
      .populate('requestedBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: 1 }); // En eski talepler önce
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Şube bazlı transfer istatistikleri
router.get('/stats/:branch', auth, async (req, res) => {
  try {
    const { branch } = req.params;
    const stats = await Transfer.aggregate([
      {
        $match: {
          $or: [
            { sourceBranch: branch },
            { targetBranch: branch }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;