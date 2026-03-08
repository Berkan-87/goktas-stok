const Order = require('../models/Order');

const createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Sipariş oluşturulamadı' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Siparişler getirilemedi' });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = Date.now();

    const order = await Order.findByIdAndUpdate(id, updates, { new: true });
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Sipariş güncellenemedi' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    res.json({ message: 'Sipariş başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Sipariş silinemedi' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, station } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    // İstasyon sırasını kontrol et
    const stations = ['planlama', 'cnc', 'tutkal', 'pvc', 'pres', 'kenarbant', 'kilit', 'lake', 'paketleme'];
    const currentIndex = stations.indexOf(order.currentStation);
    const newIndex = stations.indexOf(station);

    if (newIndex !== currentIndex + 1 && newIndex !== currentIndex) {
      return res.status(400).json({ error: 'Geçersiz istasyon geçişi' });
    }

    order.status = status;
    order.currentStation = station;
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Sipariş durumu güncellenemedi' });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  updateOrder,
  deleteOrder,
  updateOrderStatus
};