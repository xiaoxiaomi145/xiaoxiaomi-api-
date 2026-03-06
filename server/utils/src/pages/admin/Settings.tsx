import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Settings as SettingsIcon, Mail, Server, Image as ImageIcon, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } });
      setSettings(await res.json());
    };
    fetchSettings();
  }, [token]);

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('保存失败');
      toast.success('设置保存成功');
    } catch (err) {
      toast.error('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600" />
          系统设置
        </h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all hover:shadow"
        >
          <Save className="w-4 h-4 mr-2" /> {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-10">
          
          {/* General Settings Section */}
          <section>
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-6">
              <Server className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-gray-900">常规设置</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">系统名称</label>
                <input 
                  type="text" 
                  value={settings.system_name || ''} 
                  onChange={e => handleChange('system_name', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                  placeholder="例如: AI API 代理平台"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  Logo URL
                </label>
                <input 
                  type="text" 
                  value={settings.logo_url || ''} 
                  onChange={e => handleChange('logo_url', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                  placeholder="https://..." 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">API Key 前缀</label>
                <input 
                  type="text" 
                  value={settings.api_key_prefix || 'sk-'} 
                  onChange={e => handleChange('api_key_prefix', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                  placeholder="例如: sk-"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-gray-400" />
                  新用户默认额度
                </label>
                <input 
                  type="number" 
                  value={settings.default_user_points || ''} 
                  onChange={e => handleChange('default_user_points', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">日志保留时间 (天)</label>
                <select 
                  value={settings.log_retention_days || '30'} 
                  onChange={e => handleChange('log_retention_days', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="7">7 天</option>
                  <option value="30">30 天</option>
                  <option value="90">90 天</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">超过 7 天的日志内容将被自动压缩或删除以节省空间。</p>
              </div>
            </div>
          </section>

          {/* SMTP Settings Section */}
          <section>
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-6">
              <Mail className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-gray-900">邮件服务 (SMTP)</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">SMTP 服务器</label>
                <input 
                  type="text" 
                  value={settings.smtp_host || ''} 
                  onChange={e => handleChange('smtp_host', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                  placeholder="smtp.example.com"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">SMTP 端口</label>
                <input 
                  type="text" 
                  value={settings.smtp_port || ''} 
                  onChange={e => handleChange('smtp_port', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                  placeholder="465 或 587"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">SMTP 用户名</label>
                <input 
                  type="text" 
                  value={settings.smtp_user || ''} 
                  onChange={e => handleChange('smtp_user', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">SMTP 密码</label>
                <input 
                  type="password" 
                  value={settings.smtp_pass || ''} 
                  onChange={e => handleChange('smtp_pass', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                />
              </div>
              
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">发件人地址</label>
                <input 
                  type="text" 
                  value={settings.smtp_from || ''} 
                  onChange={e => handleChange('smtp_from', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                  placeholder="noreply@example.com" 
                />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
