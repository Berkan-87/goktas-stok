const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  model: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['planlama', 'cnc', 'tutkal', 'vakum', 'pres', 'kenarbant', 'kilit', 'lake', 'paketleme', 'tamamlandi'],
    default: 'planlama'
  },
  currentStation: { type: String, default: 'planlama' },
  stationHistory: [{
    station: String,
    enteredAt: Date,
    exitedAt: Date,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);