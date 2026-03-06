import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Lock, Save } from 'lucide-react';

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        setVerified(true);
        toast.success('验证成功');
      } else {
        toast.error('密码错误');
      }
    } catch (err) {
      toast.error('验证失败');
    } finally {
      setLoading(false);
    }
  };

  if (verified) return <>{children}</>;

  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <form onSubmit={verify} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">管理员验证</h2>
        </div>
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          className="w-full px-4 py-2.5 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="请输入管理员密码"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {loading ? '验证中...' : '验证'}
        </button>
      </form>
    </div>
  );
}
