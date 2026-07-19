import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { 
  PlusIcon, 
  ArrowRightIcon, 
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Production = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('planlama');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [newOrder, setNewOrder] = useState({
    orderNo: '',
    customer: '',
    model: '',
    color: '',
    quantity: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);

  // Aşama tanımları
  const stages = [
    { id: 'planlama', label: '📋 Planlamada', icon: '📋', nextStage: 'uretim' },
    { id: 'uretim', label: '⚙️ Üretimde', icon: '⚙️', nextStage: 'paketleme' },
    { id: 'paketleme', label: '📦 Paketlemede', icon: '📦', nextStage: 'hazir' },
    { id: 'hazir', label: '✅ Hazır', icon: '✅', nextStage: 'tamamlandi' },
    { id: 'tamamlandi', label: '🏁 Tamamlandı', icon: '🏁', nextStage: null }
  ];

  // Kullanıcının yetkili olduğu aşamalar
  const getUserStages = () => {
    if (user?.role === 'admin') return stages.map(s => s.id);
    if (user?.role === 'production_manager') {
      const roleStages = {
        'planlama': ['planlama'],
        'uretim': ['uretim'],
        'paketleme': ['paketleme'],
        'hazir': ['hazir']
      };
      return roleStages[user?.productionRole] || [];
    }
    return [];
  };

  const canManageStage = (stage) => {
    const userStages = getUserStages();
    return userStages.includes(stage) || user?.role === 'admin';
  };

  const canDelete = (stage) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'production_manager') {
      if (stage === 'planlama' && user?.productionRole === 'planlama') return true;
      if (stage === 'tamamlandi' && user?.productionRole === 'hazir') return true;
    }
    return false;
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      console.log('📤 Siparişler isteniyor...', `/production/stage/${activeTab}`);
      const response = await axios.get(`/production/stage/${activeTab}`);
      console.log('📥 Gelen siparişler:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('❌ Sipariş hatası:', error);
      console.error('❌ Hata detayı:', error.response?.data);
      toast.error(error.response?.data?.message || 'Siparişler alınamadı');
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/production', {
        ...newOrder,
        stage: 'planlama',
        createdBy: user._id
      });
      toast.success('Sipariş başarıyla eklendi');
      setShowAddModal(false);
      setNewOrder({ orderNo: '', customer: '', model: '', color: '', quantity: '', note: '' });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sipariş eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`/production/${orderId}`);
      toast.success('Sipariş başarıyla silindi');
      setShowDeleteModal(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sipariş silinemedi');
    }
  };

  const handleMoveStage = async (orderId, currentStage) => {
    const stage = stages.find(s => s.id === currentStage);
    if (!stage || !stage.nextStage) return;

    if (!canManageStage(currentStage)) {
      toast.error('Bu aşamada yetkiniz yok');
      return;
    }

    try {
      await axios.put(`/production/${orderId}/stage`, {
        stage: stage.nextStage
      });
      toast.success('Sipariş ileri taşındı');
      fetchOrders();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM HH:mm', { locale: tr });
  };

  const calculateDuration = (startDate) => {
    if (!startDate) return '-';
    const start = new Date(startDate);
    const now = new Date();
    const diffHours = Math.floor((now - start) / (1000 * 60 * 60));
    const diffMinutes = Math.floor(((now - start) / (1000 * 60)) % 60);
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} gün ${diffHours % 24} saat`;
    }
    return `${diffHours} saat ${diffMinutes} dakika`;
  };

  const canAdd = activeTab === 'planlama' && canManageStage('planlama');

  // ✅ Mobil Kart Bileşeni
  const MobileOrderCard = ({ order }) => {
    const showDelete = canDelete(order.stage);
    const showMove = activeTab !== 'tamamlandi' && canManageStage(activeTab);

    return (
      <div className="bg-white rounded-lg shadow-sm p-3 mb-2 border border-gray-100 hover:shadow-md transition-all duration-200">
        {/* Üst Satır: Sipariş No, Durum ve İşlemler */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600 text-sm">#{order.orderNo}</span>
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {stages.find(s => s.id === order.stage)?.label || order.stage}
            </span>
          </div>
          <div className="flex gap-0.5">
            {showMove && (
              <button
                onClick={() => handleMoveStage(order._id, activeTab)}
                className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                title="İleri Taşı"
              >
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            )}
            {activeTab === 'tamamlandi' && !showDelete && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
            {showDelete && (
              <button
                onClick={() => setShowDeleteModal({
                  id: order._id,
                  orderNo: order.orderNo,
                  customer: order.customer
                })}
                className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"
                title="Siparişi Sil"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Orta Satır: Müşteri - Model - Adet */}
        <div className="flex items-center gap-2 text-sm mb-1.5">
          <span className="font-medium text-gray-800 truncate flex-1">{order.customer}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 truncate flex-1">{order.model}</span>
          <span className="text-gray-400">•</span>
          <span className="font-semibold text-gray-900">{order.quantity} adet</span>
        </div>

        {/* Alt Satır: Renk - Süre - Aşama Zamanı */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-1.5">
          <div className="flex items-center gap-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-full border border-gray-200 flex-shrink-0" 
              style={{ 
                backgroundColor: order.color.toLowerCase().includes('beyaz') ? '#f5f5f5' :
                              order.color.toLowerCase().includes('siyah') ? '#1a1a1a' :
                              order.color.toLowerCase().includes('kırmızı') ? '#dc2626' :
                              order.color.toLowerCase().includes('mavi') ? '#2563eb' :
                              order.color.toLowerCase().includes('yeşil') ? '#16a34a' :
                              order.color.toLowerCase().includes('sarı') ? '#eab308' :
                              order.color.toLowerCase().includes('gri') ? '#6b7280' :
                              order.color.toLowerCase().includes('lacivert') ? '#1e3a8a' :
                              order.color.toLowerCase().includes('bordo') ? '#7f1d1d' :
                              '#9ca3af'
              }}
            />
            <span className="truncate max-w-[60px]">{order.color}</span>
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3 text-gray-400" />
            <span>{calculateDuration(order.stageHistory?.[order.stage]?.startedAt)}</span>
          </div>
          <span className="text-gray-400 text-[10px]">
            {formatDate(order.stageHistory?.[order.stage]?.startedAt)}
          </span>
        </div>
      </div>
    );
  }; // ✅ Buraya dikkat! MobileOrderCard burada kapanıyor

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Başlık ve Buton Alanı */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🏭 Üretim Takibi</h1>
          <p className="text-sm text-gray-600 mt-1 hidden sm:block">Siparişlerin üretim sürecini takip edin</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Yeni Sipariş Ekle</span>
          </button>
        )}
      </div>

      {/* ✅ Aşama Sekmeleri - Mobilde Dikey */}
      <div className="flex flex-col sm:flex-row gap-2 pb-2">
        {stages.map((stage) => {
          const count = orders.filter(o => o.stage === stage.id).length;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveTab(stage.id)}
              className={`
                px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg font-medium transition-all text-xs sm:text-sm
                w-full sm:flex-1 text-left sm:text-center flex justify-between sm:justify-center items-center gap-2
                ${activeTab === stage.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              <div className="flex items-center gap-2">
                <span>{stage.icon}</span>
                <span>{stage.label.replace(stage.icon, '').trim()}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === stage.id ? 'bg-blue-700' : 'bg-gray-200'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ✅ Sipariş Listesi - Mobilde Kart, Masaüstünde Tablo */}
      <div className="card overflow-hidden">
        {/* Masaüstü Tablosu (md ve üzeri) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Sip. No</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Cari</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Model</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Renk</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Adet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Bu Aşamada</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Süre</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 text-sm">
                    Bu aşamada sipariş bulunmuyor
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const showDelete = canDelete(order.stage);
                  const showMove = activeTab !== 'tamamlandi' && canManageStage(activeTab);
                  
                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm font-bold">{order.orderNo}</td>
                      <td className="py-3 px-4 text-sm">{order.customer}</td>
                      <td className="py-3 px-4 text-sm">{order.model}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" 
                            style={{ 
                              backgroundColor: order.color.toLowerCase().includes('beyaz') ? '#f5f5f5' :
                                            order.color.toLowerCase().includes('siyah') ? '#1a1a1a' :
                                            order.color.toLowerCase().includes('kırmızı') ? '#dc2626' :
                                            order.color.toLowerCase().includes('mavi') ? '#2563eb' :
                                            order.color.toLowerCase().includes('yeşil') ? '#16a34a' :
                                            order.color.toLowerCase().includes('sarı') ? '#eab308' :
                                            order.color.toLowerCase().includes('gri') ? '#6b7280' :
                                            '#9ca3af'
                            }}
                          />
                          <span className="text-sm">{order.color}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-sm">{order.quantity}</td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(order.stageHistory?.[order.stage]?.startedAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-mono">
                            {calculateDuration(order.stageHistory?.[order.stage]?.startedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          {showMove && (
                            <button
                              onClick={() => handleMoveStage(order._id, activeTab)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="İleri Taşı"
                            >
                              <ArrowRightIcon className="h-5 w-5" />
                            </button>
                          )}
                          {activeTab === 'tamamlandi' && !showDelete && (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          )}
                          {showDelete && (
                            <button
                              onClick={() => setShowDeleteModal({
                                id: order._id,
                                orderNo: order.orderNo,
                                customer: order.customer
                              })}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Siparişi Sil"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobil Kart Görünümü (md altı) */}
        <div className="md:hidden p-2">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Bu aşamada sipariş bulunmuyor
            </div>
          ) : (
            orders.map((order) => (
              <MobileOrderCard key={order._id} order={order} />
            ))
          )}
        </div>
      </div>

      {/* Silme Onay Modalı */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <TrashIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-2">Siparişi Sil</h2>
            <p className="text-gray-600 text-center mb-4 text-sm">
              <strong>{showDeleteModal.orderNo}</strong> numaralı siparişi silmek istediğinize emin misiniz?
            </p>
            <p className="text-sm text-gray-500 text-center mb-2">
              Müşteri: <strong>{showDeleteModal.customer}</strong>
            </p>
            <p className="text-sm text-red-600 text-center mb-6">
              ⚠️ Bu işlem geri alınamaz!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleDeleteOrder(showDeleteModal.id)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 btn-secondary"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Sipariş Ekleme Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Yeni Sipariş Ekle</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sipariş No *
                  </label>
                  <input
                    type="text"
                    value={newOrder.orderNo}
                    onChange={(e) => setNewOrder({ ...newOrder, orderNo: e.target.value })}
                    className="input-field"
                    placeholder="Örn: 41191"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cari / Müşteri *
                  </label>
                  <input
                    type="text"
                    value={newOrder.customer}
                    onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                    className="input-field"
                    placeholder="Cüneyt Bekki"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={newOrder.model}
                    onChange={(e) => setNewOrder({ ...newOrder, model: e.target.value })}
                    className="input-field"
                    placeholder="606"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Renk *
                  </label>
                  <input
                    type="text"
                    value={newOrder.color}
                    onChange={(e) => setNewOrder({ ...newOrder, color: e.target.value })}
                    className="input-field"
                    placeholder="LAKE MÜŞTERİ RENKİ"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adet *
                </label>
                <input
                  type="number"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                  className="input-field"
                  placeholder="16"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={newOrder.note}
                  onChange={(e) => setNewOrder({ ...newOrder, note: e.target.value })}
                  className="input-field"
                  rows="2"
                  placeholder="Siparişle ilgili notlar..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary" disabled={loading}>
                  {loading ? 'Ekleniyor...' : 'Sipariş Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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

export default Production;