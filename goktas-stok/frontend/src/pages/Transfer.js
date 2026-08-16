import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  UserIcon,
  CalendarIcon,
  CubeIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

const Transfer = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [activeTab, setActiveTab] = useState('request');

  const [formData, setFormData] = useState({
    sourceBranch: 'fabrika',
    targetBranch: user?.branch || '',
    productId: '',
    quantity: '',
    note: '',
    isCustom: false,
    customName: ''
  });

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const [partialModal, setPartialModal] = useState({
    show: false,
    transferId: null,
    productName: '',
    requestedQuantity: 0,
    partialQuantity: '',
    partialNote: '',
    isCustom: false
  });

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

  const statuses = [
    { value: 'all', label: 'Tümü' },
    { value: 'pending', label: '⏳ Beklemede' },
    { value: 'approved', label: '✅ Onaylandı' },
    { value: 'partially_fulfilled', label: '📦 Kısmi Karşılandı' },
    { value: 'completed', label: '✔️ Tamamlandı' },
    { value: 'rejected', label: '❌ Reddedildi' },
    { value: 'cancelled', label: '🚫 İptal Edildi' }
  ];

  const isFabrika = user?.role === 'admin' || user?.branch === 'fabrika';

  useEffect(() => {
    console.log('🔄 Transfer component mount edildi');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? '✅ Var' : '❌ Yok');
      
      if (!token) {
        toast.error('Oturum açmamışsınız!');
        setLoading(false);
        return;
      }

      console.log('📡 Veriler çekiliyor...');

      const [productsRes, stocksRes, transfersRes, pendingRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/stock'),
        axios.get('/transfers'),
        axios.get('/transfers/pending')
      ]);

      console.log('📦 Gelen ürünler:', productsRes.data);
      console.log('📦 Toplam ürün sayısı:', productsRes.data?.length || 0);
      console.log('📊 Gelen stoklar:', stocksRes.data);
      console.log('📊 Toplam stok sayısı:', stocksRes.data?.length || 0);
      
      const kanatlar = productsRes.data?.filter(p => p.category === 'kanat') || [];
      const kasalar = productsRes.data?.filter(p => p.category === 'kasa') || [];
      const basliklar = productsRes.data?.filter(p => p.category === 'baslik') || [];
      console.log(`🚪 Kanat: ${kanatlar.length}, 🪟 Kasa: ${kasalar.length}, 🎯 Başlık: ${basliklar.length}`);

      setProducts(productsRes.data || []);
      setStocks(stocksRes.data || []);
      setTransfers(transfersRes.data || []);
      setPendingTransfers(pendingRes.data || []);

      if (!productsRes.data || productsRes.data.length === 0) {
        toast.error('⚠️ Sistemde hiç ürün bulunmuyor! Lütfen önce ürün ekleyin.');
      } else {
        toast.success(`✅ ${productsRes.data.length} ürün yüklendi`);
      }

    } catch (error) {
      console.error('❌ Veri çekme hatası:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Oturumunuz sona ermiş! Lütfen tekrar girin.');
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        toast.error(error.response?.data?.message || 'Veriler alınamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  const getProductStock = (productId, branch) => {
    if (!productId || !stocks || stocks.length === 0) return 0;
    
    const stock = stocks.find(s => {
      const stockProductId = s.productId?._id || s.productId;
      return stockProductId?.toString() === productId?.toString() && s.branch === branch;
    });
    
    return stock ? stock.quantity : 0;
  };

  const getFactoryStock = () => {
    if (!formData.productId) return 0;
    return getProductStock(formData.productId, 'fabrika');
  };

  const handleRequest = async (e) => {
    e.preventDefault();

    if (!formData.targetBranch) {
      toast.error('Hedef şube seçiniz');
      return;
    }

    if (formData.isCustom && !formData.customName) {
      toast.error('Özel ürün adı giriniz');
      return;
    }

    if (!formData.isCustom && !formData.productId) {
      toast.error('Ürün seçiniz');
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    if (!formData.isCustom) {
      const factoryStock = getFactoryStock();
      if (formData.quantity > factoryStock) {
        toast.error(`Fabrikada yeterli stok yok! Mevcut: ${factoryStock} adet`);
        return;
      }
    }

    try {
      const payload = {
        sourceBranch: 'fabrika',
        targetBranch: formData.targetBranch,
        quantity: parseInt(formData.quantity),
        note: formData.note,
        isCustom: formData.isCustom,
        customName: formData.customName
      };

      if (!formData.isCustom) {
        payload.productId = formData.productId;
      }

      await axios.post('/transfers', payload);
      toast.success('✅ Transfer talebi oluşturuldu!');

      setFormData({
        ...formData,
        productId: '',
        quantity: '',
        note: '',
        customName: '',
        isCustom: false
      });

      fetchData();
      setActiveTab('pending');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Talep oluşturulamadı');
    }
  };

  // ✅ Tümünü Gönder - Onaylar + Tamamını gönderir
  const handleSendAll = async (transferId, quantity) => {
    if (!window.confirm(`Talebi onaylayıp TAMAMINI (${quantity} adet) göndermek istediğinize emin misiniz?`)) return;
    
    try {
      await axios.put(`/transfers/${transferId}/approve`);
      toast.success(`✅ ${quantity} adet tamamen gönderildi!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  // ✅ Kısmi Gönder - Önce onaylar, sonra kısmi gönderir
  const handlePartialFulfill = async (e) => {
    e.preventDefault();
    
    const { transferId, partialQuantity, partialNote, requestedQuantity, isCustom } = partialModal;
    
    if (!partialQuantity || partialQuantity <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    if (parseInt(partialQuantity) >= requestedQuantity) {
      toast.error(`Kısmi miktar (${partialQuantity}), talep edilen miktardan (${requestedQuantity}) küçük olmalıdır. Tamamı için "Tümünü Gönder" butonunu kullanın.`);
      return;
    }

    try {
      // Önce onayla
      await axios.put(`/transfers/${transferId}/approve`);
      
      // Sonra kısmi gönder
      await axios.put(`/transfers/${transferId}/partial-fulfill`, {
        partialQuantity: parseInt(partialQuantity),
        partialNote: partialNote || 'Kısmi karşılama'
      });
      
      toast.success(`✅ ${partialQuantity} adet kısmi karşılama tamamlandı! (Kalan: ${requestedQuantity - partialQuantity} adet)`);
      setPartialModal({ 
        show: false, 
        transferId: null, 
        productName: '',
        requestedQuantity: 0, 
        partialQuantity: '', 
        partialNote: '',
        isCustom: false
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: '⏳ Beklemede' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: '✅ Onaylandı' },
      partially_fulfilled: { color: 'bg-orange-100 text-orange-800', icon: DocumentArrowDownIcon, label: '📦 Kısmi Karşılandı' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: '✔️ Tamamlandı' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: '❌ Reddedildi' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: '🚫 İptal Edildi' }
    };
    return badges[status] || badges.pending;
  };

  const getProductName = (productId) => {
    if (!productId || !products || products.length === 0) return 'Ürün bulunamadı';
    const product = products.find(p => p._id === productId);
    return product ? product.name : 'Ürün bulunamadı';
  };

  const getCategoryEmoji = (category) => {
    if (category === 'kanat') return '🚪';
    if (category === 'kasa') return '🪟';
    if (category === 'baslik') return '🎯';
    return '📦';
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

      {/* Debug Bilgisi */}
      <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600 flex flex-wrap items-center gap-4">
        <span>📦 Ürün: <strong className="text-blue-600">{products.length}</strong></span>
        <span>📊 Stok: <strong className="text-green-600">{stocks.length}</strong></span>
        <span>🚪 Kanat: <strong className="text-blue-600">{products.filter(p => p.category === 'kanat').length}</strong></span>
        <span>🪟 Kasa: <strong className="text-purple-600">{products.filter(p => p.category === 'kasa').length}</strong></span>
        <span>🎯 Başlık: <strong className="text-green-600">{products.filter(p => p.category === 'baslik').length}</strong></span>
        <button
          onClick={fetchData}
          className="text-blue-500 hover:text-blue-700 underline font-medium"
        >
          🔄 Yenile
        </button>
        {products.length > 0 && (
          <span className="text-green-600 font-medium">✅ Ürünler yüklendi!</span>
        )}
        {products.length === 0 && (
          <span className="text-red-600 font-medium">⚠️ Ürün yok!</span>
        )}
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'request'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          📝 Talep Oluştur
        </button>
        {isFabrika && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'pending'
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
          className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'history'
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
                value={formData.isCustom ? 'custom' : formData.productId}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setFormData({ ...formData, isCustom: true, productId: '' });
                  } else {
                    setFormData({ ...formData, isCustom: false, productId: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Ürün seçin</option>
                {products && products.length > 0 ? (
                  products.map(product => {
                    const stock = getProductStock(product._id, 'fabrika');
                    return (
                      <option key={product._id} value={product._id}>
                        {product.name}
                        {getCategoryEmoji(product.category)}
                        {' - '}Fabrika: {stock} adet
                        {stock === 0 && ' ⚠️ Stok yok'}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>⚠️ Hiç ürün bulunamadı</option>
                )}
                <option value="custom">📦 Diğer (Özel Ürün)</option>
              </select>

              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-400">
                  Toplam ürün: <strong>{products?.length || 0}</strong>
                </p>
                {products && products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('📦 Tüm Ürünler:', products);
                      toast.success(`${products.length} ürün mevcut`);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700 underline"
                  >
                    Ürünleri göster
                  </button>
                )}
              </div>

              {(!products || products.length === 0) && (
                <p className="text-sm text-red-500 mt-1">
                  ⚠️ Sistemde hiç ürün yok! Lütfen önce ürün ekleyin.
                </p>
              )}
            </div>

            {formData.isCustom && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Özel Ürün Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Cam çıtası 20mm, Pervaz beyaz"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Özel ürünler stoktan düşmez, sadece talep olarak kaydedilir.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miktar <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!formData.isCustom) {
                    const factoryStock = getFactoryStock();
                    if (value <= factoryStock || !e.target.value) {
                      setFormData({ ...formData, quantity: e.target.value });
                    } else {
                      toast.error(`Fabrikada maksimum ${factoryStock} adet mevcut`);
                    }
                  } else {
                    setFormData({ ...formData, quantity: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Miktar girin"
                min="1"
                required
              />
              {formData.productId && !formData.isCustom && (
                <p className="text-xs text-gray-500 mt-1">
                  Fabrikada mevcut: <strong>{getFactoryStock()}</strong> adet
                </p>
              )}
              {formData.isCustom && (
                <p className="text-xs text-gray-400 mt-1">
                  ℹ️ Özel ürünler stok kontrolüne tabi değildir.
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

            {formData.productId && formData.quantity && formData.targetBranch && !formData.isCustom && (
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

            {formData.isCustom && formData.customName && formData.quantity && formData.targetBranch && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-900 mb-2">Özel Talep Özeti:</p>
                <p className="text-sm text-purple-800">
                  <strong>Ürün:</strong> 📦 {formData.customName}<br />
                  <strong>Kaynak:</strong> 🏭 Fabrika (Özel ürün - stoktan düşmez)<br />
                  <strong>Hedef:</strong> {branches.find(b => b.value === (isFabrika ? formData.targetBranch : user?.branch))?.label}<br />
                  <strong>Miktar:</strong> {formData.quantity} adet
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !formData.targetBranch ||
                (!formData.isCustom && !formData.productId) ||
                (formData.isCustom && !formData.customName) ||
                !formData.quantity ||
                (!formData.isCustom && parseInt(formData.quantity) > getFactoryStock())
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
        <div className="space-y-6">
          {pendingTransfers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl text-gray-500 font-medium">Bekleyen transfer talebi yok</p>
              <p className="text-sm text-gray-400 mt-1">Tüm talepler işleme alınmış görünüyor</p>
            </div>
          ) : (
            Object.entries(
              pendingTransfers.reduce((acc, transfer) => {
                const branch = transfer.targetBranch;
                if (!acc[branch]) acc[branch] = [];
                acc[branch].push(transfer);
                return acc;
              }, {})
            ).map(([branch, branchTransfers]) => {
              const branchLabel = branches.find(b => b.value === branch)?.label || branch;
              const totalItems = branchTransfers.length;
              const totalQuantity = branchTransfers.reduce((sum, t) => sum + t.quantity, 0);
              
              return (
                <div key={branch} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏢</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{branchLabel}</h3>
                        <p className="text-blue-100 text-sm">
                          {totalItems} talep • Toplam: {totalQuantity} adet
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        ⏳ {totalItems} bekleyen
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {branchTransfers.map((transfer) => {
                      const product = transfer.productId;
                      const colorInfo = product?.color ? colors.find(c => c.id === product.color) : null;
                      const isPartial = transfer.partialQuantity && transfer.partialQuantity < transfer.quantity;
                      const isCustom = transfer.isCustom;
                      
                      return (
                        <div key={transfer._id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isCustom ? (
                                  <>
                                    <span className="text-base font-semibold text-gray-900">
                                      📦 {transfer.customName || 'Özel Ürün'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      Özel Ürün
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-base font-semibold text-gray-900">
                                      {product?.name || 'Ürün bulunamadı'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {getCategoryEmoji(product?.category)}
                                      {product?.category === 'kanat' ? 'Kanat' : 
                                       product?.category === 'kasa' ? 'Kasa' : 
                                       product?.category === 'baslik' ? 'Başlık' : ''}
                                    </span>
                                    {colorInfo && (
                                      <span 
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                                        style={{
                                          backgroundColor: colorInfo.color,
                                          color: colorInfo.textColor,
                                          borderColor: product.color === 'acik_gri' ? '#9ca3af' : 'transparent'
                                        }}
                                      >
                                        {colorInfo.emoji} {colorInfo.label}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <CubeIcon className="h-4 w-4" />
                                  <span className="font-medium text-gray-700">Miktar:</span>
                                  <span className="text-gray-900 font-semibold">{transfer.quantity} adet</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <UserIcon className="h-4 w-4" />
                                  <span className="font-medium text-gray-700">Talep eden:</span>
                                  {transfer.requestedBy?.name || 'Bilinmiyor'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span className="font-medium text-gray-700">Tarih:</span>
                                  {new Date(transfer.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              
                              {transfer.note && (
                                <p className="mt-1 text-sm text-gray-400 italic">
                                  📝 {transfer.note}
                                </p>
                              )}
                            </div>

                            {/* ✅ Aksiyon Butonları */}
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                              {isPartial && (
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-medium">
                                  ⚠️ Kısmi (Önceki: {transfer.partialQuantity})
                                </span>
                              )}
                              
                              {/* ✅ Tümünü Gönder Butonu */}
                              <button
                                onClick={() => handleSendAll(transfer._id, transfer.quantity)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm hover:shadow"
                              >
                                <CheckIcon className="h-4 w-4" />
                                <span>Tümünü Gönder</span>
                              </button>
                              
                              {/* ✅ Kısmi Gönder Butonu */}
                              <button
                                onClick={() => setPartialModal({
                                  show: true,
                                  transferId: transfer._id,
                                  productName: isCustom ? (transfer.customName || 'Özel Ürün') : (product?.name || 'Ürün'),
                                  requestedQuantity: transfer.quantity,
                                  partialQuantity: '',
                                  partialNote: '',
                                  isCustom: isCustom
                                })}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm hover:shadow"
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                                <span>Kısmi Gönder</span>
                              </button>
                              
                              <button
                                onClick={() => handleReject(transfer._id)}
                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors border border-red-200"
                                title="Reddet"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Transfer Geçmişi */}
      {activeTab === 'history' && (
        <div>
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
                const isCustom = transfer.isCustom;

                return (
                  <div key={transfer._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          {isCustom ? (
                            <>
                              <span className="font-medium text-gray-900">
                                📦 {transfer.customName || 'Özel Ürün'}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Özel
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {transfer.productId?.name || 'Ürün bulunamadı'}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            <StatusIcon className="h-3 w-3 inline mr-1" />
                            {statusBadge.label}
                          </span>
                          {transfer.status === 'partially_fulfilled' && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                              {transfer.partialQuantity}/{transfer.quantity} gönderildi
                            </span>
                          )}
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
                        {transfer.partialNote && (
                          <p className="text-sm text-orange-500 mt-1">📦 Kısmi not: {transfer.partialNote}</p>
                        )}
                        {transfer.rejectionReason && (
                          <p className="text-sm text-red-500 mt-1">❌ Red sebebi: {transfer.rejectionReason}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-400">
                          {new Date(transfer.createdAt).toLocaleString('tr-TR')}
                        </span>
                        
                        {transfer.status === 'approved' && isFabrika && (
                          <button
                            onClick={() => setPartialModal({
                              show: true,
                              transferId: transfer._id,
                              productName: isCustom ? (transfer.customName || 'Özel Ürün') : (transfer.productId?.name || 'Ürün'),
                              requestedQuantity: transfer.quantity,
                              partialQuantity: '',
                              partialNote: '',
                              isCustom: isCustom
                            })}
                            className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            📦 Kısmi Gönder
                          </button>
                        )}

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

                        {transfer.status === 'partially_fulfilled' && transfer.targetBranch === user?.branch && (
                          <button
                            onClick={() => handleComplete(transfer._id)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            ✔️ Teslim Al (Kalan: {transfer.quantity - transfer.partialQuantity} adet)
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

      {/* Kısmi Karşılama Modalı */}
      {partialModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Kısmi Karşılama</h2>
            
            <p className="text-sm text-gray-600 mb-2">
              <strong>Ürün:</strong> {partialModal.productName}
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Talep edilen miktar:</strong> {partialModal.requestedQuantity} adet
              </p>
            </div>

            <form onSubmit={handlePartialFulfill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Göndermek istediğiniz miktar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={partialModal.partialQuantity}
                  onChange={(e) => setPartialModal({ 
                    ...partialModal, 
                    partialQuantity: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Miktar girin"
                  min="1"
                  max={partialModal.requestedQuantity - 1}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimum: {partialModal.requestedQuantity - 1} adet (Tam miktar için "Tümünü Gönder" butonunu kullanın)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={partialModal.partialNote}
                  onChange={(e) => setPartialModal({ 
                    ...partialModal, 
                    partialNote: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows="3"
                  placeholder="Kısmi gönderim notu..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  ✅ Kısmi Gönder
                </button>
                <button
                  type="button"
                  onClick={() => setPartialModal({ 
                    show: false, 
                    transferId: null, 
                    productName: '',
                    requestedQuantity: 0, 
                    partialQuantity: '', 
                    partialNote: '',
                    isCustom: false
                  })}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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

export default Transfer;