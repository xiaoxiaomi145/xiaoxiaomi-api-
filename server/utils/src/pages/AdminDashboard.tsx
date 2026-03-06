import { Routes, Route, Navigate } from 'react-router-dom';
import Users from './admin/Users';
import Models from './admin/Models';
import Logs from './admin/Logs';
import Settings from './admin/Settings';
import System from './admin/System';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';

export default function AdminDashboard() {
  return (
    <ProtectedAdminRoute>
      <Routes>
        <Route index element={<Navigate to="users" />} />
        <Route path="users" element={<Users />} />
        <Route path="models" element={<Models />} />
        <Route path="logs" element={<Logs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="system" element={<System />} />
      </Routes>
    </ProtectedAdminRoute>
  );
}
