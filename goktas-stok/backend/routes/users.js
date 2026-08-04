const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// 📌 Tüm aktif kullanıcıları getir
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('username name role branch productionRole')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('❌ Kullanıcılar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni kullanıcı oluştur (EKLEME)
router.post('/', auth, async (req, res) => {
  try {
    const { username, password, name, role, branch, productionRole } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış' });
    }

    const newUser = new User({
      username,
      password,
      name,
      role,
      branch: role === 'admin' ? null : branch,
      productionRole: role === 'production_manager' ? productionRole : null
    });

    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;
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
    const { name, role, branch, productionRole, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (user.username === 'admin' && role !== 'admin') {
      return res.status(400).json({ message: 'Admin kullanıcının rolü değiştirilemez!' });
    }

    user.name = name || user.name;
    user.role = role || user.role;
    user.branch = (role === 'admin') ? null : (branch || user.branch);
    user.productionRole = (role === 'production_manager') ? (productionRole || user.productionRole) : null;

    if (password && password.length > 0) {
      user.password = password;
    }

    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
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
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: 'Admin kullanıcı silinemez!' });
    }

    user.isActive = false;
    await user.save();
    res.json({ message: 'Kullanıcı başarıyla silindi (pasif hale getirildi)' });

  } catch (error) {
    console.error('❌ Kullanıcı silinirken hata:', error);
    res.status(500).json({ message: error.message || 'Kullanıcı silinirken bir hata oluştu.' });
  }
});

module.exports = router;