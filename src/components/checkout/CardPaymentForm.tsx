import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface CardFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  installments: number;
}

interface CardPaymentFormProps {
  onSubmit: (data: CardFormData) => void;
  loading?: boolean;
  className?: string;
}

const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  onSubmit,
  loading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    installments: 1
  });
  const [errors, setErrors] = useState<Partial<CardFormData>>({});
  const [showCvv, setShowCvv] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<CardFormData> = {};

    // Validar número de tarjeta
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'Ingresa el número de tarjeta';
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.cardNumber = 'Número de tarjeta inválido';
    }

    // Validar nombre
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Ingresa el nombre del titular';
    }

    // Validar mes
    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Selecciona el mes';
    }

    // Validar año
    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Selecciona el año';
    } else {
      const currentYear = new Date().getFullYear();
      const selectedYear = parseInt(formData.expiryYear);
      if (selectedYear < currentYear) {
        newErrors.expiryYear = 'Año inválido';
      }
    }

    // Validar CVV
    if (!formData.cvv) {
      newErrors.cvv = 'Ingresa el CVV';
    } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = 'CVV inválido';
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

  const handleInputChange = (field: keyof CardFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardType = (number: string) => {
    const num = number.replace(/\s/g, '');
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    return 'unknown';
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = [
    { value: '01', label: '01 - Enero' },
    { value: '02', label: '02 - Febrero' },
    { value: '03', label: '03 - Marzo' },
    { value: '04', label: '04 - Abril' },
    { value: '05', label: '05 - Mayo' },
    { value: '06', label: '06 - Junio' },
    { value: '07', label: '07 - Julio' },
    { value: '08', label: '08 - Agosto' },
    { value: '09', label: '09 - Septiembre' },
    { value: '10', label: '10 - Octubre' },
    { value: '11', label: '11 - Noviembre' },
    { value: '12', label: '12 - Diciembre' }
  ];

  const installmentOptions = [
    { value: 1, label: '1 cuota (sin interés)' },
    { value: 3, label: '3 cuotas' },
    { value: 6, label: '6 cuotas' },
    { value: 12, label: '12 cuotas' },
    { value: 24, label: '24 cuotas' }
  ];

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <CreditCard className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pago con Tarjeta
          </h3>
          <p className="text-sm text-gray-600">
            Visa, Mastercard, American Express
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Número de Tarjeta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Tarjeta
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.cardNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getCardType(formData.cardNumber) === 'visa' && (
                <div className="text-blue-600 font-bold text-sm">VISA</div>
              )}
              {getCardType(formData.cardNumber) === 'mastercard' && (
                <div className="text-red-600 font-bold text-sm">MC</div>
              )}
              {getCardType(formData.cardNumber) === 'amex' && (
                <div className="text-blue-800 font-bold text-sm">AMEX</div>
              )}
            </div>
          </div>
          {errors.cardNumber && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.cardNumber}
            </p>
          )}
        </div>

        {/* Nombre del Titular */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Titular
          </label>
          <input
            type="text"
            value={formData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value.toUpperCase())}
            placeholder="NOMBRE COMO APARECE EN LA TARJETA"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.cardholderName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cardholderName && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.cardholderName}
            </p>
          )}
        </div>

        {/* Fecha de Vencimiento y CVV */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <select
              value={formData.expiryMonth}
              onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Mes</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            {errors.expiryMonth && (
              <p className="mt-1 text-sm text-red-600">
                {errors.expiryMonth}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={formData.expiryYear}
              onChange={(e) => handleInputChange('expiryYear', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.expiryYear ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Año</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.expiryYear && (
              <p className="mt-1 text-sm text-red-600">
                {errors.expiryYear}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVV
            </label>
            <div className="relative">
              <input
                type={showCvv ? 'text' : 'password'}
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cvv ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCvv(!showCvv)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.cvv && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cvv}
              </p>
            )}
          </div>
        </div>

        {/* Cuotas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Cuotas
          </label>
          <select
            value={formData.installments}
            onChange={(e) => handleInputChange('installments', parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {installmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Información de Seguridad */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Pago Seguro:</p>
              <ul className="space-y-1 text-green-700">
                <li>• Conexión SSL encriptada</li>
                <li>• No almacenamos datos de tu tarjeta</li>
                <li>• Certificación PCI DSS</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Procesando...
            </div>
          ) : (
            'Pagar con Tarjeta'
          )}
        </button>
      </form>
    </div>
  );
};

export default CardPaymentForm;