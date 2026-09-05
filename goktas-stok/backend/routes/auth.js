const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, isActive: true });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, branch: user.branch },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı oluştur (şimdilik auth kontrolü yok)
router.post('/users', async (req, res) => {
  try {
    const { username, password, name, role, branch } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Kullanıcı adı zaten kullanılıyor' });
    }
    const user = new User({ username, password, name, role, branch });
    await user.save();
    res.status(201).json({
      message: 'Kullanıcı oluşturuldu',
      user: { id: user._id, username, name, role, branch }
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm kullanıcıları getir (şimdilik auth kontrolü yok)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;