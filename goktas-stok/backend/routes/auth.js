const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/authorize');

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
      { id: user._id, role: user.role, branch: user.branch },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
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
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı oluştur (sadece admin)
router.post('/users', [auth, admin], [
  body('username').notEmpty().withMessage('Kullanıcı adı gerekli'),
  body('password').notEmpty().withMessage('Şifre gerekli').isLength({ min: 6 }),
  body('name').notEmpty().withMessage('İsim gerekli'),
  body('role').isIn(['admin', 'branch_manager', 'viewer']).withMessage('Geçersiz rol')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, name, role, branch } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const user = new User({ username, password, name, role, branch });
    await user.save();

    res.status(201).json({
      message: 'Kullanıcı oluşturuldu',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm kullanıcıları getir (sadece admin)
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Mevcut kullanıcı bilgilerini getir
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

module.exports = router;