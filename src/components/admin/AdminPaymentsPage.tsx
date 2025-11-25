import React, { useState } from 'react';
import { 
  BarChart3, 
  CreditCard, 
  List, 
  Settings,
  Activity
} from 'lucide-react';
import PaymentsDashboard from './PaymentsDashboard';
import TransactionsList from './TransactionsList';
import PaymentAnalytics from './PaymentAnalytics';
import PaymentsTestConnection from './PaymentsTestConnection';

interface AdminPaymentsPageProps {
  className?: string;
}

const AdminPaymentsPage: React.FC<AdminPaymentsPageProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'settings'>('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Activity,
      description: 'Vista general del sistema de pagos'
    },
    {
      id: 'transactions',
      label: 'Transacciones',
      icon: List,
      description: 'Lista detallada de todas las transacciones'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Análisis avanzado y reportes'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      description: 'Configuración del sistema de pagos'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <PaymentsTestConnection />
            <PaymentsDashboard />
          </>
        );
      case 'transactions':
        return <TransactionsList />;
      case 'analytics':
        return <PaymentAnalytics />;
      case 'settings':
        return <PaymentSettings />;
      default:
        return (
          <>
            <PaymentsTestConnection />
            <PaymentsDashboard />
          </>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Administración de Pagos
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de gestión de pagos Colombia
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sistema Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'transactions' | 'analytics' | 'settings')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

// Payment Settings Component
const PaymentSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    wompiEnabled: true,
    payuEnabled: false,
    minAmount: 1000,
    maxAmount: 20000000,
    webhookUrl: '',
    notificationEmail: '',
  });

  const handleSave = async () => {
    try {
      // TODO: Implement settings save
      console.log('Saving settings:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Configuración de Gateways
        </h2>
        
        <div className="space-y-6">
          {/* Wompi Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Wompi</h3>
                <p className="text-sm text-gray-600">Gateway principal para Colombia</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wompiEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, wompiEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {settings.wompiEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Public Key
                  </label>
                  <input
                    type="text"
                    placeholder="pub_test_..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Private Key
                  </label>
                  <input
                    type="password"
                    placeholder="prv_test_..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* PayU Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">PayU</h3>
                <p className="text-sm text-gray-600">Gateway de respaldo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payuEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, payuEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {settings.payuEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="API Key"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    placeholder="Merchant ID"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account ID
                  </label>
                  <input
                    type="text"
                    placeholder="Account ID"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Limits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Límites de Transacción
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto Mínimo (COP)
            </label>
            <input
              type="number"
              value={settings.minAmount}
              onChange={(e) => setSettings(prev => ({ ...prev, minAmount: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto Máximo (COP)
            </label>
            <input
              type="number"
              value={settings.maxAmount}
              onChange={(e) => setSettings(prev => ({ ...prev, maxAmount: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Notificaciones
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={settings.webhookUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
              placeholder="https://tu-dominio.com/api/payments/webhook"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de Notificaciones
            </label>
            <input
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
              placeholder="admin@tu-dominio.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;