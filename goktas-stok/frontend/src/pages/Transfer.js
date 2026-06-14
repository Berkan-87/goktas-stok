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
  const [loading, setLoading] = useState(false);

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
    // Ürün ve kaynak şube seçildiğinde stoğu kontrol et
    if (formData.productId && formData.fromBranch) {
      const stock = stocks.find(
        s => s.productId?._id === formData.productId && s.branch === formData.fromBranch
      );
      setAvailableStock(stock ? stock.quantity : 0);
    } else {
      setAvailableStock(0);
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

    const quantityNum = parseInt(formData.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    if (quantityNum > availableStock) {
      toast.error(`Yeterli stok yok. Mevcut stok: ${availableStock} adet`);
      return;
    }

    setLoading(true);
    try {
      // Backend'de transfer endpoint'i yoksa, önce çıkış sonra giriş yapalım
      // 1. Kaynak şubeden stok çıkışı
      await axios.post('/stock/out', {
        productId: formData.productId,
        branch: formData.fromBranch,
        quantity: quantityNum,
        note: `${formData.note || 'Transfer'} - ${formData.fromBranch} → ${formData.toBranch}`
      });

      // 2. Hedef şubeye stok girişi
      await axios.post('/stock/in', {
        productId: formData.productId,
        branch: formData.toBranch,
        quantity: quantityNum,
        note: `${formData.note || 'Transfer'} - ${formData.fromBranch} → ${formData.toBranch}`
      });

      toast.success(`${quantityNum} adet ürün başarıyla transfer edildi`);
      
      // Formu temizle
      setFormData({
        productId: '',
        fromBranch: user?.branch || '',
        toBranch: '',
        quantity: '',
        note: ''
      });
      
      // Verileri yenile
      await fetchData();
      
    } catch (error) {
      console.error('Transfer hatası:', error);
      toast.error(error.response?.data?.message || 'Transfer başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? `${product.code} - ${product.name}` : '';
  };

  // Maksimum transfer edilebilecek miktarı göster
  const getMaxTransfer = () => {
    if (availableStock > 0) {
      return availableStock;
    }
    return 0;
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
              Ürün / Model <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value, quantity: '' })}
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
                Kaynak Şube <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.fromBranch}
                onChange={(e) => setFormData({ ...formData, fromBranch: e.target.value, quantity: '' })}
                className="input-field"
                required
                disabled={user?.role === 'branch_manager'}
              >
                <option value="">Kaynak şube seçin</option>
                {branches.map(branch => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
              {formData.fromBranch && (
                <div className="mt-2 p-2 rounded-lg text-sm">
                  {availableStock > 0 ? (
                    <p className="text-green-600">
                      ✓ Mevcut stok: <strong>{availableStock}</strong> adet
                      {availableStock <= 10 && availableStock > 0 && (
                        <span className="text-yellow-600 ml-2">(Kritik seviye!)</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-red-600">
                      ✗ Bu şubede stok bulunmamaktadır
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hedef Şube <span className="text-red-500">*</span>
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
              Transfer Miktarı <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value <= availableStock || !e.target.value) {
                  setFormData({ ...formData, quantity: e.target.value });
                } else {
                  toast.error(`Maksimum ${availableStock} adet transfer edebilirsiniz`);
                }
              }}
              className="input-field"
              placeholder="Miktar girin"
              min="1"
              max={availableStock || undefined}
              required
              disabled={availableStock === 0}
            />
            {availableStock > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Maksimum transfer: {getMaxTransfer()} adet
              </p>
            )}
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

          {formData.productId && formData.fromBranch && formData.toBranch && formData.quantity && availableStock > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">Transfer Özeti:</p>
              <p className="text-sm text-blue-800">
                <strong>Ürün:</strong> {getProductName(formData.productId)}<br />
                <strong>Kaynak:</strong> {branches.find(b => b.value === formData.fromBranch)?.label}<br />
                <strong>Hedef:</strong> {branches.find(b => b.value === formData.toBranch)?.label}<br />
                <strong>Miktar:</strong> {formData.quantity} adet<br />
                <strong>Transfer sonrası kaynak stok:</strong> {availableStock - parseInt(formData.quantity)} adet
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || 
              !canTransfer() || 
              !formData.productId || 
              !formData.fromBranch ||
              !formData.toBranch || 
              !formData.quantity ||
              availableStock === 0 ||
              parseInt(formData.quantity) > availableStock
            }
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightIcon className="h-5 w-5" />
            {loading ? 'Transfer yapılıyor...' : 'Transfer Yap'}
          </button>
        </form>
      </div>

      {/* Transfer geçmişi için alan (opsiyonel) */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Kuralları</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✓ Sadece kendi şubenizden transfer yapabilirsiniz</li>
          <li>✓ Transfer miktarı mevcut stoğu aşamaz</li>
          <li>✓ Kaynak ve hedef şube aynı olamaz</li>
          <li>✓ Transfer işlemleri anında gerçekleşir</li>
          <li>✓ Her transfer işlemi loglanır</li>
        </ul>
      </div>
    </div>
  );
};

export default Transfer;