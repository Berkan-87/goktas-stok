const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// 📌 Mesaj gönder
router.post('/', auth, async (req, res) => {
  try {
    const { receiver, group, content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Mesaj içeriği boş olamaz' });
    }

    // Özel mesaj veya grup mesajı kontrolü
    if (!receiver && !group) {
      return res.status(400).json({ message: 'Alıcı veya grup belirtilmelidir' });
    }

    // Grup mesajıysa, kullanıcı grupta mı kontrol et
    if (group) {
      const groupData = await Group.findById(group);
      if (!groupData) {
        return res.status(404).json({ message: 'Grup bulunamadı' });
      }
      if (!groupData.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Bu gruba mesaj gönderme yetkiniz yok' });
      }
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiver || null,
      group: group || null,
      content,
      type: 'text'
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username name')
      .populate('receiver', 'username name');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('❌ Mesaj gönderme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Özel mesajları getir
router.get('/private/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'username name')
      .populate('receiver', 'username name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('❌ Özel mesajlar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Genel sohbet mesajlarını getir
router.get('/general', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      receiver: null,
      group: null
    })
      .populate('sender', 'username name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('❌ Genel mesajlar getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Grup mesajlarını getir
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Grup bulunamadı' });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Bu gruba erişim yetkiniz yok' });
    }

    const messages = await Message.find({ group: groupId })
      .populate('sender', 'username name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('❌ Grup mesajları getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Mesajları okundu işaretle
router.put('/read/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.json({ message: 'Mesaj okundu olarak işaretlendi' });
  } catch (error) {
    console.error('❌ Mesaj okuma hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;