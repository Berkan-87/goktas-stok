const Stock = require('../models/Stock');

const createStock = async (req, res) => {
  try {
    const stock = new Stock(req.body);
    await stock.save();
    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ error: 'Stok oluşturulamadı' });
  }
};

const getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ modelName: 1 });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: 'Stoklar getirilemedi' });
  }
};

const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = Date.now();

    const stock = await Stock.findByIdAndUpdate(id, updates, { new: true });
    if (!stock) {
      return res.status(404).json({ error: 'Stok bulunamadı' });
    }
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: 'Stok güncellenemedi' });
  }
};

const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await Stock.findByIdAndDelete(id);
    if (!stock) {
      return res.status(404).json({ error: 'Stok bulunamadı' });
    }
    res.json({ message: 'Stok başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Stok silinemedi' });
  }
};

const updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({ error: 'Stok bulunamadı' });
    }

    if (operation === 'add') {
      stock.quantity += quantity;
    } else if (operation === 'remove') {
      if (stock.quantity < quantity) {
        return res.status(400).json({ error: 'Yetersiz stok' });
      }
      stock.quantity -= quantity;
    }

    stock.updatedAt = Date.now();
    await stock.save();

    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: 'Stok miktarı güncellenemedi' });
  }
};

module.exports = {
  createStock,
  getAllStocks,
  updateStock,
  deleteStock,
  updateStockQuantity
};