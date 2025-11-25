import React, { useState, useEffect } from 'react';
import { CreditCard, Building2, Smartphone, Banknote, Calendar } from 'lucide-react';
import FinancingSelector from './FinancingSelector';
import { usePayments } from '../../hooks/usePayments';
import type { 
  PaymentMethod, 
  PaymentMethodType, 
  FinancingOption,
  PaymentCustomerInfo 
} from '../../types/payments';

// Interfaz extendida para el componente con icono
interface PaymentMethodWithIcon extends PaymentMethod {
  icon: React.ReactNode;
}

// Alias para compatibilidad
type FinancingPlan = FinancingOption;
type Customer = PaymentCustomerInfo;

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onMethodSelect: (methodId: string) => void;
  selectedFinancingPlan?: FinancingPlan | null;
  onFinancingPlanSelect?: (plan: FinancingPlan | null) => void;
  amount?: number;
  customer?: Customer;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodSelect,
  selectedFinancingPlan,
  onFinancingPlanSelect,
  amount = 0,
  customer,
  className = ''
}) => {
  const [methodsWithIcons, setMethodsWithIcons] = useState<PaymentMethodWithIcon[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const { 
    loading, 
    error, 
    fetchPaymentMethods,
  } = usePayments();

  const loadPaymentMethods = async () => {
    try {
      const methods = await fetchPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const getEnabledPaymentMethods = () => {
    return paymentMethods.filter(method => method.enabled);
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getIconForPaymentType = (type: PaymentMethodType): React.ReactNode => {
    switch (type) {
      case 'PSE':
        return <Building2 className="w-6 h-6" />;
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="w-6 h-6" />;
      case 'NEQUI':
      case 'DAVIPLATA':
        return <Smartphone className="w-6 h-6" />;
      case 'CASH_ON_DELIVERY':
        return <Banknote className="w-6 h-6" />;
      case 'BANK_TRANSFER':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const processPaymentMethods = () => {
    const enabledMethods = getEnabledPaymentMethods();
    
    const methodsWithIcons: PaymentMethodWithIcon[] = enabledMethods.map(method => ({
      ...method,
      icon: getIconForPaymentType(method.type)
    }));

    // Agregar financiamiento si el monto es suficiente
    if (amount >= 50000) {
      const hasFinancing = methodsWithIcons.some(m => 
        m.type === 'CREDIT_CARD' && m.config?.financing
      );
      
      if (!hasFinancing) {
        methodsWithIcons.push({
          id: 'financing',
          name: 'Financiamiento',
          type: 'CREDIT_CARD',
          description: 'Paga en cuotas con ADDI',
          enabled: true,
          icon: <Calendar className="w-6 h-6" />,
          config: {
            financing: true,
            minAmount: 50000,
            maxAmount: 8000000
          }
        });
      }
    }

    setMethodsWithIcons(methodsWithIcons);
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (paymentMethods.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      processPaymentMethods();
    }
  }, [paymentMethods, amount]);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Método de Pago
      </h3>
      
      <div className="space-y-3">
        {methodsWithIcons.map((method) => (
          <div key={method.id}>
            <button
              onClick={() => onMethodSelect(method.id)}
              className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === method.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {method.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {method.name}
                    </h4>
                    {selectedMethod === method.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.description || 'Método de pago disponible'}
                  </p>
                  {method.fees && (
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      {method.fees.fixed && (
                        <p>Tarifa fija: {formatAmount(method.fees.fixed)}</p>
                      )}
                      {method.fees.percentage && (
                        <p>Tarifa: {method.fees.percentage}%</p>
                      )}
                    </div>
                  )}
                  {method.config?.minAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Monto mínimo: {formatAmount(method.config.minAmount)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
      
      {/* Show financing selector when financing method is selected */}
      {selectedMethod === 'financing' && customer && onFinancingPlanSelect && (
        <div className="mt-6">
          <FinancingSelector
            amount={amount}
            customer={customer}
            onPlanSelected={onFinancingPlanSelect}
            selectedPlan={selectedFinancingPlan || null}
          />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 font-medium">Error al cargar métodos de pago</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button 
            onClick={loadPaymentMethods}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && methodsWithIcons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay métodos de pago disponibles</p>
          <p className="text-sm mt-1">Contacta con soporte</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;