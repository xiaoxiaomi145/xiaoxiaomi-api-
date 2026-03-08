import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Models() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/admin/models', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (e) {
      console.error('Failed to fetch models', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">{t('Loading models...')}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Name')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Model ID')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Billing Mode')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Status')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {models.map((model) => (
            <tr key={model.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.model_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.billing_mode}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${model.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {model.is_active ? t('Active') : t('Inactive')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
