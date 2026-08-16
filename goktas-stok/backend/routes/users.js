// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// 📌 Tüm kullanıcıları getir
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find()
      .select('username name role branch productionRole materialDepoAccess isActive')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('❌ Kullanıcılar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni kullanıcı oluştur
router.post('/', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    const { username, password, name, role, branch, productionRole, materialDepoAccess } = req.body;

    // Validasyon
    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: 'Kullanıcı adı, şifre, isim ve rol zorunludur' });
    }

    // Kullanıcı adı kontrolü
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış' });
    }

    // Yeni kullanıcı oluştur
    const newUser = new User({
      username,
      password,
      name,
      role,
      branch: role === 'admin' ? null : (branch || null),
      productionRole: role === 'production_manager' ? productionRole : null,
      materialDepoAccess: materialDepoAccess || false,
      isActive: true
    });

    await newUser.save();
    
    // Şifreyi çıkararak cevap ver
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    console.log('✅ Yeni kullanıcı oluşturuldu:', username);
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('❌ Kullanıcı oluşturulamadı:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Kullanıcı güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    const userId = req.params.id;
    const { name, role, branch, productionRole, materialDepoAccess, password, isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Admin koruması
    if (user.username === 'admin') {
      if (role && role !== 'admin') {
        return res.status(400).json({ message: 'Admin kullanıcının rolü değiştirilemez!' });
      }
      if (isActive === false) {
        return res.status(400).json({ message: 'Admin kullanıcı pasifleştirilemez!' });
      }
    }

    // Güncellemeler
    if (name) user.name = name;
    
    if (role) {
      user.role = role;
      user.branch = (role === 'admin') ? null : (branch || user.branch);
      user.productionRole = (role === 'production_manager') ? (productionRole || user.productionRole) : null;
    }
    
    if (branch !== undefined && role !== 'admin') {
      user.branch = branch;
    }
    
    if (productionRole !== undefined && role === 'production_manager') {
      user.productionRole = productionRole;
    }
    
    if (materialDepoAccess !== undefined) {
      user.materialDepoAccess = materialDepoAccess;
    }
    
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    
    if (password && password.length > 0) {
      user.password = password;
    }

    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    console.log('✅ Kullanıcı güncellendi:', user.username);
    res.json(userResponse);
  } catch (error) {
    console.error('❌ Kullanıcı güncellenemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Kullanıcı pasifleştir (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: 'Admin kullanıcı silinemez!' });
    }

    user.isActive = false;
    await user.save();
    
    console.log('✅ Kullanıcı pasifleştirildi:', user.username);
    res.json({ message: 'Kullanıcı başarıyla pasifleştirildi' });
  } catch (error) {
    console.error('❌ Kullanıcı silinirken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Kullanıcı aktifleştir
router.put('/:id/activate', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    user.isActive = true;
    await user.save();
    
    console.log('✅ Kullanıcı aktifleştirildi:', user.username);
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      message: 'Kullanıcı başarıyla aktifleştirildi',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Kullanıcı aktifleştirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Kullanıcı sayısını getir
router.get('/count', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }

    const total = await User.countDocuments();
    const active = await User.countDocuments({ isActive: true });
    const inactive = await User.countDocuments({ isActive: false });
    
    res.json({ total, active, inactive });
  } catch (error) {
    console.error('❌ Kullanıcı sayısı getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;