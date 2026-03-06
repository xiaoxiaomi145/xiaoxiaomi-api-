import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const ImageGen = lazy(() => import('./pages/ImageGen'));
const UserSettings = lazy(() => import('./pages/UserSettings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Layout = lazy(() => import('./components/Layout'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="chat" element={<Chatbot />} />
              <Route path="image" element={<ImageGen />} />
              <Route path="settings" element={<UserSettings />} />
              <Route path="xiaoxiaomiadmin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
