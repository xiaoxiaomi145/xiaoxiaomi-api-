import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Key } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(2);
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('密码重置成功，请重新登录。');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || '重置密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform transition-transform hover:scale-105">
            <Key className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
            重置密码
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            {step === 1 ? '请输入您的邮箱以获取验证码' : '请输入验证码及新密码'}
          </p>
        </div>

        <div className="mt-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSendCode}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? '发送中...' : '发送验证码'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  验证码
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="6位数字验证码"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  新密码
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="至少 6 位字符"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? '重置中...' : '确认重置密码'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors text-sm">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
