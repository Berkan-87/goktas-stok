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
    const stocks = await Stock.find().populate('productId', 'code name');
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
    const stocks = await Stock.find({ branch }).populate('productId', 'code name');
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Stok girişi (sadece yetkili şube)
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
    
    const stock = await Stock.findOne({ productId, branch });
    if (!stock) {
      return res.status(404).json({ message: 'Stok kaydı bulunamadı' });
    }

    const previousQuantity = stock.quantity;
    stock.quantity += quantity;
    stock.updatedAt = Date.now();
    await stock.save();

    // İşlem kaydı
    const transaction = new Transaction({
      type: 'in',
      productId,
      toBranch: branch,
      quantity,
      previousQuantity,
      newQuantity: stock.quantity,
      user: req.user._id,
      note
    });
    await transaction.save();

    res.json({
      message: 'Stok girişi başarılı',
      stock,
      transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Stok çıkışı (sadece yetkili şube)
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
    
    const stock = await Stock.findOne({ productId, branch });
    if (!stock) {
      return res.status(404).json({ message: 'Stok kaydı bulunamadı' });
    }

    if (stock.quantity < quantity) {
      return res.status(400).json({ message: 'Yeterli stok bulunmamaktadır' });
    }

    const previousQuantity = stock.quantity;
    stock.quantity -= quantity;
    stock.updatedAt = Date.now();
    await stock.save();

    // İşlem kaydı
    const transaction = new Transaction({
      type: 'out',
      productId,
      fromBranch: branch,
      quantity,
      previousQuantity,
      newQuantity: stock.quantity,
      user: req.user._id,
      note
    });
    await transaction.save();

    res.json({
      message: 'Stok çıkışı başarılı',
      stock,
      transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;