const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// 📌 Tüm grupları getir
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
      isActive: true
    }).populate('members', 'username name');
    
    res.json(groups);
  } catch (error) {
    console.error('❌ Gruplar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Yeni grup oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Grup adı zorunludur' });
    }

    const group = new Group({
      name,
      description: description || '',
      members: [...new Set([req.user._id, ...(members || [])])],
      admins: [req.user._id],
      createdBy: req.user._id
    });

    await group.save();
    await group.populate('members', 'username name');

    res.status(201).json(group);
  } catch (error) {
    console.error('❌ Grup oluşturma hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Gruba üye ekle
router.post('/:groupId/members', auth, async (req, res) => {
  try {
    const { members } = req.body;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }

    if (!group.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    group.members = [...new Set([...group.members, ...members])];
    await group.save();
    await group.populate('members', 'username name');

    res.json(group);
  } catch (error) {
    console.error('❌ Üye ekleme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Gruptan ayrıl
router.delete('/:groupId/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();

    res.json({ message: 'Gruptan ayrıldınız' });
  } catch (error) {
    console.error('❌ Gruptan ayrılma hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;