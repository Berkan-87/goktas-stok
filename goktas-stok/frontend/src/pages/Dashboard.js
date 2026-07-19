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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [productsRes, stockRes, transactionsRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/stock'),
        axios.get('/history?limit=100')
      ]);

      const stocks = stockRes.data;
      const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
      
      // ✅ Düşük stok hesabı - kritik seviye 50 olarak ayarlandı
      const CRITICAL_LEVEL = 50;
      const lowStockItems = stocks.filter(s => s.quantity <= CRITICAL_LEVEL && s.quantity > 0);
      const lowStockCount = lowStockItems.length;
      
      setStats({
        totalProducts: productsRes.data.length,
        totalStock,
        lowStock: lowStockCount,
        recentTransactions: transactionsRes.data.length
      });

      // Düşük stok listesi (en düşükten en yükseğe sıralı)
      const sortedLowItems = lowStockItems
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 10);
      setLowStockItems(sortedLowItems);

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
        branch: branchNames[branch] || branch,
        stok: total
      })));
      
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Düşük stok durumuna göre renk
  const getLowStockColor = (quantity) => {
    if (quantity <= 10) return 'text-red-600';
    if (quantity <= 25) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const statsCards = [
    { title: 'Toplam Ürün', value: stats.totalProducts, icon: CubeIcon, color: 'bg-blue-500' },
    { title: 'Toplam Stok', value: stats.totalStock, icon: CubeIcon, color: 'bg-green-500' },
    { title: 'Düşük Stok', value: stats.lowStock, icon: ExclamationTriangleIcon, color: 'bg-yellow-500' },
    { title: 'Son İşlemler', value: stats.recentTransactions, icon: ClockIcon, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pl-12 sm:pl-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Hoş geldiniz, {user?.name || 'Kullanıcı'}!
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Stok yönetim sistemine genel bakış
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="card flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-full`}>
              <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Şube Bazlı Stok Dağılımı</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="stok" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            ⚠️ Düşük Stok Uyarıları 
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Kritik: 50 adet altı)
            </span>
          </h2>
          {lowStockItems.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {lowStockItems.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {item.productId?.name || 'Bilinmeyen Ürün'}
                    </p>
                    <p className="text-xs text-gray-600">
                      🏢 {item.branch || 'Şube yok'}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs text-gray-500">Kalan Stok</p>
                    <p className={`font-bold text-base sm:text-lg ${getLowStockColor(item.quantity)}`}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-gray-400">Kritik: {item.criticalLevel || 50}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length >= 10 && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  +{stats.lowStock - 10} daha ürün düşük stokta
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-gray-500">Düşük stokta ürün bulunmuyor</p>
              <p className="text-xs text-gray-400 mt-1">Tüm ürünler kritik seviyenin üzerinde</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;