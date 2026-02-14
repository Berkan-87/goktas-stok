const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { checkPermission } = require('../middleware/auth');

// Tüm kullanıcılar siparişleri görebilir
router.get('/', orderController.getAllOrders);

// Sipariş oluşturma - Sadece admin ve planlama istasyonu
router.post('/', 
  checkPermission(['admin', 'istasyon'], ['planlama']), 
  orderController.createOrder
);

// Sipariş güncelleme - Sadece admin ve planlama istasyonu
router.put('/:id', 
  checkPermission(['admin', 'istasyon'], ['planlama']), 
  orderController.updateOrder
);

// Sipariş silme - Sadece admin
router.delete('/:id', 
  checkPermission(['admin']), 
  orderController.deleteOrder
);

// Sipariş durumu güncelleme - İstasyon bazlı
router.patch('/:id/status', 
  checkPermission(['admin', 'istasyon']), 
  orderController.updateOrderStatus
);

module.exports = router;