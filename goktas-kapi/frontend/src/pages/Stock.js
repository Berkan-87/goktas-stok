import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Stock = () => {
  const { user, hasPermission } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [formData, setFormData] = useState({
    modelName: '',
    quantity: 0,
    minThreshold: 10
  });
  const [quantityUpdate, setQuantityUpdate] = useState({
    stockId: null,
    quantity: 0,
    operation: 'add'
  });

  const canEdit = hasPermission('edit', 'stok');

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stocks');
      setStocks(response.data);
    } catch (error) {
      console.error('Stoklar yüklenirken hata:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStock) {
        await axios.put(`http://localhost:5000/api/stocks/${editingStock._id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/stocks', formData);
      }
      
      setShowForm(false);
      setEditingStock(null);
      setFormData({
        modelName: '',
        quantity: 0,
        minThreshold: 10
      });
      fetchStocks();
    } catch (error) {
      console.error('Stok kaydedilirken hata:', error);
    }
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      modelName: stock.modelName,
      quantity: stock.quantity,
      minThreshold: stock.minThreshold
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu stok kalemini silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:5000/api/stocks/${id}`);
        fetchStocks();
      } catch (error) {
        console.error('Stok silinirken hata:', error);
      }
    }
  };

  const handleQuantityUpdate = async () => {
    if (!quantityUpdate.stockId) return;
    
    try {
      await axios.patch(`http://localhost:5000/api/stocks/${quantityUpdate.stockId}/quantity`, {
        quantity: quantityUpdate.quantity,
        operation: quantityUpdate.operation
      });
      
      setQuantityUpdate({
        stockId: null,
        quantity: 0,
        operation: 'add'
      });
      fetchStocks();
    } catch (error) {
      console.error('Stok miktarı güncellenirken hata:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h2>
          {canEdit && (
            <button
              onClick={() => {
                setEditingStock(null);
                setFormData({
                  modelName: '',
                  quantity: 0,
                  minThreshold: 10
                });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Yeni Stok Modeli Ekle
            </button>
          )}
        </div>

        {/* Stok Formu */}
        {showForm && canEdit && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingStock ? 'Stok Düzenle' : 'Yeni Stok Modeli'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Model Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.modelName}
                    onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Başlangıç Miktarı
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Stok Seviyesi
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({...formData, minThreshold: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingStock(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingStock ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Miktar Güncelleme Modalı */}
        {quantityUpdate.stockId && canEdit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Miktarı Güncelle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    İşlem Tipi
                  </label>
                  <select
                    value={quantityUpdate.operation}
                    onChange={(e) => setQuantityUpdate({...quantityUpdate, operation: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="add">Stok Ekle</option>
                    <option value="remove">Stok Çıkar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Miktar
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantityUpdate.quantity}
                    onChange={(e) => setQuantityUpdate({...quantityUpdate, quantity: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setQuantityUpdate({ stockId: null, quantity: 0, operation: 'add' })}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleQuantityUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stok Listesi */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min. Seviye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stock) => (
                  <tr key={stock._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stock.modelName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.minThreshold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stock.quantity <= stock.minThreshold ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Kritik Seviye
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Normal
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setQuantityUpdate({ stockId: stock._id, quantity: 0, operation: 'add' })}
                          className="text-green-600 hover:text-green-900"
                        >
                          Miktar Güncelle
                        </button>
                        <button
                          onClick={() => handleEdit(stock)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(stock._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Stock;