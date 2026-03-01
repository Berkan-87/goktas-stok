const router = require('express').Router();
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');
const { isAdmin, canModifyBranch, isViewerOrAbove } = require('../middleware/authorize');

// Tüm stokları getir
router.get('/', auth, isViewerOrAbove, async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('updatedBy', 'username');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Şubeye göre stokları getir
router.get('/branch/:branch', auth, isViewerOrAbove, async (req, res) => {
  try {
    const inventory = await Inventory.find({ branch: req.params.branch });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni stok modeli ekle (admin veya fabrika yetkilisi)
router.post('/', auth, async (req, res, next) => {
  if (req.user.role === 'admin' || (req.user.role === 'inventory_user' && req.user.branch === 'fabrika')) {
    next();
  } else {
    res.status(403).json({ error: 'Stok ekleme yetkiniz yok' });
  }
}, async (req, res) => {
  try {
    const inventory = new Inventory({
      ...req.body,
      updatedBy: req.user.userId
    });
    await inventory.save();
    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stok güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Stok bulunamadı' });
    }

    // Yetki kontrolü
    if (req.user.role !== 'admin' && 
        !(req.user.role === 'inventory_user' && req.user.branch === inventory.branch)) {
      return res.status(403).json({ error: 'Bu şubede stok güncelleme yetkiniz yok' });
    }

    inventory.quantity = req.body.quantity;
    inventory.lastUpdated = new Date();
    inventory.updatedBy = req.user.userId;

    await inventory.save();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stok modeli sil (sadece admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stok modeli silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;