import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  ShoppingBag,
  Star,
  Edit,
  Trash2,
  Plus,
  Download
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  registrationDate: string;
  lastPurchase?: string;
  totalOrders: number;
  totalSpent: number;
  wishlistItems: number;
  status: 'active' | 'inactive' | 'vip';
  notes?: string;
  birthDate?: string;
  preferences: string[];
}

interface CustomerManagementProps {
  customers: Customer[];
  onUpdateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onExportData?: () => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddCustomer,
  onExportData
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      vip: 'bg-gold-100 text-gold-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    vip: customers.filter(c => c.status === 'vip').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0)
      : 0
  };

  // FUNCIÓN CORREGIDA PARA NUEVO CLIENTE
  const handleAddNewCustomer = () => {
    setSelectedCustomer(null);
    setIsAddingCustomer(true);
  };

  const handleSaveCustomer = (customerData: Omit<Customer, 'id'>) => {
    onAddCustomer(customerData);
    setIsAddingCustomer(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600">Total Clientes</p>
              <p className="text-2xl admin-heading">
                {customerStats.total}
              </p>
            </div>
            <Users className="h-8 w-8 text-gold-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600">Clientes Activos</p>
              <p className="text-2xl admin-heading text-green-600">
                {customerStats.active}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600">Clientes VIP</p>
              <p className="text-2xl admin-heading text-gold-600">
                {customerStats.vip}
              </p>
            </div>
            <Star className="h-8 w-8 text-gold-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600">Valor Promedio</p>
              <p className="text-2xl admin-heading">
                {formatPrice(customerStats.averageOrderValue)}
              </p>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters - BOTÓN NUEVO CLIENTE CORREGIDO */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-elegant-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddNewCustomer}
              className="flex items-center space-x-2 bg-gradient-gold text-elegant-900 px-4 py-2 rounded-lg admin-button hover:shadow-gold transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Cliente</span>
            </button>
            <button 
              onClick={onExportData}
              className="flex items-center space-x-2 px-4 py-2 border border-elegant-300 rounded-lg hover:border-gold-500 transition-colors admin-button"
            >
              <Download className="h-5 w-5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elegant-50">
              <tr>
                <th className="px-6 py-3 text-left admin-table-header">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left admin-table-header">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left admin-table-header">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left admin-table-header">
                  Total Gastado
                </th>
                <th className="px-6 py-3 text-left admin-table-header">
                  Estado
                </th>
                <th className="px-6 py-3 text-left admin-table-header">
                  Última Compra
                </th>
                <th className="px-6 py-3 text-left admin-table-header">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-elegant-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-elegant-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-gold rounded-full flex items-center justify-center mr-3">
                        <span className="text-elegant-900 font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="admin-table-cell font-semibold">
                          {customer.name}
                        </div>
                        <div className="admin-body text-elegant-500">
                          Cliente desde {new Date(customer.registrationDate).getFullYear()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="admin-body">
                      <div className="flex items-center text-elegant-900">
                        <Mail className="h-4 w-4 mr-1" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-elegant-600 mt-1">
                        <Phone className="h-4 w-4 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="admin-body">
                      <div className="font-semibold text-elegant-900">
                        {customer.totalOrders} pedidos
                      </div>
                      <div className="text-elegant-600">
                        {customer.wishlistItems} en wishlist
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="admin-table-cell font-semibold">
                      {formatPrice(customer.totalSpent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(customer.status)}`}>
                      {customer.status === 'vip' && <Star className="h-3 w-3 mr-1" />}
                      <span className="capitalize">{customer.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="admin-table-cell">
                      {customer.lastPurchase 
                        ? new Date(customer.lastPurchase).toLocaleDateString('es-ES')
                        : 'Nunca'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap admin-table-cell">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-gold-600 hover:text-gold-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomer(customer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail/Edit Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedCustomer(null)} />
          
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl admin-heading">
                  Perfil del Cliente
                </h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-elegant-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-elegant-50 p-4 rounded-lg">
                  <h3 className="admin-subheading mb-3">
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block admin-label mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={selectedCustomer.name}
                        onChange={(e) => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                        className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                      />
                    </div>
                    <div>
                      <label className="block admin-label mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={selectedCustomer.email}
                        onChange={(e) => setSelectedCustomer({...selectedCustomer, email: e.target.value})}
                        className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                      />
                    </div>
                    <div>
                      <label className="block admin-label mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={selectedCustomer.phone}
                        onChange={(e) => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                      />
                    </div>
                    <div>
                      <label className="block admin-label mb-1">
                        Estado
                      </label>
                      <select
                        value={selectedCustomer.status}
                        onChange={(e) => setSelectedCustomer({...selectedCustomer, status: e.target.value as 'active' | 'inactive' | 'vip'})}
                        className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl admin-heading text-blue-600">
                      {selectedCustomer.totalOrders}
                    </div>
                    <div className="admin-body text-blue-800">Pedidos</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl admin-heading text-green-600">
                      {formatPrice(selectedCustomer.totalSpent)}
                    </div>
                    <div className="admin-body text-green-800">Total Gastado</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl admin-heading text-purple-600">
                      {selectedCustomer.wishlistItems}
                    </div>
                    <div className="admin-body text-purple-800">Favoritos</div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block admin-label mb-2">
                    Notas
                  </label>
                  <textarea
                    value={selectedCustomer.notes || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, notes: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                    placeholder="Notas sobre el cliente..."
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-6 py-2 border border-elegant-300 text-elegant-700 rounded-lg admin-button hover:bg-elegant-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onUpdateCustomer(selectedCustomer.id, selectedCustomer);
                      setSelectedCustomer(null);
                    }}
                    className="px-6 py-2 bg-gradient-gold text-elegant-900 rounded-lg admin-button hover:shadow-gold transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nuevo Cliente */}
      {isAddingCustomer && (
        <NewCustomerForm
          onSave={handleSaveCustomer}
          onCancel={() => setIsAddingCustomer(false)}
        />
      )}
    </div>
  );
};

// Componente para formulario de nuevo cliente
const NewCustomerForm: React.FC<{
  onSave: (customer: Omit<Customer, 'id'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Colombia'
    },
    status: 'active' as const,
    notes: '',
    birthDate: '',
    preferences: ['']
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const customerData = {
      ...formData,
      registrationDate: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      wishlistItems: 0,
      preferences: formData.preferences.filter(pref => pref.trim() !== '')
    };

    onSave(customerData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-elegant-200 bg-elegant-50">
          <div>
            <h2 className="text-2xl admin-heading">
              Nuevo Cliente
            </h2>
            <p className="admin-body">
              Agrega un nuevo cliente al sistema
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-elegant-200 rounded-full transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <div className="bg-elegant-50 p-6 rounded-xl">
              <h3 className="text-lg admin-subheading mb-4">
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block admin-label mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input ${
                      errors.name ? 'border-red-500' : 'border-elegant-300'
                    }`}
                    placeholder="Ej: María González"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block admin-label mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input ${
                      errors.email ? 'border-red-500' : 'border-elegant-300'
                    }`}
                    placeholder="maria@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block admin-label mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input ${
                      errors.phone ? 'border-red-500' : 'border-elegant-300'
                    }`}
                    placeholder="+57 300 123 4567"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block admin-label mb-2">
                    Estado del Cliente
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'vip' })}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-elegant-50 p-6 rounded-xl">
              <h3 className="text-lg admin-subheading mb-4">
                Dirección
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block admin-label mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, street: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                    placeholder="Calle 123 #45-67"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block admin-label mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                      placeholder="Bogotá"
                    />
                  </div>

                  <div>
                    <label className="block admin-label mb-2">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, state: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                      placeholder="Cundinamarca"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block admin-label mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                placeholder="Notas sobre el cliente, preferencias especiales, etc..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-elegant-200 bg-elegant-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-elegant-300 text-elegant-700 rounded-lg admin-button hover:bg-elegant-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-gold text-elegant-900 rounded-lg admin-button hover:shadow-gold transition-all flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Crear Cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;