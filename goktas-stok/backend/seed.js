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
    password: 'Admin2026x', 
    name: 'Admin User', 
    role: 'admin', 
    branch: null,
    productionRole: null 
  },
  
  // Şube Yöneticileri
  { 
    username: 'fabrika', 
    password: 'Fabrika2026!', 
    name: 'Fabrika Yöneticisi', 
    role: 'branch_manager', 
    branch: 'fabrika',
    productionRole: null 
  },
  { 
    username: 'karabaglar', 
    password: 'Karabaglar2026!', 
    name: 'Karabağlar Yöneticisi', 
    role: 'branch_manager', 
    branch: 'karabaglar',
    productionRole: null 
  },
  { 
    username: 'manisa', 
    password: 'Manisa2026!', 
    name: 'Manisa Yöneticisi', 
    role: 'branch_manager', 
    branch: 'manisa',
    productionRole: null 
  },
  { 
    username: 'edremit', 
    password: 'Edremit2026!', 
    name: 'Edremit Yöneticisi', 
    role: 'branch_manager', 
    branch: 'edremit',
    productionRole: null 
  },
  { 
    username: 'karsiyaka', 
    password: 'Karsiyaka2026!', 
    name: 'Karşıyaka Yöneticisi', 
    role: 'branch_manager', 
    branch: 'karsiyaka',
    productionRole: null 
  },
  
  // Üretim Yöneticileri
  { 
    username: 'planlama', 
    password: 'Planlama2026!', 
    name: 'Planlama Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'planlama' 
  },
  { 
    username: 'uretim_sorumlu', 
    password: 'Uretim2026!', 
    name: 'Üretim Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'uretim' 
  },
  { 
    username: 'paketleme', 
    password: 'Paketleme2026!', 
    name: 'Paketleme Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'paketleme' 
  },
  { 
    username: 'hazir_sorumlu', 
    password: 'Hazir2026!', 
    name: 'Hazır Sorumlusu', 
    role: 'production_manager', 
    branch: 'fabrika',
    productionRole: 'hazir' 
  },
  
  // Görüntüleyici
  { 
    username: 'viewer', 
    password: 'Viewer2026!', 
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
    console.log('  👑 Admin: admin / Admin2026x');
    console.log('  🏭 Fabrika: fabrika / Fabrika2026!');
    console.log('  🏘️ Karabağlar: karabaglar / Karabaglar2026!');
    console.log('  🏙️ Manisa: manisa / Manisa2026!');
    console.log('  🌊 Edremit: edremit / Edremit2026!');
    console.log('  🏖️ Karşıyaka: karsiyaka / Karsiyaka2026!');
    console.log('  📋 Planlama: planlama / Planlama2026!');
    console.log('  ⚙️ Üretim: uretim_sorumlu / Uretim2026!');
    console.log('  📦 Paketleme: paketleme / Paketleme2026!');
    console.log('  ✅ Hazır: hazir_sorumlu / Hazir2026!');
    console.log('  👁️ Görüntüleyici: viewer / Viewer2026!');

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