const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Aktif duyuruları getir
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni duyuru ekle
router.post('/', async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Başlık ve içerik zorunludur' });
    }
    // ⚠️ BU KISMI GERÇEK BİR KULLANICI ID'Sİ İLE DEĞİŞTİRİN
    const adminUserId = '65f0a1b2c3d4e5f6a7b8c9d0';
    const announcement = new Announcement({
      title,
      content,
      priority: priority || 'medium',
      createdBy: adminUserId
    });
    await announcement.save();
    await announcement.populate('createdBy', 'name username');
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Duyuru sil
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Duyuru bulunamadı' });
    await announcement.deleteOne();
    res.json({ message: 'Duyuru silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;