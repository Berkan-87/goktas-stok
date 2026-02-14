import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Station = () => {
  const { stationName } = useParams();
  const { user, hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const canEdit = hasPermission('edit', stationName);

  const stationLabels = {
    planlama: 'Planlama',
    cnc: 'CNC',
    tutkal: 'Tutkal',
    pvc: 'PVC',
    pres: 'Pres',
    kenarbant: 'Kenar Bant',
    kilit: 'Kilit',
    lake: 'Lake',
    paketleme: 'Paketleme'
  };

  const nextStations = {
    planlama: 'cnc',
    cnc: 'tutkal',
    tutkal: 'pvc',
    pvc: 'pres',
    pres: 'kenarbant',
    kenarbant: 'kilit',
    kilit: 'lake',
    lake: 'paketleme',
    paketleme: 'tamamlandi'
  };

  useEffect(() => {
    fetchOrders();
  }, [stationName]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders');
      setOrders(response.data.filter(o => o.currentStation === stationName));
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (order) => {
    try {
      const nextStation = nextStations[stationName];
      await axios.patch(`http://localhost:5000/api/orders/${order._id}/status`, {
        status: nextStation === 'tamamlandi' ? 'tamamlandi' : nextStation,
        station: nextStation === 'tamamlandi' ? stationName : nextStation
      });
      fetchOrders();
    } catch (error) {
      console.error('Sipariş tamamlanırken hata:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {stationLabels[stationName]} İstasyonu
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Bu istasyonda bekleyen sipariş yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {order.orderCode}
                    </h3>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {order.quantity} Adet
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Model:</span>{' '}
                    <span className="text-gray-600">{order.model}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Renk:</span>{' '}
                    <span className="text-gray-600">{order.color}</span>
                  </p>
                </div>

                {canEdit && stationName !== 'paketleme' && (
                  <button
                    onClick={() => handleComplete(order)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Tamamla ve {stationLabels[nextStations[stationName]]}'ye Gönder
                  </button>
                )}

                {canEdit && stationName === 'paketleme' && (
                  <button
                    onClick={() => handleComplete(order)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Üretimi Tamamla
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Station;