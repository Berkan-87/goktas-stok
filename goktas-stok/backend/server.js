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
app.use('/api/products', require('./routes/products'));  // Ürün yönetimi
app.use('/api/stock', require('./routes/stock'));        // Stok yönetimi
app.use('/api/transfer', require('./routes/transfer'));  // Transfer işlemleri
app.use('/api/history', require('./routes/history'));    // Geçmiş kayıtları
app.use('/api/production', require('./routes/production')); // Üretim takibi

// 🔄 OTOMATİK VERİTABANI DOLDURMA (SEED) FONKSİYONU
const autoSeedDatabase = async () => {
  try {
    const User = require('./models/User');
    const Product = require('./models/Product');
    const Stock = require('./models/Stock');

    // Veritabanında admin kullanıcısı var mı diye bakıyoruz
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      console.log('⚠️ Veritabanı boş algılandı! Otomatik yükleme (Seed) başlatılıyor...');

      // 1. Kullanıcı Listesi (Şifreler kodun istediği formatta otomatik hashlenir)
      const usersData = [
        { username: 'admin', password: 'admin123', name: 'Admin User', role: 'admin', branch: null, productionRole: null },
        { username: 'fabrika', password: '123456', name: 'Fabrika Yöneticisi', role: 'branch_manager', branch: 'fabrika', productionRole: null },
        { username: 'karabaglar', password: '123456', name: 'Karabağlar Yöneticisi', role: 'branch_manager', branch: 'karabaglar', productionRole: null },
        { username: 'manisa', password: '123456', name: 'Manisa Yöneticisi', role: 'branch_manager', branch: 'manisa', productionRole: null },
        { username: 'edremit', password: '123456', name: 'Edremit Yöneticisi', role: 'branch_manager', branch: 'edremit', productionRole: null },
        { username: 'karsiyaka', password: '123456', name: 'Karşıyaka Yöneticisi', role: 'branch_manager', branch: 'karsiyaka', productionRole: null },
        { username: 'planlama', password: '123456', name: 'Planlama Sorumlusu', role: 'production_manager', branch: 'fabrika', productionRole: 'planlama' },
        { username: 'uretim_sorumlu', password: '123456', name: 'Üretim Sorumlusu', role: 'production_manager', branch: 'fabrika', productionRole: 'uretim' },
        { username: 'paketleme', password: '123456', name: 'Paketleme Sorumlusu', role: 'production_manager', branch: 'fabrika', productionRole: 'paketleme' },
        { username: 'hazir_sorumlu', password: '123456', name: 'Hazır Sorumlusu', role: 'production_manager', branch: 'fabrika', productionRole: 'hazir' },
        { username: 'viewer', password: '123456', name: 'Görüntüleyici Kullanıcı', role: 'viewer', branch: 'fabrika', productionRole: null }
      ];
      const createdUsers = await User.create(usersData);
      console.log(`👤 ${createdUsers.length} adet kullanıcı başarıyla oluşturuldu.`);

      // 2. Ürün Listesi
      const productsData = [
        { code: '618 BUTE 87', name: '618 BUTE 87', description: 'Standart model', unit: 'adet' },
        { code: '618 BUTE 77', name: '618 BUTE 77', description: 'Premium model', unit: 'adet' },
        { code: '618 BUTE CAMLI', name: '618 BUTE Camlı', description: 'Camlı model', unit: 'adet' },
        { code: 'STD-A', name: 'Standart Model A', description: 'Standart üretim modeli', unit: 'adet' },
        { code: 'PRM-B', name: 'Premium Model B', description: 'Premium üretim modeli', unit: 'adet' }
      ];
      const createdProducts = await Product.create(productsData);
      console.log(`📦 ${createdProducts.length} adet demo ürün eklendi.`);

      // 3. Stok Girişleri
      const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];
      const stockEntries = [];
      for (const product of createdProducts) {
        for (const branch of branches) {
          const randomStock = Math.floor(Math.random() * 250) + 50;
          stockEntries.push({
            productId: product._id,
            branch,
            quantity: randomStock,
            criticalLevel: 10
          });
        }
      }
      await Stock.insertMany(stockEntries);
      console.log(`📊 ${stockEntries.length} adet rastgele stok kaydı dağıtıldı.`);
      console.log('🎉 VERİTABANI BAŞARIYLA DOLDURULDU!');
    } else {
      console.log('ℹ️ Veritabanında zaten kayıtlı kullanıcılar var, yükleme atlandı.');
    }
  } catch (err) {
    console.error('⚠️ Otomatik veri yükleme hatası:', err.message);
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    // Bağlantı başarılı olunca yükleme fonksiyonunu tetikliyoruz
    autoSeedDatabase();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Test route'u
app.get('/api/test', (req, res) => {
  res.json({ message: 'API çalışıyor!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});