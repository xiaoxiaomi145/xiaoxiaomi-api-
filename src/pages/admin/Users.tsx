import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to update user status', e);
    }
  };

  const addPoints = async (userId: string, currentPoints: number) => {
    const pointsToAdd = prompt(t('Enter points to add (can be negative to deduct):'), '10');
    if (!pointsToAdd || isNaN(Number(pointsToAdd))) return;

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const updateRes = await fetch(`/api/admin/users/${userId}/limits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          points: currentPoints + Number(pointsToAdd),
          daily_token_limit: user.daily_token_limit || 0,
          daily_request_limit: user.daily_request_limit || 0
        })
      });

      if (updateRes.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to add points', e);
    }
  };

  if (loading) return <div className="p-4">{t('Loading users...')}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Email')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Role')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Points')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Status')}</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.points?.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.is_active ? t('Active') : t('Inactive')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button 
                  onClick={() => addPoints(user.id, user.points || 0)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {t('Add Points')}
                </button>
                <button 
                  onClick={() => toggleStatus(user.id, user.is_active)}
                  className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                >
                  {user.is_active ? t('Suspend') : t('Activate')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
