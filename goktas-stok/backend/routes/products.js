const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// 📌 Tüm ürünleri getir
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    console.error('❌ Ürünler getirilirken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni ürün ekle - OTOMATİK STOK OLUŞTUR
router.post('/', auth, authorize.admin, async (req, res) => {
  try {
    console.log('📥 Yeni ürün isteği:', req.body);
    
    const { code, name, description, unit, category } = req.body;
    const productCategory = category || 'kanat';
    
    // Geçerli kategori mi kontrol et
    if (!['kanat', 'kasa'].includes(productCategory)) {
      return res.status(400).json({ 
        message: 'Geçersiz kategori. Lütfen "kanat" veya "kasa" seçin.' 
      });
    }
    
    // Ürünü oluştur
    const product = new Product({
      code,
      name,
      description: description || '',
      unit: unit || 'adet',
      category: productCategory,
      isActive: true
    });
    
    await product.save();
    console.log('✅ Ürün eklendi:', product);
    
    // ✅ TÜM ŞUBELER İÇİN STOK KAYDI OLUŞTUR
    const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];
    const stockEntries = branches.map(branch => ({
      productId: product._id,
      branch,
      quantity: 0, // Başlangıçta 0 stok
      criticalLevel: 10
    }));
    
    await Stock.insertMany(stockEntries);
    console.log(`✅ ${branches.length} şube için stok kaydı oluşturuldu`);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Ürün eklenirken hata:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu kod ile zaten bir ürün var.' });
    }
    res.status(400).json({ message: error.message });
  }
});

// 📌 Ürün güncelle
router.put('/:id', auth, authorize.admin, async (req, res) => {
  try {
    const { name, code, description, category, isActive } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    
    if (name) product.name = name;
    if (code) product.code = code;
    if (description !== undefined) product.description = description;
    if (category) {
      if (!['kanat', 'kasa'].includes(category)) {
        return res.status(400).json({ message: 'Geçersiz kategori' });
      }
      product.category = category;
    }
    if (isActive !== undefined) product.isActive = isActive;
    
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('❌ Ürün güncellenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 Ürün sil (soft delete)
router.delete('/:id', auth, authorize.admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    
    product.isActive = false;
    await product.save();
    res.json({ message: 'Ürün başarıyla devre dışı bırakıldı' });
  } catch (error) {
    console.error('❌ Ürün silinirken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;