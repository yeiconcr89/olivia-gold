import React, { useState, useEffect } from 'react';
import { Building2, User, FileText, AlertCircle } from 'lucide-react';
import { API_CONFIG, apiRequest } from '../../config/api';
import type { PSEConfig } from '../../types/payments';

interface Bank {
  id: string;
  name: string;
  logo?: string;
}

interface PSEFormData {
  bankCode: string;
  bankName: string;
  userType: 'NATURAL' | 'JURIDICA';
  documentType: 'CC' | 'CE' | 'NIT';
  documentNumber: string;
}

interface PSEPaymentFormProps {
  onSubmit: (data: PSEConfig) => void;
  loading?: boolean;
  className?: string;
}

const PSEPaymentForm: React.FC<PSEPaymentFormProps> = ({
  onSubmit,
  loading = false,
  className = ''
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [formData, setFormData] = useState<PSEFormData>({
    bankCode: '',
    bankName: '',
    userType: 'NATURAL',
    documentType: 'CC',
    documentNumber: ''
  });
  const [errors, setErrors] = useState<Partial<PSEFormData>>({});

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/payments/pse/banks`;
      const result = await apiRequest<{ success: boolean; data?: { banks: Bank[] } }>(url, {
        method: 'GET',
        timeout: 8000,
      });
      setBanks(result.data?.banks || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
      // Fallback banks
      setBanks([
        { id: 'bancolombia', name: 'Bancolombia' },
        { id: 'davivienda', name: 'Davivienda' },
        { id: 'bbva', name: 'BBVA Colombia' },
        { id: 'banco_bogota', name: 'Banco de Bogotá' }
      ]);
    } finally {
      setBanksLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PSEFormData> = {};

    if (!formData.bankId) {
      newErrors.bankId = 'Selecciona tu banco';
    }

    if (!formData.documentNumber) {
      newErrors.documentNumber = 'Ingresa tu número de documento';
    } else if (formData.documentNumber.length < 6) {
      newErrors.documentNumber = 'Documento debe tener al menos 6 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof PSEFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pago con PSE
          </h3>
          <p className="text-sm text-gray-600">
            Paga de forma segura desde tu banco
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de Persona */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Persona
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('personType', 'natural')}
              className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                formData.personType === 'natural'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 mx-auto mb-1" />
              Natural
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('personType', 'juridica')}
              className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                formData.personType === 'juridica'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="w-4 h-4 mx-auto mb-1" />
              Jurídica
            </button>
          </div>
        </div>

        {/* Tipo de Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Documento
          </label>
          <select
            value={formData.documentType}
            onChange={(e) => handleInputChange('documentType', e.target.value as 'CC' | 'CE' | 'NIT' | 'PP')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="NIT">NIT</option>
            <option value="PP">Pasaporte</option>
          </select>
        </div>

        {/* Número de Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Documento
          </label>
          <input
            type="text"
            value={formData.documentNumber}
            onChange={(e) => handleInputChange('documentNumber', e.target.value.replace(/\D/g, ''))}
            placeholder="Ingresa tu número de documento"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.documentNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.documentNumber && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.documentNumber}
            </p>
          )}
        </div>

        {/* Selección de Banco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu Banco
          </label>
          {banksLoading ? (
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          ) : (
            <select
              value={formData.bankId}
              onChange={(e) => handleInputChange('bankId', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.bankId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona tu banco</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          )}
          {errors.bankId && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.bankId}
            </p>
          )}
        </div>

        {/* Información de Seguridad */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información Importante:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Serás redirigido al sitio web de tu banco</li>
                <li>• Ingresa tus credenciales bancarias de forma segura</li>
                <li>• El pago se confirmará automáticamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={loading || banksLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Procesando...
            </div>
          ) : (
            'Continuar con PSE'
          )}
        </button>
      </form>
    </div>
  );
};

export default PSEPaymentForm;