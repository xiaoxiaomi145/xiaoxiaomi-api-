import React, { useState, useEffect } from 'react';
import { Save, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { t } = useTranslation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const settingsMap: Record<string, string> = {};
        data.forEach((s: any) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ settings })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('Settings saved successfully') });
      } else {
        setMessage({ type: 'error', text: t('Failed to save settings') });
      }
    } catch (e) {
      setMessage({ type: 'error', text: t('An error occurred') });
    } finally {
      setSaving(false);
    }
  };

  const applyGmailPreset = () => {
    setSettings(prev => ({
      ...prev,
      smtp_host: 'smtp.gmail.com',
      smtp_port: '587',
      smtp_user: '',
      smtp_pass: '',
      smtp_from: ''
    }));
    setMessage({ type: 'success', text: t('Gmail preset applied. Please fill in your email and app password.') });
  };

  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-indigo-600" />
            {t('SMTP Settings (Email Verification)')}
          </h2>
          
          <div className="mb-6">
            <button
              type="button"
              onClick={applyGmailPreset}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors"
            >
              {t('Apply Gmail Preset')}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {t('Clicking this will auto-fill the host and port for Gmail. You only need to provide your Gmail address and an App Password.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('SMTP Host')}</label>
              <input
                type="text"
                value={settings.smtp_host || ''}
                onChange={(e) => handleChange('smtp_host', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('SMTP Port')}</label>
              <input
                type="text"
                value={settings.smtp_port || ''}
                onChange={(e) => handleChange('smtp_port', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('SMTP User (Email)')}</label>
              <input
                type="text"
                value={settings.smtp_user || ''}
                onChange={(e) => handleChange('smtp_user', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="your-email@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('SMTP Password')}</label>
              <input
                type="password"
                value={settings.smtp_pass || ''}
                onChange={(e) => handleChange('smtp_pass', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="App Password"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('From Address')}</label>
              <input
                type="text"
                value={settings.smtp_from || ''}
                onChange={(e) => handleChange('smtp_from', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="AI Studio <noreply@example.com>"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('System Settings')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Default User Points')}</label>
              <input
                type="number"
                value={settings.default_user_points || '0'}
                onChange={(e) => handleChange('default_user_points', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('Points given to newly registered users.')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Daily Reset Points')}</label>
              <input
                type="number"
                value={settings.daily_reset_points || '0'}
                onChange={(e) => handleChange('daily_reset_points', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('If > 0, users with fewer points will be topped up to this amount daily.')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? t('Saving...') : t('Save Settings')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
