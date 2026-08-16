// routes/materials.js
const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const auth = require('../middleware/auth');

// 📌 Tüm malzemeleri getir (şubeye göre)
router.get('/', auth, async (req, res) => {
  try {
    const { branch } = req.query;
    const filter = { isActive: true };
    if (branch) filter.branch = branch;
    
    const materials = await Material.find(filter)
      .sort({ category: 1, name: 1 });
    res.json(materials);
  } catch (error) {
    console.error('❌ Malzemeler getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Kategoriye göre malzemeleri getir
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { branch } = req.query;
    const filter = { category, isActive: true };
    if (branch) filter.branch = branch;
    
    const materials = await Material.find(filter)
      .sort({ name: 1 });
    res.json(materials);
  } catch (error) {
    console.error('❌ Kategori malzemeleri getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni malzeme ekle
router.post('/', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const material = new Material(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    console.error('❌ Malzeme eklenirken hata:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu malzeme zaten mevcut (Aynı isim, kategori ve şube)' 
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// 📌 Stok güncelle
router.put('/:id/stock', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity === 0) {
      return res.status(400).json({ message: 'Geçerli bir miktar giriniz' });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Malzeme bulunamadı' });
    }

    const newStock = material.stock + parseInt(quantity);
    if (newStock < 0) {
      return res.status(400).json({ message: 'Stok miktarı negatif olamaz' });
    }

    material.stock = newStock;
    await material.save();
    res.json(material);
  } catch (error) {
    console.error('❌ Stok güncellenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 Malzeme güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!material) {
      return res.status(404).json({ message: 'Malzeme bulunamadı' });
    }
    res.json(material);
  } catch (error) {
    console.error('❌ Malzeme güncellenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 Malzeme sil (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!material) {
      return res.status(404).json({ message: 'Malzeme bulunamadı' });
    }
    res.json({ message: 'Malzeme başarıyla silindi', material });
  } catch (error) {
    console.error('❌ Malzeme silinirken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;