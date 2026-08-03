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
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' veya 'products'
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'viewer',
    branch: '',
    productionRole: ''
  });

  // ✅ Ürün formu
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    description: '',
    category: 'kanat'
  });
  
  // ✅ Ürün düzenleme
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    description: '',
    category: 'kanat'
  });
  const [productLoading, setProductLoading] = useState(false);

  const branches = [
    { value: '', label: 'Şube Seçin (Yönetici için gerekli)' },
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  const roles = [
    { value: 'admin', label: '👑 Admin (Tüm yetkiler)' },
    { value: 'branch_manager', label: '📋 Şube Yöneticisi (Kendi şubesinde değişiklik yapabilir)' },
    { value: 'production_manager', label: '🏭 Üretim Yöneticisi (Üretim aşamalarında yetkili)' },
    { value: 'viewer', label: '👁️ Görüntüleyici (Sadece görüntüleme)' }
  ];

  // Üretim aşamaları
  const productionRoles = [
    { value: '', label: 'Yetkisi Yok' },
    { value: 'planlama', label: '📋 Planlamada' },
    { value: 'uretim', label: '⚙️ Üretimde' },
    { value: 'paketleme', label: '📦 Paketlemede' },
    { value: 'hazir', label: '✅ Hazır' }
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
    }
  }, [user]);

  // ✅ Kullanıcıları getir
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Kullanıcılar alınamadı');
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
    try {
      if (editingUser) {
        await axios.put(`/auth/users/${editingUser._id}`, formData);
        toast.success('Kullanıcı güncellendi');
      } else {
        await axios.post('/auth/users', formData);
        toast.success('Kullanıcı oluşturuldu');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setFormData({ 
        username: '', 
        password: '', 
        name: '', 
        role: 'viewer', 
        branch: '',
        productionRole: '' 
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`/auth/users/${userId}`);
        toast.success('Kullanıcı silindi');
        fetchUsers();
      } catch (error) {
        toast.error('Kullanıcı silinemedi');
      }
    }
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
      planlama: '📋 Planlamada',
      uretim: '⚙️ Üretimde',
      paketleme: '📦 Paketlemede',
      hazir: '✅ Hazır'
    };
    return labels[productionRole] || '-';
  };

  const hasProductionRole = (user) => {
    return user.role === 'production_manager' && user.productionRole;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Admin Paneli</h1>
          <p className="text-gray-600 mt-1">Kullanıcı ve sistem yönetimi</p>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ 
                username: '', 
                password: '', 
                name: '', 
                role: 'viewer', 
                branch: '',
                productionRole: '' 
              });
              setShowUserModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            Yeni Kullanıcı
          </button>
        )}
      </div>

      {/* ✅ Sekmeler */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 Kullanıcı Yönetimi
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'products'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📦 Ürün Yönetimi
        </button>
      </div>

      {/* ✅ KULLANICI YÖNETİMİ SEKMESİ */}
      {activeTab === 'users' && (
        <>
          {/* Users Table */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 Kullanıcılar</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı Adı</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">İsim</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Şube</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Üretim Yetkisi</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{u.username}</td>
                      <td className="py-3 px-4">{u.name}</td>
                      <td className="py-3 px-4">{getRoleLabel(u.role)}</td>
                      <td className="py-3 px-4">{u.branch ? getBranchLabel(u.branch) : '-'}</td>
                      <td className="py-3 px-4">
                        {hasProductionRole(u) ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {getProductionRoleLabel(u.productionRole)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setFormData({
                                username: u.username,
                                password: '',
                                name: u.name,
                                role: u.role,
                                branch: u.branch || '',
                                productionRole: u.productionRole || ''
                              });
                              setShowUserModal(true);
                            }}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-gray-500 text-sm">Toplam Kullanıcı</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="card">
              <p className="text-gray-500 text-sm">Toplam Ürün</p>
              <p className="text-3xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="card">
              <p className="text-gray-500 text-sm">Aktif Şubeler</p>
              <p className="text-3xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-500 mt-1">Fabrika, Karabağlar, Manisa, Edremit, Karşıyaka</p>
            </div>
          </div>
        </>
      )}

      {/* ✅ ÜRÜN YÖNETİMİ SEKMESİ */}
      {activeTab === 'products' && (
        <>
          {/* Yeni Ürün Ekleme Formu */}
          <div className="card">
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
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Mevcut Ürünler</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Kategori</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Kod</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Ad</th>
                    <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const isEditing = editingProduct?._id === product._id;
                    
                    if (isEditing) {
                      return (
                        <tr key={product._id} className="border-b border-gray-100">
                          <td colSpan="4" className="py-2 px-3">
                            <form onSubmit={handleEditProduct} className="flex flex-wrap gap-2">
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className="input-field text-sm py-1 w-28"
                              >
                                <option value="kanat">🚪 Kanat</option>
                                <option value="kasa">🪟 Kasa</option>
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
                      <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm">
                          {product.category === 'kanat' ? '🚪 Kanat' : '🪟 Kasa Takım'}
                        </td>
                        <td className="py-2 px-3 text-sm font-mono">{product.code}</td>
                        <td className="py-2 px-3 text-sm">{product.name}</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
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

      {/* ✅ Kullanıcı Modal (Aynen korundu) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
            </h2>
            <form onSubmit={handleUserSubmit}>
              <input
                type="text"
                placeholder="Kullanıcı Adı"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-field mb-3"
                required
                disabled={!!editingUser}
              />
              <input
                type="text"
                placeholder="İsim Soyisim"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field mb-3"
                required
              />
              <input
                type="password"
                placeholder={editingUser ? "Yeni şifre (boş bırakırsanız değişmez)" : "Şifre"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field mb-3"
                required={!editingUser}
                minLength="6"
              />
              
              <select
                value={formData.role}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  role: e.target.value,
                  productionRole: e.target.value === 'production_manager' ? formData.productionRole : ''
                })}
                className="input-field mb-3"
                required
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>

              {(formData.role === 'branch_manager' || formData.role === 'production_manager' || formData.role === 'viewer') && (
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="input-field mb-3"
                  required={formData.role === 'branch_manager'}
                >
                  {branches.map(branch => (
                    <option key={branch.value} value={branch.value}>{branch.label}</option>
                  ))}
                </select>
              )}

              {formData.role === 'production_manager' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Üretim Yetkisi
                  </label>
                  <select
                    value={formData.productionRole}
                    onChange={(e) => setFormData({ ...formData, productionRole: e.target.value })}
                    className="input-field"
                    required
                  >
                    {productionRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Hangi üretim aşamasında yetkili olacağını seçin
                  </p>
                </div>
              )}

              {formData.role === 'production_manager' && !formData.productionRole && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    ⚠️ Lütfen bir üretim yetkisi seçiniz
                  </p>
                </div>
              )}

              {formData.role === 'admin' && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    ℹ️ Admin kullanıcılar tüm yetkilere sahiptir
                  </p>
                </div>
              )}

              <div className="flex gap-3">
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