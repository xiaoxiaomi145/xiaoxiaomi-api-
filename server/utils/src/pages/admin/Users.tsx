import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users as UsersIcon, Settings, Shield, Edit3, ShieldOff, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function Users() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [editLimits, setEditLimits] = useState({ points: '', daily_token_limit: '', daily_request_limit: '' });
  const [modalType, setModalType] = useState<'limits' | 'models' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  const fetchData = async () => {
    const [usersRes, modelsRes] = await Promise.all([
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/models', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setUsers(await usersRes.json());
    setModels(await modelsRes.json());
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === 'all' || u.role === roleFilter)
    );
  }, [users, searchTerm, roleFilter]);

  const handleToggleActive = async (id: string, current: number) => {
    await fetch(`/api/admin/users/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: current === 1 ? 0 : 1 })
    });
    toast.success(`用户状态已更新`);
    fetchData();
  };

  const handleSaveLimits = async () => {
    if (!selectedUser) return;
    await fetch(`/api/admin/users/${selectedUser.id}/limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ 
        points: parseFloat(editLimits.points),
        daily_token_limit: parseInt(editLimits.daily_token_limit) || 0,
        daily_request_limit: parseInt(editLimits.daily_request_limit) || 0
      })
    });
    toast.success('用户限制已更新');
    setSelectedUser(null);
    setModalType(null);
    fetchData();
  };

  const openModelsModal = async (user: any) => {
    setSelectedUser(user);
    setModalType('models');
    const res = await fetch(`/api/admin/user-models/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
    setUserModels(await res.json());
  };

  const handleSaveModels = async () => {
    if (!selectedUser) return;
    await fetch(`/api/admin/user-models/${selectedUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ modelIds: userModels })
    });
    toast.success('用户模型权限已更新');
    setSelectedUser(null);
    setModalType(null);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-indigo-600" />
          用户管理
        </h1>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">所有角色</option>
            <option value="admin">管理员</option>
            <option value="user">普通用户</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">邮箱</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">额度</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">每日限制 (Token/请求)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{u.points.toFixed(4)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {u.daily_token_limit || '无限制'} / {u.daily_request_limit || '无限制'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {u.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {u.is_active ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                    <button 
                      onClick={() => { 
                        setSelectedUser(u); 
                        setModalType('limits');
                        setEditLimits({ 
                          points: u.points.toString(), 
                          daily_token_limit: u.daily_token_limit?.toString() || '0',
                          daily_request_limit: u.daily_request_limit?.toString() || '0'
                        }); 
                      }} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      设置
                    </button>
                    <button 
                      onClick={() => openModelsModal(u)} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      模型
                    </button>
                    <button 
                      onClick={() => handleToggleActive(u.id, u.is_active)} 
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${u.is_active ? 'text-red-600 hover:text-red-900 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50'}`}
                    >
                      {u.is_active ? <ShieldOff className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      {u.is_active ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Modals */}
      {selectedUser && modalType === 'limits' && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              编辑用户设置
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">账户额度</label>
                <input 
                  type="number" 
                  value={editLimits.points} 
                  onChange={e => setEditLimits({...editLimits, points: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">每日 Token 限制 <span className="text-gray-400 font-normal">(0 = 无限制)</span></label>
                <input 
                  type="number" 
                  value={editLimits.daily_token_limit} 
                  onChange={e => setEditLimits({...editLimits, daily_token_limit: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">每日请求限制 <span className="text-gray-400 font-normal">(0 = 无限制)</span></label>
                <input 
                  type="number" 
                  value={editLimits.daily_request_limit} 
                  onChange={e => setEditLimits({...editLimits, daily_request_limit: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => {setSelectedUser(null); setModalType(null); setEditLimits({points:'', daily_token_limit:'', daily_request_limit:''});}} 
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveLimits} 
                className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:shadow"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && modalType === 'models' && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] flex flex-col shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              分配可用模型
            </h3>
            <p className="text-sm text-gray-500 mb-6">为 {selectedUser.email} 选择可访问的模型</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
              {models.map(m => (
                <label key={m.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-100 transition-all">
                  <input
                    type="checkbox"
                    checked={userModels.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) setUserModels([...userModels, m.id]);
                      else setUserModels(userModels.filter(id => id !== m.id));
                    }}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition-colors"
                  />
                  <span className="text-sm font-medium text-gray-700">{m.name} ({m.model_id})</span>
                </label>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={() => {setSelectedUser(null); setModalType(null); setUserModels([]);}} 
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveModels} 
                className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:shadow"
              >
                保存分配
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
