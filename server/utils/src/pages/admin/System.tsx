import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Cpu, Server, Clock, BarChart3, Box } from 'lucide-react';

export default function System() {
  const { token } = useAuth();
  const [systemData, setSystemData] = useState<any>(null);

  const fetchSystemData = async () => {
    const res = await fetch('/api/admin/system', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setSystemData(await res.json());
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (!systemData) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          系统监控
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 mb-1">CPU 使用率</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 font-mono">{systemData.cpu}</h3>
                <span className="text-sm font-medium text-gray-500">%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${systemData.cpu > 80 ? 'bg-red-500' : systemData.cpu > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
              style={{ width: `${Math.min(100, systemData.cpu)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Server className="w-6 h-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 mb-1">内存使用率</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 font-mono">{systemData.memory.percent}</h3>
                <span className="text-sm font-medium text-gray-500">%</span>
              </div>
              <p className="text-xs font-medium text-gray-400 mt-0.5 font-mono">{systemData.memory.used}GB / {systemData.memory.total}GB</p>
            </div>
          </div>
          <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${systemData.memory.percent > 80 ? 'bg-red-500' : systemData.memory.percent > 50 ? 'bg-amber-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min(100, systemData.memory.percent)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Clock className="w-6 h-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 mb-1">系统运行时间</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 font-mono">{(systemData.uptime / 3600).toFixed(1)}</h3>
                <span className="text-sm font-medium text-gray-500">小时</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            热门模型统计
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">模型名称</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">总请求次数</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {systemData.topModels.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Box className="w-4 h-4 text-gray-400" />
                    {m.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{m.requests}</span>
                      <span className="text-xs text-gray-400">次</span>
                    </div>
                  </td>
                </tr>
              ))}
              {systemData.topModels.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity className="w-8 h-8 text-gray-300" />
                      <p>暂无请求数据</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
