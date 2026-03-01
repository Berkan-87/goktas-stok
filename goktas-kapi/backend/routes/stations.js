const router = require('express').Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');

// İstasyon listesini getir
router.get('/', auth, (req, res) => {
  const stations = [
    { id: 'planlama', name: 'Planlama' },
    { id: 'cnc', name: 'CNC' },
    { id: 'tutkal', name: 'Tutkal' },
    { id: 'vakum', name: 'Vakum' },
    { id: 'pres', name: 'Pres' },
    { id: 'kenarbant', name: 'Kenarbant' },
    { id: 'kilit', name: 'Kilit' },
    { id: 'lake', name: 'Lake' },
    { id: 'paketleme', name: 'Paketleme' }
  ];
  res.json(stations);
});

// İstasyondaki siparişleri getir
router.get('/:station/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ currentStation: req.params.station })
      .populate('stationHistory.user', 'username');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;