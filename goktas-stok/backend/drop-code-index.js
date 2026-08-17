// drop-code-index.js
const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok');
    console.log('✅ Bağlantı başarılı');

    const Product = require('./models/Product');
    
    // Mevcut indeksleri gör
    const indexes = await Product.collection.getIndexes();
    console.log('📋 Mevcut indeksler:', Object.keys(indexes));

    // code_1 indeksini sil
    if (indexes['code_1']) {
      await Product.collection.dropIndex('code_1');
      console.log('✅ code_1 indeksi silindi');
    } else {
      console.log('ℹ️ code_1 indeksi zaten yok');
    }

    // Kalan indeksleri göster
    const newIndexes = await Product.collection.getIndexes();
    console.log('📋 Kalan indeksler:', Object.keys(newIndexes));

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

dropIndex();