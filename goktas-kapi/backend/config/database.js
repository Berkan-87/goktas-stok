const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Yeni mongoose sürümünde useNewUrlParser ve useUnifiedTopology seçenekleri kalktı
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-kapi');
    console.log('MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;