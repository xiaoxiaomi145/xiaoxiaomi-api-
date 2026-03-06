import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Lock, User as UserIcon, Save } from 'lucide-react';

export default function UserSettings() {
  const { token } = useAuth();
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新密码不一致');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword })
      });
      if (!res.ok) throw new Error('修改失败');
      toast.success('密码修改成功');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error('修改密码失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl font-sans">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <UserIcon className="w-6 h-6 text-indigo-600" />
        个人设置
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-6">
          <Lock className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-gray-900">修改密码</h3>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">旧密码</label>
            <input 
              type="password" 
              value={passwordData.oldPassword}
              onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">新密码</label>
            <input 
              type="password" 
              value={passwordData.newPassword}
              onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">确认新密码</label>
            <input 
              type="password" 
              value={passwordData.confirmPassword}
              onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all hover:shadow"
          >
            <Save className="w-4 h-4 mr-2" /> {saving ? '保存中...' : '修改密码'}
          </button>
        </form>
      </div>
    </div>
  );
}
