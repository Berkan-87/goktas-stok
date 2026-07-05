const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - SIRALAMA ÖNEMLİ
app.use('/api/auth', require('./routes/auth'));          // Kimlik doğrulama
app.use('/api/products', require('./routes/products'));  // Ürün yönetimi (Product modeli)
app.use('/api/stock', require('./routes/stock'));        // Stok yönetimi
app.use('/api/transfer', require('./routes/transfer'));  // Transfer işlemleri
app.use('/api/history', require('./routes/history'));    // Geçmiş kayıtları
app.use('/api/production', require('./routes/production')); // Üretim takibi (Production modeli)

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Test route'u (isteğe bağlı)
app.get('/api/test', (req, res) => {
  res.json({ message: 'API çalışıyor!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log('\n📋 Routes:');
  console.log(`  POST   /api/auth/login`);
  console.log(`  GET    /api/products`);
  console.log(`  POST   /api/products`);
  console.log(`  GET    /api/stock/branch/:branch`);
  console.log(`  POST   /api/stock/in`);
  console.log(`  POST   /api/stock/out`);
  console.log(`  GET    /api/production/stage/:stage`);
  console.log(`  POST   /api/production`);
  console.log(`  PUT    /api/production/:id/stage`);
});