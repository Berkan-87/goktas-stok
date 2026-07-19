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
  TrashIcon
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
    if (quantity >= 1000) return 'bg-blue-600';
    if (quantity >= 400) return 'bg-blue-500';
    if (quantity >= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStockStatus = (quantity) => {
    if (quantity >= 400) return { text: 'Yeterli', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (quantity >= 100) return { text: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (quantity > 0) return { text: 'Kritik', color: 'text-red-600', bg: 'bg-red-50' };
    return { text: 'Tükendi', color: 'text-gray-500', bg: 'bg-gray-50' };
  };

  const getBarWidth = (quantity) => {
    const percentage = (quantity / maxStock) * 100;
    return Math.min(percentage, 100);
  };

  // Mobil görünüm için kart (isEvenGroup prop'una göre arka plan rengi değişiyor)
  const MobileStockCard = ({ product, quantity, barWidth, barColor, status, isEvenGroup }) => (
    <div className={`rounded-lg shadow-sm p-3 mb-3 border transition-colors ${isEvenGroup ? 'bg-white border-gray-100' : 'bg-gray-50/90 border-gray-200/60'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">{product.name}</div>
          <div className="text-xs text-gray-400">{product.code}</div>
        </div>
        <div className="text-right">
          <span className={`font-bold ${status.color} text-lg`}>{quantity}</span>
          <span className="text-xs text-gray-400 ml-1">adet</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-6 bg-white/60 shadow-inner border border-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-300 rounded-full`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="flex justify-end gap-2">
        {canModify() && (
          <>
            <button
              onClick={() => setModalData({
                show: true,
                type: 'in',
                productId: product._id,
                productName: product.name,
                currentStock: quantity
              })}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setModalData({
                show: true,
                type: 'out',
                productId: product._id,
                productName: product.name,
                currentStock: quantity
              })}
              className={`p-2 rounded-lg transition-colors ${
                quantity === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
              disabled={quantity === 0}
            >
              <MinusIcon className="h-5 w-5" />
            </button>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <button
              onClick={() => {
                setEditingProduct(product);
                setEditForm({
                  name: product.name,
                  code: product.code,
                  description: product.description || ''
                });
              }}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm({
                show: true,
                productId: product._id,
                productName: product.name
              })}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stok Listesi</h1>
          <p className="text-sm text-gray-600 mt-1 hidden sm:block">Ürün stoklarını görüntüleyin ve yönetin</p>
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

      {/* Desktop Table - hidden on mobile */}
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Model Adı</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Stok</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Doluluk</th>
              {canModify() && <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>}
              {user?.role === 'admin' && <th className="text-center py-3 px-4 font-semibold text-gray-700">Yönetim</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const quantity = getStockForProduct(product._id);
              const barWidth = getBarWidth(quantity);
              const barColor = getStockColor(quantity);
              const status = getStockStatus(quantity);
              
              // Her 3 satırda bir rengi değiştiren matematiksel formül
              const isEvenGroup = Math.floor(index / 3) % 2 === 0;
              
              return (
                <tr 
                  key={product._id} 
                  className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${isEvenGroup ? 'bg-white' : 'bg-gray-50/70'}`}
                >
                  <td className="py-3 px-4">
                    {editingProduct?._id === product._id && user?.role === 'admin' ? (
                      <form onSubmit={handleEditProduct} className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="input-field text-sm py-1"
                          required
                        />
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                          className="input-field text-sm py-1"
                          required
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary text-sm py-1 px-2">
                            <CheckIcon className="h-4 w-4 inline" /> Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(null)}
                            className="btn-secondary text-sm py-1 px-2"
                          >
                            <XMarkIcon className="h-4 w-4 inline" /> İptal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-bold ${status.color}`}>{quantity}</span>
                    <span className="text-xs text-gray-400 ml-1">adet</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-6 bg-gray-100/80 shadow-inner rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-300 rounded-full`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </td>
                  {canModify() && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setModalData({
                            show: true,
                            type: 'in',
                            productId: product._id,
                            productName: product.name,
                            currentStock: quantity
                          })}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setModalData({
                            show: true,
                            type: 'out',
                            productId: product._id,
                            productName: product.name,
                            currentStock: quantity
                          })}
                          className={`p-2 rounded-lg ${
                            quantity === 0 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          disabled={quantity === 0}
                        >
                          <MinusIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  )}
                  {user?.role === 'admin' && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setShowDeleteConfirm({
                          show: true,
                          productId: product._id,
                          productName: product.name
                        })}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - visible on mobile */}
      <div className="md:hidden">
        {products.map((product, index) => {
          const quantity = getStockForProduct(product._id);
          const barWidth = getBarWidth(quantity);
          const barColor = getStockColor(quantity);
          const status = getStockStatus(quantity);
          const isEvenGroup = Math.floor(index / 3) % 2 === 0;
          
          return (
            <MobileStockCard
              key={product._id}
              product={product}
              quantity={quantity}
              barWidth={barWidth}
              barColor={barColor}
              status={status}
              isEvenGroup={isEvenGroup}
            />
          );
        })}
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Stokta ürün bulunmuyor
          </div>
        )}
      </div>

      {/* Modals - Mobil Uyumlu */}
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
              <div className="flex gap-3">
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
            <div className="flex gap-3">
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
                  placeholder="Örn: Standart Model A"
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
              <div className="flex gap-3">
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