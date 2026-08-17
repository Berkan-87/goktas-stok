// backend/delete-products.js
const mongoose = require('mongoose');
require('dotenv').config();

const deleteProducts = async () => {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok');
    console.log('✅ Bağlantı başarılı');

    const Product = require('./models/Product');
    const Stock = require('./models/Stock');

    // Silinecek ürün isimleri
    const productNames = ["Premium Model B", "Standart Model A"];

    // Önce bu ürünleri bul
    const products = await Product.find({ name: { $in: productNames } });
    console.log(`📦 Bulunan ürünler: ${products.length}`);

    if (products.length === 0) {
      console.log('⚠️ Silinecek ürün bulunamadı');
      process.exit(0);
    }

    // Ürünleri göster
    console.log('📋 Silinecek ürünler:');
    products.forEach(p => {
      console.log(`   - ${p.name} (${p.category})`);
    });

    // Ürün ID'lerini al
    const productIds = products.map(p => p._id);

    // Stokları sil
    const stockResult = await Stock.deleteMany({ productId: { $in: productIds } });
    console.log(`🗑️ ${stockResult.deletedCount} stok kaydı silindi`);

    // Ürünleri sil
    const productResult = await Product.deleteMany({ _id: { $in: productIds } });
    console.log(`🗑️ ${productResult.deletedCount} ürün silindi`);

    console.log('✅ İşlem tamamlandı!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

deleteProducts();
