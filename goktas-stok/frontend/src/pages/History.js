import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { DocumentArrowDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

const History = () => {
  const { user } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  const branches = [
    { value: '', label: 'Tüm Şubeler' },
    { value: 'fabrika', label: 'Fabrika' },
    { value: 'karabaglar', label: 'Karabağlar' },
    { value: 'manisa', label: 'Manisa' },
    { value: 'edremit', label: 'Edremit' },
    { value: 'karsiyaka', label: 'Karşıyaka' }
  ];

  const types = [
    { value: '', label: 'Tüm İşlemler' },
    { value: 'in', label: 'Stok Girişi' },
    { value: 'out', label: 'Stok Çıkışı' },
    { value: 'transfer', label: 'Transfer' }
  ];

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.branch) params.branch = filters.branch;
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await axios.get('/history', { params });
      setTransactions(response.data);
    } catch (error) {
      toast.error('Geçmiş verileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      in: { text: 'Stok Girişi', color: 'text-green-600 bg-green-100' },
      out: { text: 'Stok Çıkışı', color: 'text-red-600 bg-red-100' },
      transfer: { text: 'Transfer', color: 'text-blue-600 bg-blue-100' }
    };
    return labels[type] || { text: type, color: 'text-gray-600 bg-gray-100' };
  };

  const getBranchInfo = (transaction) => {
    if (transaction.type === 'transfer') {
      return `${transaction.fromBranch} → ${transaction.toBranch}`;
    } else if (transaction.type === 'in') {
      return `Giriş: ${transaction.toBranch}`;
    } else {
      return `Çıkış: ${transaction.fromBranch}`;
    }
  };

  const exportToCSV = () => {
    const headers = ['Tarih', 'İşlem Tipi', 'Ürün', 'Miktar', 'Şube Bilgisi', 'Not', 'Kullanıcı'];
    const data = transactions.map(t => [
      format(new Date(t.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr }),
      getTypeLabel(t.type).text,
      t.productId?.name || '-',
      t.quantity,
      getBranchInfo(t),
      t.note || '-',
      t.user?.name || '-'
    ]);

    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stok_gecmisi_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İşlem Geçmişi</h1>
          <p className="text-gray-600 mt-1">Tüm stok hareketlerini görüntüleyin</p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Excel'e Aktar
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filtreler</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            className="input-field"
          >
            {branches.map(branch => (
              <option key={branch.value} value={branch.value}>{branch.label}</option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="input-field"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="input-field"
            placeholder="Başlangıç Tarihi"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="input-field"
            placeholder="Bitiş Tarihi"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Yükleniyor...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz işlem kaydı bulunmuyor</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tarih</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlem Tipi</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ürün</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Miktar</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Şube Bilgisi</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Not</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const typeInfo = getTypeLabel(transaction.type);
                return (
                  <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {format(new Date(transaction.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.text}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.productId?.name}</p>
                        <p className="text-xs text-gray-500">{transaction.productId?.code}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{transaction.quantity} adet</td>
                    <td className="py-3 px-4 text-sm">{getBranchInfo(transaction)}</td>
                    <td className="py-3 px-4 text-sm">{transaction.user?.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{transaction.note || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default History;