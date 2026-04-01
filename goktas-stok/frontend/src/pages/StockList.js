import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { PlusIcon, MinusIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

const StockList = () => {
  const { user } = useSelector((state) => state.auth);
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(user?.branch || 'fabrika');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ code: '', name: '', description: '' });
  const [modalData, setModalData] = useState({ show: false, type: '', productId: '', branch: '', currentStock: 0 });

  const branches = [
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

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
    try {
      await axios.post('/products', newProduct);
      toast.success('Ürün başarıyla eklendi');
      setShowAddProduct(false);
      setNewProduct({ code: '', name: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ürün eklenemedi');
    }
  };

  const getStockForProduct = (productId) => {
    const stock = stocks.find(s => s.productId._id === productId);
    return stock ? stock.quantity : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Listesi</h1>
          <p className="text-gray-600 mt-1">Ürün stoklarını görüntüleyin ve yönetin</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="input-field w-48"
            disabled={user?.role === 'branch_manager' && user?.branch !== selectedBranch}
          >
            {branches.map(branch => (
              <option key={branch.value} value={branch.value}>{branch.label}</option>
            ))}
          </select>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Yeni Model Ekle
            </button>
          )}
        </div>
      </div>

      {/* Stock Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Model Kodu</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Model Adı</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Stok Miktarı</th>
              {canModify() && (
                <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const quantity = getStockForProduct(product._id);
              const isLowStock = quantity <= 10 && quantity > 0;
              
              return (
                <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{product.code}</td>
                  <td className="py-3 px-4">{product.name}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${isLowStock ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {quantity} {product.unit || 'adet'}
                    {isLowStock && <span className="ml-2 text-xs text-yellow-600">(Kritik)</span>}
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
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Stok Girişi"
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
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Stok Çıkışı"
                          disabled={quantity === 0}
                        >
                          <MinusIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Modal */}
      {modalData.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {modalData.type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı'}
            </h2>
            <p className="text-gray-600 mb-4">
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

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Yeni Model Ekle</h2>
            <form onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="Model Kodu (örn: PRD-001)"
                value={newProduct.code}
                onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                className="input-field mb-3"
                required
              />
              <input
                type="text"
                placeholder="Model Adı"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="input-field mb-3"
                required
              />
              <textarea
                placeholder="Açıklama"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="input-field mb-4"
                rows="3"
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-primary">Ekle</button>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 btn-secondary"
                >
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