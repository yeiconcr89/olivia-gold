import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, MapPin } from 'lucide-react';

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

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (customer: Omit<Customer, 'id'>) => void;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, onClose }) => {
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

  useEffect(() => {
    if (customer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        status: customer.status,
        notes: customer.notes || '',
        birthDate: customer.birthDate || '',
        preferences: customer.preferences.length > 0 ? customer.preferences : ['']
      });
    }
  }, [customer]);

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

    if (!formData.address.street.trim()) {
      newErrors.street = 'La dirección es requerida';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
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
      registrationDate: customer?.registrationDate || new Date().toISOString(),
      totalOrders: customer?.totalOrders || 0,
      totalSpent: customer?.totalSpent || 0,
      wishlistItems: customer?.wishlistItems || 0,
      preferences: formData.preferences.filter(pref => pref.trim() !== '')
    };

    onSubmit(customerData);
  };

  const handlePreferenceChange = (index: number, value: string) => {
    const newPreferences = [...formData.preferences];
    newPreferences[index] = value;
    setFormData({ ...formData, preferences: newPreferences });
  };

  const addPreferenceField = () => {
    setFormData({ ...formData, preferences: [...formData.preferences, ''] });
  };

  const removePreferenceField = (index: number) => {
    const newPreferences = formData.preferences.filter((_, i) => i !== index);
    setFormData({ ...formData, preferences: newPreferences });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-elegant-200 bg-elegant-50">
          <div>
            <h2 className="text-2xl admin-heading">
              {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <p className="admin-body">
              {customer ? 'Actualiza la información del cliente' : 'Agrega un nuevo cliente al sistema'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-elegant-200 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-elegant-600" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <div className="bg-elegant-50 p-6 rounded-xl">
              <h3 className="text-lg admin-subheading mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
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

                <div>
                  <label className="block admin-label mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                  />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="bg-elegant-50 p-6 rounded-xl">
              <h3 className="text-lg admin-subheading mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-elegant-50 p-6 rounded-xl">
              <h3 className="text-lg admin-subheading mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Dirección
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block admin-label mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, street: e.target.value }
                    })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input ${
                      errors.street ? 'border-red-500' : 'border-elegant-300'
                    }`}
                    placeholder="Calle 123 #45-67"
                  />
                  {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block admin-label mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input ${
                        errors.city ? 'border-red-500' : 'border-elegant-300'
                      }`}
                      placeholder="Bogotá"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
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

                  <div>
                    <label className="block admin-label mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                      placeholder="110111"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferencias */}
            <div className="bg-elegant-50 p-6 rounded-xl">
              <h3 className="text-lg admin-subheading mb-4">
                Preferencias de Productos
              </h3>
              
              <div className="space-y-3">
                {formData.preferences.map((preference, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={preference}
                      onChange={(e) => handlePreferenceChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                    >
                      <option value="">Seleccionar preferencia</option>
                      <option value="collares">Collares</option>
                      <option value="anillos">Anillos</option>
                      <option value="pulseras">Pulseras</option>
                      <option value="aretes">Aretes</option>
                      <option value="conjuntos">Conjuntos</option>
                      <option value="relojes">Relojes</option>
                    </select>
                    {formData.preferences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePreferenceField(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPreferenceField}
                  className="text-gold-600 hover:text-gold-700 admin-button text-sm"
                >
                  + Agregar preferencia
                </button>
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
            onClick={onClose}
            className="px-6 py-2 border border-elegant-300 text-elegant-700 rounded-lg admin-button hover:bg-elegant-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-gold text-elegant-900 rounded-lg admin-button hover:shadow-gold transition-all flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{customer ? 'Actualizar Cliente' : 'Crear Cliente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;