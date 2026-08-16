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
      .populate('partialFulfilledBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    console.error('❌ Transferler getirilemedi:', error);
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
      .populate('partialFulfilledBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    console.error('❌ Şube transferleri getirilemedi:', error);
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

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Geçerli bir miktar giriniz' });
    }

    // Ürün kontrolü
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Kaynak şubede stok kontrolü
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
      note: note || '',
      status: 'pending'
    });

    await transfer.save();
    await transfer.populate('requestedBy', 'name username');
    await transfer.populate('productId', 'name category color');

    res.status(201).json(transfer);
  } catch (error) {
    console.error('❌ Transfer talebi hatası:', error);
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

    // Stok işlemleri - Kaynak şubeden düş
    sourceStock.quantity -= transfer.quantity;
    await sourceStock.save();

    // Hedef şubeye ekle (yoksa oluştur)
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
    console.error('❌ Transfer onay hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 ✅ YENİ: Kısmi karşılama (Fabrika kısmi miktar gönderir)
router.put('/:id/partial-fulfill', auth, async (req, res) => {
  try {
    const { partialQuantity, partialNote } = req.body;
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer bulunamadı' });
    }

    // Sadece onaylanmış transferler kısmi karşılanabilir
    if (transfer.status !== 'approved') {
      return res.status(400).json({ 
        message: 'Sadece onaylanmış transferler kısmi karşılanabilir. Mevcut durum: ' + transfer.status 
      });
    }

    // Sadece fabrika yetkilisi veya admin yapabilir
    if (req.user.role !== 'admin' && req.user.branch !== 'fabrika') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Kısmi miktar kontrolü
    if (!partialQuantity || partialQuantity <= 0) {
      return res.status(400).json({ message: 'Geçerli bir miktar giriniz' });
    }

    if (partialQuantity > transfer.quantity) {
      return res.status(400).json({ 
        message: `Kısmi miktar (${partialQuantity}), talep edilen miktardan (${transfer.quantity}) büyük olamaz` 
      });
    }

    // Eğer tam miktar gönderiliyorsa, normal complete yapılmalı
    if (partialQuantity === transfer.quantity) {
      return res.status(400).json({ 
        message: 'Tam miktar gönderilecekse "Tamamla" butonunu kullanın' 
      });
    }

    // Stok kontrolü - Kaynak şubede yeterli stok var mı?
    const sourceStock = await Stock.findOne({ 
      productId: transfer.productId, 
      branch: transfer.sourceBranch 
    });
    
    if (!sourceStock || sourceStock.quantity < partialQuantity) {
      return res.status(400).json({ 
        message: `Yeterli stok yok! Mevcut: ${sourceStock?.quantity || 0}` 
      });
    }

    // ✅ Kısmi stok işlemi
    // 1. Kaynak şubeden düş
    sourceStock.quantity -= partialQuantity;
    await sourceStock.save();

    // 2. Hedef şubeye ekle
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
    targetStock.quantity += partialQuantity;
    await targetStock.save();

    // Transfer durumunu güncelle
    transfer.partialQuantity = partialQuantity;
    transfer.partialNote = partialNote || 'Kısmi karşılama';
    transfer.partialFulfilled = true;
    transfer.partialFulfilledBy = req.user._id;
    transfer.partialFulfilledAt = new Date();
    transfer.status = 'partially_fulfilled';
    await transfer.save();

    await transfer.populate('requestedBy', 'name username');
    await transfer.populate('partialFulfilledBy', 'name username');
    await transfer.populate('productId', 'name category color');

    res.json({ 
      message: `✅ Kısmi karşılama tamamlandı: ${partialQuantity}/${transfer.quantity} adet gönderildi`,
      transfer,
      remainingQuantity: transfer.quantity - partialQuantity
    });
  } catch (error) {
    console.error('❌ Kısmi karşılama hatası:', error);
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
    console.error('❌ Transfer reddetme hatası:', error);
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

    // Hem approved hem partially_fulfilled tamamlanabilir
    if (transfer.status !== 'approved' && transfer.status !== 'partially_fulfilled') {
      return res.status(400).json({ 
        message: 'Sadece onaylanmış veya kısmi karşılanmış transferler tamamlanabilir' 
      });
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
    console.error('❌ Transfer tamamlama hatası:', error);
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
    console.error('❌ Transfer iptal hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Bekleyen transfer taleplerini getir (FABRİKA PANELİ İÇİN)
router.get('/pending', auth, async (req, res) => {
  try {
    const transfers = await Transfer.find({ 
      status: 'pending',
      sourceBranch: 'fabrika'
    })
      .populate('requestedBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: 1 });
    res.json(transfers);
  } catch (error) {
    console.error('❌ Bekleyen transferler getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 ✅ YENİ: Kısmi karşılanmış transferleri getir
router.get('/partial-fulfilled', auth, async (req, res) => {
  try {
    const transfers = await Transfer.find({ 
      status: 'partially_fulfilled'
    })
      .populate('requestedBy', 'name username')
      .populate('partialFulfilledBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    console.error('❌ Kısmi karşılanan transferler getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 ✅ YENİ: Onaylanmış ama henüz kısmi karşılanmamış transferler
router.get('/awaiting-fulfillment', auth, async (req, res) => {
  try {
    const transfers = await Transfer.find({ 
      status: 'approved'
    })
      .populate('requestedBy', 'name username')
      .populate('productId', 'name category color')
      .sort({ createdAt: 1 });
    res.json(transfers);
  } catch (error) {
    console.error('❌ Bekleyen karşılamalar getirilemedi:', error);
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
          totalQuantity: { $sum: '$quantity' },
          totalPartialQuantity: { $sum: '$partialQuantity' }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    console.error('❌ İstatistikler getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;