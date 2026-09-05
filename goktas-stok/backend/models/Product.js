const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  unit: {
    type: String,
    default: 'adet'
  },
  category: {
    type: String,
    enum: ['kanat', 'kasa', 'baslik', 'pervaz', 'supurgelik', 'cam_citasi'],
    default: 'kanat',
    required: [true, 'Kategori seçilmesi zorunludur']
  },
  color: {
    type: String,
    enum: ['bute_beyaz', 'koyu_gri', 'acik_gri', 'tas_gri', null],
    default: null,
    validate: {
      validator: function(value) {
        const colorRequired = ['kasa', 'baslik', 'pervaz', 'supurgelik', 'cam_citasi'];
        if (colorRequired.includes(this.category)) {
          return value !== null && value !== undefined && value !== '';
        }
        return true;
      },
      message: 'Kasa, Başlık, Pervaz, Süpürgelik ve Cam Çıtası kategorileri için renk seçimi zorunludur'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

productSchema.index({ name: 1 }, { unique: true });
productSchema.index({ category: 1, color: 1 });

productSchema.pre('save', function(next) {
  const colorRequired = ['kasa', 'baslik', 'pervaz', 'supurgelik', 'cam_citasi'];
  
  if (colorRequired.includes(this.category) && !this.color) {
    return next(new Error('Kasa, Başlık, Pervaz, Süpürgelik ve Cam Çıtası kategorileri için renk seçimi zorunludur'));
  }
  
  if (this.category === 'kanat') {
    this.color = null;
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);