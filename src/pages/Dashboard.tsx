import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Coins, Key, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/user/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('Welcome back', { email: user?.email })}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('Available Points')}</h3>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Coins className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{user?.points?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('Total Requests')}</h3>
            <div className="p-2 bg-green-50 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalRequests || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('Tokens Used')}</h3>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalTokens || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('API Keys')}</h3>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.apiKeysCount || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t('Recent Activity')}</h2>
        </div>
        <div className="p-6">
          {stats?.recentLogs?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{log.model_name}</p>
                    <p className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">-{log.points_deducted.toFixed(4)} pts</p>
                    <p className="text-sm text-gray-500">{log.prompt_tokens + log.completion_tokens} tokens</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">{t('No recent activity')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
