// seed.js - KESİN ÇÖZÜM (Premium Model B ve Standart Model A KALDIRILDI)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Stock = require('./models/Stock');
require('dotenv').config();

// ⚠️ SADECE ADMIN KULLANICI YOKSA OLUŞTUR - HİÇBİR ÜRÜN EKLEME!
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok');
    console.log('✅ MongoDB bağlantısı başarılı');

    // ✅ Sadece admin kontrol et - Ürünleri ASLA EKLEME!
    const adminExists = await User.findOne({ username: 'admin' });

    if (adminExists) {
      console.log('✅ Admin kullanıcı zaten var. Seed işlemi ATLANDI!');
      console.log('📊 Mevcut veriler:');
      const userCount = await User.countDocuments();
      const productCount = await Product.countDocuments();
      const stockCount = await Stock.countDocuments();
      console.log(`   👤 Kullanıcı: ${userCount}`);
      console.log(`   📦 Ürün: ${productCount}`);
      console.log(`   📦 Stok: ${stockCount}`);
      process.exit(0);
    }

    // ✅ Sadece admin oluştur - HİÇBİR ÜRÜN EKLEME!
    console.log('📝 Admin kullanıcı oluşturuluyor...');
    console.log('⚠️ HİÇBİR ÜRÜN EKLENMEYECEK! Ürünleri Admin Panelinden ekleyin.');
    
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

    console.log('✅ Seed işlemi tamamlandı!');
    console.log('💡 Ürünleri Admin Panelinden ekleyin.');
    console.log('💡 Premium Model B ve Standart Model A ASLA EKLENMEYECEK!');
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
    
    // Sonra normal seed çalıştır (sadece admin)
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