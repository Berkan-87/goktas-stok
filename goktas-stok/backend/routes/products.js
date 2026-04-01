const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/authorize');

// Tüm ürünleri getir
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ code: 1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni ürün ekle (sadece admin)
router.post('/', [auth, admin], [
  body('code').notEmpty().withMessage('Ürün kodu gerekli'),
  body('name').notEmpty().withMessage('Ürün adı gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, name, description, unit } = req.body;
    
    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      return res.status(400).json({ message: 'Bu ürün kodu zaten mevcut' });
    }

    const product = new Product({ code, name, description, unit });
    await product.save();

    // Tüm şubeler için stok kaydı oluştur
    const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];
    const stockEntries = branches.map(branch => ({
      productId: product._id,
      branch,
      quantity: 0
    }));
    await Stock.insertMany(stockEntries);

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ürün güncelle (sadece admin)
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ürün sil (sadece admin)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({ message: 'Ürün silindi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;