const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  station: String,
  createdAt: Date
});

const User = mongoose.model('User', UserSchema);

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-kapi');
    console.log('MongoDB bağlantısı başarılı');

    // Koleksiyonu temizle (opsiyonel)
    await User.deleteMany({});
    console.log('Eski kullanıcılar temizlendi');

    // Admin kullanıcısı
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      createdAt: new Date()
    });
    console.log('✅ Admin oluşturuldu: admin / admin123');

    // Stok sorumlusu
    const stokPassword = await bcrypt.hash('stok123', 10);
    await User.create({
      username: 'stok',
      password: stokPassword,
      role: 'stok',
      createdAt: new Date()
    });
    console.log('✅ Stok sorumlusu oluşturuldu: stok / stok123');

    // İstasyonlar
    const stations = ['planlama', 'cnc', 'tutkal', 'pvc', 'pres', 'kenarbant', 'kilit', 'lake', 'paketleme'];
    for (const station of stations) {
      const password = await bcrypt.hash('123456', 10);
      await User.create({
        username: station,
        password: password,
        role: 'istasyon',
        station: station,
        createdAt: new Date()
      });
      console.log(`✅ ${station} oluşturuldu: ${station} / 123456`);
    }

    // İzleyici
    const izleyiciPassword = await bcrypt.hash('izleyici123', 10);
    await User.create({
      username: 'izleyici',
      password: izleyiciPassword,
      role: 'izleyici',
      createdAt: new Date()
    });
    console.log('✅ İzleyici oluşturuldu: izleyici / izleyici123');

    console.log('\n🎉 Tüm kullanıcılar başarıyla oluşturuldu!');

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();