// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Stock = require('./models/Stock');

dotenv.config();

const branches = ['fabrika', 'karabaglar', 'manisa', 'edremit', 'karsiyaka'];

const users = [
  // Admin
  { 
    username: 'admin', 
    password: 'admin123', 
    name: 'Admin User', 
    role: 'admin', 
    branch: null,
    productionRole: null 
  },
  
  // Şube Yöneticileri
  { 
    username: 'fabrika', 
    password: '123456', 
    name: 'Fabrika Yöneticisi', 
    role: 'branch_manager', 
    branch: 'fabrika',
    productionRole: null 
  },
  { 
    username: 'karabaglar', 
    password: '123456', 
    name: 'Karabağlar Yöneticisi', 
    role: 'branch_manager', 
    branch: 'karabaglar',
    productionRole: null 
  },
  { 
    username: 'manisa', 
    password: '123456', 
    name: 'Manisa Yöneticisi', 
    role: 'branch_manager', 
    branch: 'manisa',
    productionRole: null 
  },
  { 
    username: 'edremit', 
    password: '123456', 
    name: 'Edremit Yöneticisi', 
    role: 'branch_manager', 
    branch: 'edremit',
    productionRole: null 
  },
  { 
    username: 'karsiyaka', 
    password: '123456', 
    name: 'Karşıyaka Yöneticisi', 
    role: 'branch_manager', 
    branch: 'karsiyaka',
    productionRole: null 
  },
  
  // Üretim Yöneticileri
  { 
    username: 'planlama', 
    password: '123456', 
    name: 'Planlama Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'planlama' 
  },
  { 
    username: 'uretim_sorumlu', 
    password: '123456', 
    name: 'Üretim Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'uretim' 
  },
  { 
    username: 'paketleme', 
    password: '123456', 
    name: 'Paketleme Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'paketleme' 
  },
  { 
    username: 'hazir_sorumlu', 
    password: '123456', 
    name: 'Hazır Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'hazir' 
  },
  
  // Görüntüleyici
  { 
    username: 'viewer', 
    password: '123456', 
    name: 'Görüntüleyici Kullanıcı', 
    role: 'viewer', 
    branch: 'fabrika',
    productionRole: null 
  }
];

const products = [
  { 
    code: '618 BUTE 87', 
    name: '618 BUTE 87', 
    description: 'Standart model', 
    unit: 'adet' 
  },
  { 
    code: '618 BUTE 77', 
    name: '618 BUTE 77', 
    description: 'Premium model', 
    unit: 'adet' 
  },
  { 
    code: '618 BUTE CAMLI', 
    name: '618 BUTE Camlı', 
    description: 'Camlı model', 
    unit: 'adet' 
  },
  { 
    code: 'STD-A', 
    name: 'Standart Model A', 
    description: 'Standart üretim modeli', 
    unit: 'adet' 
  },
  { 
    code: 'PRM-B', 
    name: 'Premium Model B', 
    description: 'Premium üretim modeli', 
    unit: 'adet' 
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Temizle - SADECE User, Product, Stock
    await User.deleteMany({});
    await Product.deleteMany({});
    await Stock.deleteMany({});
    console.log('🗑️  Veritabanı temizlendi');

    // Kullanıcıları ekle
    const createdUsers = await User.create(users);
    console.log(`👤 ${createdUsers.length} kullanıcı eklendi`);
    
    console.log('\n📋 Kullanıcı Listesi:');
    createdUsers.forEach(user => {
      const roleLabel = 
        user.role === 'admin' ? '👑 Admin' :
        user.role === 'branch_manager' ? '📋 Şube Yöneticisi' :
        user.role === 'production_manager' ? '🏭 Üretim Yöneticisi' :
        '👁️ Görüntüleyici';
      
      const productionLabel = user.productionRole ? 
        ` (${user.productionRole})` : '';
      
      console.log(`  - ${user.username}: ${roleLabel}${productionLabel}`);
    });

    // Ürünleri ekle
    const createdProducts = await Product.create(products);
    console.log(`\n📦 ${createdProducts.length} ürün eklendi`);
    
    console.log('📋 Ürün Listesi:');
    createdProducts.forEach(product => {
      console.log(`  - ${product.code}: ${product.name}`);
    });

    // Stokları oluştur
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
    console.log(`\n📊 ${stockEntries.length} stok kaydı oluşturuldu`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED İŞLEMİ TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`👤 Kullanıcı: ${createdUsers.length}`);
    console.log(`📦 Ürün: ${createdProducts.length}`);
    console.log(`📊 Stok: ${stockEntries.length}`);
    console.log('='.repeat(50));
    
    console.log('\n🔑 Demo Giriş Bilgileri:');
    console.log('  Admin: admin / admin123');
    console.log('  Fabrika: fabrika / 123456');
    console.log('  Planlama: planlama / 123456');
    console.log('  Üretim: uretim_sorumlu / 123456');
    console.log('  Paketleme: paketleme / 123456');
    console.log('  Hazır: hazir_sorumlu / 123456');
    console.log('  Görüntüleyici: viewer / 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 MongoDB bağlantısı başarısız. MongoDB\'nin çalıştığından emin olun.');
    }
    process.exit(1);
  }
}

seed();