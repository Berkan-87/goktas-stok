const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { canModifyBranch } = require('../middleware/authorize');

// Tüm şubelerin stoklarını getir
router.get('/', auth, async (req, res) => {
  try {
    const stocks = await Stock.find().populate('productId', 'code name isActive category');
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli bir şubenin stoklarını getir
router.get('/branch/:branch', auth, async (req, res) => {
  try {
    const { branch } = req.params;
    const stocks = await Stock.find({ branch }).populate('productId', 'code name isActive category');
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 📌 Stok girişi - OTOMATİK STOK KAYDI OLUŞTUR
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
    
    // Ürünün aktif olup olmadığını kontrol et
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Ürün bulunamadı veya pasif' });
    }
    
    // ✅ Stok kaydını bul, yoksa oluştur
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
      console.log('✅ Yeni stok kaydı oluşturuldu:', stock);
    }

    const previousQuantity = stock.quantity;
    stock.quantity += parseInt(quantity);
    stock.updatedAt = Date.now();
    await stock.save();

    // İşlem kaydı
    const transaction = new Transaction({
      type: 'in',
      productId,
      toBranch: branch,
      quantity: parseInt(quantity),
      previousQuantity,
      newQuantity: stock.quantity,
      user: req.user._id,
      note: note || 'Stok girişi'
    });
    await transaction.save();

    res.json({
      message: 'Stok girişi başarılı',
      stock,
      transaction
    });
  } catch (error) {
    console.error('❌ Stok girişi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// 📌 Stok çıkışı - OTOMATİK STOK KAYDI OLUŞTUR
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
    
    // Ürünün aktif olup olmadığını kontrol et
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Ürün bulunamadı veya pasif' });
    }
    
    // ✅ Stok kaydını bul, yoksa oluştur (0 stokla)
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
      console.log('✅ Yeni stok kaydı oluşturuldu:', stock);
    }

    if (stock.quantity < parseInt(quantity)) {
      return res.status(400).json({ 
        message: `Yeterli stok bulunmamaktadır. Mevcut stok: ${stock.quantity}` 
      });
    }

    const previousQuantity = stock.quantity;
    stock.quantity -= parseInt(quantity);
    stock.updatedAt = Date.now();
    await stock.save();

    // İşlem kaydı
    const transaction = new Transaction({
      type: 'out',
      productId,
      fromBranch: branch,
      quantity: parseInt(quantity),
      previousQuantity,
      newQuantity: stock.quantity,
      user: req.user._id,
      note: note || 'Stok çıkışı'
    });
    await transaction.save();

    res.json({
      message: 'Stok çıkışı başarılı',
      stock,
      transaction
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
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 📌 Tüm stokları özet olarak getir (admin için)
router.get('/summary', auth, async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('productId', 'code name category')
      .sort({ branch: 1, 'productId.name': 1 });
    
    // Şube bazında grupla
    const summary = {};
    stocks.forEach(stock => {
      if (!summary[stock.branch]) {
        summary[stock.branch] = [];
      }
      summary[stock.branch].push({
        productName: stock.productId?.name || 'Bilinmeyen',
        productCode: stock.productId?.code || '',
        quantity: stock.quantity,
        criticalLevel: stock.criticalLevel
      });
    });
    
    res.json(summary);
  } catch (error) {
    console.error('❌ Stok özeti getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;