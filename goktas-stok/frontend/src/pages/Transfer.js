import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const Transfer = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'pending' | 'history'
  
  // ✅ Transfer Form State
  const [formData, setFormData] = useState({
    sourceBranch: 'fabrika',
    targetBranch: user?.branch || '',
    productId: '',
    quantity: '',
    note: ''
  });
  
  // ✅ Filtreleme
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  
  const branches = [
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  const statuses = [
    { value: 'all', label: 'Tümü' },
    { value: 'pending', label: '⏳ Beklemede' },
    { value: 'approved', label: '✅ Onaylandı' },
    { value: 'completed', label: '✔️ Tamamlandı' },
    { value: 'rejected', label: '❌ Reddedildi' },
    { value: 'cancelled', label: '🚫 İptal Edildi' }
  ];

  const isFabrika = user?.role === 'admin' || user?.branch === 'fabrika';
  const isBranchManager = user?.role === 'branch_manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, stocksRes, transfersRes, pendingRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/stock'),
        axios.get('/transfers'),
        axios.get('/transfers/pending')
      ]);
      
      setProducts(productsRes.data);
      setStocks(stocksRes.data);
      setTransfers(transfersRes.data);
      setPendingTransfers(pendingRes.data);
    } catch (error) {
      toast.error('Veriler alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mevcut stok kontrolü
  const getProductStock = (productId, branch) => {
    const stock = stocks.find(s => s.productId?._id === productId && s.branch === branch);
    return stock ? stock.quantity : 0;
  };

  // ✅ Seçili ürünün fabrika stoğu
  const getFactoryStock = () => {
    if (!formData.productId) return 0;
    return getProductStock(formData.productId, 'fabrika');
  };

  // ✅ Transfer talebi oluştur
  const handleRequest = async (e) => {
    e.preventDefault();
    
    if (!formData.targetBranch) {
      toast.error('Hedef şube seçiniz');
      return;
    }
    
    if (!formData.productId) {
      toast.error('Ürün seçiniz');
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }
    
    const factoryStock = getFactoryStock();
    if (formData.quantity > factoryStock) {
      toast.error(`Fabrikada yeterli stok yok! Mevcut: ${factoryStock} adet`);
      return;
    }

    try {
      const response = await axios.post('/transfers', {
        sourceBranch: 'fabrika',
        targetBranch: formData.targetBranch,
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        note: formData.note
      });
      
      toast.success('✅ Transfer talebi oluşturuldu! Fabrika onayı bekleniyor.');
      
      setFormData({
        ...formData,
        productId: '',
        quantity: '',
        note: ''
      });
      
      fetchData();
      setActiveTab('pending');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Talep oluşturulamadı');
    }
  };

  // ✅ Transfer onayla (Fabrika)
  const handleApprove = async (transferId) => {
    if (!window.confirm('Bu transfer talebini onaylamak istediğinize emin misiniz?')) return;
    
    try {
      await axios.put(`/transfers/${transferId}/approve`);
      toast.success('✅ Transfer onaylandı ve stoklar güncellendi!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Onay başarısız');
    }
  };

  // ✅ Transfer reddet (Fabrika)
  const handleReject = async (transferId) => {
    const reason = prompt('Reddetme sebebini girin:');
    if (reason === null) return;
    
    try {
      await axios.put(`/transfers/${transferId}/reject`, { reason });
      toast.success('Transfer reddedildi');
      fetchData();
    } catch (error) {
      toast.error('Reddetme başarısız');
    }
  };

  // ✅ Transfer tamamla (Şube)
  const handleComplete = async (transferId) => {
    if (!window.confirm('Transferi teslim aldığınızı onaylıyor musunuz?')) return;
    
    try {
      await axios.put(`/transfers/${transferId}/complete`);
      toast.success('✔️ Transfer tamamlandı! Stoklar güncellendi.');
      fetchData();
    } catch (error) {
      toast.error('Tamamlama başarısız');
    }
  };

  // ✅ Transfer iptal et
  const handleCancel = async (transferId) => {
    if (!window.confirm('Bu transfer talebini iptal etmek istediğinize emin misiniz?')) return;
    
    try {
      await axios.put(`/transfers/${transferId}/cancel`);
      toast.success('Transfer iptal edildi');
      fetchData();
    } catch (error) {
      toast.error('İptal başarısız');
    }
  };

  // ✅ Filtrelenmiş transferler
  const getFilteredTransfers = () => {
    let filtered = transfers;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }
    
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(t => 
        t.sourceBranch === selectedBranch || 
        t.targetBranch === selectedBranch
      );
    }
    
    return filtered;
  };

  // ✅ Transfer durumu badge'i
  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: '⏳ Beklemede' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: '✅ Onaylandı' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: '✔️ Tamamlandı' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: '❌ Reddedildi' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: '🚫 İptal Edildi' }
    };
    return badges[status] || badges.pending;
  };

  // ✅ Transferdeki ürün adını bul
  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.name : 'Ürün bulunamadı';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Stok Transfer</h1>
          <p className="text-gray-600 mt-1">
            {isFabrika ? 'Şubelerden gelen transfer taleplerini yönetin' : 'Fabrikadan ürün talebinde bulunun'}
          </p>
        </div>
        <div className="flex gap-2">
          {isFabrika && pendingTransfers.length > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              {pendingTransfers.length} Bekleyen Talep
            </span>
          )}
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'request'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 Talep Oluştur
        </button>
        {isFabrika && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap relative ${
              activeTab === 'pending'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⏳ Bekleyen Talepler
            {pendingTransfers.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingTransfers.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Transfer Geçmişi
        </button>
      </div>

      {/* Talep Oluştur */}
      {activeTab === 'request' && (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isFabrika ? '📦 Stok Transferi (Fabrika → Şube)' : '📦 Fabrikadan Ürün Talebi'}
          </h2>
          
          <form onSubmit={handleRequest} className="space-y-5">
            {isFabrika && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef Şube <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.targetBranch}
                  onChange={(e) => setFormData({ ...formData, targetBranch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Şube seçin</option>
                  {branches
                    .filter(b => b.value !== 'fabrika')
                    .map(branch => (
                      <option key={branch.value} value={branch.value}>
                        {branch.label}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {!isFabrika && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benim Şubem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={branches.find(b => b.value === user?.branch)?.label || 'Belirtilmemiş'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  📌 Talebiniz fabrikaya iletilecektir
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value, quantity: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Ürün seçin</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} 
                    {product.category === 'kanat' ? ' 🚪' : 
                     product.category === 'kasa' ? ' 🪟' : ' 🎯'}
                    {' - '}Fabrika: {getProductStock(product._id, 'fabrika')} adet
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miktar <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const factoryStock = getFactoryStock();
                  if (value <= factoryStock || !e.target.value) {
                    setFormData({ ...formData, quantity: e.target.value });
                  } else {
                    toast.error(`Fabrikada maksimum ${factoryStock} adet mevcut`);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Miktar girin"
                min="1"
                max={getFactoryStock() || undefined}
                required
              />
              {formData.productId && (
                <p className="text-xs text-gray-500 mt-1">
                  Fabrikada mevcut: <strong>{getFactoryStock()}</strong> adet
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Transfer notu ekleyin..."
              />
            </div>

            {formData.productId && formData.quantity && formData.targetBranch && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Talep Özeti:</p>
                <p className="text-sm text-blue-800">
                  <strong>Ürün:</strong> {getProductName(formData.productId)}<br />
                  <strong>Kaynak:</strong> 🏭 Fabrika<br />
                  <strong>Hedef:</strong> {branches.find(b => b.value === (isFabrika ? formData.targetBranch : user?.branch))?.label}<br />
                  <strong>Miktar:</strong> {formData.quantity} adet<br />
                  <strong>Transfer sonrası fabrika stoku:</strong> {getFactoryStock() - parseInt(formData.quantity)} adet
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !formData.targetBranch ||
                !formData.productId ||
                !formData.quantity ||
                parseInt(formData.quantity) > getFactoryStock()
              }
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightIcon className="h-5 w-5" />
              {loading ? 'Talep gönderiliyor...' : isFabrika ? 'Transfer Yap' : 'Talep Gönder'}
            </button>
          </form>
        </div>
      )}

      {/* Bekleyen Talepler (Fabrika) */}
      {activeTab === 'pending' && isFabrika && (
        <div className="space-y-4">
          {pendingTransfers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-lg text-gray-500">📭 Bekleyen transfer talebi yok</p>
              <p className="text-sm text-gray-400 mt-1">Tüm talepler işleme alınmış görünüyor</p>
            </div>
          ) : (
            pendingTransfers.map((transfer) => (
              <div key={transfer._id} className="bg-white rounded-xl shadow-lg border border-yellow-200 p-4 hover:shadow-xl transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-gray-900">
                        {transfer.productId?.name || 'Ürün bulunamadı'}
                      </span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        ⏳ Beklemede
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Talep Eden:</span> {transfer.requestedBy?.name || 'Bilinmiyor'}
                      </div>
                      <div>
                        <span className="font-medium">Hedef Şube:</span> {branches.find(b => b.value === transfer.targetBranch)?.label}
                      </div>
                      <div>
                        <span className="font-medium">Miktar:</span> {transfer.quantity} adet
                      </div>
                      <div>
                        <span className="font-medium">Tarih:</span> {new Date(transfer.createdAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    {transfer.note && (
                      <p className="text-sm text-gray-500 mt-2">📝 {transfer.note}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(transfer._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Onayla
                    </button>
                    <button
                      onClick={() => handleReject(transfer._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Transfer Geçmişi */}
      {activeTab === 'history' && (
        <div>
          {/* Filtreler */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Durum:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Şube:</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Şubeler</option>
                {branches.map(branch => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchData}
              className="bg-gray-200 text-gray-700 px-4 py-1 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Yenile
            </button>
          </div>

          {/* Transfer Listesi */}
          {getFilteredTransfers().length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-lg text-gray-500">📋 Henüz transfer kaydı yok</p>
              <p className="text-sm text-gray-400 mt-1">Yapılan transferler burada görünecek</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredTransfers().map((transfer) => {
                const statusBadge = getStatusBadge(transfer.status);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <div key={transfer._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium text-gray-900">
                            {transfer.productId?.name || 'Ürün bulunamadı'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            <StatusIcon className="h-3 w-3 inline mr-1" />
                            {statusBadge.label}
                          </span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Kaynak:</span> {branches.find(b => b.value === transfer.sourceBranch)?.label}
                          </div>
                          <div>
                            <span className="font-medium">Hedef:</span> {branches.find(b => b.value === transfer.targetBranch)?.label}
                          </div>
                          <div>
                            <span className="font-medium">Miktar:</span> {transfer.quantity} adet
                          </div>
                          <div>
                            <span className="font-medium">Talep:</span> {transfer.requestedBy?.name || 'Bilinmiyor'}
                          </div>
                        </div>
                        {transfer.note && (
                          <p className="text-sm text-gray-500 mt-1">📝 {transfer.note}</p>
                        )}
                        {transfer.rejectionReason && (
                          <p className="text-sm text-red-500 mt-1">❌ Red sebebi: {transfer.rejectionReason}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-400">
                          {new Date(transfer.createdAt).toLocaleString('tr-TR')}
                        </span>
                        {transfer.status === 'pending' && transfer.requestedBy?._id === user?._id && (
                          <button
                            onClick={() => handleCancel(transfer._id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            İptal Et
                          </button>
                        )}
                        {transfer.status === 'approved' && transfer.targetBranch === user?.branch && (
                          <button
                            onClick={() => handleComplete(transfer._id)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            ✔️ Teslim Al
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transfer;
