const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { checkPermission } = require('../middleware/auth');

// Tüm kullanıcılar stokları görebilir
router.get('/', stockController.getAllStocks);

// Stok oluşturma - Sadece admin ve stok sorumlusu
router.post('/', 
  checkPermission(['admin', 'stok']), 
  stockController.createStock
);

// Stok güncelleme - Sadece admin ve stok sorumlusu
router.put('/:id', 
  checkPermission(['admin', 'stok']), 
  stockController.updateStock
);

// Stok silme - Sadece admin ve stok sorumlusu
router.delete('/:id', 
  checkPermission(['admin', 'stok']), 
  stockController.deleteStock
);

// Stok miktarı güncelleme - Sadece admin ve stok sorumlusu
router.patch('/:id/quantity', 
  checkPermission(['admin', 'stok']), 
  stockController.updateStockQuantity
);

module.exports = router;