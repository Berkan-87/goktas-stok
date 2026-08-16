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
    
    const materials = await Material.find(filter).sort({ category: 1, name: 1 });
    res.json(materials);
  } catch (error) {
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
    
    const materials = await Material.find(filter).sort({ name: 1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni malzeme ekle
router.post('/', auth, async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 📌 Stok güncelle
router.put('/:id/stock', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Malzeme bulunamadı' });
    }
    material.stock += parseInt(quantity);
    await material.save();
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 📌 Malzeme güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 📌 Malzeme sil (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json({ message: 'Malzeme silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;