// frontend/src/pages/History.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import {
  ClockIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const History = () => {
  const { user } = useSelector((state) => state.auth);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, in, out, transfer
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  const branches = [
    { value: 'all', label: 'Tüm Şubeler' },
    { value: 'fabrika', label: '🏭 Fabrika' },
    { value: 'karabaglar', label: '🏘️ Karabağlar' },
    { value: 'manisa', label: '🏙️ Manisa' },
    { value: 'edremit', label: '🌊 Edremit' },
    { value: 'karsiyaka', label: '🏖️ Karşıyaka' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Bugün' },
    { value: '7days', label: '7 Gün' },
    { value: '30days', label: '30 Gün' },
    { value: '90days', label: '3 Ay' },
    { value: 'all', label: 'Tümü' }
  ];

  useEffect(() => {
    fetchHistory();
  }, [filter, selectedBranch, dateRange]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);
      if (selectedBranch !== 'all') params.append('branch', selectedBranch);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      
      const response = await axios.get(`/history?${params.toString()}`);
      setHistory(response.data);
    } catch (error) {
      console.error('❌ Geçmiş verileri alınamadı:', error);
      toast.error('Geçmiş verileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Excel Export
  const handleExportExcel = () => {
    if (history.length === 0) {
      toast.error('Export yapılacak veri bulunamadı!');
      return;
    }

    const exportData = history.map(item => ({
      'Tarih': new Date(item.createdAt).toLocaleString('tr-TR'),
      'İşlem': item.type === 'in' ? 'Giriş' : item.type === 'out' ? 'Çıkış' : 'Transfer',
      'Ürün': item.productId?.name || '-',
      'Şube': branches.find(b => b.value === item.branch)?.label || item.branch,
      'Miktar': item.quantity,
      'Not': item.note || '-'
    }));

    const success = exportToExcel(exportData, `Gecmis_${new Date().toISOString().split('T')[0]}`);
    if (success) {
      toast.success('📊 Geçmiş Excel olarak indirildi!');
    } else {
      toast.error('Excel export başarısız!');
    }
  };

  // ✅ PDF Export
  const handleExportPDF = () => {
    if (history.length === 0) {
      toast.error('Export yapılacak veri bulunamadı!');
      return;
    }

    const exportData = history.map(item => ({
      'Tarih': new Date(item.createdAt).toLocaleString('tr-TR'),
      'İşlem': item.type === 'in' ? 'Giriş' : item.type === 'out' ? 'Çıkış' : 'Transfer',
      'Ürün': item.productId?.name || '-',
      'Şube': branches.find(b => b.value === item.branch)?.label || item.branch,
      'Miktar': item.quantity,
      'Not': item.note || '-'
    }));

    const columns = [
      { key: 'Tarih', label: 'Tarih' },
      { key: 'İşlem', label: 'İşlem' },
      { key: 'Ürün', label: 'Ürün' },
      { key: 'Şube', label: 'Şube' },
      { key: 'Miktar', label: 'Miktar' },
      { key: 'Not', label: 'Not' }
    ];

    const success = exportToPDF(exportData, `Gecmis_${new Date().toISOString().split('T')[0]}`, 'Geçmiş Raporu', columns);
    if (success) {
      toast.success('📄 Geçmiş PDF olarak indirildi!');
    } else {
      toast.error('PDF export başarısız!');
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'in') return <ArrowDownIcon className="h-4 w-4 text-green-500" />;
    if (type === 'out') return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
    return <ArrowRightIcon className="h-4 w-4 text-yellow-500" />;
  };

  const getTypeLabel = (type) => {
    if (type === 'in') return '📥 Giriş';
    if (type === 'out') return '📤 Çıkış';
    return '🔄 Transfer';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Geçmiş yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🕐 Geçmiş</h1>
          <p className="text-gray-600 mt-1">Tüm stok hareketleri</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="btn-secondary flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <TableCellsIcon className="h-4 w-4 text-green-600" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="btn-secondary flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 text-red-600" />
            PDF
          </button>
          <button
            onClick={fetchHistory}
            className="btn-secondary flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Yenile
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">İşlem:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field text-sm py-1 w-32"
          >
            <option value="all">Tümü</option>
            <option value="in">📥 Giriş</option>
            <option value="out">📤 Çıkış</option>
            <option value="transfer">🔄 Transfer</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Şube:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="input-field text-sm py-1 w-40"
          >
            {branches.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Tarih:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field text-sm py-1 w-32"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-400 ml-auto">
          Toplam: {history.length} kayıt
        </div>
      </div>

      {/* Geçmiş Listesi */}
      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-lg text-gray-500">Henüz geçmiş kaydı yok</p>
          <p className="text-sm text-gray-400 mt-1">Stok işlemleri yaptıkça burada görünecek</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şube</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miktar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Not</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.productId?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {branches.find(b => b.value === item.branch)?.label || item.branch}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.type === 'in' ? 'text-green-600' : item.type === 'out' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {item.type === 'in' ? '+' : item.type === 'out' ? '-' : ''}{item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {item.note || '-'}
                    </td>
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

export default History;