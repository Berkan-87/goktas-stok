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
  TrashIcon // ✅ YENİ - Silme ikonu
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Production = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('planlama');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // ✅ YENİ - Silme onay modalı
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

  // ✅ Silme yetkisi - Sadece planlama ve tamamlandı için
  const canDelete = (stage) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'production_manager') {
      // Planlama yetkilisi planlama aşamasını silebilir
      if (stage === 'planlama' && user?.productionRole === 'planlama') return true;
      // Hazır yetkilisi tamamlandı aşamasını silebilir
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

  // ✅ Sipariş silme fonksiyonu
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

  // Sadece aktif aşamayı göster
  const currentStage = stages.find(s => s.id === activeTab);
  const canAdd = activeTab === 'planlama' && canManageStage('planlama');

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏭 Üretim Takibi</h1>
          <p className="text-gray-600 mt-1">Siparişlerin üretim sürecini takip edin</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Yeni Sipariş Ekle
          </button>
        )}
      </div>

      {/* Aşama Sekmeleri */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setActiveTab(stage.id)}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap
              ${activeTab === stage.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {stage.label} 
            <span className="ml-2 text-sm opacity-75">
              ({orders.length})
            </span>
          </button>
        ))}
      </div>

      {/* Sipariş Listesi */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Sip. No</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Cari</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Model</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Renk</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Adet</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Bu Aşamada</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Süre</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
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
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4">{order.model}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {order.color}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{order.quantity}</td>
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
                        {/* İleri Taşı Butonu */}
                        {showMove && (
                          <button
                            onClick={() => handleMoveStage(order._id, activeTab)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="İleri Taşı"
                          >
                            <ArrowRightIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Tamamlandı ikonu */}
                        {activeTab === 'tamamlandi' && !showDelete && (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        )}
                        
                        {/* ✅ SİL BUTONU - Sadece planlama ve tamamlandı için */}
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

      {/* ✅ Silme Onay Modalı */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <TrashIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Siparişi Sil</h2>
            <p className="text-gray-600 text-center mb-4">
              <strong>{showDeleteModal.orderNo}</strong> numaralı siparişi silmek istediğinize emin misiniz?
            </p>
            <p className="text-sm text-gray-500 text-center mb-2">
              Müşteri: <strong>{showDeleteModal.customer}</strong>
            </p>
            <p className="text-sm text-red-600 text-center mb-6">
              ⚠️ Bu işlem geri alınamaz!
            </p>
            <div className="flex gap-3">
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

      {/* Yeni Sipariş Ekleme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Yeni Sipariş Ekle</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex gap-3 pt-4">
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