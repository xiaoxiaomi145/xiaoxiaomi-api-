import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, User, Activity, Database, MessageSquare, Image as ImageIcon, LayoutDashboard, Server } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={clsx(
          "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
          isActive 
            ? "bg-indigo-100/50 text-indigo-900 font-semibold" 
            : "text-gray-600 hover:bg-indigo-50/50 hover:text-indigo-900"
        )}
      >
        <Icon className={clsx(
          "w-5 h-5 mr-3 transition-colors",
          isActive ? "text-indigo-700" : "text-indigo-400 group-hover:text-indigo-600"
        )} />
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex font-sans text-gray-900">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-indigo-100 flex flex-col z-10 shadow-[4px_0_24px_rgba(79,70,229,0.05)]">
        <div className="h-20 flex items-center px-8 border-b border-indigo-50">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Server className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">xiaoxiaomi的小破站</span>
        </div>
        
        <nav className="flex-1 p-5 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 pb-2 pt-2 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
            用户服务
          </div>
          <NavItem to="/dashboard" icon={LayoutDashboard}>控制台</NavItem>
          <NavItem to="/chat" icon={MessageSquare}>AI 聊天助手</NavItem>
          <NavItem to="/image" icon={ImageIcon}>AI 图像生成</NavItem>
          <NavItem to="/settings" icon={User}>个人设置</NavItem>
          
          {user?.role === 'admin' && (
            <>
              <div className="pt-8 pb-2 px-4 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                系统管理
              </div>
              <NavItem to="/xiaoxiaomiadmin/users" icon={User}>用户管理</NavItem>
              <NavItem to="/xiaoxiaomiadmin/models" icon={Database}>模型管理</NavItem>
              <NavItem to="/xiaoxiaomiadmin/logs" icon={Activity}>请求日志</NavItem>
              <NavItem to="/xiaoxiaomiadmin/system" icon={Server}>系统监控</NavItem>
              <NavItem to="/xiaoxiaomiadmin/settings" icon={Settings}>系统设置</NavItem>
            </>
          )}
        </nav>

        <div className="p-6 border-t border-indigo-50 bg-indigo-50/30">
          <div className="flex items-center mb-5 bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
              <p className="text-xs text-indigo-600 font-medium truncate mt-0.5">{user?.points.toFixed(2)} 额度</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-gray-500 bg-white border border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded-xl transition-all duration-200 shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#f5f3ff]">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
