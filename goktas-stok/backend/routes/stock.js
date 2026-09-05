// routes/stock.js - Transaction KALDIRILDI
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const History = require('../models/History');
const auth = require('../middleware/auth'); // ✅ DOĞRU
const { canModifyBranch } = require('../middleware/authorize'); // ✅ DOĞRU

// 📌 Tüm şubelerin stoklarını getir
router.get('/', auth, async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('productId', 'code name isActive category')
      .sort({ branch: 1, 'productId.name': 1 });
    res.json(stocks);
  } catch (error) {
    console.error('❌ Stoklar getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Belirli bir şubenin stoklarını getir
router.get('/branch/:branch', auth, async (req, res) => {
  try {
    const { branch } = req.params;
    const stocks = await Stock.find({ branch })
      .populate('productId', 'code name isActive category')
      .sort({ 'productId.name': 1 });
    res.json(stocks);
  } catch (error) {
    console.error('❌ Şube stokları getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Stok girişi
router.post('/in', [
  auth,
  canModifyBranch(req => req.body.branch)
], [
  body('productId').notEmpty().withMessage('Ürün ID gerekli'),
  body('branch').notEmpty().withMessage('Şube gerekli'),
  body('quantity').isInt({ min: 1 }).withMessage('Geçerli miktar giriniz'),
  body('note').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, branch, quantity, note } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    if (!product.isActive) {
      return res.status(404).json({ message: 'Ürün pasif durumda' });
    }
    
    let stock = await Stock.findOne({ productId, branch });
    if (!stock) {
      console.log(`📦 Stok kaydı bulunamadı, oluşturuluyor: ${product.name} - ${branch}`);
      stock = new Stock({
        productId,
        branch,
        quantity: 0,
        criticalLevel: 10
      });
      await stock.save();
      console.log('✅ Yeni stok kaydı oluşturuldu');
    }

    const previousQuantity = stock.quantity;
    const quantityNum = parseInt(quantity);
    stock.quantity += quantityNum;
    stock.updatedAt = Date.now();
    await stock.save();

    // ✅ Sadece History kaydı (Transaction KALDIRILDI)
    const history = new History({
      productId,
      branch,
      type: 'in',
      quantity: quantityNum,
      fromBranch: branch,
      toBranch: branch,
      user: req.user._id,
      note: note || 'Stok girişi'
    });
    await history.save();

    const populatedStock = await Stock.findById(stock._id)
      .populate('productId', 'code name isActive category');

    res.json({
      success: true,
      message: 'Stok girişi başarılı',
      stock: populatedStock,
      history
    });
  } catch (error) {
    console.error('❌ Stok girişi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Stok çıkışı
router.post('/out', [
  auth,
  canModifyBranch(req => req.body.branch)
], [
  body('productId').notEmpty().withMessage('Ürün ID gerekli'),
  body('branch').notEmpty().withMessage('Şube gerekli'),
  body('quantity').isInt({ min: 1 }).withMessage('Geçerli miktar giriniz'),
  body('note').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, branch, quantity, note } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    if (!product.isActive) {
      return res.status(404).json({ message: 'Ürün pasif durumda' });
    }
    
    let stock = await Stock.findOne({ productId, branch });
    if (!stock) {
      console.log(`📦 Stok kaydı bulunamadı, oluşturuluyor: ${product.name} - ${branch}`);
      stock = new Stock({
        productId,
        branch,
        quantity: 0,
        criticalLevel: 10
      });
      await stock.save();
      console.log('✅ Yeni stok kaydı oluşturuldu');
    }

    const quantityNum = parseInt(quantity);
    if (stock.quantity < quantityNum) {
      return res.status(400).json({ 
        message: `Yeterli stok bulunmamaktadır. Mevcut stok: ${stock.quantity}` 
      });
    }

    const previousQuantity = stock.quantity;
    stock.quantity -= quantityNum;
    stock.updatedAt = Date.now();
    await stock.save();

    // ✅ Sadece History kaydı (Transaction KALDIRILDI)
    const history = new History({
      productId,
      branch,
      type: 'out',
      quantity: quantityNum,
      fromBranch: branch,
      toBranch: branch,
      user: req.user._id,
      note: note || 'Stok çıkışı'
    });
    await history.save();

    const populatedStock = await Stock.findById(stock._id)
      .populate('productId', 'code name isActive category');

    res.json({
      success: true,
      message: 'Stok çıkışı başarılı',
      stock: populatedStock,
      history
    });
  } catch (error) {
    console.error('❌ Stok çıkışı hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Belirli bir ürünün tüm şubelerdeki stoklarını getir
router.get('/product/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const stocks = await Stock.find({ productId })
      .populate('productId', 'code name isActive category')
      .sort({ branch: 1 });
    res.json(stocks);
  } catch (error) {
    console.error('❌ Ürün stokları getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Tüm stokları özet olarak getir (admin için)
router.get('/summary', auth, async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('productId', 'code name category')
      .sort({ branch: 1, 'productId.name': 1 });
    
    const summary = {};
    stocks.forEach(stock => {
      if (!stock.productId) return;
      
      if (!summary[stock.branch]) {
        summary[stock.branch] = {
          totalProducts: 0,
          totalStock: 0,
          products: []
        };
      }
      summary[stock.branch].totalProducts++;
      summary[stock.branch].totalStock += stock.quantity;
      summary[stock.branch].products.push({
        productId: stock.productId._id,
        productName: stock.productId.name || 'Bilinmeyen',
        productCode: stock.productId.code || '',
        quantity: stock.quantity,
        criticalLevel: stock.criticalLevel
      });
    });
    
    res.json(summary);
  } catch (error) {
    console.error('❌ Stok özeti getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Stok miktarını güncelle (admin için doğrudan müdahale)
router.put('/:id', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const stock = await Stock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stok kaydı bulunamadı' });
    }
    
    stock.quantity = parseInt(quantity);
    stock.updatedAt = Date.now();
    await stock.save();
    
    const populatedStock = await Stock.findById(stock._id)
      .populate('productId', 'code name isActive category');
    
    res.json({
      success: true,
      message: 'Stok güncellendi',
      stock: populatedStock
    });
  } catch (error) {
    console.error('❌ Stok güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Sadece Kanat kategorisindeki ürünlerin toplam stok miktarı
router.get('/total-kanat', auth, async (req, res) => {
  try {
    const kanatProducts = await Product.find({ category: 'kanat', isActive: true }).select('_id');
    const kanatProductIds = kanatProducts.map(p => p._id);

    if (kanatProductIds.length === 0) {
      return res.json({ totalQuantity: 0 });
    }

    const result = await Stock.aggregate([
      {
        $match: {
          productId: { $in: kanatProductIds }
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
    res.json({ totalQuantity });
  } catch (error) {
    console.error('❌ Toplam kanat stok hesaplanırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

module.exports = router;