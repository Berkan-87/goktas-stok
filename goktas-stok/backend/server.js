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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/transfers', require('./routes/transfer'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/history', require('./routes/history'));
app.use('/api/production', require('./routes/production'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/users', require('./routes/users'));
app.use('/api/announcements', require('./routes/announcements'));

// ✅ SADECE EKSİK STOKLARI DÜZELT - VERİ SİLME YOK!
const fixMissingStocks = async () => {
  try {
    const Product = require('./models/Product');
    const Stock = require('./models/Stock');
    
    // Sadece aktif ürünleri al
    const products = await Product.find({ isActive: true });
    const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];
    
    if (products.length === 0) {
      console.log('ℹ️ Henüz ürün eklenmemiş, stok kontrolü atlanıyor.');
      return;
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    
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
        } else {
          skippedCount++;
        }
      }
    }
    
    console.log(`✅ Stok kontrolü tamamlandı: ${createdCount} yeni eklendi, ${skippedCount} mevcut korundu.`);
  } catch (error) {
    console.error('❌ Eksik stok düzeltme hatası:', error);
  }
};

// ✅ GÜVENLİ VERİTABANI BAŞLATMA - HİÇBİR VERİ SİLİNMEZ!
const initDatabase = async () => {
  try {
    const User = require('./models/User');
    const Product = require('./models/Product');
    const Stock = require('./models/Stock');

    // Mevcut verileri kontrol et
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const stockCount = await Stock.countDocuments();

    console.log('📊 Mevcut veri durumu:');
    console.log(`   👤 Kullanıcı: ${userCount}`);
    console.log(`   📦 Ürün: ${productCount}`);
    console.log(`   📦 Stok: ${stockCount}`);

    // ⚠️ HİÇBİR VERİ SİLİNMEZ - SADECE EKSİK STOKLAR TAMAMLANIR
    if (userCount > 0 || productCount > 0) {
      console.log('✅ Veritabanında mevcut veriler korunuyor.');
      
      // Sadece eksik stokları tamamla (Verileri asla sıfırlama!)
      if (productCount > 0) {
        await fixMissingStocks();
      }
    } else {
      console.log('⚠️ UYARI: Veritabanı tamamen boş görünüyor!');
      console.log('💡 Lütfen Admin Panelinden kullanıcı ve ürün ekleyiniz.');
      console.log('💡 Veya "npm run seed" komutunu çalıştırarak örnek veriler ekleyin.');
    }

    // Veritabanı bağlantı durumunu logla
    console.log(`✅ Veritabanı bağlantısı aktif: ${mongoose.connection.db.databaseName}`);
    
  } catch (err) {
    console.error('⚠️ Veritabanı başlatma hatası:', err.message);
  }
};

// ✅ MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 saniye timeout
  socketTimeoutMS: 45000, // 45 saniye
})
.then(async () => {
    console.log('✅ MongoDB connected successfully');
    
    // Bağlantı bilgilerini göster
    const db = mongoose.connection.db;
    console.log(`📊 Veritabanı: ${db.databaseName}`);
    console.log(`📊 Host: ${mongoose.connection.host}`);
    
    // Güvenli başlatma fonksiyonunu tetikle
    await initDatabase();
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️ 5 saniye sonra yeniden bağlanmayı deneyeceğim...');
    setTimeout(() => {
      mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goktas-stok');
    }, 5000);
});

// ✅ MongoDB Bağlantı Olayları
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB bağlantısı yeniden kuruldu');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB bağlantısı kesildi');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB bağlantı hatası:', err);
});

// ✅ Test route'u
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API çalışıyor!',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'bağlı' : 'bağlı değil'
  });
});

// ✅ Veritabanı durumunu kontrol etme route'u
app.get('/api/db-status', async (req, res) => {
  try {
    const User = require('./models/User');
    const Product = require('./models/Product');
    const Stock = require('./models/Stock');
    const Message = require('./models/Message');
    
    const status = {
      connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      database: mongoose.connection.db?.databaseName || 'unknown',
      collections: {
        users: await User.countDocuments(),
        products: await Product.countDocuments(),
        stocks: await Stock.countDocuments(),
        messages: await Message.countDocuments()
      }
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`📊 DB Durumu: http://localhost:${PORT}/api/db-status`);
});

// ✅ Graceful Shutdown - Server düzgün kapanma
process.on('SIGINT', async () => {
  console.log('🛑 Server kapatılıyor...');
  await mongoose.connection.close();
  console.log('✅ MongoDB bağlantısı kapatıldı');
  process.exit(0);
});