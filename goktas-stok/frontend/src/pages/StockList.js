import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { 
  PlusIcon, 
  MinusIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const StockList = () => {
  const { user } = useSelector((state) => state.auth);
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(user?.branch || 'fabrika');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ code: '', name: '', description: '', category: 'kanat' });
  const [modalData, setModalData] = useState({ show: false, type: '', productId: '', branch: '', currentStock: 0 });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', category: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [activeTab, setActiveTab] = useState('kanat');
  const [loading, setLoading] = useState(true);

  // 🎯 Kasa Takım renkleri - DÜZELTİLDİ
  const kasaColors = [
    { id: 'bute_beyaz', label: 'Bute Beyaz', color: '#f3f4f6', textColor: '#1f2937', emoji: '⚪' },
    { id: 'koyu_gri', label: 'Koyu Gri', color: '#4b5563', textColor: '#ffffff', emoji: '⚫' },
    { id: 'acik_gri', label: 'Açık Gri', color: '#e5e7eb', textColor: '#1f2937', emoji: '🔘' },
    { id: 'tas_gri', label: 'Taş Gri', color: '#6b7280', textColor: '#ffffff', emoji: '🪨' }
  ];

  const branches = [
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  // ✅ Kategoriye göre renkler ve ikonlar
  const getCategoryColors = (category) => {
    if (category === 'kanat') {
      return {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        header: 'from-blue-50 to-blue-100',
        badge: 'bg-blue-100 text-blue-700',
        dot: '🔵',
        icon: '🚪'
      };
    } else {
      return {
        border: 'border-purple-500',
        bg: 'bg-purple-50',
        header: 'from-purple-50 to-purple-100',
        badge: 'bg-purple-100 text-purple-700',
        dot: '🟣',
        icon: '🪟'
      };
    }
  };

  const maxStock = Math.max(...stocks.map(s => s.quantity), 1000);

  useEffect(() => {
    fetchData();
  }, [selectedBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksRes, productsRes] = await Promise.all([
        axios.get(`/stock/branch/${selectedBranch}`),
        axios.get('/products')
      ]);
      setStocks(stocksRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Veriler alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const canModify = () => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'branch_manager' && user?.branch === selectedBranch) return true;
    return false;
  };

  const handleStockChange = async (type, productId, quantity) => {
    if (!quantity || quantity <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    try {
      const endpoint = type === 'in' ? '/stock/in' : '/stock/out';
      await axios.post(endpoint, {
        productId,
        branch: selectedBranch,
        quantity: parseInt(quantity),
        note: `${type === 'in' ? 'Stok girişi' : 'Stok çıkışı'}`
      });
      toast.success(`Stok ${type === 'in' ? 'girişi' : 'çıkışı'} başarılı`);
      fetchData();
      setModalData({ ...modalData, show: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.name) {
      toast.error('Model kodu ve adı zorunludur');
      return;
    }

    try {
      console.log('📤 Yeni ürün gönderiliyor:', newProduct);
      const response = await axios.post('/products', {
        code: newProduct.code,
        name: newProduct.name,
        description: newProduct.description,
        unit: 'adet',
        category: newProduct.category
      });
      console.log('✅ Ürün eklendi:', response.data);
      toast.success(`${newProduct.name} modeli başarıyla eklendi`);
      setShowAddProduct(false);
      setNewProduct({ code: '', name: '', description: '', category: 'kanat' });
      fetchData();
    } catch (error) {
      console.error('❌ Ürün ekleme hatası:', error);
      toast.error(error.response?.data?.message || 'Ürün eklenemedi');
    }
  };

  const handleDeleteProduct = async () => {
    if (!showDeleteConfirm) return;
    try {
      await axios.delete(`/products/${showDeleteConfirm.productId}`);
      toast.success(`${showDeleteConfirm.productName} modeli başarıyla çıkarıldı`);
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Model çıkarılamadı');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/products/${editingProduct._id}`, {
        name: editForm.name,
        code: editForm.code,
        description: editForm.description,
        category: editForm.category || editingProduct.category
      });
      toast.success('Ürün başarıyla güncellendi');
      setEditingProduct(null);
      setEditForm({ name: '', code: '', description: '', category: '' });
      fetchData();
    } catch (error) {
      toast.error('Ürün güncellenemedi');
    }
  };

  const getStockForProduct = (productId) => {
    const stock = stocks.find(s => s.productId?._id === productId);
    return stock ? stock.quantity : 0;
  };

  const getStockColor = (quantity) => {
    if (quantity >= 400) return 'bg-blue-500';
    if (quantity >= 100) return 'bg-yellow-500';
    if (quantity > 0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStockStatus = (quantity) => {
    if (quantity >= 400) return { text: 'Yeterli', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (quantity >= 100) return { text: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (quantity > 0) return { text: 'Kritik', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'Tükendi', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getBarWidth = (quantity) => {
    const percentage = (quantity / maxStock) * 100;
    return Math.min(percentage, 100);
  };

  // ✅ Ürünleri modellerine göre grupla (KANAT için)
  const groupProductsByModel = (category) => {
    const filteredProducts = products.filter(p => p.category === category);
    const groups = {};
    filteredProducts.forEach(product => {
      const modelName = product.name.replace(/\s*(87|77|Camlı|Camli|Cam)\s*$/i, '').trim();
      if (!groups[modelName]) {
        groups[modelName] = [];
      }
      groups[modelName].push(product);
    });
    return groups;
  };

  // ✅ Kasa Takım renklerine göre grupla - DÜZELTİLDİ
  const groupProductsByKasaColor = () => {
    const filteredProducts = products.filter(p => p.category === 'kasa');
    const groups = {};
    
    // Her renk için boş bir dizi oluştur
    kasaColors.forEach(color => {
      groups[color.label] = [];
    });
    
    // "Diğer" grubunu ekle
    groups['Diğer'] = [];

    // 🎯 Renk eşleştirme anahtarları - DÜZELTİLDİ
    const colorKeys = {
      'Bute Beyaz': ['bute beyaz', 'beyaz', 'bute', 'bb', 'bey'],
      'Koyu Gri': ['koyu gri', 'koyu', 'kg', 'gri koyu'],
      'Açık Gri': ['açık gri', 'açık', 'acik', 'ag', 'gri açık', 'acik gri', 'gri'],
      'Taş Gri': ['taş gri', 'tas gri', 'tas', 'tg', 'gri taş']
    };

    // Ürünleri renklerine göre doldur
    filteredProducts.forEach(product => {
      const productName = product.name.toLowerCase();
      const productCode = product.code?.toLowerCase() || '';
      let assigned = false;
      
      for (const [colorLabel, keys] of Object.entries(colorKeys)) {
        for (const key of keys) {
          if (productName.includes(key) || productCode.includes(key)) {
            if (groups[colorLabel]) {
              groups[colorLabel].push(product);
              assigned = true;
              break;
            }
          }
        }
        if (assigned) break;
      }
      
      // Eğer hiçbir renkle eşleşmediyse "Diğer" grubuna ekle
      if (!assigned) {
        groups['Diğer'].push(product);
      }
    });

    // Boş renk gruplarını kaldır (sadece dolu olanları göster)
    const result = {};
    Object.keys(groups).forEach(key => {
      if (groups[key].length > 0) {
        result[key] = groups[key];
      }
    });
    
    return result;
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // ✅ Kanat Grup Kartı
  const KanatGroupCard = ({ groupName, products: groupProducts }) => {
    const isExpanded = expandedGroups[groupName] !== false;
    const totalStock = groupProducts.reduce((sum, p) => sum + getStockForProduct(p._id), 0);
    const colors = getCategoryColors('kanat');

    return (
      <div className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${colors.border} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div 
          className={`flex items-center justify-between p-4 bg-gradient-to-r ${colors.header} cursor-pointer hover:opacity-90 transition-opacity`}
          onClick={() => toggleGroup(groupName)}
        >
          <div className="flex items-center gap-3">
            <button className="text-gray-600">
              {isExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
            </button>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {colors.icon} {groupName}
              </h3>
              <p className="text-sm text-gray-500">
                {groupProducts.length} varyant • Toplam: {totalStock} adet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
              {totalStock > 500 ? '🟢 Yüksek' :
               totalStock > 200 ? '🟡 Orta' :
               totalStock > 50 ? '🟠 Düşük' :
               '🔴 Kritik'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className={`p-4 ${colors.bg}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupProducts.map(product => renderProductCard(product))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ✅ Kasa Takım Renk Kartı - DÜZELTİLDİ
  const KasaColorCard = ({ colorLabel, products: colorProducts }) => {
    const isExpanded = expandedGroups[colorLabel] !== false;
    const totalStock = colorProducts.reduce((sum, p) => sum + getStockForProduct(p._id), 0);
    const colors = getCategoryColors('kasa');
    const colorInfo = kasaColors.find(c => c.label === colorLabel);
    const isOther = colorLabel === 'Diğer';
    const isAcikGri = colorLabel === 'Açık Gri';

    return (
      <div className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${colors.border} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div 
          className={`flex items-center justify-between p-4 bg-gradient-to-r ${colors.header} cursor-pointer hover:opacity-90 transition-opacity`}
          onClick={() => toggleGroup(colorLabel)}
        >
          <div className="flex items-center gap-3">
            <button className="text-gray-600">
              {isExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              {!isOther && colorInfo && (
                <div className="flex items-center gap-2">
                  <span 
                    className={`w-7 h-7 rounded-full flex-shrink-0 ${isAcikGri ? 'border-2 border-gray-400' : 'border border-gray-300'}`}
                    style={{ 
                      backgroundColor: colorInfo.color,
                      boxShadow: isAcikGri ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                    }}
                  />
                  <span 
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      color: colorInfo.textColor,
                      border: isAcikGri ? '1px solid #9ca3af' : 'none'
                    }}
                  >
                    {colorInfo.label}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {isOther ? '📦 Diğer' : `${colorInfo?.emoji || '🎨'} ${colorLabel}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {colorProducts.length} varyant • Toplam: {totalStock} adet
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
              {totalStock > 500 ? '🟢 Yüksek' :
               totalStock > 200 ? '🟡 Orta' :
               totalStock > 50 ? '🟠 Düşük' :
               totalStock > 0 ? '🔴 Kritik' :
               '📭 Boş'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className={`p-4 ${colors.bg}`}>
            {colorProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {colorProducts.map(product => renderProductCard(product))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Bu renkte henüz ürün bulunmuyor
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ✅ Ürün Kartı Render
  const renderProductCard = (product) => {
    const quantity = getStockForProduct(product._id);
    const barWidth = getBarWidth(quantity);
    const barColor = getStockColor(quantity);
    const status = getStockStatus(quantity);
    const isEditing = editingProduct?._id === product._id && user?.role === 'admin';

    return (
      <div key={product._id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          {isEditing ? (
            <form onSubmit={handleEditProduct} className="w-full space-y-1">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input-field text-xs py-1"
                required
              />
              <input
                type="text"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                className="input-field text-xs py-1"
                required
              />
              <select
                value={editForm.category || product.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="input-field text-xs py-1"
              >
                <option value="kanat">🚪 Kanat</option>
                <option value="kasa">🪟 Kasa Takım</option>
              </select>
              <div className="flex gap-1">
                <button type="submit" className="btn-primary text-xs py-0.5 px-2">
                  <CheckIcon className="h-3 w-3" /> Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn-secondary text-xs py-0.5 px-2"
                >
                  <XMarkIcon className="h-3 w-3" /> İptal
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800 text-sm">{product.name}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {product.category === 'kanat' ? '🚪' : '🪟'}
              </span>
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setEditForm({
                      name: product.name,
                      code: product.code,
                      description: product.description || '',
                      category: product.category || 'kanat'
                    });
                  }}
                  className="text-gray-400 hover:text-blue-600"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
            {status.text}
          </span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="text-xl font-bold text-gray-900">{quantity}</span>
          <span className="text-xs text-gray-400">adet</span>
        </div>

        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {canModify() && (
          <div className="flex justify-end gap-1 pt-1 border-t border-gray-200">
            <button
              onClick={() => setModalData({
                show: true,
                type: 'in',
                productId: product._id,
                productName: product.name,
                currentStock: quantity
              })}
              className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
              title="Stok Girişi"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setModalData({
                show: true,
                type: 'out',
                productId: product._id,
                productName: product.name,
                currentStock: quantity
              })}
              className={`p-1.5 rounded transition-colors ${
                quantity === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
              disabled={quantity === 0}
              title="Stok Çıkışı"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowDeleteConfirm({
                  show: true,
                  productId: product._id,
                  productName: product.name
                })}
                className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                title="Model Çıkar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Kategorilere göre ürünleri filtrele
  const kanatGroups = groupProductsByModel('kanat');
  const kasaGroups = groupProductsByKasaColor();

  // Kasa gruplarını renk sırasına göre düzenle - DÜZELTİLDİ
  const orderedKasaGroups = {};
  kasaColors.forEach(color => {
    if (kasaGroups[color.label] && kasaGroups[color.label].length > 0) {
      orderedKasaGroups[color.label] = kasaGroups[color.label];
    }
  });
  // Diğer grubunu ekle
  if (kasaGroups['Diğer'] && kasaGroups['Diğer'].length > 0) {
    orderedKasaGroups['Diğer'] = kasaGroups['Diğer'];
  }

  // 📊 Toplam sayılar
  const kanatCount = products.filter(p => p.category === 'kanat').length;
  const kasaCount = products.filter(p => p.category === 'kasa').length;

  // ✅ Loading kontrolü
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Stoklar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📦 Stok Listesi</h1>
          <p className="text-sm text-gray-600 mt-1">Ürünleri modellerine göre gruplanmış olarak görüntüleyin</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="input-field w-full sm:w-48 text-sm"
            disabled={user?.role === 'branch_manager' && user?.branch !== selectedBranch}
          >
            {branches.map(branch => (
              <option key={branch.value} value={branch.value}>{branch.label}</option>
            ))}
          </select>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Yeni Model Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* 🎯 Kategori Sekmeleri */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('kanat')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'kanat'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚪 Kanat
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {kanatCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('kasa')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'kasa'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🪟 Kasa Takım
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {kasaCount}
          </span>
        </button>
      </div>

      {/* 📋 Kategori İçeriği */}
      <div className="space-y-4">
        {activeTab === 'kanat' ? (
          // KANAT GRUPLARI
          Object.keys(kanatGroups).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-lg text-gray-500">🚪 Kanat kategorisinde ürün bulunmuyor</p>
              <p className="text-sm text-gray-400 mt-1">Yeni ürün eklemek için "Yeni Model Ekle" butonunu kullanın.</p>
            </div>
          ) : (
            Object.entries(kanatGroups).map(([groupName, groupProducts]) => (
              <KanatGroupCard 
                key={groupName} 
                groupName={groupName} 
                products={groupProducts} 
              />
            ))
          )
        ) : (
          // KASA TAKIM RENK GRUPLARI
          Object.keys(orderedKasaGroups).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-lg text-gray-500">🪟 Kasa Takım kategorisinde ürün bulunmuyor</p>
              <p className="text-sm text-gray-400 mt-1">Yeni ürün eklemek için "Yeni Model Ekle" butonunu kullanın.</p>
            </div>
          ) : (
            Object.entries(orderedKasaGroups).map(([colorLabel, colorProducts]) => (
              <KasaColorCard 
                key={colorLabel} 
                colorLabel={colorLabel} 
                products={colorProducts} 
              />
            ))
          )
        )}
      </div>

      {/* Modal - Stok Giriş/Çıkış */}
      {modalData.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full mx-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              {modalData.type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı'}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Ürün: <strong>{modalData.productName}</strong><br />
              Mevcut Stok: <strong>{modalData.currentStock}</strong> adet
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const quantity = e.target.quantity.value;
              handleStockChange(modalData.type, modalData.productId, quantity);
            }}>
              <input
                type="number"
                name="quantity"
                placeholder="Miktar"
                min="1"
                required
                className="input-field mb-4"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" className="flex-1 btn-primary">
                  {modalData.type === 'in' ? 'Giriş Yap' : 'Çıkış Yap'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalData({ ...modalData, show: false })}
                  className="flex-1 btn-secondary"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Silme Onay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <TrashIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4">Model Çıkar</h2>
            <p className="text-gray-600 text-center mb-4 text-sm">
              <strong>{showDeleteConfirm.productName}</strong> modelini stok listesinden çıkarmak istediğinize emin misiniz?
            </p>
            <p className="text-sm text-red-600 text-center mb-6">
              ⚠️ Bu işlem geri alınamaz!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleDeleteProduct} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                Evet, Çıkar
              </button>
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 btn-secondary">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Yeni Model Ekle */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Yeni Model Ekle</h2>
            <form onSubmit={handleAddProduct}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="kanat">🚪 Kanat</option>
                  <option value="kasa">🪟 Kasa Takım</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Kodu *</label>
                <input
                  type="text"
                  placeholder="Örn: 618 BUTE 87"
                  value={newProduct.code}
                  onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: 618 BUTE 87"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  placeholder="Model açıklaması..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-blue-800">ℹ️ Yeni model eklendiğinde otomatik olarak tüm şubelerde stok kaydı oluşturulacaktır.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" className="flex-1 btn-primary">Ekle</button>
                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 btn-secondary">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;