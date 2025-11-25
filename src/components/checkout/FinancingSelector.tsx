import React, { useState, useEffect } from 'react';
import { CheckCircle, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { apiRequest } from '../../config/api';

interface FinancingPlan {
  installments: number;
  monthlyAmount: number;
  totalAmount: number;
  interestRate: number;
  provider: string;
  description: string;
}

interface FinancingEligibility {
  eligible: boolean;
  creditLimit?: number;
  reason?: string;
}

interface Customer {
  email: string;
  name: string;
  phone: string;
  document: {
    type: 'CC' | 'CE' | 'NIT' | 'PP';
    number: string;
  };
}

interface FinancingSelectorProps {
  amount: number;
  customer: Customer;
  onPlanSelected: (plan: FinancingPlan | null) => void;
  selectedPlan: FinancingPlan | null;
}

const FinancingSelector: React.FC<FinancingSelectorProps> = ({
  amount,
  customer,
  onPlanSelected,
  selectedPlan
}) => {
  const [plans, setPlans] = useState<FinancingPlan[]>([]);
  const [eligibility, setEligibility] = useState<FinancingEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (amount >= 50000 && customer.email && customer.document.number) {
      loadFinancingOptions();
    }
  }, [amount, customer]);

  const loadFinancingOptions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check customer eligibility
      const eligibilityResponse = await apiRequest('/api/payments/financing/eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer }),
      });

      setEligibility(eligibilityResponse.data);

      if (eligibilityResponse.data.eligible) {
        // Get available financing plans
        const plansResponse = await apiRequest(
          `/api/payments/financing/plans?amount=${amount}&customerEmail=${customer.email}&customerDocument=${customer.document.number}&customerPhone=${customer.phone}`
        );

        setPlans(plansResponse.data.plans);
      }
    } catch (err) {
      console.error('Error loading financing options:', err);
      setError('Error al cargar opciones de financiamiento');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (amount < 50000) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <CreditCard className="h-5 w-5" />
          <span className="text-sm">
            Financiamiento disponible para compras desde {formatCurrency(50000)}
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-40"></div>
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={loadFinancingOptions}
          className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-yellow-600" />
          <div>
            <div className="text-yellow-800 font-medium text-sm">
              Financiamiento no disponible
            </div>
            <div className="text-yellow-700 text-sm">
              {eligibility?.reason || 'No cumples con los requisitos para financiamiento'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Opciones de Financiamiento ADDI
        </h3>
      </div>

      {eligibility.creditLimit && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>
              Límite de crédito aprobado: {formatCurrency(eligibility.creditLimit)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedPlan === plan
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onPlanSelected(selectedPlan === plan ? null : plan)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedPlan === plan
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPlan === plan && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-900">
                      {plan.installments} cuotas de {formatCurrency(plan.monthlyAmount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {plan.description}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{plan.installments} meses</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {plan.interestRate === 0 ? 'Sin interés' : `${plan.interestRate}% mensual`}
                    </span>
                  </div>
                </div>

                {plan.totalAmount > amount && (
                  <div className="mt-2 text-sm text-gray-500">
                    Total a pagar: {formatCurrency(plan.totalAmount)}
                    <span className="ml-2 text-xs">
                      (+{formatCurrency(plan.totalAmount - amount)} en intereses)
                    </span>
                  </div>
                )}
              </div>

              {plan.interestRate === 0 && (
                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Sin interés
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No hay planes de financiamiento disponibles para este monto
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800">
          <strong>ADDI</strong> - Financiamiento rápido y seguro. Aprobación inmediata sin papeleos.
          Powered by inteligencia artificial para una experiencia sin fricciones.
        </div>
      </div>
    </div>
  );
};

export default FinancingSelector;