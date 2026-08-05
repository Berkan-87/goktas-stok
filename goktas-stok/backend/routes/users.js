const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// 📌 Tüm kullanıcıları getir (isActive durumuna bakılmaksızın)
router.get('/', auth, async (req, res) => {
  try {
    // ✅ TÜM kullanıcıları getir (isActive kontrolü yapma)
    const users = await User.find()
      .select('username name role branch productionRole isActive')
      .sort({ name: 1 });
    
    console.log('📱 Toplam kullanıcı:', users.length);
    console.log('📱 Aktif kullanıcı:', users.filter(u => u.isActive).length);
    
    res.json(users);
  } catch (error) {
    console.error('❌ Kullanıcılar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Sadece aktif kullanıcıları getir (opsiyonel)
router.get('/active', auth, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('username name role branch productionRole')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('❌ Aktif kullanıcılar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni kullanıcı oluştur (EKLEME)
router.post('/', auth, async (req, res) => {
  try {
    const { username, password, name, role, branch, productionRole } = req.body;

    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış' });
    }

    // ✅ Yeni kullanıcı oluştur - isActive varsayılan true
    const newUser = new User({
      username,
      password,
      name,
      role: role || 'viewer',
      branch: role === 'admin' ? null : branch,
      productionRole: role === 'production_manager' ? productionRole : null,
      isActive: true // ✅ Varsayılan olarak aktif
    });

    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    console.log('✅ Yeni kullanıcı oluşturuldu:', userResponse);
    res.status(201).json(userResponse);

  } catch (error) {
    console.error('❌ Kullanıcı oluşturulamadı:', error);
    res.status(500).json({ message: error.message || 'Kullanıcı oluşturulurken bir hata oluştu.' });
  }
});

// 📌 Kullanıcı Güncelleme (DÜZENLEME)
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, role, branch, productionRole, password, isActive } = req.body;

    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Admin kullanıcı koruması
    if (user.username === 'admin' && role !== 'admin') {
      return res.status(400).json({ message: 'Admin kullanıcının rolü değiştirilemez!' });
    }

    // Güncellemeler
    if (name) user.name = name;
    if (role) user.role = role;
    if (branch !== undefined) user.branch = (role === 'admin') ? null : branch;
    if (productionRole !== undefined) {
      user.productionRole = (role === 'production_manager') ? productionRole : null;
    }
    if (isActive !== undefined) user.isActive = isActive;

    if (password && password.length > 0) {
      user.password = password;
    }

    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    
    console.log('✅ Kullanıcı güncellendi:', userResponse);
    res.json(userResponse);

  } catch (error) {
    console.error('❌ Kullanıcı güncellenemedi:', error);
    res.status(500).json({ message: error.message || 'Kullanıcı güncellenirken bir hata oluştu.' });
  }
});

// 📌 Kullanıcı Silme / Pasifleştirme
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: 'Admin kullanıcı silinemez!' });
    }

    user.isActive = false;
    await user.save();
    
    console.log('✅ Kullanıcı pasifleştirildi:', user.username);
    res.json({ message: 'Kullanıcı başarıyla silindi (pasif hale getirildi)' });

  } catch (error) {
    console.error('❌ Kullanıcı silinirken hata:', error);
    res.status(500).json({ message: error.message || 'Kullanıcı silinirken bir hata oluştu.' });
  }
});

// 📌 Kullanıcıyı aktifleştir
router.put('/:id/activate', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Admin kontrolü
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    user.isActive = true;
    await user.save();
    
    console.log('✅ Kullanıcı aktifleştirildi:', user.username);
    res.json({ message: 'Kullanıcı başarıyla aktifleştirildi', user });

  } catch (error) {
    console.error('❌ Kullanıcı aktifleştirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;