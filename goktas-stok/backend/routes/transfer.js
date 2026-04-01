const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { canModifyBranch } = require('../middleware/authorize');

// Depolar arası transfer
router.post('/', [
  auth,
  canModifyBranch(req => req.body.fromBranch)
], [
  body('productId').notEmpty().withMessage('Ürün ID gerekli'),
  body('fromBranch').notEmpty().withMessage('Kaynak şube gerekli'),
  body('toBranch').notEmpty().withMessage('Hedef şube gerekli'),
  body('quantity').isInt({ min: 1 }).withMessage('Geçerli miktar giriniz'),
  body('note').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, fromBranch, toBranch, quantity, note } = req.body;

    if (fromBranch === toBranch) {
      return res.status(400).json({ message: 'Kaynak ve hedef şube aynı olamaz' });
    }

    // Kaynak stok kontrolü
    const fromStock = await Stock.findOne({ productId, branch: fromBranch });
    if (!fromStock) {
      return res.status(404).json({ message: 'Kaynak stok bulunamadı' });
    }

    if (fromStock.quantity < quantity) {
      return res.status(400).json({ message: 'Kaynak şubede yeterli stok yok' });
    }

    // Hedef stok
    let toStock = await Stock.findOne({ productId, branch: toBranch });
    if (!toStock) {
      return res.status(404).json({ message: 'Hedef stok bulunamadı' });
    }

    // Stok güncellemeleri
    const fromPrevious = fromStock.quantity;
    const toPrevious = toStock.quantity;

    fromStock.quantity -= quantity;
    toStock.quantity += quantity;

    await fromStock.save();
    await toStock.save();

    // Transfer kaydı
    const transaction = new Transaction({
      type: 'transfer',
      productId,
      fromBranch,
      toBranch,
      quantity,
      user: req.user._id,
      note
    });
    await transaction.save();

    res.json({
      message: 'Transfer başarılı',
      fromStock,
      toStock,
      transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;