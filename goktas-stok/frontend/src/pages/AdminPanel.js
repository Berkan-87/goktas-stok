import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  // Ürün formu
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    description: '',
    category: 'kanat'
  });
  
  // Düzenleme
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    description: '',
    category: 'kanat'
  });

  // Admin kontrolü
  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">⛔ Yetkisiz Erişim</h1>
        <p className="text-gray-600 mt-2">Bu sayfaya erişim izniniz yok.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Ürünler alınamadı:', error);
      toast.error('Ürünler alınamadı');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Kullanıcılar alınamadı:', error);
    }
  };

  // ✅ Ürün Ekle
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/products', newProduct);
      toast.success(`${newProduct.name} başarıyla eklendi`);
      setNewProduct({ code: '', name: '', description: '', category: 'kanat' });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ürün eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ürün Sil
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

  // ✅ Ürün Düzenle
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">⚙️ Admin Panel</h1>

      {/* ✅ Sekmeler */}
      <div className="flex gap-2 border-b border-gray-200">
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
      </div>

      {/* ✅ Ürün Yönetimi Sekmesi */}
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
                disabled={loading}
              >
                {loading ? 'Ekleniyor...' : 'Ürün Ekle'}
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
                                className="input-field text-sm py-1 w-32"
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
            </div>
          </div>
        </>
      )}

      {/* ✅ Kullanıcı Yönetimi Sekmesi */}
      {activeTab === 'users' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 Kullanıcılar</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Kullanıcı</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Ad</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Rol</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Şube</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-sm font-mono">{user.username}</td>
                    <td className="py-2 px-3 text-sm">{user.name}</td>
                    <td className="py-2 px-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'branch_manager' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'production_manager' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm">{user.branch || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;