// seed.js - DÜZELTİLMİŞ VERSİYON
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Stock = require('./models/Stock');
require('dotenv').config();

// ⚠️ SADECE VERİTABANI BOŞSA ÇALIŞTIR
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok');
    console.log('✅ MongoDB bağlantısı başarılı');

    // ✅ MEVCUT VERİLERİ KONTROL ET - SİLME!
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const stockCount = await Stock.countDocuments();

    console.log(`📊 Mevcut veriler: ${userCount} kullanıcı, ${productCount} ürün, ${stockCount} stok`);

    // ✅ EĞER VERİ VARSA, SİLME!
    if (userCount > 0 || productCount > 0 || stockCount > 0) {
      console.log('⚠️ Veritabanında zaten veri var. Seed işlemi ATLANDI!');
      console.log('💡 Veritabanını sıfırlamak istiyorsanız: npm run seed:force');
      process.exit(0);
    }

    // ✅ SADECE VERİ YOKSA EKLE
    console.log('📝 Veritabanı boş, örnek veriler ekleniyor...');

    // Admin kullanıcı oluştur
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      branch: null,
      isActive: true
    });
    await admin.save();
    console.log('✅ Admin kullanıcı oluşturuldu');

    // Örnek ürünler
    const products = [
      { code: 'PR001', name: 'Standart Kanat', category: 'kanat', unit: 'adet' },
      { code: 'PR002', name: 'Premium Kanat', category: 'kanat', unit: 'adet' },
      { code: 'PR003', name: 'Bute Beyaz Kasa', category: 'kasa', unit: 'adet' },
      { code: 'PR004', name: 'Koyu Gri Kasa', category: 'kasa', unit: 'adet' },
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Ürün eklendi: ${product.name}`);
    }

    console.log('✅ Seed işlemi tamamlandı!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed hatası:', error);
    process.exit(1);
  }
};

// ⚠️ ZORLA SIFIRLAMA (SADECE GEREKTİĞİNDE KULLAN)
const forceSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok');
    console.log('⚠️ ZORLA SIFIRLAMA BAŞLATILIYOR...');
    
    // Tüm koleksiyonları temizle
    await User.deleteMany({});
    await Product.deleteMany({});
    await Stock.deleteMany({});
    console.log('🗑️ Tüm veriler temizlendi');
    
    // Sonra normal seed çalıştır
    await seedDatabase();
  } catch (error) {
    console.error('❌ Force seed hatası:', error);
    process.exit(1);
  }
};

// Komut satırı argümanı kontrolü
if (process.argv.includes('--force')) {
  console.log('⚠️ Zorla sıfırlama modu aktif');
  forceSeed();
} else {
  seedDatabase();
}