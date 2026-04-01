// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Stock = require('./models/Stock');

dotenv.config();

const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];

const users = [
  { username: 'admin', password: 'admin123', name: 'Admin User', role: 'admin', branch: null },
  { username: 'fabrika', password: '123456', name: 'Fabrika Yöneticisi', role: 'branch_manager', branch: 'fabrika' },
  { username: 'karabaglar', password: '123456', name: 'Karabağlar Yöneticisi', role: 'branch_manager', branch: 'karabaglar' },
  { username: 'manisa', password: '123456', name: 'Manisa Yöneticisi', role: 'branch_manager', branch: 'manisa' },
  { username: 'edremit', password: '123456', name: 'Edremit Yöneticisi', role: 'branch_manager', branch: 'edremit' },
  { username: 'karsiyaka', password: '123456', name: 'Karşıyaka Yöneticisi', role: 'branch_manager', branch: 'karsiyaka' },
  { username: 'viewer', password: '123456', name: 'Görüntüleyici Kullanıcı', role: 'viewer', branch: 'fabrika' }
];

const products = [
  { code: '618 BUTE 87', name: '618 BUTE 87', description: 'Temel model açıklaması', unit: 'adet' },
  { code: '618 BUTE 77', name: '618 BUTE 77', description: 'Premium model açıklaması', unit: 'adet' },
  { code: '618 BUTE camlı', name: '618 BUTE 87', description: 'Ekonomik model açıklaması', unit: 'adet' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Temizle
    await User.deleteMany({});
    await Product.deleteMany({});
    await Stock.deleteMany({});
    console.log('Veritabanı temizlendi');

    // Kullanıcıları ekle
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} kullanıcı eklendi`);

    // Ürünleri ekle
    const createdProducts = await Product.create(products);
    console.log(`${createdProducts.length} ürün eklendi`);

    // Stokları oluştur (tüm şubeler için)
    const stockEntries = [];
    for (const product of createdProducts) {
      for (const branch of branches) {
        // Rastgele başlangıç stokları
        const randomStock = Math.floor(Math.random() * 100) + 20;
        stockEntries.push({
          productId: product._id,
          branch,
          quantity: randomStock,
          criticalLevel: 10
        });
      }
    }
    await Stock.insertMany(stockEntries);
    console.log(`${stockEntries.length} stok kaydı oluşturuldu`);

    console.log('Seed işlemi tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

seed();