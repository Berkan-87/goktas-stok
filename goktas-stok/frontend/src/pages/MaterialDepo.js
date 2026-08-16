// frontend/src/pages/MaterialDepo.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import {
  PlusIcon,
  MinusIcon,
  PlusCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const MaterialDepo = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('mdf');
  const [selectedBranch, setSelectedBranch] = useState(user?.branch || 'fabrika');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // ✅ Stok Modal State
  const [stockModal, setStockModal] = useState({
    show: false,
    materialId: null,
    materialName: '',
    currentStock: 0,
    type: 'in', // 'in' veya 'out'
    quantity: ''
  });
  
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    unit: 'adet',
    thickness: '',
    size: '',
    color: '',
    colorName: '',
    stock: 0,
    criticalLevel: 10
  });

  const branches = [
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  const tabs = [
    { id: 'mdf', label: '📋 MDF\'ler' },
    { id: 'glue', label: '🧴 Tutkallar' },
    { id: 'edgeband', label: '📐 Kenar Bantlar' },
    { id: 'pvc', label: '🔲 PVC\'ler' }
  ];

  const colors = [
    { id: 'white', name: 'Beyaz', emoji: '⚪' },
    { id: 'black', name: 'Siyah', emoji: '⚫' },
    { id: 'oak', name: 'Meşe', emoji: '🟤' },
    { id: 'walnut', name: 'Ceviz', emoji: '🟫' },
    { id: 'gray', name: 'Gri', emoji: '🔘' },
    { id: 'beech', name: 'Kayın', emoji: '🟨' }
  ];

  useEffect(() => {
    fetchMaterials();
  }, [selectedBranch]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/materials?branch=${selectedBranch}`);
      setMaterials(res.data);
    } catch (error) {
      console.error('❌ Malzemeler alınamadı:', error);
      toast.error('Malzemeler alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryMaterials = (category) => {
    return materials.filter(m => m.category === category);
  };

  // ✅ Stok Modal İşlemleri
  const openStockModal = (material, type) => {
    setStockModal({
      show: true,
      materialId: material._id,
      materialName: material.name,
      currentStock: material.stock,
      type: type,
      quantity: ''
    });
  };

  const closeStockModal = () => {
    setStockModal({
      show: false,
      materialId: null,
      materialName: '',
      currentStock: 0,
      type: 'in',
      quantity: ''
    });
  };

  const handleStockChange = async (e) => {
    e.preventDefault();
    
    const { materialId, type, quantity, currentStock } = stockModal;
    
    if (!quantity || quantity <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    const quantityNum = parseInt(quantity);
    
    // Çıkış kontrolü
    if (type === 'out' && quantityNum > currentStock) {
      toast.error(`Yeterli stok yok! Mevcut: ${currentStock}`);
      return;
    }

    try {
      const changeQuantity = type === 'in' ? quantityNum : -quantityNum;
      await axios.put(`/materials/${materialId}/stock`, { quantity: changeQuantity });
      toast.success(`✅ ${quantityNum} adet ${type === 'in' ? 'eklendi' : 'çıkarıldı'}`);
      closeStockModal();
      fetchMaterials();
    } catch (error) {
      console.error('❌ Stok güncelleme hatası:', error);
      toast.error(error.response?.data?.message || 'Stok güncellenemedi');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    
    if (!newMaterial.name.trim()) {
      toast.error('Malzeme adı zorunludur');
      return;
    }

    if ((activeTab === 'edgeband' || activeTab === 'pvc') && !newMaterial.color) {
      toast.error('Renk seçimi zorunludur');
      return;
    }

    try {
      const payload = {
        name: newMaterial.name.trim(),
        category: activeTab,
        branch: selectedBranch,
        stock: parseInt(newMaterial.stock) || 0,
        criticalLevel: parseInt(newMaterial.criticalLevel) || 10,
        unit: newMaterial.unit || 'adet'
      };

      if (activeTab === 'mdf') {
        payload.thickness = newMaterial.thickness || null;
        payload.size = newMaterial.size || null;
      } else if (activeTab === 'edgeband' || activeTab === 'pvc') {
        payload.color = newMaterial.color;
        payload.colorName = newMaterial.colorName || '';
      }

      console.log('📦 Gönderilen payload:', payload);

      await axios.post('/materials', payload);
      toast.success('✅ Malzeme başarıyla eklendi');
      setShowAddModal(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('❌ Ekleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Ekleme başarısız';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setNewMaterial({
      name: '',
      unit: 'adet',
      thickness: '',
      size: '',
      color: '',
      colorName: '',
      stock: 0,
      criticalLevel: 10
    });
  };

  const getStatusColor = (stock, critical) => {
    if (stock <= critical) return 'text-red-600 bg-red-50';
    if (stock <= critical * 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (stock, critical) => {
    if (stock <= critical) return '🔴 Kritik';
    if (stock <= critical * 2) return '🟠 Düşük';
    return '🟢 Yeterli';
  };

  const renderAddForm = () => {
    switch (activeTab) {
      case 'mdf':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Malzeme Adı *</label>
              <input
                type="text"
                placeholder="örn: 18mm MDF"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kalınlık (mm)</label>
                <input
                  type="number"
                  placeholder="18"
                  value={newMaterial.thickness}
                  onChange={(e) => setNewMaterial({ ...newMaterial, thickness: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ebat</label>
                <input
                  type="text"
                  placeholder="210x280"
                  value={newMaterial.size}
                  onChange={(e) => setNewMaterial({ ...newMaterial, size: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </>
        );
      case 'glue':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Malzeme Adı *</label>
              <input
                type="text"
                placeholder="örn: İskelet Tutkalı"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
              <select
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                className="input-field"
              >
                <option value="kg">Kg</option>
                <option value="lt">Lt</option>
                <option value="adet">Adet</option>
              </select>
            </div>
          </>
        );
      case 'edgeband':
      case 'pvc':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Malzeme Adı *</label>
              <input
                type="text"
                placeholder={`${activeTab === 'edgeband' ? 'Kenar Bant' : 'PVC'} adı`}
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Renk *</label>
              <select
                value={newMaterial.color}
                onChange={(e) => {
                  const selected = colors.find(c => c.id === e.target.value);
                  setNewMaterial({ 
                    ...newMaterial, 
                    color: e.target.value,
                    colorName: selected?.name || ''
                  });
                }}
                className="input-field"
                required
              >
                <option value="">Renk Seçin</option>
                {colors.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
              <select
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                className="input-field"
              >
                <option value="metre">Metre</option>
                <option value="adet">Adet</option>
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderMaterialCard = (material) => {
    const statusColor = getStatusColor(material.stock, material.criticalLevel);
    const statusText = getStatusText(material.stock, material.criticalLevel);

    let details = '';
    if (material.category === 'mdf') {
      details = `${material.thickness || '?'}mm - ${material.size || '?'}`;
    } else if (material.category === 'edgeband' || material.category === 'pvc') {
      const color = colors.find(c => c.id === material.color);
      details = color ? `${color.emoji} ${color.name}` : material.colorName;
    }

    return (
      <div key={material._id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{material.name}</h4>
            {details && <p className="text-sm text-gray-500">{details}</p>}
            <p className="text-xs text-gray-400">{material.unit}</p>
          </div>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{material.stock}</span>
          <div className="flex gap-1">
            {/* ✅ Stok Giriş Butonu - Modal Açar */}
            <button
              onClick={() => openStockModal(material, 'in')}
              className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
              title="Stok Ekle"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            {/* ✅ Stok Çıkış Butonu - Modal Açar */}
            <button
              onClick={() => {
                if (material.stock <= 0) {
                  toast.error('Stok zaten 0');
                  return;
                }
                openStockModal(material, 'out');
              }}
              className={`p-1.5 rounded transition-colors ${
                material.stock <= 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
              title="Stok Çıkar"
              disabled={material.stock <= 0}
            >
              <MinusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div 
            className={`h-full rounded-full transition-all ${
              material.stock <= material.criticalLevel ? 'bg-red-500' : 
              material.stock <= material.criticalLevel * 2 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((material.stock / (material.criticalLevel * 3)) * 100, 100)}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-400 text-right">
          Kritik: {material.criticalLevel}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Malzemeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Malzeme Depo</h1>
          <p className="text-gray-600 mt-1">Yardımcı malzeme stok takibi</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="input-field w-48 text-sm"
          >
            {branches.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Yeni Ekle
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {getCategoryMaterials(tab.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getCategoryMaterials(activeTab).length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
            <p className="text-lg text-gray-500">📭 Bu kategoride malzeme bulunmuyor</p>
            <p className="text-sm text-gray-400 mt-1">"Yeni Ekle" butonunu kullanarak malzeme ekleyin.</p>
          </div>
        ) : (
          getCategoryMaterials(activeTab).map(material => renderMaterialCard(material))
        )}
      </div>

      {/* ✅ Stok Giriş/Çıkış Modalı */}
      {stockModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {stockModal.type === 'in' ? '📥 Stok Girişi' : '📤 Stok Çıkışı'}
            </h2>
            
            <p className="text-sm text-gray-600 mb-2">
              <strong>Malzeme:</strong> {stockModal.materialName}
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Mevcut Stok:</strong> {stockModal.currentStock} adet
              </p>
            </div>

            <form onSubmit={handleStockChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {stockModal.type === 'in' ? 'Eklenecek Miktar' : 'Çıkarılacak Miktar'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={stockModal.quantity}
                  onChange={(e) => setStockModal({ ...stockModal, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Miktar girin"
                  min="1"
                  max={stockModal.type === 'out' ? stockModal.currentStock : undefined}
                  required
                  autoFocus
                />
                {stockModal.type === 'out' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maksimum: {stockModal.currentStock} adet
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    stockModal.type === 'in' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {stockModal.type === 'in' ? '✅ Ekle' : '❌ Çıkar'}
                </button>
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Malzeme Ekleme Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Yeni {tabs.find(t => t.id === activeTab)?.label} Ekle
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              {renderAddForm()}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Stoku</label>
                  <input
                    type="number"
                    value={newMaterial.stock}
                    onChange={(e) => setNewMaterial({ ...newMaterial, stock: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kritik Seviye</label>
                  <input
                    type="number"
                    value={newMaterial.criticalLevel}
                    onChange={(e) => setNewMaterial({ ...newMaterial, criticalLevel: parseInt(e.target.value) || 10 })}
                    className="input-field"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 btn-primary">Ekle</button>
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

export default MaterialDepo;