// routes/messages.js
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

    if (!receiver && !group) {
      return res.status(400).json({ message: 'Alıcı veya grup belirtilmelidir' });
    }

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
      type: 'text',
      readBy: [req.user._id]
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

// 📌 Özel mesajları getir (SADECE GÖNDEREN VE ALICI)
router.get('/private/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await Message.find({
      receiver: { $ne: null },
      group: null,
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'username name')
      .populate('receiver', 'username name')
      .sort({ createdAt: -1 });

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
      .sort({ createdAt: -1 });

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
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('❌ Grup mesajları getirilemedi:', error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ TEK MESAJI OKUNDU İŞARETLE
router.put('/read/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    if (!message.readBy.includes(req.user._id.toString())) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.json({ message: 'Mesaj okundu olarak işaretlendi' });
  } catch (error) {
    console.error('❌ Mesaj okuma hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ TÜM MESAJLARI OKUNDU İŞARETLE - DÜZELTİLDİ
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // ✅ TÜM okunmamış mesajları bul (genel, özel, grup)
    const filter = {
      readBy: { $ne: userId },
      sender: { $ne: userId }
    };
    
    // Tüm mesajları güncelle
    const result = await Message.updateMany(
      filter,
      { $addToSet: { readBy: userId } }
    );
    
    console.log(`✅ ${result.modifiedCount} mesaj okundu olarak işaretlendi`);
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} mesaj okundu olarak işaretlendi`,
      count: result.modifiedCount 
    });
  } catch (error) {
    console.error('❌ Toplu okuma hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ OKUNMAMIŞ MESAJ SAYISI
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // ✅ TÜM okunmamış mesajları say (genel, özel, grup)
    const unreadCount = await Message.countDocuments({
      readBy: { $ne: userId },
      sender: { $ne: userId }
    });

    // Özel mesajlardaki okunmamış sayısı (detay için)
    const privateUnread = await Message.countDocuments({
      receiver: userId,
      readBy: { $ne: userId },
      sender: { $ne: userId }
    });

    // Grup mesajlarındaki okunmamış sayısı (detay için)
    const groups = await Group.find({ members: userId });
    const groupIds = groups.map(g => g._id);
    
    const groupUnread = await Message.countDocuments({
      group: { $in: groupIds },
      readBy: { $ne: userId },
      sender: { $ne: userId }
    });

    res.json({
      total: unreadCount,
      private: privateUnread,
      group: groupUnread
    });
  } catch (error) {
    console.error('❌ Okunmamış sayısı alınamadı:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;