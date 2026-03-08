import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, Save, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UserSettings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/user/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey || t('No API key generated yet'));
      }
    } catch (e) {
      console.error('Failed to fetch API key', e);
    }
  };

  const resetApiKey = async () => {
    if (!confirm(t('Are you sure? Your old API key will stop working.'))) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/reset-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.key);
        setMessage({ type: 'success', text: t('API key reset successfully') });
      } else {
        setMessage({ type: 'error', text: t('Failed to reset API key') });
      }
    } catch (e) {
      setMessage({ type: 'error', text: t('An error occurred') });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: t('Password updated successfully') });
        setOldPassword('');
        setNewPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || t('Failed to update password') });
      }
    } catch (e) {
      setMessage({ type: 'error', text: t('An error occurred') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('Settings')}</h1>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* API Key Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t('API Key')}</h2>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">
              {t('API Base URL (for third-party clients like NextChat, Chatbox, etc.)')}
            </p>
            <div className="flex space-x-4">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/v1`}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/v1`);
                  setMessage({ type: 'success', text: t('API Base URL copied to clipboard') });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium flex items-center space-x-2 transition-colors"
              >
                <span>{t('Copy')}</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">
              {t('Use this key to authenticate your API requests. Keep it secret.')}
            </p>
            <div className="flex space-x-4">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setMessage({ type: 'success', text: t('API key copied to clipboard') });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium flex items-center space-x-2 transition-colors"
              >
                <span>{t('Copy')}</span>
              </button>
              <button
                onClick={resetApiKey}
                disabled={loading}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('Reset Key')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <Save className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t('Change Password')}</h2>
        </div>
        <form onSubmit={updatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Current Password')}</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('New Password')}</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
          >
            {t('Update Password')}
          </button>
        </form>
      </div>
    </div>
  );
}
