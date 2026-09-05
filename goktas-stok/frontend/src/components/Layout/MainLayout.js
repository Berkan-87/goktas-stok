// frontend/src/components/MainLayout.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
  XMarkIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

const MainLayout = () => {
  console.log('🔥 MainLayout render oldu!');

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Ana Sayfa', icon: HomeIcon, path: '/' },
    { name: 'Stoklar', icon: CubeIcon, path: '/stoklar' },
    { name: 'Siparişler', icon: ClipboardDocumentListIcon, path: '/uretim' },
    { name: 'Talep-Transfer', icon: ArrowsRightLeftIcon, path: '/transfer' },
    { name: 'Malzeme Depo', icon: BuildingStorefrontIcon, path: '/malzeme-depo' },
    // { name: 'İletişim', icon: ChatBubbleLeftRightIcon, path: '/sohbet' }, // ✅ Badge KALDIRILDI
    { name: 'Geçmiş', icon: ClockIcon, path: '/gecmis' },
  ];

  if (user?.role === 'admin' || user?.role === 'branch_manager') {
    menuItems.push({ name: 'Admin Panel', icon: UserCircleIcon, path: '/admin' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
      
      {/* Mobil Menü Butonu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md p-4 flex justify-between items-center shrink-0">
        <h1 className="text-lg font-bold text-blue-600 flex items-center gap-2">
          <img src="/logo192.png" alt="Göktaş Stok Logo" className="h-6 w-6 object-contain" />
          GÖKTAŞ KAPI
        </h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 flex flex-col h-full`}
      >
        <div className="p-6 border-b border-gray-200 shrink-0">
          <h1 className="text-lg font-bold text-blue-600 flex items-center gap-2">
            <img src="/logo192.png" alt="Göktaş Stok Logo" className="h-6 w-6 object-contain" />
            GÖKTAŞ KAPI
          </h1>
          <p className="text-sm text-gray-500 mt-1">{user?.name}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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

        <div className="shrink-0 p-4 border-t border-gray-200">
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <UserCircleIcon className="h-5 w-5" />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <div className="h-16 lg:h-0 shrink-0"></div>
        <div className="flex-1 overflow-auto p-4 lg:p-6 w-full h-full">
          <Outlet /> 
        </div>
      </main>

      {/* Mobilde kapatma katmanı */}
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