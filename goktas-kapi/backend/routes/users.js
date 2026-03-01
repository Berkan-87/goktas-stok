const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');

// Tüm kullanıcıları getir (sadece admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı güncelle (sadece admin)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { username, role, station, branch } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    user.username = username || user.username;
    user.role = role || user.role;
    user.station = station || user.station;
    user.branch = branch || user.branch;

    await user.save();
    res.json({ message: 'Kullanıcı güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı sil (sadece admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;