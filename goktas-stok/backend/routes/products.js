// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

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

// 📌 Yeni ürün ekle - ✅ DÜZELTİLDİ
router.post('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const { name, description, unit, category, color } = req.body;
    const productCategory = category || 'kanat';
    
    const validCategories = ['kanat', 'kasa', 'baslik'];
    if (!validCategories.includes(productCategory)) {
      return res.status(400).json({ 
        message: `Geçersiz kategori. Geçerli kategoriler: ${validCategories.join(', ')}` 
      });
    }

    if ((productCategory === 'kasa' || productCategory === 'baslik') && !color) {
      return res.status(400).json({ 
        message: 'Kasa ve Başlık kategorileri için renk seçimi zorunludur' 
      });
    }

    const existingProduct = await Product.findOne({ 
      name, 
      category: productCategory,
      color: color || null
    });
    if (existingProduct) {
      return res.status(400).json({ 
        message: 'Bu isimde, kategoride ve renkte zaten bir ürün var' 
      });
    }

    const product = new Product({
      name,
      description: description || '',
      unit: unit || 'adet',
      category: productCategory,
      color: color || null,
      isActive: true
    });
    
    await product.save();

    const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];
    const stockEntries = branches.map(branch => ({
      productId: product._id,
      branch,
      quantity: 0,
      criticalLevel: 10
    }));
    
    await Stock.insertMany(stockEntries);

    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Ürün eklenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 Ürün güncelle
router.put('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const { name, description, category, color, isActive } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    
    if (category) {
      const validCategories = ['kanat', 'kasa', 'baslik'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ 
          message: `Geçersiz kategori. Geçerli kategoriler: ${validCategories.join(', ')}` 
        });
      }
      product.category = category;
    }

    if (color !== undefined) {
      const validColors = ['bute_beyaz', 'koyu_gri', 'acik_gri', 'tas_gri', null];
      if (!validColors.includes(color)) {
        return res.status(400).json({ 
          message: 'Geçersiz renk. Geçerli renkler: Bute Beyaz, Koyu Gri, Açık Gri, Taş Gri' 
        });
      }
      product.color = color;
    }
    
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (isActive !== undefined) product.isActive = isActive;
    
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('❌ Ürün güncellenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 Ürün sil (soft delete)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
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