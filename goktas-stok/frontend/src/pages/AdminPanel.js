import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { UserPlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'viewer',
    branch: ''
  });

  const branches = [
    { value: '', label: 'Şube Seçin (Yönetici için gerekli)' },
    { value: 'fabrika', label: 'Fabrika' },
    { value: 'karabaglar', label: 'Karabağlar' },
    { value: 'manisa', label: 'Manisa' },
    { value: 'edremit', label: 'Edremit' },
    { value: 'karsiyaka', label: 'Karşıyaka' }
  ];

  const roles = [
    { value: 'admin', label: 'Admin (Tüm yetkiler)' },
    { value: 'branch_manager', label: 'Şube Yöneticisi (Kendi şubesinde değişiklik yapabilir)' },
    { value: 'viewer', label: 'Görüntüleyici (Sadece görüntüleme)' }
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchProducts();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Kullanıcılar alınamadı');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Ürünler alınamadı');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        await axios.put(`/auth/users/${editingUser._id}`, formData);
        toast.success('Kullanıcı güncellendi');
      } else {
        // Create user
        await axios.post('/auth/users', formData);
        toast.success('Kullanıcı oluşturuldu');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', name: '', role: 'viewer', branch: '' });
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

  const getRoleLabel = (role) => {
    const labels = {
      admin: '👑 Admin',
      branch_manager: '📋 Şube Yöneticisi',
      viewer: '👁️ Görüntüleyici'
    };
    return labels[role] || role;
  };

  const getBranchLabel = (branch) => {
    const branches = {
      fabrika: '🏭 Fabrika',
      karabaglar: '🏘️ Karabağlar',
      manisa: '🏙️ Manisa',
      edremit: '🌊 Edremit',
      karsiyaka: '🏖️ Karşıyaka'
    };
    return branches[branch] || '-';
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-gray-600 mt-1">Kullanıcı ve sistem yönetimi</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', password: '', name: '', role: 'viewer', branch: '' });
            setShowUserModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlusIcon className="h-5 w-5" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Users Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcılar</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı Adı</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">İsim</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Şube</th>
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
                            branch: u.branch || ''
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

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
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
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-field mb-3"
                required
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              {formData.role !== 'admin' && (
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="input-field mb-4"
                  required={formData.role === 'branch_manager'}
                >
                  {branches.map(branch => (
                    <option key={branch.value} value={branch.value}>{branch.label}</option>
                  ))}
                </select>
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