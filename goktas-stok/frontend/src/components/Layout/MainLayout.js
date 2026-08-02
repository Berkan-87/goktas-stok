import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom'; // ✅ Outlet'i import et
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  HomeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const MainLayout = () => { // ✅ children prop'unu kaldır, Outlet kullan
  console.log('🔥 MainLayout render oldu!');

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Ana Sayfa', icon: HomeIcon, path: '/' },
    { name: 'Stoklar', icon: CubeIcon, path: '/stoklar' },
    { name: 'Siparişler', icon: ClipboardDocumentListIcon, path: '/uretim' },
    { name: 'Transfer', icon: ArrowsRightLeftIcon, path: '/transfer' },
    { name: 'Sohbet', icon: ChatBubbleLeftRightIcon, path: '/sohbet' },
    { name: 'Geçmiş', icon: ClockIcon, path: '/gecmis' },
  ];

  if (user?.role === 'admin' || user?.role === 'branch_manager') {
    menuItems.push({ name: 'Admin Panel', icon: UserCircleIcon, path: '/admin' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobil Menü Butonu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-600">🚪 Göktaş Stok</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">🚪 Göktaş Stok</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.name}</p>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${
                  isActive(item.path) ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <UserCircleIcon className="h-5 w-5" />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* ✅ ANA İÇERİK - Outlet ile alt route'lar render edilir */}
      <div className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 mt-16 lg:mt-0">
          <Outlet /> {/* ✅ Bu satır çok önemli! */}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;