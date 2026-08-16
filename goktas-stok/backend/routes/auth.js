const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize'); // ✅ DÜZELTİLDİ

// Giriş yap
router.post('/login', [
  body('username').notEmpty().withMessage('Kullanıcı adı gerekli'),
  body('password').notEmpty().withMessage('Şifre gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ username, isActive: true });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        branch: user.branch,
        productionRole: user.productionRole,
        materialDepoAccess: user.materialDepoAccess
      },
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
        branch: user.branch,
        productionRole: user.productionRole,
        materialDepoAccess: user.materialDepoAccess
      }
    });
  } catch (error) {
    console.error('❌ Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı oluştur (sadece admin)
router.post('/users', [auth, authorize(['admin'])], [ // ✅ DÜZELTİLDİ
  body('username').notEmpty().withMessage('Kullanıcı adı gerekli'),
  body('password').notEmpty().withMessage('Şifre gerekli').isLength({ min: 6 }),
  body('name').notEmpty().withMessage('İsim gerekli'),
  body('role').isIn(['admin', 'branch_manager', 'production_manager', 'viewer']).withMessage('Geçersiz rol')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, name, role, branch, productionRole, materialDepoAccess } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const user = new User({ 
      username, 
      password, 
      name, 
      role, 
      branch: role === 'admin' ? null : branch,
      productionRole: role === 'production_manager' ? productionRole : null,
      materialDepoAccess: materialDepoAccess || false
    });
    await user.save();

    res.status(201).json({
      message: 'Kullanıcı oluşturuldu',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        branch: user.branch,
        productionRole: user.productionRole,
        materialDepoAccess: user.materialDepoAccess
      }
    });
  } catch (error) {
    console.error('❌ Kullanıcı oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm kullanıcıları getir (sadece admin)
router.get('/users', [auth, authorize(['admin'])], async (req, res) => { // ✅ DÜZELTİLDİ
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('❌ Kullanıcı listesi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Mevcut kullanıcı bilgilerini getir
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('❌ Kullanıcı bilgisi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;