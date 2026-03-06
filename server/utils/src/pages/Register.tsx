import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Server } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!email) return setError('请输入邮箱地址');
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('验证码已发送至您的邮箱 (如果是测试环境请查看控制台)');
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('发送验证码失败');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/login');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('发生错误，请稍后再试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform transition-transform hover:scale-105">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
            创建您的账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            加入 xiaoxiaomi的小破站，体验强大的 AI 服务
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          {msg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-sm text-center">
              {msg}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="6位数字验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="whitespace-nowrap inline-flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {sending ? '发送中...' : '获取验证码'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">设置密码</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="至少 6 位字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all hover:shadow-lg"
            >
              注 册
            </button>
          </div>
          <div className="text-sm text-center mt-6">
            <span className="text-gray-500">已有账号？</span>{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              直接登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
