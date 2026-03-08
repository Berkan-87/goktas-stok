const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkPermission } = require('../middleware/auth');

router.get('/', checkPermission(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar getirilemedi' });
  }
});

router.delete('/:id', checkPermission(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı silinemedi' });
  }
});

module.exports = router;