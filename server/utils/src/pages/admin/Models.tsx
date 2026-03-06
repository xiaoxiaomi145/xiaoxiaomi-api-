import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, RefreshCw, Activity, Layers, Edit3, CheckCircle, XCircle, Download } from 'lucide-react';

export default function Models() {
  const { token } = useAuth();
  const [models, setModels] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [editModel, setEditModel] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', model_id: '', alias: '', upstream_url: '', upstream_key: '',
    billing_mode: 'per_token', prompt_price: 0, completion_price: 0, request_price: 0, rpm_limit: 60, is_active: true
  });
  const [fetchData, setFetchData] = useState({ upstream_url: '', upstream_key: '' });
  const [fetchedModels, setFetchedModels] = useState<any[]>([]);
  const [testingModel, setTestingModel] = useState<string | null>(null);

  const loadModels = async () => {
    const res = await fetch('/api/admin/models', { headers: { Authorization: `Bearer ${token}` } });
    setModels(await res.json());
  };

  useEffect(() => { loadModels(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editModel ? `/api/admin/models/${editModel.id}` : '/api/admin/models';
    const method = editModel ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    setShowModal(false);
    setEditModel(null);
    loadModels();
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/models/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(fetchData)
    });
    const data = await res.json();
    setFetchedModels(data);
  };

  const importModel = async (modelId: string) => {
    await fetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: modelId, model_id: modelId, alias: '', upstream_url: fetchData.upstream_url, upstream_key: fetchData.upstream_key,
        billing_mode: 'per_token', prompt_price: 0, completion_price: 0, request_price: 0, rpm_limit: 60, is_active: true
      })
    });
    loadModels();
    alert(`成功导入模型 ${modelId}`);
  };

  const testModelSpeed = async (model: any) => {
    setTestingModel(model.id);
    const startTime = Date.now();
    try {
      let endpoint = model.upstream_url;
      if (!endpoint.endsWith('/')) endpoint += '/';
      endpoint += 'chat/completions';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.upstream_key}`
        },
        body: JSON.stringify({
          model: model.model_id,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });
      
      if (res.ok) {
        const duration = Date.now() - startTime;
        alert(`测试成功！延迟: ${duration}ms`);
      } else {
        const err = await res.text();
        alert(`测试失败: ${res.status} ${err}`);
      }
    } catch (e: any) {
      alert(`测试出错: ${e.message}`);
    } finally {
      setTestingModel(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          模型管理
        </h1>
        <div className="space-x-3">
          <button 
            onClick={() => { setFormData({ name: '', model_id: '', alias: '', upstream_url: '', upstream_key: '', billing_mode: 'per_token', prompt_price: 0, completion_price: 0, request_price: 0, rpm_limit: 60, is_active: true }); setEditModel(null); setShowModal(true); }} 
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" /> 添加模型
          </button>
          <button 
            onClick={() => { setFetchedModels([]); setShowFetchModal(true); }} 
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl shadow-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> 自动获取
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">名称</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">模型 ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">别名</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">计费方式</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {models.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{m.model_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{m.alias || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {m.billing_mode === 'per_token' ? '按 Token' : '按次'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${m.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {m.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {m.is_active ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                    <button 
                      onClick={() => { setEditModel(m); setFormData({ ...m, is_active: m.is_active === 1 }); setShowModal(true); }} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑
                    </button>
                    <button 
                      onClick={() => testModelSpeed(m)} 
                      disabled={testingModel === m.id} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Activity className={`w-4 h-4 ${testingModel === m.id ? 'animate-spin' : ''}`} />
                      {testingModel === m.id ? '测试中...' : '测速'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 custom-scrollbar">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              {editModel ? '编辑模型' : '添加模型'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">名称</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">模型 ID</label>
                  <input required disabled={!!editModel} type="text" value={formData.model_id} onChange={e => setFormData({...formData, model_id: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">别名 (可选)</label>
                  <input type="text" value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="例如: gpt-4" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">上游 API 地址</label>
                  <input required type="url" value={formData.upstream_url} onChange={e => setFormData({...formData, upstream_url: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="https://api.openai.com" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">上游 API Key</label>
                  <input required type="password" value={formData.upstream_key} onChange={e => setFormData({...formData, upstream_key: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">计费方式</label>
                  <select value={formData.billing_mode} onChange={e => setFormData({...formData, billing_mode: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                    <option value="per_token">按 Token 计费</option>
                    <option value="per_request">按次计费</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">RPM 限制 <span className="text-gray-400 font-normal">(0 = 无限制)</span></label>
                  <input type="number" value={formData.rpm_limit} onChange={e => setFormData({...formData, rpm_limit: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                </div>
                
                {formData.billing_mode === 'per_token' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">提示词价格 <span className="text-gray-400 font-normal">(每 Token)</span></label>
                      <input type="number" step="0.000001" value={formData.prompt_price} onChange={e => setFormData({...formData, prompt_price: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">补全价格 <span className="text-gray-400 font-normal">(每 Token)</span></label>
                      <input type="number" step="0.000001" value={formData.completion_price} onChange={e => setFormData({...formData, completion_price: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">请求价格 <span className="text-gray-400 font-normal">(每次请求)</span></label>
                    <input type="number" step="0.000001" value={formData.request_price} onChange={e => setFormData({...formData, request_price: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </div>
                )}
                <div className="col-span-2 flex items-center mt-2">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition-colors cursor-pointer" />
                  <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-900 cursor-pointer">启用此模型</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                  取消
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:shadow">
                  保存模型
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Fetch Modal */}
      {showFetchModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              自动获取模型
            </h3>
            <form onSubmit={handleFetch} className="space-y-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">上游 API 基础地址</label>
                <input required type="url" value={fetchData.upstream_url} onChange={e => setFetchData({...fetchData, upstream_url: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="https://api.openai.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">上游 API Key</label>
                <input required type="password" value={fetchData.upstream_key} onChange={e => setFetchData({...fetchData, upstream_key: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:shadow">
                <RefreshCw className="w-4 h-4" />
                获取可用模型列表
              </button>
            </form>
            
            <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-4 custom-scrollbar">
              {fetchedModels.length > 0 ? (
                <ul className="space-y-3 pr-2">
                  {fetchedModels.map((m: any) => (
                    <li key={m.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors">
                      <span className="font-medium text-sm text-gray-900 font-mono">{m.id}</span>
                      <button 
                        onClick={() => importModel(m.id)} 
                        className="inline-flex items-center gap-1 text-xs font-medium bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        导入
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  暂无数据，请先点击获取
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button onClick={() => setShowFetchModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
