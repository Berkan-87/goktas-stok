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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/transfer', require('./routes/transfer'));
app.use('/api/history', require('./routes/history'));
app.use('/api/production', require('./routes/production'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/users', require('./routes/users'));

// ✅ SADECE EKSİK STOKLARI DÜZELT
const fixMissingStocks = async () => {
  try {
    const Product = require('./models/Product');
    const Stock = require('./models/Stock');
    
    const products = await Product.find({ isActive: true });
    const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];
    
    let createdCount = 0;
    for (const product of products) {
      for (const branch of branches) {
        const existingStock = await Stock.findOne({ 
          productId: product._id, 
          branch 
        });
        if (!existingStock) {
          await Stock.create({
            productId: product._id,
            branch,
            quantity: 0,
            criticalLevel: 10
          });
          createdCount++;
        }
      }
    }
    if (createdCount > 0) {
      console.log(`✅ ${createdCount} adet eksik stok kaydı oluşturuldu.`);
    }
  } catch (error) {
    console.error('❌ Eksik stok düzeltme hatası:', error);
  }
};

// ✅ GÜVENLİ VERİTABANI BAŞLATMA (Otomatik silme özelliği KALDIRILDI)
const initDatabase = async () => {
  try {
    const User = require('./models/User');
    const Stock = require('./models/Stock');

    // Sadece admin kullanıcısı var mı diye kontrol et (Veri varlığını test et)
    const adminExists = await User.findOne({ username: 'admin' });
    
    // Eğer hiç kullanıcı yoksa (tamamen yeni bir kurulum), sadece o zaman çalıştır
    if (!adminExists) {
      console.log('⚠️ UYARI: Veritabanı tamamen boş! Lütfen Admin Panelinden kullanıcı ve ürün ekleyiniz.');
    } else {
      console.log('ℹ️ Veritabanında kayıtlı kullanıcılar var, mevcut veriler korunuyor.');
      
      // Sadece eksik stokları tamamla (Verileri asla sıfırlama!)
      await fixMissingStocks();
    }
  } catch (err) {
    console.error('⚠️ Veritabanı başlatma hatası:', err.message);
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
    console.log('✅ MongoDB connected successfully');
    // Güvenli başlatma fonksiyonunu tetikle
    initDatabase();
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Test route'u
app.get('/api/test', (req, res) => {
  res.json({ message: 'API çalışıyor!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});