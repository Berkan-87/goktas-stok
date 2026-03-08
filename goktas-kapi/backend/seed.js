const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-kapi');
    console.log('MongoDB bağlantısı başarılı');

    // Admin kullanıcısı var mı kontrol et
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      
      await admin.save();
      console.log('✅ Admin kullanıcısı oluşturuldu!');
    } else {
      console.log('Admin kullanıcısı zaten mevcut');
    }
    
    // Stok sorumlusu
    const stockExists = await User.findOne({ username: 'stok' });
    if (!stockExists) {
      const stock = new User({
        username: 'stok',
        password: 'stok123',
        role: 'stok'
      });
      await stock.save();
      console.log('✅ Stok sorumlusu oluşturuldu!');
    }
    
    // İstasyon sorumluları
    const stations = ['planlama', 'cnc', 'tutkal', 'pvc', 'pres', 'kenarbant', 'kilit', 'lake', 'paketleme'];
    
    for (const station of stations) {
      const exists = await User.findOne({ username: station });
      if (!exists) {
        const user = new User({
          username: station,
          password: '123456',
          role: 'istasyon',
          station: station
        });
        await user.save();
        console.log(`✅ ${station} istasyon sorumlusu oluşturuldu!`);
      }
    }
    
    // İzleyici
    const viewerExists = await User.findOne({ username: 'izleyici' });
    if (!viewerExists) {
      const viewer = new User({
        username: 'izleyici',
        password: 'izleyici123',
        role: 'izleyici'
      });
      await viewer.save();
      console.log('✅ İzleyici kullanıcısı oluşturuldu!');
    }
    
    console.log('\n🎉 Tüm örnek kullanıcılar oluşturuldu!');
    console.log('\n📝 Kullanıcı Bilgileri:');
    console.log('Admin: admin / admin123');
    console.log('Stok: stok / stok123');
    console.log('İstasyonlar: [istasyon_adi] / 123456');
    console.log('İzleyici: izleyici / izleyici123');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();