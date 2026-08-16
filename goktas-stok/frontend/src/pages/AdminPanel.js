// frontend/src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import {
  UserPlusIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  PackageIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // ✅ Kullanıcı Formu
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'viewer',
    branch: '',
    productionRole: '',
    materialDepoAccess: false
  });

  // ✅ Ürün Formu
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    description: '',
    category: 'kanat'
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    description: '',
    category: 'kanat'
  });
  const [productLoading, setProductLoading] = useState(false);

  // ✅ Şube listesi
  const branches = [
    { value: '', label: 'Şube Seçin (Yönetici için gerekli)' },
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  // ✅ Kullanıcı roller
  const roles = [
    { value: 'admin', label: '👑 Admin (Tüm yetkiler)' },
    { value: 'branch_manager', label: '📋 Şube Yöneticisi (Kendi şubesinde değişiklik yapabilir)' },
    { value: 'production_manager', label: '🏭 Üretim Yöneticisi (Üretim aşamalarında yetkili)' },
    { value: 'viewer', label: '👁️ Görüntüleyici (Sadece görüntüleme)' }
  ];

  // ✅ Üretim rolleri (GÜNCELLENDİ)
  const productionRoles = [
    { value: '', label: 'Yetkisi Yok' },
    { value: 'planlama', label: '📋 Planlama' },
    { value: 'uretim', label: '🏭 Üretim' },
    { value: 'paketleme', label: '📦 Paketleme' },
    { value: 'depo_hazirlik', label: '📦 Depo Hazırlık' },
    { value: 'sevk', label: '🚛 Sevk Alanı' }
  ];

  // ✅ Admin kontrolü
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  // ✅ Verileri getir
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchProducts();
      fetchStats();
    }
  }, [user]);

  // ✅ Kullanıcıları getir
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('❌ Kullanıcılar alınamadı:', error);
      toast.error('Kullanıcılar alınamadı');
    }
  };

  // ✅ İstatistikleri getir
  const fetchStats = async () => {
    try {
      const response = await axios.get('/users/count');
      setStats(response.data);
    } catch (error) {
      console.error('❌ İstatistikler alınamadı:', error);
    }
  };

  // ✅ Ürünleri getir
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Ürünler alınamadı');
    }
  };

  // ✅ Kullanıcı işlemleri
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    
    // Validasyonlar
    if (!formData.username || !formData.name || !formData.role) {
      toast.error('Kullanıcı adı, isim ve rol zorunludur');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Yeni kullanıcı için şifre zorunludur');
      return;
    }

    if (formData.role === 'production_manager' && !formData.productionRole) {
      toast.error('Üretim yöneticisi için üretim rolü seçilmelidir');
      return;
    }

    if (formData.role === 'branch_manager' && !formData.branch) {
      toast.error('Şube yöneticisi için şube seçilmelidir');
      return;
    }

    try {
      if (editingUser) {
        await axios.put(`/users/${editingUser._id}`, formData);
        toast.success('✅ Kullanıcı güncellendi');
      } else {
        await axios.post('/users', formData);
        toast.success('✅ Kullanıcı oluşturuldu');
      }
      setShowUserModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('❌ Kullanıcı işlemi hatası:', error);
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı pasifleştirmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/users/${userId}`);
      toast.success('✅ Kullanıcı pasifleştirildi');
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Kullanıcı pasifleştirilemedi');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await axios.put(`/users/${userId}/activate`);
      toast.success('✅ Kullanıcı aktifleştirildi');
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Kullanıcı aktifleştirilemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'viewer',
      branch: '',
      productionRole: '',
      materialDepoAccess: false
    });
  };

  // ✅ Ürün işlemleri
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProductLoading(true);
    try {
      await axios.post('/products', newProduct);
      toast.success(`${newProduct.name} başarıyla eklendi`);
      setNewProduct({ code: '', name: '', description: '', category: 'kanat' });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ürün eklenemedi');
    } finally {
      setProductLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`${productName} silmek istediğinize emin misiniz?`)) return;
    try {
      await axios.delete(`/products/${productId}`);
      toast.success(`${productName} silindi`);
      fetchProducts();
    } catch (error) {
      toast.error('Ürün silinemedi');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/products/${editingProduct._id}`, editForm);
      toast.success('Ürün güncellendi');
      setEditingProduct(null);
      setEditForm({ code: '', name: '', description: '', category: 'kanat' });
      fetchProducts();
    } catch (error) {
      toast.error('Ürün güncellenemedi');
    }
  };

  const startEditing = (product) => {
    setEditingProduct(product);
    setEditForm({
      code: product.code,
      name: product.name,
      description: product.description || '',
      category: product.category || 'kanat'
    });
  };

  // ✅ Yardımcı fonksiyonlar
  const getRoleLabel = (role) => {
    const labels = {
      admin: '👑 Admin',
      branch_manager: '📋 Şube Yöneticisi',
      production_manager: '🏭 Üretim Yöneticisi',
      viewer: '👁️ Görüntüleyici'
    };
    return labels[role] || role;
  };

  const getBranchLabel = (branch) => {
    const branchLabels = {
      fabrika: '🏭 Fabrika',
      karabaglar: '🏘️ Karabağlar',
      manisa: '🏙️ Manisa',
      edremit: '🌊 Edremit',
      karsiyaka: '🏖️ Karşıyaka'
    };
    return branchLabels[branch] || '-';
  };

  const getProductionRoleLabel = (productionRole) => {
    const labels = {
      planlama: '📋 Planlama',
      uretim: '🏭 Üretim',
      paketleme: '📦 Paketleme',
      depo_hazirlik: '📦 Depo Hazırlık',
      sevk: '🚛 Sevk Alanı'
    };
    return labels[productionRole] || '-';
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const hasProductionRole = (user) => {
    return user.role === 'production_manager' && user.productionRole;
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Admin Paneli</h1>
          <p className="text-gray-600 mt-1">Kullanıcı, yetki ve ürün yönetimi</p>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowUserModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            Yeni Kullanıcı
          </button>
        )}
      </div>

      {/* İstatistik Kartları (SADECE KULLANICI TABINDA) */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aktif Kullanıcı</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XMarkIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pasif Kullanıcı</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 Kullanıcı Yönetimi
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'products'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📦 Ürün Yönetimi
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {products.length}
          </span>
        </button>
      </div>

      {/* KULLANICI YÖNETİMİ SEKMESİ */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şube</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üretim Yetkisi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Malzeme Depo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500">@{u.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {u.branch ? getBranchLabel(u.branch) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {u.productionRole ? getProductionRoleLabel(u.productionRole) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {u.materialDepoAccess ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          ✅ Var
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          ❌ Yok
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(u.isActive)}`}>
                        {u.isActive ? '✅ Aktif' : '❌ Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setFormData({
                              username: u.username,
                              password: '',
                              name: u.name,
                              role: u.role,
                              branch: u.branch || '',
                              productionRole: u.productionRole || '',
                              materialDepoAccess: u.materialDepoAccess || false
                            });
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Düzenle"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {u.username !== 'admin' && (
                          <>
                            {u.isActive ? (
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Pasifleştir"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(u._id)}
                                className="text-green-600 hover:text-green-900"
                                title="Aktifleştir"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ÜRÜN YÖNETİMİ SEKMESİ */}
      {activeTab === 'products' && (
        <>
          {/* Yeni Ürün Ekleme Formu */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Yeni Ürün Ekle
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="kanat">🚪 Kanat</option>
                    <option value="kasa">🪟 Kasa Takım</option>
                    <option value="baslik">🎯 Başlık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Kodu *
                  </label>
                  <input
                    type="text"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                    className="input-field"
                    placeholder="Örn: KASA-AG-01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Adı *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="input-field"
                  placeholder="Örn: Açık Gri Kasa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="input-field"
                  rows="2"
                  placeholder="Ürün açıklaması..."
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={productLoading}
              >
                {productLoading ? 'Ekleniyor...' : 'Ürün Ekle'}
              </button>
            </form>
          </div>

          {/* Mevcut Ürünler */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📋 Mevcut Ürünler</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => {
                    const isEditing = editingProduct?._id === product._id;
                    
                    if (isEditing) {
                      return (
                        <tr key={product._id}>
                          <td colSpan="4" className="px-6 py-4">
                            <form onSubmit={handleEditProduct} className="flex flex-wrap gap-2">
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className="input-field text-sm py-1 w-28"
                              >
                                <option value="kanat">🚪 Kanat</option>
                                <option value="kasa">🪟 Kasa</option>
                                <option value="baslik">🎯 Başlık</option>
                              </select>
                              <input
                                type="text"
                                value={editForm.code}
                                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                className="input-field text-sm py-1 w-32"
                                required
                              />
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="input-field text-sm py-1 flex-1"
                                required
                              />
                              <button type="submit" className="btn-primary text-sm py-1 px-3">
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="btn-secondary text-sm py-1 px-3"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    }
                    
                    return (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.category === 'kanat' ? '🚪 Kanat' : 
                           product.category === 'kasa' ? '🪟 Kasa Takım' : '🎯 Başlık'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{product.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(product)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Düzenle"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id, product.name)}
                              className="text-red-500 hover:text-red-700"
                              title="Sil"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Henüz ürün eklenmemiş. Yukarıdaki formdan ürün ekleyebilirsiniz.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Kullanıcı Modalı */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? '✏️ Kullanıcı Düzenle' : '👤 Yeni Kullanıcı Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Yeni Şifre (opsiyonel)' : 'Şifre *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                  placeholder={editingUser ? "Değiştirmek istemiyorsanız boş bırakın" : "Şifre girin"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      role: e.target.value,
                      branch: '',
                      productionRole: ''
                    });
                  }}
                  className="input-field"
                  required
                >
                  {roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {formData.role === 'branch_manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şube *</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Şube Seçin</option>
                    {branches.filter(b => b.value !== '').map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'production_manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Üretim Yetkisi *</label>
                  <select
                    value={formData.productionRole}
                    onChange={(e) => setFormData({ ...formData, productionRole: e.target.value })}
                    className="input-field"
                    required
                  >
                    {productionRoles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="materialDepoAccess"
                  checked={formData.materialDepoAccess || false}
                  onChange={(e) => setFormData({ ...formData, materialDepoAccess: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="materialDepoAccess" className="text-sm text-gray-700">
                  📦 Malzeme Depo Erişimi
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 btn-primary">
                  {editingUser ? 'Güncelle' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                  }}
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

export default AdminPanel;