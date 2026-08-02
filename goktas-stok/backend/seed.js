const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Stock = require('./models/Stock');
const Transaction = require('./models/Transaction');

// Veritabanına bağlan
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok')
  .then(async () => {
    console.log('✅ MongoDB bağlantısı başarılı');
    
    try {
      // ✅ Önce mevcut verileri temizle (sadece seed çalıştırıldığında)
      console.log('🗑️ Veritabanı temizleniyor...');
      await User.deleteMany({});
      await Product.deleteMany({});
      await Stock.deleteMany({});
      await Transaction.deleteMany({});
      console.log('✅ Veritabanı temizlendi');

      // 1. Kullanıcılar
      const usersData = [
        { username: 'admin', password: 'Admin2026x', name: 'Admin User', role: 'admin', branch: null, productionRole: null },
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

      // Şifreleri hashle
      const hashedUsers = await Promise.all(usersData.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return { ...user, password: hashedPassword };
      }));

      const createdUsers = await User.insertMany(hashedUsers);
      console.log(`👤 ${createdUsers.length} adet kullanıcı başarıyla oluşturuldu.`);

      // 2. Ürünler
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

      const createdProducts = await Product.insertMany(productsData);
      console.log(`📦 ${createdProducts.length} adet demo ürün eklendi.`);

      // 3. Stoklar
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
      
    } catch (error) {
      console.error('❌ Hata:', error.message);
      if (error.code === 11000) {
        console.error('📌 Yinelenen anahtar hatası. Veritabanında zaten kayıtlar var.');
      }
    } finally {
      await mongoose.disconnect();
      console.log('🔌 MongoDB bağlantısı kapatıldı.');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });