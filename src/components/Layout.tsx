import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, MessageSquare, Image as ImageIcon, Settings, LogOut, Shield, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Chatbot', path: '/chat', icon: MessageSquare },
    { name: 'Image Gen', path: '/image', icon: ImageIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/xiaoxiaomiadmin', icon: Shield });
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">AI Studio</h1>
          <button onClick={toggleLanguage} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title={t('Language')}>
            <Globe className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{t(item.name)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('Logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
