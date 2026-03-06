import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, X, Clock, User, Box, Zap, Database } from 'lucide-react';

export default function Logs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/admin/logs', { headers: { Authorization: `Bearer ${token}` } });
      setLogs(await res.json());
    };
    fetchLogs();
  }, [token]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          系统日志
        </h1>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">模型</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens (提示/补全)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">消耗额度</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {logs.map(log => (
                <tr 
                  key={log.id} 
                  className="hover:bg-indigo-50/50 cursor-pointer transition-colors" 
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" />
                    {log.user_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-indigo-400" />
                    {log.model_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    <span className="text-blue-600">{log.prompt_tokens}</span> / <span className="text-emerald-600">{log.completion_tokens}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    {log.points_deducted.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-gray-100 transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                请求详情
              </h3>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      输入内容
                    </h4>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                      {selectedLog.prompt_tokens} Tokens
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <pre className="p-4 text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto h-[400px] custom-scrollbar font-mono leading-relaxed">
                      {selectedLog.request_content || '内容已压缩或不可用'}
                    </pre>
                  </div>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      输出内容
                    </h4>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      {selectedLog.completion_tokens} Tokens
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <pre className="p-4 text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto h-[400px] custom-scrollbar font-mono leading-relaxed">
                      {selectedLog.response_content || '内容已压缩或不可用'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
