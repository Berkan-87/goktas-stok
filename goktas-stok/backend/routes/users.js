const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// 📌 Tüm aktif kullanıcıları getir
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('username name role branch')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('❌ Kullanıcılar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;