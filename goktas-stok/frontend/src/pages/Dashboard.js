import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../utils/axios';
import { 
  CubeIcon, 
  ArrowsRightLeftIcon, 
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    recentTransactions: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, stockRes, transactionsRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/stock'),
        axios.get('/history?limit=100')
      ]);

      const stocks = stockRes.data;
      const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
      const lowStock = stocks.filter(s => s.quantity <= s.criticalLevel && s.quantity > 0).length;
      
      setStats({
        totalProducts: productsRes.data.length,
        totalStock,
        lowStock,
        recentTransactions: transactionsRes.data.length
      });

      // Düşük stoklar
      const lowItems = stocks
        .filter(s => s.quantity <= s.criticalLevel && s.quantity > 0)
        .slice(0, 5);
      setLowStockItems(lowItems);

      // Şube bazlı stok grafiği
      const branchStats = {};
      stocks.forEach(stock => {
        if (!branchStats[stock.branch]) {
          branchStats[stock.branch] = 0;
        }
        branchStats[stock.branch] += stock.quantity;
      });

      const branchNames = {
        fabrika: 'Fabrika',
        karabaglar: 'Karabağlar',
        manisa: 'Manisa',
        edremit: 'Edremit',
        karsiyaka: 'Karşıyaka'
      };

      setChartData(Object.entries(branchStats).map(([branch, total]) => ({
        branch: branchNames[branch],
        stok: total
      })));
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
    }
  };

  const statsCards = [
    { title: 'Toplam Ürün', value: stats.totalProducts, icon: CubeIcon, color: 'bg-blue-500' },
    { title: 'Toplam Stok', value: stats.totalStock, icon: CubeIcon, color: 'bg-green-500' },
    { title: 'Düşük Stok', value: stats.lowStock, icon: ExclamationTriangleIcon, color: 'bg-yellow-500' },
    { title: 'Son İşlemler', value: stats.recentTransactions, icon: ClockIcon, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hoş Geldiniz, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Stok yönetim sistemine genel bakış</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="card flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-full`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Şube Bazlı Stok Dağılımı</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stok" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Düşük Stok Uyarıları</h2>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900">{item.productId?.name}</p>
                    <p className="text-sm text-gray-600">Şube: {item.branch}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Mevcut Stok</p>
                    <p className="font-bold text-yellow-600">{item.quantity} {item.unit || 'adet'}</p>
                    <p className="text-xs text-gray-400">Kritik: {item.criticalLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Düşük stokta ürün bulunmuyor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;