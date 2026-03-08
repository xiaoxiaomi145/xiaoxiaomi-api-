import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, Database, FileText, Settings, Server, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Import admin pages (lazy loaded in a real app, but we'll use simple components here for now)
import UsersPage from './admin/Users';
import ModelsPage from './admin/Models';
import LogsPage from './admin/Logs';
import SettingsPage from './admin/Settings';
import SystemPage from './admin/System';

export default function AdminDashboard() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const tabs = [
    { name: t('Users'), path: '/xiaoxiaomiadmin', icon: Users },
    { name: t('Models'), path: '/xiaoxiaomiadmin/models', icon: Database },
    { name: t('Logs'), path: '/xiaoxiaomiadmin/logs', icon: FileText },
    { name: t('Settings'), path: '/xiaoxiaomiadmin/settings', icon: Settings },
    { name: t('System'), path: '/xiaoxiaomiadmin/system', icon: Server },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('Admin Dashboard')}</h1>
        <button onClick={toggleLanguage} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg flex items-center space-x-2 bg-white shadow-sm border border-gray-200">
          <Globe className="w-5 h-5" />
          <span className="text-sm font-medium">{i18n.language.startsWith('zh') ? 'English' : '中文'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path || (tab.path !== '/xiaoxiaomiadmin' && location.pathname.startsWith(tab.path));
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <Routes>
            <Route index element={<UsersPage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="system" element={<SystemPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
