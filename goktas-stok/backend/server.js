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
app.use('/api/messages', require('./routes/messages'));  // Mesajlaşma
app.use('/api/groups', require('./routes/groups'));      // Grup yönetimi
app.use('/api/users', require('./routes/users'));        // Kullanıcı listesi

// ✅ EKSİK STOKLARI DÜZELT
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

// 🔄 OTOMATİK VERİTABANI DOLDURMA (SEED)
const autoSeedDatabase = async () => {
  try {
    const User = require('./models/User');
    const Product = require('./models/Product');
    const Stock = require('./models/Stock');

    // Veritabanında admin kullanıcısı var mı diye bakıyoruz
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      console.log('⚠️ Veritabanı boş algılandı! Otomatik yükleme (Seed) başlatılıyor...');

      // 1. Kullanıcı Listesi
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
        // KANAT ÜRÜNLERİ
        { code: '618 BUTE 87', name: '618 BUTE 87', description: 'Standart model', unit: 'adet', category: 'kanat' },
        { code: '618 BUTE 77', name: '618 BUTE 77', description: 'Premium model', unit: 'adet', category: 'kanat' },
        { code: '618 BUTE CAMLI', name: '618 BUTE Camlı', description: 'Camlı model', unit: 'adet', category: 'kanat' },
        { code: 'STD-A', name: 'Standart Model A', description: 'Standart üretim modeli', unit: 'adet', category: 'kanat' },
        { code: 'PRM-B', name: 'Premium Model B', description: 'Premium üretim modeli', unit: 'adet', category: 'kanat' },
        // KASA TAKIM ÜRÜNLERİ
        { code: 'KASA-BB-01', name: 'Bute Beyaz Kasa', description: 'Bute beyaz renk kasa takımı', unit: 'adet', category: 'kasa' },
        { code: 'KASA-KG-01', name: 'Koyu Gri Kasa', description: 'Koyu gri renk kasa takımı', unit: 'adet', category: 'kasa' },
        { code: 'KASA-AG-01', name: 'Açık Gri Kasa', description: 'Açık gri renk kasa takımı', unit: 'adet', category: 'kasa' },
        { code: 'KASA-TG-01', name: 'Taş Gri Kasa', description: 'Taş gri renk kasa takımı', unit: 'adet', category: 'kasa' }
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
      
      // ✅ EKSİK STOKLARI DÜZELT (VERİLERİ SIFIRLAMA!)
      await fixMissingStocks();
    }
  } catch (err) {
    console.error('⚠️ Otomatik veri yükleme hatası:', err.message);
  }
};

// MongoDB Connection (Artık .env'deki ana veritabanına bağlanacak)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});