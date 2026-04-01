import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
  HomeIcon, 
  CubeIcon, 
  ArrowsRightLeftIcon, 
  ClockIcon, 
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Stok Listesi', href: '/stoklar', icon: CubeIcon },
  { name: 'Transfer', href: '/transfer', icon: ArrowsRightLeftIcon },
  { name: 'Geçmiş', href: '/gecmis', icon: ClockIcon },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const branches = {
    fabrika: '🏭 Fabrika',
    karabaglar: '🏘️ Karabağlar',
    manisa: '🏙️ Manisa',
    edremit: '🌊 Edremit',
    karsiyaka: '🏖️ Karşıyaka'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobil sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-xl font-bold text-primary-600">Göktaş Stok</h1>
            {user?.branch && (
              <p className="text-xs text-gray-500 mt-1">{branches[user.branch]}</p>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <nav className="mt-6 px-4">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.href);
                setSidebarOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mb-1"
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          ))}

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                navigate('/admin');
                setSidebarOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mb-1"
            >
              <UserGroupIcon className="h-5 w-5 mr-3" />
              Admin Panel
            </button>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.username}</p>
              <p className="text-xs text-gray-400 mt-1">
                {user?.role === 'admin' ? '👑 Admin' : 
                 user?.role === 'branch_manager' ? '📋 Şube Yöneticisi' : '👁️ Görüntüleyici'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;