import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Copy, RefreshCw, Key, Database, Activity, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [userRes, statsRes, logsRes] = await Promise.all([
        fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/user/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/user/logs', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUserInfo(await userRes.json());
      setStats(await statsRes.json());
      setLogs(await logsRes.json());
    } catch (err) {
      console.error(err);
      toast.error('获取数据失败');
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleResetKey = async () => {
    if (!confirm('您确定要重置 API 密钥吗？旧密钥将立即失效。')) return;
    try {
      const res = await fetch('/api/user/reset-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUserInfo({ ...userInfo, apiKey: data.key });
      toast.success('API 密钥已重置');
    } catch (err) {
      console.error(err);
      toast.error('重置密钥失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const chartData = useMemo(() => {
    if (!stats?.dailyStats) return { data: [], models: [] };
    const grouped: Record<string, any> = {};
    const modelsSet = new Set<string>();
    
    stats.dailyStats.forEach((stat: any) => {
      if (!grouped[stat.date]) {
        grouped[stat.date] = { date: stat.date, prompt: 0, completion: 0 };
      }
      const modelName = stat.model_name || '未知模型';
      modelsSet.add(modelName);
      
      grouped[stat.date].prompt += stat.prompt_tokens;
      grouped[stat.date].completion += stat.completion_tokens;
    });
    
    return { data: Object.values(grouped), models: Array.from(modelsSet) };
  }, [stats]);

  // Generate colors for models
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  if (!userInfo || !stats) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="space-y-8 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">控制台</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>系统运行正常</span>
        </div>
      </motion.div>
      
      {/* Overview Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Activity, color: 'indigo', label: '账户余额', value: userInfo.points.toFixed(4) },
          { icon: Zap, color: 'emerald', label: '总请求次数', value: stats.stats.total_requests },
          { icon: Database, color: 'blue', label: '总消耗 Token', value: (stats.stats.total_prompt_tokens + stats.stats.total_completion_tokens).toLocaleString() },
          { icon: Activity, color: 'amber', label: '每日限额 (Token/请求)', value: `${userInfo.daily_token_limit || '无'} / ${userInfo.daily_request_limit || '无'}` }
        ].map((card, i) => (
          <motion.div key={i} variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className={`p-3 bg-${card.color}-50 rounded-xl`}>
                <card.icon className={`w-6 h-6 text-${card.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* API Key & Models */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Key className="w-5 h-5 mr-2 text-indigo-500" /> API 密钥管理
          </h2>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              readOnly
              value={userInfo.apiKey || '无 API 密钥'}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 font-mono"
            />
            <button
              onClick={() => copyToClipboard(userInfo.apiKey)}
              className="p-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              title="复制"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetKey}
              className="p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              title="重置密钥"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 flex items-center justify-between">
              <span>接口地址 (Base URL):</span>
              <code className="bg-white px-2 py-1 rounded-lg border border-gray-200 text-indigo-600 font-mono text-xs">
                {window.location.origin}/v1
              </code>
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Database className="w-5 h-5 mr-2 text-indigo-500" /> 可用模型列表
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '160px' }}>
            {userInfo.models.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                暂无可用模型，请联系管理员分配。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userInfo.models.map((m: any) => (
                  <div key={m.model_id} className="flex flex-col justify-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                    <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                    <span className="text-gray-500 text-xs font-mono mt-1 truncate" title={m.model_id}>{m.model_id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">每日 Token 使用量 (入站/出站)</h2>
        <div className="h-80">
          {chartData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="prompt" name="入站 Token" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="completion" name="出站 Token" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              暂无数据
            </div>
          )}
        </div>
      </motion.div>

      {/* Request Logs */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">最近请求日志</h2>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">最多显示 100 条</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">模型</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens (提示/补全)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">消耗额度</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    暂无请求记录
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-indigo-50/50 cursor-pointer transition-colors" onClick={() => setSelectedLog(log)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {log.model_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    <span className="text-blue-600">{log.prompt_tokens}</span> / <span className="text-emerald-600">{log.completion_tokens}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.points_deducted.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-500" />
                请求详情
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <span className="sr-only">关闭</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/30">
              <div className="flex flex-col">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                  <span>输入内容 (Prompt)</span>
                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">{selectedLog.prompt_tokens} tokens</span>
                </h4>
                <div className="flex-1 bg-white p-4 rounded-xl text-sm text-gray-800 whitespace-pre-wrap border border-gray-200 shadow-sm overflow-y-auto font-mono leading-relaxed" style={{ minHeight: '300px' }}>
                  {selectedLog.request_content || '内容已压缩或不可用'}
                </div>
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                  <span>输出内容 (Completion)</span>
                  <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100">{selectedLog.completion_tokens} tokens</span>
                </h4>
                <div className="flex-1 bg-white p-4 rounded-xl text-sm text-gray-800 whitespace-pre-wrap border border-gray-200 shadow-sm overflow-y-auto font-mono leading-relaxed" style={{ minHeight: '300px' }}>
                  {selectedLog.response_content || '内容已压缩或不可用'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
