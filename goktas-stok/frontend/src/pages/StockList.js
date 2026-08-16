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
  ChevronRightIcon,
  DocumentArrowDownIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const StockList = () => {
  const { user } = useSelector((state) => state.auth);
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(user?.branch || 'fabrika');
  const [showAddProduct, setShowAddProduct] = useState(false);
  // ❌ code kaldırıldı
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: 'kanat', color: '' });
  const [modalData, setModalData] = useState({ show: false, type: '', productId: '', branch: '', currentStock: 0 });
  const [editingProduct, setEditingProduct] = useState(null);
  // ❌ code kaldırıldı
  const [editForm, setEditForm] = useState({ name: '', description: '', category: '', color: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [activeTab, setActiveTab] = useState('kanat');
  const [loading, setLoading] = useState(true);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // 🎯 RENKLER - HEM KASA HEM BAŞLIK İÇİN AYNI
  const colors = [
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

  // ✅ EXPORT FONKSİYONLARI - code kaldırıldı
  const handleExportExcel = () => {
    if (stocks.length === 0) {
      toast.error('Export yapılacak veri bulunamadı!');
      return;
    }

    const exportData = stocks.map(stock => ({
      // ❌ 'Ürün Kodu' KALDIRILDI
      'Ürün Adı': stock.productId?.name || '-',
      'Kategori': stock.productId?.category === 'kanat' ? '🚪 Kanat' : 
                  stock.productId?.category === 'kasa' ? '🪟 Kasa Takım' : '🎯 Başlık',
      'Renk': stock.productId?.color ? colors.find(c => c.id === stock.productId.color)?.label || '-' : '-',
      'Şube': branches.find(b => b.value === stock.branch)?.label || stock.branch,
      'Miktar': stock.quantity,
      'Kritik Seviye': stock.criticalLevel || 50,
      'Durum': stock.quantity <= 10 ? '🔴 Kritik' : 
               stock.quantity <= 25 ? '🟠 Uyarı' : 
               stock.quantity <= 50 ? '🟡 Düşük' : '🟢 Yeterli',
      'Son Güncelleme': stock.updatedAt ? new Date(stock.updatedAt).toLocaleString('tr-TR') : '-'
    }));

    const filename = `TumStoklar_${branches.find(b => b.value === selectedBranch)?.label}_${new Date().toISOString().split('T')[0]}`;
    const success = exportToExcel(exportData, filename);
    
    if (success) {
      toast.success(`📊 ${exportData.length} stok kaydı Excel olarak indirildi!`);
    } else {
      toast.error('Excel export başarısız!');
    }
    setExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    if (stocks.length === 0) {
      toast.error('Export yapılacak veri bulunamadı!');
      return;
    }

    const exportData = stocks.map(stock => ({
      // ❌ 'Ürün Kodu' KALDIRILDI
      'Ürün Adı': stock.productId?.name || '-',
      'Kategori': stock.productId?.category === 'kanat' ? 'Kanat' : 
                  stock.productId?.category === 'kasa' ? 'Kasa Takım' : 'Başlık',
      'Renk': stock.productId?.color ? colors.find(c => c.id === stock.productId.color)?.label || '-' : '-',
      'Şube': branches.find(b => b.value === stock.branch)?.label || stock.branch,
      'Miktar': stock.quantity,
      'Kritik Seviye': stock.criticalLevel || 50,
      'Durum': stock.quantity <= 10 ? 'Kritik' : 
               stock.quantity <= 25 ? 'Uyarı' : 
               stock.quantity <= 50 ? 'Düşük' : 'Yeterli'
    }));

    const columns = [
      // ❌ 'Ürün Kodu' KALDIRILDI
      { key: 'Ürün Adı', label: 'Ürün Adı' },
      { key: 'Kategori', label: 'Kategori' },
      { key: 'Renk', label: 'Renk' },
      { key: 'Şube', label: 'Şube' },
      { key: 'Miktar', label: 'Miktar' },
      { key: 'Kritik Seviye', label: 'Kritik Seviye' },
      { key: 'Durum', label: 'Durum' }
    ];

    const title = `Tüm Stok Raporu (${branches.find(b => b.value === selectedBranch)?.label})`;
    const filename = `TumStoklar_${branches.find(b => b.value === selectedBranch)?.label}_${new Date().toISOString().split('T')[0]}`;
    const success = exportToPDF(exportData, filename, title, columns);
    
    if (success) {
      toast.success(`📄 ${exportData.length} stok kaydı PDF olarak indirildi!`);
    } else {
      toast.error('PDF export başarısız!');
    }
    setExportDropdownOpen(false);
  };

  // ✅ Kategori bazlı export - code kaldırıldı
  const handleExportFiltered = (category) => {
    const filteredStocks = stocks.filter(s => s.productId?.category === category);
    
    if (filteredStocks.length === 0) {
      const categoryName = category === 'kanat' ? 'Kanat' : 
                          category === 'kasa' ? 'Kasa' : 'Başlık';
      toast.error(`${categoryName} kategorisinde stok bulunamadı!`);
      return;
    }

    const exportData = filteredStocks.map(stock => ({
      // ❌ 'Ürün Kodu' KALDIRILDI
      'Ürün Adı': stock.productId?.name || '-',
      'Kategori': stock.productId?.category === 'kanat' ? '🚪 Kanat' : 
                  stock.productId?.category === 'kasa' ? '🪟 Kasa Takım' : '🎯 Başlık',
      'Renk': stock.productId?.color ? colors.find(c => c.id === stock.productId.color)?.label || '-' : '-',
      'Şube': branches.find(b => b.value === stock.branch)?.label || stock.branch,
      'Miktar': stock.quantity,
      'Kritik Seviye': stock.criticalLevel || 50,
      'Durum': stock.quantity <= 10 ? '🔴 Kritik' : 
               stock.quantity <= 25 ? '🟠 Uyarı' : 
               stock.quantity <= 50 ? '🟡 Düşük' : '🟢 Yeterli'
    }));

    const categoryName = category === 'kanat' ? 'Kanat' : 
                        category === 'kasa' ? 'Kasa_Takim' : 'Baslik';
    const filename = `${categoryName}_Stoklari_${branches.find(b => b.value === selectedBranch)?.label}_${new Date().toISOString().split('T')[0]}`;
    const success = exportToExcel(exportData, filename);
    
    if (success) {
      const displayName = category === 'kanat' ? 'Kanat' : 
                         category === 'kasa' ? 'Kasa' : 'Başlık';
      toast.success(`📊 ${exportData.length} ${displayName} stok kaydı indirildi!`);
    } else {
      toast.error('Export başarısız!');
    }
    setExportDropdownOpen(false);
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

  // ✅ handleAddProduct - code kaldırıldı
  const handleAddProduct = async (e) => {
    e.preventDefault();
    // ❌ code kontrolü kaldırıldı
    if (!newProduct.name) {
      toast.error('Ürün adı zorunludur');
      return;
    }

    // Renk kontrolü (Kasa ve Başlık için zorunlu)
    if ((newProduct.category === 'kasa' || newProduct.category === 'baslik') && !newProduct.color) {
      toast.error('Bu kategori için renk seçmelisiniz');
      return;
    }

    try {
      console.log('📤 Yeni ürün gönderiliyor:', newProduct);
      // ❌ code gönderilmiyor
      const response = await axios.post('/products', {
        name: newProduct.name,
        description: newProduct.description,
        unit: 'adet',
        category: newProduct.category,
        color: newProduct.color || null
      });
      console.log('✅ Ürün eklendi:', response.data);
      toast.success(`${newProduct.name} başarıyla eklendi`);
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', category: 'kanat', color: '' });
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
      toast.success(`${showDeleteConfirm.productName} başarıyla çıkarıldı`);
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ürün çıkarılamadı');
    }
  };

  // ✅ handleEditProduct - code kaldırıldı
  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      // ❌ code gönderilmiyor
      const updateData = {
        name: editForm.name,
        description: editForm.description,
        category: editForm.category || editingProduct.category
      };
      
      if (editForm.color) {
        updateData.color = editForm.color;
      }
      
      await axios.put(`/products/${editingProduct._id}`, updateData);
      toast.success('Ürün başarıyla güncellendi');
      setEditingProduct(null);
      setEditForm({ name: '', description: '', category: '', color: '' });
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

  // ✅ Ürünün rengini bul (Kasa ve Başlık için)
  const getProductColor = (product) => {
    if (product.color) {
      return product.color;
    }
    
    const name = product.name.toUpperCase();
    
    if (name.includes('TAŞ') || name.includes('TAS') || name.includes('TG')) {
      return 'tas_gri';
    }
    if (name.includes('KOYU') || name.includes('KG')) {
      return 'koyu_gri';
    }
    if (name.includes('AÇIK') || name.includes('ACIK') || name.includes('AG')) {
      return 'acik_gri';
    }
    if (name.includes('BUTE') || name.includes('BEYAZ') || name.includes('BB')) {
      return 'bute_beyaz';
    }
    
    return null;
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

  // ✅ Ürünleri renklerine göre grupla (KASA ve BAŞLIK için)
  const groupProductsByColor = (category) => {
    const filteredProducts = products.filter(p => p.category === category);
    const groups = {};
    
    colors.forEach(color => {
      groups[color.label] = [];
    });

    filteredProducts.forEach(product => {
      const colorId = getProductColor(product);
      
      if (colorId) {
        const color = colors.find(c => c.id === colorId);
        if (color && groups[color.label]) {
          groups[color.label].push(product);
          return;
        }
      }
      
      if (!groups['Diğer']) {
        groups['Diğer'] = [];
      }
      groups['Diğer'].push(product);
    });

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

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => toggleGroup(groupName)}
        >
          <div className="flex items-center gap-3">
            <button className="text-gray-600">
              {isExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
            </button>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                🚪 {groupName}
              </h3>
              <p className="text-sm text-gray-500">
                {groupProducts.length} varyant • Toplam: {totalStock} adet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {totalStock > 500 ? '🟢 Yüksek' :
               totalStock > 200 ? '🟡 Orta' :
               totalStock > 50 ? '🟠 Düşük' :
               '🔴 Kritik'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 bg-blue-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupProducts.map(product => renderProductCard(product))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ✅ Renk Kartı (Kasa ve Başlık için ortak)
  const ColorCard = ({ colorLabel, products: colorProducts, category }) => {
    const isExpanded = expandedGroups[colorLabel] !== false;
    const totalStock = colorProducts.reduce((sum, p) => sum + getStockForProduct(p._id), 0);
    const colorInfo = colors.find(c => c.label === colorLabel);
    const isOther = colorLabel === 'Diğer';
    const isAcikGri = colorLabel === 'Açık Gri';
    
    const categoryEmoji = category === 'kasa' ? '🪟' : '🎯';
    const borderColor = category === 'kasa' ? 'border-purple-500' : 'border-green-500';
    const bgColor = category === 'kasa' ? 'from-purple-50 to-purple-100' : 'from-green-50 to-green-100';
    const badgeColor = category === 'kasa' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700';

    return (
      <div className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${borderColor} hover:shadow-lg transition-shadow duration-300`}>
        <div 
          className={`flex items-center justify-between p-4 bg-gradient-to-r ${bgColor} cursor-pointer hover:opacity-90 transition-opacity`}
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
                  {isOther ? '📦 Diğer' : `${categoryEmoji} ${colorLabel}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {colorProducts.length} ürün • Toplam: {totalStock} adet
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
              {totalStock > 500 ? '🟢 Yüksek' :
               totalStock > 200 ? '🟡 Orta' :
               totalStock > 50 ? '🟠 Düşük' :
               totalStock > 0 ? '🔴 Kritik' :
               '📭 Boş'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className={`p-4 ${category === 'kasa' ? 'bg-purple-50' : 'bg-green-50'}`}>
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

  // ✅ Ürün Kartı Render - code kaldırıldı
  const renderProductCard = (product) => {
    const quantity = getStockForProduct(product._id);
    const barWidth = getBarWidth(quantity);
    const barColor = getStockColor(quantity);
    const status = getStockStatus(quantity);
    const isEditing = editingProduct?._id === product._id && user?.role === 'admin';
    const colorId = getProductColor(product);
    const colorInfo = colors.find(c => c.id === colorId);
    const isKasaOrBaslik = product.category === 'kasa' || product.category === 'baslik';

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
              {/* ❌ code alanı KALDIRILDI */}
              <select
                value={editForm.category || product.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="input-field text-xs py-1"
              >
                <option value="kanat">🚪 Kanat</option>
                <option value="kasa">🪟 Kasa Takım</option>
                <option value="baslik">🎯 Başlık</option>
              </select>
              {(editForm.category === 'kasa' || editForm.category === 'baslik') && (
                <select
                  value={editForm.color || product.color || ''}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  className="input-field text-xs py-1"
                  required
                >
                  <option value="">Renk Seç</option>
                  {colors.map(color => (
                    <option key={color.id} value={color.id}>
                      {color.emoji} {color.label}
                    </option>
                  ))}
                </select>
              )}
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
              {/* ❌ code gösterimi KALDIRILDI */}
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {product.category === 'kanat' ? '🚪' : 
                 product.category === 'kasa' ? '🪟' : '🎯'}
              </span>
              {isKasaOrBaslik && colorInfo && (
                <span 
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: colorInfo.color,
                    color: colorInfo.textColor,
                    border: colorInfo.id === 'acik_gri' ? '1px solid #9ca3af' : 'none'
                  }}
                >
                  {colorInfo.emoji} {colorInfo.label}
                </span>
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setEditForm({
                      name: product.name,
                      description: product.description || '',
                      category: product.category || 'kanat',
                      color: product.color || ''
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
                title="Ürün Çıkar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Kategorilere göre ürünleri grupla
  const kanatGroups = groupProductsByModel('kanat');
  const kasaGroups = groupProductsByColor('kasa');
  const baslikGroups = groupProductsByColor('baslik');

  // Kasa gruplarını renk sırasına göre düzenle
  const orderedKasaGroups = {};
  colors.forEach(color => {
    if (kasaGroups[color.label] && kasaGroups[color.label].length > 0) {
      orderedKasaGroups[color.label] = kasaGroups[color.label];
    }
  });
  if (kasaGroups['Diğer'] && kasaGroups['Diğer'].length > 0) {
    orderedKasaGroups['Diğer'] = kasaGroups['Diğer'];
  }

  // Başlık gruplarını renk sırasına göre düzenle
  const orderedBaslikGroups = {};
  colors.forEach(color => {
    if (baslikGroups[color.label] && baslikGroups[color.label].length > 0) {
      orderedBaslikGroups[color.label] = baslikGroups[color.label];
    }
  });
  if (baslikGroups['Diğer'] && baslikGroups['Diğer'].length > 0) {
    orderedBaslikGroups['Diğer'] = baslikGroups['Diğer'];
  }

  const kanatCount = products.filter(p => p.category === 'kanat').length;
  const kasaCount = products.filter(p => p.category === 'kasa').length;
  const baslikCount = products.filter(p => p.category === 'baslik').length;

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
          <p className="text-sm text-gray-600 mt-1">Ürünleri kategorilere göre gruplanmış olarak görüntüleyin</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* EXPORT BUTONLARI */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleExportExcel}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Tüm stokları Excel olarak indir"
            >
              <TableCellsIcon className="h-4 w-4 text-green-600" />
              <span className="hidden xs:inline text-gray-700">Excel</span>
            </button>
            
            <button
              onClick={handleExportPDF}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Tüm stokları PDF olarak indir"
            >
              <DocumentArrowDownIcon className="h-4 w-4 text-red-600" />
              <span className="hidden xs:inline text-gray-700">PDF</span>
            </button>

            {/* Kategori Bazlı Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="btn-primary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="hidden xs:inline">Kategori Export</span>
                <span className="xs:hidden">Kategori</span>
              </button>
              
              {exportDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <button
                      onClick={() => handleExportFiltered('kanat')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg transition-colors"
                    >
                      🚪 Sadece Kanatlar
                    </button>
                    <button
                      onClick={() => handleExportFiltered('kasa')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      🪟 Sadece Kasa Takım
                    </button>
                    <button
                      onClick={() => handleExportFiltered('baslik')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg transition-colors"
                    >
                      🎯 Sadece Başlık
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

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
              <span className="hidden sm:inline">Yeni Ürün Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* Kategori Sekmeleri */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('kanat')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap ${
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
          className={`px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap ${
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
        <button
          onClick={() => setActiveTab('baslik')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap ${
            activeTab === 'baslik'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🎯 Başlık
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {baslikCount}
          </span>
        </button>
      </div>

      {/* Kategori İçeriği */}
      <div className="space-y-4">
        {activeTab === 'kanat' ? (
          Object.keys(kanatGroups).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-lg text-gray-500">🚪 Kanat kategorisinde ürün bulunmuyor</p>
              <p className="text-sm text-gray-400 mt-1">Yeni ürün eklemek için "Yeni Ürün Ekle" butonunu kullanın.</p>
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
        ) : activeTab === 'kasa' ? (
          Object.keys(orderedKasaGroups).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-lg text-gray-500">🪟 Kasa Takım kategorisinde ürün bulunmuyor</p>
              <p className="text-sm text-gray-400 mt-1">Yeni ürün eklemek için "Yeni Ürün Ekle" butonunu kullanın.</p>
            </div>
          ) : (
            Object.entries(orderedKasaGroups).map(([colorLabel, colorProducts]) => (
              <ColorCard 
                key={colorLabel} 
                colorLabel={colorLabel} 
                products={colorProducts} 
                category="kasa"
              />
            ))
          )
        ) : (
          Object.keys(orderedBaslikGroups).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-lg text-gray-500">🎯 Başlık kategorisinde ürün bulunmuyor</p>
              <p className="text-sm text-gray-400 mt-1">Yeni ürün eklemek için "Yeni Ürün Ekle" butonunu kullanın.</p>
            </div>
          ) : (
            Object.entries(orderedBaslikGroups).map(([colorLabel, colorProducts]) => (
              <ColorCard 
                key={colorLabel} 
                colorLabel={colorLabel} 
                products={colorProducts} 
                category="baslik"
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
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4">Ürün Çıkar</h2>
            <p className="text-gray-600 text-center mb-4 text-sm">
              <strong>{showDeleteConfirm.productName}</strong> ürününü stok listesinden çıkarmak istediğinize emin misiniz?
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

      {/* Modal - Yeni Ürün Ekle - code kaldırıldı */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Yeni Ürün Ekle</h2>
            <form onSubmit={handleAddProduct}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => {
                    setNewProduct({ ...newProduct, category: e.target.value, color: '' });
                  }}
                  className="input-field"
                  required
                >
                  <option value="kanat">🚪 Kanat</option>
                  <option value="kasa">🪟 Kasa Takım</option>
                  <option value="baslik">🎯 Başlık</option>
                </select>
              </div>

              {(newProduct.category === 'kasa' || newProduct.category === 'baslik') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renk *</label>
                  <select
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Renk Seçin</option>
                    {colors.map(color => (
                      <option key={color.id} value={color.id}>
                        {color.emoji} {color.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ Seçtiğiniz renge göre otomatik gruplanacaktır.
                  </p>
                </div>
              )}

              {/* ❌ Model Kodu alanı KALDIRILDI */}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: 618 BUTE 87 veya 21.5 AÇIK GRİ"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  placeholder="Ürün açıklaması..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-blue-800">ℹ️ Yeni ürün eklendiğinde otomatik olarak tüm şubelerde stok kaydı oluşturulacaktır.</p>
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