// routes/materials.js
const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const auth = require('../middleware/auth');

// 📌 Tüm malzemeleri getir
router.get('/', auth, async (req, res) => {
  try {
    const { branch } = req.query;
    const filter = { isActive: true };
    if (branch) filter.branch = branch;
    
    const materials = await Material.find(filter).sort({ category: 1, name: 1 });
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
    
    const materials = await Material.find(filter).sort({ name: 1 });
    res.json(materials);
  } catch (error) {
    console.error('❌ Kategori malzemeleri getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni malzeme ekle
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    console.log('📦 Gelen malzeme:', req.body);

    const { category, glueType, color, name, branch } = req.body;

    // Validasyonlar
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Malzeme adı zorunludur' });
    }

    if (category === 'glue' && !glueType) {
      return res.status(400).json({ message: 'Tutkal tipi seçimi zorunludur' });
    }

    if ((category === 'edgeband' || category === 'pvc') && !color) {
      return res.status(400).json({ message: 'Renk seçimi zorunludur' });
    }

    // Benzersizlik kontrolü
    const existing = await Material.findOne({ 
      name: name.trim(), 
      category, 
      branch: branch || 'fabrika' 
    });

    if (existing) {
      return res.status(400).json({ 
        message: `"${name}" isimli malzeme bu kategoride ve şubede zaten mevcut` 
      });
    }

    const material = new Material({
      name: name.trim(),
      category,
      unit: req.body.unit || 'adet',
      thickness: req.body.thickness || null,
      size: req.body.size || null,
      glueType: category === 'glue' ? glueType : null,
      color: (category === 'edgeband' || category === 'pvc') ? color : null,
      colorName: req.body.colorName || null,
      stock: parseInt(req.body.stock) || 0,
      branch: branch || 'fabrika',
      criticalLevel: parseInt(req.body.criticalLevel) || 10,
      isActive: true
    });

    await material.save();
    console.log('✅ Malzeme eklendi:', material.name);

    res.status(201).json({
      success: true,
      message: 'Malzeme başarıyla eklendi',
      material
    });

  } catch (error) {
    console.error('❌ Malzeme eklenirken hata:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu malzeme zaten mevcut (Aynı isim, kategori ve şube ile kayıtlı)' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validasyon hatası: ' + messages.join(', ') 
      });
    }
    
    res.status(400).json({ 
      message: error.message || 'Malzeme eklenirken bir hata oluştu' 
    });
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
      return res.status(400).json({ 
        message: `Stok miktarı negatif olamaz. Mevcut stok: ${material.stock}` 
      });
    }

    material.stock = newStock;
    await material.save();
    
    res.json({
      success: true,
      message: 'Stok başarıyla güncellendi',
      material
    });
  } catch (error) {
    console.error('❌ Stok güncellenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 Malzeme güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Malzeme bulunamadı' });
    }

    const updateData = { ...req.body };
    
    if (updateData.category && updateData.category !== material.category) {
      if (updateData.category !== 'mdf') {
        updateData.thickness = null;
        updateData.size = null;
      }
      if (updateData.category !== 'glue') {
        updateData.glueType = null;
      }
      if (updateData.category !== 'edgeband' && updateData.category !== 'pvc') {
        updateData.color = null;
        updateData.colorName = null;
      }
    }

    const updated = await Material.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Malzeme başarıyla güncellendi',
      material: updated
    });
  } catch (error) {
    console.error('❌ Malzeme güncellenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// 📌 Malzeme sil (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Malzeme bulunamadı' });
    }

    material.isActive = false;
    await material.save();

    res.json({
      success: true,
      message: `"${material.name}" malzemesi başarıyla silindi`,
      material
    });
  } catch (error) {
    console.error('❌ Malzeme silinirken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 İstatistikler
router.get('/stats', auth, async (req, res) => {
  try {
    const { branch } = req.query;
    const filter = { isActive: true };
    if (branch) filter.branch = branch;

    const stats = await Material.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          criticalItems: {
            $sum: {
              $cond: [
                { $lte: ['$stock', '$criticalLevel'] },
                1,
                0
              ]
            }
          }
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