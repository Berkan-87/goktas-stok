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
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Production = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    production: true,
    stock: true,
    sevk: true,
    completed: true
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [newOrder, setNewOrder] = useState({
    orderNo: '',
    customer: '',
    model: '',
    color: '',
    quantity: '',
    note: '',
    startStage: 'planlama'
  });
  const [loading, setLoading] = useState(false);

  // 🎯 Aşama tanımları - TÜM AŞAMALAR TEK BİR YERDE
  const allStages = [
    { id: 'planlama', label: '📋 Planlama', icon: '📋', nextStage: 'uretim' },
    { id: 'uretim', label: '⚙️ Üretim', icon: '⚙️', nextStage: 'paketleme' },
    { id: 'paketleme', label: '📦 Paketleme', icon: '📦', nextStage: 'sevk_alani' },
    { id: 'depo_hazirlik', label: '🏭 Depo Hazırlık', icon: '🏭', nextStage: 'sevk_alani' },
    { id: 'sevk_alani', label: '🚚 Sevk Alanı', icon: '🚚', nextStage: 'tamamlandi' },
    { id: 'tamamlandi', label: '✅ Tamamlandı', icon: '✅', nextStage: null }
  ];

  // Bölüm bazında aşamalar
  const productionStages = allStages.filter(s => ['planlama', 'uretim', 'paketleme'].includes(s.id));
  const stockStages = allStages.filter(s => ['depo_hazirlik'].includes(s.id));
  const sevkStages = allStages.filter(s => ['sevk_alani'].includes(s.id));
  const completedStages = allStages.filter(s => ['tamamlandi'].includes(s.id));

  // Kullanıcının yetkili olduğu aşamalar
  const getUserStages = () => {
    if (user?.role === 'admin') return allStages.map(s => s.id);
    if (user?.role === 'production_manager') {
      const roleStages = {
        'planlama': ['planlama'],
        'uretim': ['uretim'],
        'paketleme': ['paketleme'],
        'depo_hazirlik': ['depo_hazirlik', 'sevk_alani'],
        'hazir': ['tamamlandi']
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
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('📤 Tüm siparişler isteniyor...');
      const response = await axios.get('/production');
      console.log('📥 Gelen siparişler:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('❌ Sipariş hatası:', error);
      toast.error(error.response?.data?.message || 'Siparişler alınamadı');
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('📤 Sipariş ekleniyor:', newOrder);
      const response = await axios.post('/production', {
        orderNo: newOrder.orderNo,
        customer: newOrder.customer,
        model: newOrder.model,
        color: newOrder.color,
        quantity: parseInt(newOrder.quantity),
        note: newOrder.note,
        startStage: newOrder.startStage // Backend bu alanı kullanacak
      });
      console.log('✅ Sipariş eklendi:', response.data);
      toast.success('Sipariş başarıyla eklendi');
      setShowAddModal(false);
      setNewOrder({ 
        orderNo: '', 
        customer: '', 
        model: '', 
        color: '', 
        quantity: '', 
        note: '',
        startStage: 'planlama'
      });
      fetchOrders();
    } catch (error) {
      console.error('❌ Sipariş ekleme hatası:', error);
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

  // 🎯 DÜZELTİLDİ: handleMoveStage
  const handleMoveStage = async (orderId, currentStage) => {
    // currentStage'e göre nextStage'i bul
    const stage = allStages.find(s => s.id === currentStage);
    if (!stage || !stage.nextStage) {
      toast.error('Sipariş zaten son aşamada!');
      return;
    }

    if (!canManageStage(currentStage)) {
      toast.error('Bu aşamada yetkiniz yok');
      return;
    }

    try {
      console.log(`📤 Sipariş ${currentStage} -> ${stage.nextStage} taşınıyor...`);
      await axios.put(`/production/${orderId}`, {
        stage: stage.nextStage
      });
      const nextStageLabel = allStages.find(s => s.id === stage.nextStage)?.label || stage.nextStage;
      toast.success(`Sipariş ${nextStageLabel} aşamasına taşındı`);
      fetchOrders();
    } catch (error) {
      console.error('❌ Taşıma hatası:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'İşlem başarısız');
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

  const getOrdersByStage = (stageId) => {
    return orders.filter(order => order.stage === stageId);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const canAdd = user?.role === 'admin' || user?.role === 'branch_manager' || user?.productionRole === 'planlama';

  // ✅ Mobil Kart Bileşeni
  const MobileOrderCard = ({ order, stageId }) => {
    const showDelete = canDelete(order.stage);
    const showMove = stageId !== 'tamamlandi' && canManageStage(stageId);
    const isCompleted = order.stage === 'tamamlandi';
    const isSevk = order.stage === 'sevk_alani';

    return (
      <div className="bg-white rounded-lg shadow-sm p-3 mb-2 border border-gray-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600 text-sm">#{order.orderNo}</span>
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {allStages.find(s => s.id === order.stage)?.label || order.stage}
            </span>
          </div>
          <div className="flex gap-0.5">
            {showMove && !isCompleted && (
              <button
                onClick={() => handleMoveStage(order._id, stageId)}
                className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                title="İleri Taşı"
              >
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            )}
            {isCompleted && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
            {isSevk && !isCompleted && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                Sevk Bekliyor
              </span>
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

        <div className="flex items-center gap-2 text-sm mb-1.5">
          <span className="font-medium text-gray-800 truncate flex-1">{order.customer}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 truncate flex-1">{order.model}</span>
          <span className="text-gray-400">•</span>
          <span className="font-semibold text-gray-900">{order.quantity} adet</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-1.5">
          <div className="flex items-center gap-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-full border border-gray-200 flex-shrink-0" 
              style={{ 
                backgroundColor: order.color?.toLowerCase().includes('beyaz') ? '#f5f5f5' :
                              order.color?.toLowerCase().includes('siyah') ? '#1a1a1a' :
                              order.color?.toLowerCase().includes('kırmızı') ? '#dc2626' :
                              order.color?.toLowerCase().includes('mavi') ? '#2563eb' :
                              order.color?.toLowerCase().includes('yeşil') ? '#16a34a' :
                              order.color?.toLowerCase().includes('sarı') ? '#eab308' :
                              order.color?.toLowerCase().includes('gri') ? '#6b7280' :
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
  };

  // Stage kartı render'ı
  const renderStageColumn = (stage, sectionType = 'production') => {
    const stageOrders = getOrdersByStage(stage.id);
    
    let bgColor, borderColor, headerBg;
    if (sectionType === 'production') {
      bgColor = 'bg-blue-50';
      borderColor = 'border-blue-200';
      headerBg = 'bg-blue-100';
    } else if (sectionType === 'stock') {
      bgColor = 'bg-indigo-50';
      borderColor = 'border-indigo-200';
      headerBg = 'bg-indigo-100';
    } else if (sectionType === 'sevk') {
      bgColor = 'bg-orange-50';
      borderColor = 'border-orange-200';
      headerBg = 'bg-orange-100';
    } else {
      bgColor = 'bg-green-50';
      borderColor = 'border-green-200';
      headerBg = 'bg-green-100';
    }

    return (
      <div key={stage.id} className="flex-1 min-w-[200px]">
        <div className={`${bgColor} rounded-xl p-3 h-full`}>
          <div className={`${headerBg} rounded-lg p-2 mb-3 border ${borderColor}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-800">
                {stage.icon} {stage.label}
              </h3>
              <span className="text-xs font-semibold bg-white px-2 py-0.5 rounded-full shadow-sm">
                {stageOrders.length}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {stageOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-6 bg-white rounded-lg border-2 border-dashed border-gray-200 text-xs">
                Sipariş yok
              </div>
            ) : (
              stageOrders.map((order) => (
                <MobileOrderCard key={order._id} order={order} stageId={stage.id} />
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto p-2 sm:p-4">
      {/* GELEN SİPARİŞ */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border-2 border-green-300 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 flex items-center gap-2">
              📦 GELEN SİPARİŞ
            </h2>
            <p className="text-green-600 text-sm mt-1">
              Toplam: {orders.length} aktif sipariş
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-semibold text-sm">
              📋 Planlamada: {getOrdersByStage('planlama').length}
            </span>
            <span className="bg-indigo-200 text-indigo-800 px-3 py-1.5 rounded-lg font-semibold text-sm">
              🏭 Depo Hazırlık: {getOrdersByStage('depo_hazirlik').length}
            </span>
            {canAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-md"
              >
                <PlusIcon className="h-4 w-4" />
                Yeni Sipariş Ekle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ÜRETİM BÖLÜMÜ */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 cursor-pointer flex justify-between items-center border-b-2 border-blue-200 hover:bg-blue-100 transition"
          onClick={() => toggleSection('production')}
        >
          <h2 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center gap-2">
            🏭 ÜRETİM BÖLÜMÜ
            <span className="text-sm font-normal text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">
              {productionStages.reduce((total, stage) => total + getOrdersByStage(stage.id).length, 0)}
            </span>
          </h2>
          <button className="text-blue-600 p-1">
            {expandedSections.production ? 
              <ChevronUpIcon className="h-5 w-5" /> : 
              <ChevronDownIcon className="h-5 w-5" />
            }
          </button>
        </div>

        {expandedSections.production && (
          <div className="p-3 sm:p-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-[280px]">
              {productionStages.map(stage => renderStageColumn(stage, 'production'))}
            </div>
          </div>
        )}
      </div>

      {/* STOK BÖLÜMÜ */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div 
          className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 cursor-pointer flex justify-between items-center border-b-2 border-indigo-200 hover:bg-indigo-100 transition"
          onClick={() => toggleSection('stock')}
        >
          <h2 className="text-lg sm:text-xl font-bold text-indigo-800 flex items-center gap-2">
            📦 STOK BÖLÜMÜ
            <span className="text-sm font-normal text-indigo-600 bg-indigo-200 px-2 py-0.5 rounded-full">
              {stockStages.reduce((total, stage) => total + getOrdersByStage(stage.id).length, 0)}
            </span>
          </h2>
          <button className="text-indigo-600 p-1">
            {expandedSections.stock ? 
              <ChevronUpIcon className="h-5 w-5" /> : 
              <ChevronDownIcon className="h-5 w-5" />
            }
          </button>
        </div>

        {expandedSections.stock && (
          <div className="p-3 sm:p-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-[280px]">
              {stockStages.map(stage => renderStageColumn(stage, 'stock'))}
            </div>
          </div>
        )}
      </div>

      {/* SEVK ALANI */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div 
          className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 sm:p-4 cursor-pointer flex justify-between items-center border-b-2 border-orange-200 hover:bg-orange-100 transition"
          onClick={() => toggleSection('sevk')}
        >
          <h2 className="text-lg sm:text-xl font-bold text-orange-800 flex items-center gap-2">
            🚚 SEVK ALANI
            <span className="text-sm font-normal text-orange-600 bg-orange-200 px-2 py-0.5 rounded-full">
              {getOrdersByStage('sevk_alani').length}
            </span>
          </h2>
          <button className="text-orange-600 p-1">
            {expandedSections.sevk ? 
              <ChevronUpIcon className="h-5 w-5" /> : 
              <ChevronDownIcon className="h-5 w-5" />
            }
          </button>
        </div>

        {expandedSections.sevk && (
          <div className="p-3 sm:p-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-[280px]">
              {sevkStages.map(stage => renderStageColumn(stage, 'sevk'))}
            </div>
          </div>
        )}
      </div>

      {/* TAMAMLANAN SİPARİŞLER */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div 
          className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 cursor-pointer flex justify-between items-center border-b-2 border-green-200 hover:bg-green-100 transition"
          onClick={() => toggleSection('completed')}
        >
          <h2 className="text-lg sm:text-xl font-bold text-green-800 flex items-center gap-2">
            ✅ TAMAMLANAN SİPARİŞLER
            <span className="text-sm font-normal text-green-600 bg-green-200 px-2 py-0.5 rounded-full">
              {getOrdersByStage('tamamlandi').length}
            </span>
          </h2>
          <button className="text-green-600 p-1">
            {expandedSections.completed ? 
              <ChevronUpIcon className="h-5 w-5" /> : 
              <ChevronDownIcon className="h-5 w-5" />
            }
          </button>
        </div>

        {expandedSections.completed && (
          <div className="p-3 sm:p-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-[280px]">
              {completedStages.map(stage => renderStageColumn(stage, 'completed'))}
            </div>
          </div>
        )}
      </div>

      {/* Silme Modalı */}
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
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
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
              <h2 className="text-lg sm:text-xl font-bold">📦 Yeni Sipariş Ekle</h2>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="LAKE MÜŞTERİ RENKİ"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adet *
                  </label>
                  <input
                    type="number"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="16"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Aşaması *
                  </label>
                  <select
                    value={newOrder.startStage}
                    onChange={(e) => setNewOrder({ ...newOrder, startStage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="planlama">📋 Planlama (Üretim Bölümü)</option>
                    <option value="depo_hazirlik">🏭 Depo Hazırlık (Stok Bölümü)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Siparişi doğrudan hangi bölüme eklemek istersiniz?
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={newOrder.note}
                  onChange={(e) => setNewOrder({ ...newOrder, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows="2"
                  placeholder="Siparişle ilgili notlar..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm" disabled={loading}>
                  {loading ? 'Ekleniyor...' : 'Sipariş Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
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