const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  model: { type: String, required: true },
  branch: { 
    type: String, 
    enum: ['fabrika', 'karabaglar', 'edremit', 'karsiyaka', 'manisa'],
    required: true 
  },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'adet' },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 100 },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

inventoryItemSchema.index({ model: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventoryItemSchema);