// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import { 
  CubeIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  exportToExcel, 
  exportToPDF, 
  prepareModelOutgoingData, 
  prepareBranchStockData, 
  prepareLowStockData 
} from '../utils/exportUtils';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    totalOutgoing: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [modelOutgoingData, setModelOutgoingData] = useState([]);
  const [branchStockData, setBranchStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [selectedBranch, setSelectedBranch] = useState('fabrika');

  const branches = [
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  const dateRangeOptions = [
    { value: 'month', label: '1 Aylık' },
    { value: '3months', label: '3 Aylık' },
    { value: '6months', label: '6 Aylık' },
    { value: 'year', label: 'Yıllık' }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedBranch]);

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch(dateRange) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    return startDate.toISOString();
  };

  // ✅ Excel Export
  const handleExportExcel = () => {
    if (modelOutgoingData.length === 0) {
      toast.error('Export yapılacak veri bulunamadı!');
      return;
    }
    const data = prepareModelOutgoingData(modelOutgoingData);
    const success = exportToExcel(data, `ModelBazliCikisRaporu_${new Date().toISOString().split('T')[0]}`);
    if (success) {
      toast.success('Excel raporu başarıyla indirildi! 📊');
    } else {
      toast.error('Excel export başarısız!');
    }
  };

  // ✅ PDF Export
  const handleExportPDF = () => {
    if (modelOutgoingData.length === 0) {
      toast.error('Export yapılacak veri bulunamadı!');
      return;
    }
    const data = prepareModelOutgoingData(modelOutgoingData);
    const columns = [
      { key: 'Model', label: 'Model' },
      { key: 'Çıkış (Adet)', label: 'Çıkış' },
      { key: 'Kalan Stok (Adet)', label: 'Kalan Stok' },
      { key: 'Durum', label: 'Durum' }
    ];
    const title = `Model Bazlı Çıkış Raporu (${branches.find(b => b.value === selectedBranch)?.label} - ${dateRangeOptions.find(d => d.value === dateRange)?.label})`;
    const success = exportToPDF(data, `ModelBazliCikisRaporu_${new Date().toISOString().split('T')[0]}`, title, columns);
    if (success) {
      toast.success('PDF raporu başarıyla indirildi! 📄');
    } else {
      toast.error('PDF export başarısız!');
    }
  };

  // ✅ Tüm Raporları İndir
  const handleExportAll = () => {
    if (modelOutgoingData.length === 0 && branchStockData.length === 0 && lowStockItems.length === 0) {
      toast.error('Export yapılacak veri bulunamadı!');
      return;
    }
    
    let exportCount = 0;
    
    if (modelOutgoingData.length > 0) {
      const modelData = prepareModelOutgoingData(modelOutgoingData);
      exportToExcel(modelData, `ModelBazliCikis_${new Date().toISOString().split('T')[0]}`);
      exportCount++;
    }
    
    if (branchStockData.length > 0) {
      const branchData = prepareBranchStockData(branchStockData);
      exportToExcel(branchData, `SubeBazliStok_${new Date().toISOString().split('T')[0]}`);
      exportCount++;
    }
    
    if (lowStockItems.length > 0) {
      const lowStockData = prepareLowStockData(lowStockItems);
      exportToExcel(lowStockData, `DusukStokUyarilari_${new Date().toISOString().split('T')[0]}`);
      exportCount++;
    }
    
    toast.success(`${exportCount} rapor Excel olarak indirildi! 📦`);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = getDateRangeFilter();
      
      // ✅ SADECE products ve stock çağır - history'yi KALDIR
      const [productsRes, stockRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/stock')
      ]);

      const stocks = stockRes.data;
      
      // ✅ Sadece kanat ürünleri
      const kanatProducts = productsRes.data.filter(p => p.category === 'kanat');
      const kanatProductIds = new Set(kanatProducts.map(p => p._id));
      
      // ✅ Seçili şube stoku
      const branchKanatStocks = stocks.filter(s => 
        s.branch === selectedBranch && 
        kanatProductIds.has(s.productId?._id)
      );
      const totalStock = branchKanatStocks.reduce((sum, s) => sum + s.quantity, 0);
      
      // ✅ Düşük stok
      const CRITICAL_LEVEL = 50;
      const allLowStock = stocks.filter(s => 
        s.quantity <= CRITICAL_LEVEL && 
        s.quantity > 0 &&
        kanatProductIds.has(s.productId?._id)
      );
      const branchLowStock = allLowStock.filter(s => s.branch === selectedBranch);
      
      // ✅ Model bazlı stok
      const modelStockData = {};
      branchKanatStocks.forEach(s => {
        const productName = s.productId?.name || 'Bilinmeyen';
        const cleanName = productName.replace(/\s*(87|77|Camlı|Camli|Cam)\s*$/i, '').trim();
        
        if (!modelStockData[cleanName]) {
          modelStockData[cleanName] = 0;
        }
        modelStockData[cleanName] += s.quantity;
      });

      setStats({
        totalProducts: kanatProducts.length,
        totalStock,
        lowStock: branchLowStock.length,
        totalOutgoing: 0 // Geçici olarak 0
      });

      // ✅ Düşük stok listesi
      const sortedLowItems = branchLowStock
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 10);
      setLowStockItems(sortedLowItems);

      // ✅ Model bazlı veri
      const sortedModelData = Object.entries(modelStockData)
        .map(([model, quantity]) => ({
          model,
          quantity: 0, // Çıkış yok
          currentStock: quantity,
          status: quantity > 200 ? 'Yüksek' : quantity > 100 ? 'Orta' : 'Düşük',
          statusColor: quantity > 200 ? 'bg-green-100 text-green-700' : 
                       quantity > 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700',
          statusDot: quantity > 200 ? '🟢' : quantity > 100 ? '🟡' : '🔴'
        }))
        .sort((a, b) => b.currentStock - a.currentStock);

      setModelOutgoingData(sortedModelData);

      // ✅ Şube bazlı stok
      const branchStats = {};
      let totalAllStock = 0;
      
      stocks.forEach(stock => {
        if (!branchStats[stock.branch]) {
          branchStats[stock.branch] = 0;
        }
        branchStats[stock.branch] += stock.quantity;
        totalAllStock += stock.quantity;
      });

      const branchNames = {
        fabrika: 'Fabrika',
        karabaglar: 'Karabağlar',
        manisa: 'Manisa',
        edremit: 'Edremit',
        karsiyaka: 'Karşıyaka'
      };

      const branchIcons = {
        fabrika: '🏭',
        karabaglar: '🏘️',
        manisa: '🏙️',
        edremit: '🌊',
        karsiyaka: '🏖️'
      };

      const branchColors = {
        fabrika: '#3b82f6',
        karabaglar: '#10b981',
        manisa: '#f59e0b',
        edremit: '#ef4444',
        karsiyaka: '#8b5cf6'
      };

      const branchData = Object.entries(branchStats)
        .map(([branch, total]) => ({
          branch: branchNames[branch] || branch,
          branchKey: branch,
          icon: branchIcons[branch] || '🏢',
          color: branchColors[branch] || '#6b7280',
          stok: total,
          percentage: totalAllStock > 0 ? Math.round((total / totalAllStock) * 100) : 0
        }))
        .sort((a, b) => b.stok - a.stok);

      setBranchStockData(branchData);
      setChartData(branchData.map(item => ({
        name: item.branch,
        value: item.stok,
        percentage: item.percentage,
        icon: item.icon
      })));
      
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
      
      // ✅ Daha açıklayıcı hata mesajı
      if (error.response?.status === 404) {
        toast.error('Bazı veriler alınamadı (API endpointi bulunamadı)');
      } else {
        toast.error('Dashboard verileri alınamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  const getLowStockColor = (quantity) => {
    if (quantity <= 10) return 'text-red-600 bg-red-50';
    if (quantity <= 25) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getStockBarWidth = (quantity) => {
    const max = 50;
    const percentage = (quantity / max) * 100;
    return Math.min(percentage, 100);
  };

  const statsCards = [
    { 
      title: 'Toplam Kanat Modeli', 
      value: stats.totalProducts, 
      icon: CubeIcon, 
      color: 'bg-blue-500',
      subtitle: 'Aktif kanat modeli'
    },
    { 
      title: 'Kanat Stoku', 
      value: stats.totalStock, 
      icon: BuildingOfficeIcon, 
      color: 'bg-green-500',
      subtitle: branches.find(b => b.value === selectedBranch)?.label || 'Fabrika'
    },
    { 
      title: 'Düşük Stok Uyarısı', 
      value: stats.lowStock, 
      icon: ExclamationTriangleIcon, 
      color: 'bg-yellow-500',
      subtitle: 'Kritik: 50 adet altı'
    },
    { 
      title: 'Toplam Çıkış', 
      value: stats.totalOutgoing, 
      icon: ArrowUpIcon, 
      color: 'bg-purple-500',
      subtitle: `${dateRangeOptions.find(d => d.value === dateRange)?.label} • ${branches.find(b => b.value === selectedBranch)?.label}`
    },
  ];

  const topModels = modelOutgoingData.slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Filtreler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            📊 Hoş geldiniz, {user?.name || 'Kullanıcı'}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Kanat stok durumu ve raporları
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleExportExcel}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Excel olarak indir"
              disabled={modelOutgoingData.length === 0}
            >
              <TableCellsIcon className="h-4 w-4 text-green-600" />
              <span className="hidden xs:inline text-gray-700">Excel</span>
            </button>
            
            <button
              onClick={handleExportPDF}
              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="PDF olarak indir"
              disabled={modelOutgoingData.length === 0}
            >
              <DocumentArrowDownIcon className="h-4 w-4 text-red-600" />
              <span className="hidden xs:inline text-gray-700">PDF</span>
            </button>
            
            <button
              onClick={handleExportAll}
              className="btn-primary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Tüm raporları indir"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Tümünü İndir</span>
              <span className="sm:hidden">Tümü</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="input-field text-sm w-full sm:w-44"
            >
              {branches.map(branch => (
                <option key={branch.value} value={branch.value}>{branch.label}</option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field text-sm w-full sm:w-40"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button
              onClick={fetchDashboardData}
              className="btn-primary flex items-center justify-center gap-2 text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden xs:inline">Yenile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs sm:text-sm truncate">{stat.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5">{stat.subtitle}</p>
                )}
              </div>
              <div className={`${stat.color} p-2 sm:p-2.5 rounded-lg flex-shrink-0 ml-2`}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Model Bazlı Stok Raporu */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-500" />
              Model Bazlı Stok Durumu
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{dateRangeOptions.find(d => d.value === dateRange)?.label}</span>
              <span>•</span>
              <span>{branches.find(b => b.value === selectedBranch)?.label}</span>
            </div>
          </div>
          
          {modelOutgoingData.length > 0 ? (
            <>
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topModels} layout="vertical" margin={{ left: 0, right: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="model" 
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} adet`, 'Mevcut Stok']}
                      labelFormatter={(label) => `Model: ${label}`}
                    />
                    <Bar dataKey="currentStock" radius={[0, 4, 4, 0]}>
                      {topModels.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.currentStock > 200 ? '#10b981' : entry.currentStock > 100 ? '#f59e0b' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 rounded-lg">
                    <tr>
                      <th className="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Model</th>
                      <th className="text-right py-2 px-2 sm:px-3 font-medium text-gray-600">Mevcut Stok</th>
                      <th className="text-center py-2 px-2 sm:px-3 font-medium text-gray-600">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelOutgoingData.slice(0, 8).map((item, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-2 sm:px-3 font-medium text-gray-800 truncate max-w-[80px] sm:max-w-none">
                          {item.model}
                        </td>
                        <td className={`py-2 px-2 sm:px-3 text-right font-bold ${item.currentStock < 30 ? 'text-red-600' : item.currentStock < 50 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {item.currentStock} adet
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.statusColor}`}>
                            {item.statusDot} {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {modelOutgoingData.length > 8 && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    +{modelOutgoingData.length - 8} daha model
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500">Henüz stok verisi bulunmuyor</p>
              <p className="text-xs text-gray-400 mt-1">
                Ürün ekleyerek stok verisi oluşturabilirsiniz
              </p>
            </div>
          )}
        </div>

        {/* Düşük Stok Uyarıları */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            Düşük Stok Uyarıları
            <span className="ml-auto text-xs font-normal text-gray-400">
              (Kritik: 50 altı)
            </span>
          </h2>
          
          {lowStockItems.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {lowStockItems.map((item, index) => {
                const productName = item.productId?.name || 'Bilinmeyen';
                const cleanName = productName.replace(/\s*(87|77|Camlı|Camli|Cam)\s*$/i, '').trim();
                const stockBarWidth = getStockBarWidth(item.quantity);
                
                return (
                  <div 
                    key={index} 
                    className="p-3 rounded-lg border hover:shadow-md transition-all bg-yellow-50 border-yellow-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {cleanName}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          🏢 {branches.find(b => b.value === item.branch)?.label || item.branch}
                        </p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <p className={`text-sm font-bold ${getLowStockColor(item.quantity)}`}>
                          {item.quantity} adet
                        </p>
                        <p className="text-[10px] text-gray-400">Kalan</p>
                      </div>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          item.quantity <= 10 ? 'bg-red-500' : 
                          item.quantity <= 25 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${stockBarWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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

      {/* Şube Bazlı Stok Dağılımı */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
          Şube Bazlı Stok Dağılımı
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}
                  outerRadius={70}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} adet`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {branchStockData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 text-center text-lg">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 truncate">{item.branch}</span>
                    <span className="text-sm font-bold text-gray-900">{item.stok} adet</span>
                  </div>
                  <div className="mt-1 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">%{item.percentage}</p>
                </div>
              </div>
            ))}
            
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Toplam Stok</span>
              <span className="text-lg font-bold text-gray-900">
                {branchStockData.reduce((sum, item) => sum + item.stok, 0)} adet
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;