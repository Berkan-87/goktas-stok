import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const Transfer = () => {
  const { user } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    fromBranch: user?.branch || '',
    toBranch: '',
    quantity: '',
    note: ''
  });
  const [availableStock, setAvailableStock] = useState(0);

  const branches = [
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.productId && formData.fromBranch) {
      const stock = stocks.find(
        s => s.productId._id === formData.productId && s.branch === formData.fromBranch
      );
      setAvailableStock(stock ? stock.quantity : 0);
    }
  }, [formData.productId, formData.fromBranch, stocks]);

  const fetchData = async () => {
    try {
      const [productsRes, stocksRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/stock')
      ]);
      setProducts(productsRes.data);
      setStocks(stocksRes.data);
    } catch (error) {
      toast.error('Veriler alınamadı');
    }
  };

  const canTransfer = () => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'branch_manager' && user?.branch === formData.fromBranch) return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canTransfer()) {
      toast.error('Bu şubeden transfer yapma yetkiniz yok');
      return;
    }

    if (formData.fromBranch === formData.toBranch) {
      toast.error('Kaynak ve hedef şube aynı olamaz');
      return;
    }

    if (formData.quantity > availableStock) {
      toast.error(`Yeterli stok yok. Mevcut stok: ${availableStock}`);
      return;
    }

    try {
      await axios.post('/transfer', formData);
      toast.success('Transfer başarıyla tamamlandı');
      setFormData({
        productId: '',
        fromBranch: user?.branch || '',
        toBranch: '',
        quantity: '',
        note: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transfer başarısız');
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? `${product.code} - ${product.name}` : '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Depolar Arası Transfer</h1>
        <p className="text-gray-600 mt-1">Stokları şubeler arasında transfer edin</p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ürün / Model
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Ürün seçin</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.code} - {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kaynak Şube
              </label>
              <select
                value={formData.fromBranch}
                onChange={(e) => setFormData({ ...formData, fromBranch: e.target.value })}
                className="input-field"
                required
                disabled={user?.role === 'branch_manager'}
              >
                {branches.map(branch => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
              {formData.fromBranch && availableStock > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Mevcut stok: {availableStock} adet
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hedef Şube
              </label>
              <select
                value={formData.toBranch}
                onChange={(e) => setFormData({ ...formData, toBranch: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Hedef şube seçin</option>
                {branches
                  .filter(b => b.value !== formData.fromBranch)
                  .map(branch => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transfer Miktarı
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="input-field"
              placeholder="Miktar"
              min="1"
              max={availableStock}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Not (Opsiyonel)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Transfer notu ekleyin..."
            />
          </div>

          {formData.productId && formData.fromBranch && formData.toBranch && formData.quantity && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Transfer Özeti:</strong><br />
                {getProductName(formData.productId)}<br />
                {branches.find(b => b.value === formData.fromBranch)?.label} →{' '}
                {branches.find(b => b.value === formData.toBranch)?.label}<br />
                Miktar: {formData.quantity} adet
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canTransfer() || !formData.productId || !formData.toBranch || !formData.quantity}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowRightIcon className="h-5 w-5" />
            Transfer Yap
          </button>
        </form>
      </div>
    </div>
  );
};

export default Transfer;