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
  const [newProduct, setNewProduct] = useState({ code: '', name: '', description: '' });
  const [modalData, setModalData] = useState({ show: false, type: '', productId: '', branch: '', currentStock: 0 });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const branches = [
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  // ✅ Her model grubu için renkler
  const getGroupColors = (groupName) => {
    const colorMap = {
      '618 BUTE': {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        header: 'from-blue-50 to-blue-100',
        badge: 'bg-blue-100 text-blue-700',
        dot: '🔵'
      },
      '616 BUTE': {
        border: 'border-green-500',
        bg: 'bg-green-50',
        header: 'from-green-50 to-green-100',
        badge: 'bg-green-100 text-green-700',
        dot: '🟢'
      },
      '606 BUTE': {
        border: 'border-purple-500',
        bg: 'bg-purple-50',
        header: 'from-purple-50 to-purple-100',
        badge: 'bg-purple-100 text-purple-700',
        dot: '🟣'
      }
    };
    
    return colorMap[groupName] || {
      border: 'border-gray-400',
      bg: 'bg-gray-50',
      header: 'from-gray-50 to-gray-100',
      badge: 'bg-gray-100 text-gray-700',
      dot: '⚪'
    };
  };

  const maxStock = Math.max(...stocks.map(s => s.quantity), 1000);

  useEffect(() => {
    fetchData();
  }, [selectedBranch]);

  const fetchData = async () => {
    try {
      const [stocksRes, productsRes] = await Promise.all([
        axios.get(`/stock/branch/${selectedBranch}`),
        axios.get('/products')
      ]);
      setStocks(stocksRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Veriler alınamadı');
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
      await axios.post('/products', {
        code: newProduct.code,
        name: newProduct.name,
        description: newProduct.description,
        unit: 'adet'
      });
      toast.success(`${newProduct.name} modeli başarıyla eklendi`);
      setShowAddProduct(false);
      setNewProduct({ code: '', name: '', description: '' });
      fetchData();
    } catch (error) {
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
        description: editForm.description
      });
      toast.success('Ürün başarıyla güncellendi');
      setEditingProduct(null);
      setEditForm({ name: '', code: '', description: '' });
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

  // ✅ Ürünleri modellerine göre grupla
  const groupProductsByModel = () => {
    const groups = {};
    products.forEach(product => {
      const modelName = product.name.replace(/\s*(87|77|Camlı|Camli|Cam)\s*$/i, '').trim();
      if (!groups[modelName]) {
        groups[modelName] = [];
      }
      groups[modelName].push(product);
    });
    return groups;
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const productGroups = groupProductsByModel();

  // ✅ Grup Kartı Bileşeni
  const GroupCard = ({ groupName, products: groupProducts }) => {
    const isExpanded = expandedGroups[groupName] !== false;
    const totalStock = groupProducts.reduce((sum, p) => sum + getStockForProduct(p._id), 0);
    const colors = getGroupColors(groupName);

    return (
      <div className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${colors.border} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        {/* Grup Başlığı */}
        <div 
          className={`flex items-center justify-between p-4 bg-gradient-to-r ${colors.header} cursor-pointer hover:opacity-90 transition-opacity`}
          onClick={() => toggleGroup(groupName)}
        >
          <div className="flex items-center gap-3">
            <button className="text-gray-600">
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {colors.dot} {groupName}
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

        {/* Grup İçeriği */}
        {isExpanded && (
          <div className={`p-4 ${colors.bg}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupProducts.map(product => {
                const quantity = getStockForProduct(product._id);
                const barWidth = getBarWidth(quantity);
                const barColor = getStockColor(quantity);
                const status = getStockStatus(quantity);
                const isEditing = editingProduct?._id === product._id && user?.role === 'admin';

                return (
                  <div key={product._id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                    {/* Varyant Başlığı */}
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
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setEditForm({
                                  name: product.name,
                                  code: product.code,
                                  description: product.description || ''
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

                    {/* Stok Miktarı */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl font-bold text-gray-900">{quantity}</span>
                      <span className="text-xs text-gray-400">adet</span>
                    </div>

                    {/* Doluluk Çubuğu */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* İşlem Butonları */}
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
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

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

      {/* ✅ Gruplu Kart Görünümü */}
      <div className="space-y-4">
        {Object.keys(productGroups).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-lg text-gray-500">📦 Stokta ürün bulunmuyor</p>
            <p className="text-sm text-gray-400 mt-1">Yeni ürün eklemek için "Yeni Model Ekle" butonunu kullanın.</p>
          </div>
        ) : (
          Object.entries(productGroups).map(([groupName, groupProducts]) => (
            <GroupCard 
              key={groupName} 
              groupName={groupName} 
              products={groupProducts} 
            />
          ))
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