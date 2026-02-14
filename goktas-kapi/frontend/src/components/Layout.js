import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const stations = [
    { name: 'planlama', label: 'Planlama', icon: '📋' },
    { name: 'cnc', label: 'CNC', icon: '⚙️' },
    { name: 'tutkal', label: 'Tutkal', icon: '🧴' },
    { name: 'pvc', label: 'PVC', icon: '📦' },
    { name: 'pres', label: 'Pres', icon: '🔨' },
    { name: 'kenarbant', label: 'Kenar Bant', icon: '📏' },
    { name: 'kilit', label: 'Kilit', icon: '🔒' },
    { name: 'lake', label: 'Lake', icon: '🎨' },
    { name: 'paketleme', label: 'Paketleme', icon: '📦' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Göktaş Kapı</h1>
              <span className="ml-4 text-sm text-gray-600">
                {user?.username} ({user?.role === 'istasyon' ? user?.station : user?.role})
              </span>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 overflow-x-auto py-2">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              🏠 Ana Sayfa
            </button>
            
            {stations.map((station) => (
              <button
                key={station.name}
                onClick={() => navigate(`/istasyon/${station.name}`)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md whitespace-nowrap"
              >
                {station.icon} {station.label}
              </button>
            ))}
            
            <button
              onClick={() => navigate('/stok')}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              📊 Stok
            </button>
            
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                👤 Admin
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;