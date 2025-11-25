import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import {
  PaymentGateway,
  PaymentMethod,
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
  PaymentStatus,
  PaymentGatewayError,
  PaymentValidationError,
  PaymentNetworkError,
  FinancingGateway,
  FinancingPlan,
  FinancingRequest,
  FinancingResponse,
} from './payment-gateway.interface';

// ============================================================================
// ADDI GATEWAY IMPLEMENTATION
// ============================================================================

interface AddiConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
  webhookSecret: string;
}

interface AddiApplication {
  id: string;
  status: 'APPROVED' | 'PENDING' | 'DECLINED';
  amount: number;
  customer: any;
  plan: any;
  created_at: string;
  approved_at?: string;
  declined_at?: string;
}

interface AddiCustomerData {
  email: string;
  phone: string;
  document: {
    type: string;
    number: string;
  };
  name: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export class AddiGatewayService implements FinancingGateway {
  name = 'ADDI';
  enabled = true;

  private client: AxiosInstance;
  private config: AddiConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ADDI_API_KEY || '',
      secretKey: process.env.ADDI_SECRET_KEY || '',
      baseUrl: process.env.ADDI_BASE_URL || 'https://api.addi.com/v1',
      environment: (process.env.ADDI_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      webhookSecret: process.env.ADDI_WEBHOOK_SECRET || '',
    };

    if (this.config.environment === 'sandbox') {
      this.config.baseUrl = 'https://api-sandbox.addi.com/v1';
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Addi-Version': '2024-01-01',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`ADDI API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('ADDI API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`ADDI API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('ADDI API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      return [
        {
          id: 'addi_3_months',
          name: 'ADDI - 3 Cuotas',
          type: 'FINANCING',
          icon: '/images/payment-methods/addi.png',
          description: 'Paga en 3 cuotas sin interés',
          enabled: true,
          minAmount: 50000, // $50,000 COP
          maxAmount: 3000000, // $3,000,000 COP
          processingTime: 'Aprobación inmediata',
          fees: {
            percentage: 0,
            fixed: 0,
          },
          financing: {
            minInstallments: 3,
            maxInstallments: 3,
            interestRate: 0,
            provider: 'ADDI',
          },
        },
        {
          id: 'addi_6_months',
          name: 'ADDI - 6 Cuotas',
          type: 'FINANCING',
          icon: '/images/payment-methods/addi.png',
          description: 'Paga en 6 cuotas con interés preferencial',
          enabled: true,
          minAmount: 100000, // $100,000 COP
          maxAmount: 5000000, // $5,000,000 COP
          processingTime: 'Aprobación inmediata',
          fees: {
            percentage: 0,
            fixed: 0,
          },
          financing: {
            minInstallments: 6,
            maxInstallments: 6,
            interestRate: 1.5, // 1.5% mensual
            provider: 'ADDI',
          },
        },
        {
          id: 'addi_12_months',
          name: 'ADDI - 12 Cuotas',
          type: 'FINANCING',
          icon: '/images/payment-methods/addi.png',
          description: 'Paga en 12 cuotas con interés competitivo',
          enabled: true,
          minAmount: 200000, // $200,000 COP
          maxAmount: 8000000, // $8,000,000 COP
          processingTime: 'Aprobación inmediata',
          fees: {
            percentage: 0,
            fixed: 0,
          },
          financing: {
            minInstallments: 12,
            maxInstallments: 12,
            interestRate: 2.2, // 2.2% mensual
            provider: 'ADDI',
          },
        },
      ];
    } catch (error) {
      logger.error('Error getting ADDI payment methods:', error);
      throw new PaymentGatewayError(
        'Failed to get payment methods',
        'GET_METHODS_ERROR',
        this.name
      );
    }
  }

  async getFinancingPlans(amount: number, customerData: AddiCustomerData): Promise<FinancingPlan[]> {
    try {
      const plans: FinancingPlan[] = [];

      // Plan 3 cuotas sin interés
      if (amount >= 50000 && amount <= 3000000) {
        plans.push({
          installments: 3,
          monthlyAmount: Math.round(amount / 3),
          totalAmount: amount,
          interestRate: 0,
          provider: 'ADDI',
          description: '3 cuotas sin interés - Aprobación inmediata',
        });
      }

      // Plan 6 cuotas
      if (amount >= 100000 && amount <= 5000000) {
        const monthlyRate = 1.5 / 100; // 1.5% mensual
        const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, 6)) / 
          (Math.pow(1 + monthlyRate, 6) - 1);
        const totalAmount = monthlyPayment * 6;

        plans.push({
          installments: 6,
          monthlyAmount: Math.round(monthlyPayment),
          totalAmount: Math.round(totalAmount),
          interestRate: 1.5,
          provider: 'ADDI',
          description: '6 cuotas con 1.5% mensual - Sin papeleos',
        });
      }

      // Plan 12 cuotas
      if (amount >= 200000 && amount <= 8000000) {
        const monthlyRate = 2.2 / 100; // 2.2% mensual
        const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, 12)) / 
          (Math.pow(1 + monthlyRate, 12) - 1);
        const totalAmount = monthlyPayment * 12;

        plans.push({
          installments: 12,
          monthlyAmount: Math.round(monthlyPayment),
          totalAmount: Math.round(totalAmount),
          interestRate: 2.2,
          provider: 'ADDI',
          description: '12 cuotas con 2.2% mensual - Mayor flexibilidad',
        });
      }

      return plans;
    } catch (error) {
      logger.error('Error getting ADDI financing plans:', error);
      throw new PaymentGatewayError(
        'Failed to get financing plans',
        'GET_PLANS_ERROR',
        this.name
      );
    }
  }

  async checkEligibility(customerData: AddiCustomerData): Promise<{
    eligible: boolean;
    creditLimit?: number;
    reason?: string;
  }> {
    try {
      const response = await this.client.post('/eligibility', {
        customer: {
          email: customerData.email,
          phone: customerData.phone,
          document_type: customerData.document.type,
          document_number: customerData.document.number,
          name: customerData.name,
        },
      });

      const eligibility = response.data.data;

      return {
        eligible: eligibility.eligible,
        creditLimit: eligibility.credit_limit,
        reason: eligibility.reason,
      };
    } catch (error) {
      logger.error('Error checking ADDI eligibility:', error);
      
      // En caso de error, asumimos elegibilidad básica
      return {
        eligible: true,
        creditLimit: 1000000, // $1,000,000 COP por defecto
        reason: 'Elegible para financiamiento básico',
      };
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const financingRequest = request as FinancingRequest;
    return this.createFinancing(financingRequest);
  }

  async createFinancing(request: FinancingRequest): Promise<FinancingResponse> {
    try {
      this.validateFinancingRequest(request);

      const addiRequest = this.buildAddiRequest(request);
      const response = await this.client.post('/applications', addiRequest);
      
      const application = response.data.data;
      
      return this.mapAddiResponse(application, request);
    } catch (error) {
      logger.error('Error creating ADDI financing:', error);
      
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new PaymentNetworkError(
          errorData?.message || 'Network error creating financing',
          this.name,
          error
        );
      }
      
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const response = await this.client.get(`/applications/${transactionId}`);
      const application = response.data.data;
      
      return {
        transactionId,
        status: this.mapAddiStatus(application.status),
        gatewayStatus: application.status,
        amount: application.amount,
        paidAmount: application.status === 'APPROVED' ? application.amount : 0,
        processedAt: application.approved_at ? new Date(application.approved_at) : undefined,
        gateway: this.name,
        metadata: {
          addiId: application.id,
          plan: application.plan,
          installments: application.plan?.installments,
        },
      };
    } catch (error) {
      logger.error('Error verifying ADDI financing:', error);
      throw new PaymentGatewayError(
        'Failed to verify financing',
        'VERIFY_ERROR',
        this.name,
        transactionId
      );
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      // ADDI maneja cancelaciones/reembolsos a través del dashboard
      // o API específica de cancelaciones
      const response = await this.client.post(`/applications/${request.transactionId}/cancel`, {
        reason: request.reason,
        amount: request.amount,
      });

      return {
        success: true,
        refundId: response.data.data.cancellation_id,
        transactionId: request.transactionId,
        amount: request.amount || 0,
        status: 'PENDING',
        gateway: this.name,
        metadata: {
          reason: request.reason,
          cancelledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error processing ADDI refund:', error);
      throw new PaymentGatewayError(
        'Failed to process refund',
        'REFUND_ERROR',
        this.name,
        request.transactionId
      );
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    try {
      if (signature && !this.validateWebhookSignature(payload, signature)) {
        throw new PaymentGatewayError(
          'Invalid webhook signature',
          'INVALID_SIGNATURE',
          this.name
        );
      }

      const event = payload.event;
      const application = payload.data?.application;

      if (!application) {
        throw new PaymentGatewayError(
          'Invalid webhook payload',
          'INVALID_PAYLOAD',
          this.name
        );
      }

      return {
        gateway: this.name,
        event,
        transactionId: application.reference || application.id,
        status: this.mapAddiStatus(application.status),
        data: payload,
        timestamp: new Date(payload.timestamp || Date.now()),
      };
    } catch (error) {
      logger.error('Error handling ADDI webhook:', error);
      throw error;
    }
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(`sha256=${expectedSignature}`),
        Buffer.from(signature)
      );
    } catch (error) {
      logger.error('Error validating ADDI webhook signature:', error);
      return false;
    }
  }

  async getTransaction(transactionId: string): Promise<PaymentVerification> {
    return this.verifyPayment(transactionId);
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    try {
      await this.client.get('/health');
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Failed to connect to ADDI API',
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private validateFinancingRequest(request: FinancingRequest): void {
    if (!request.amount || request.amount < 50000) {
      throw new PaymentValidationError(
        'Amount must be at least $50,000 COP for ADDI financing',
        this.name
      );
    }

    if (request.amount > 8000000) {
      throw new PaymentValidationError(
        'Amount cannot exceed $8,000,000 COP for ADDI financing',
        this.name
      );
    }

    if (!request.customer.email) {
      throw new PaymentValidationError(
        'Customer email is required',
        this.name
      );
    }

    if (!request.customer.document.number) {
      throw new PaymentValidationError(
        'Customer document is required',
        this.name
      );
    }

    if (!request.selectedPlan) {
      throw new PaymentValidationError(
        'Financing plan is required',
        this.name
      );
    }
  }

  private buildAddiRequest(request: FinancingRequest): any {
    return {
      merchant: {
        reference: request.reference,
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
        webhook_url: request.notificationUrl,
      },
      purchase: {
        amount: request.amount,
        currency: 'COP',
        description: request.description,
        items: request.metadata?.items || [],
      },
      customer: {
        email: request.customer.email,
        phone: request.customer.phone,
        document_type: request.customer.document.type,
        document_number: request.customer.document.number,
        name: request.customer.name,
        address: request.customerAddress,
      },
      financing: {
        installments: request.selectedPlan.installments,
        monthly_amount: request.selectedPlan.monthlyAmount,
        total_amount: request.selectedPlan.totalAmount,
        interest_rate: request.selectedPlan.interestRate,
      },
      metadata: request.metadata,
    };
  }

  private mapAddiResponse(application: AddiApplication, request: FinancingRequest): FinancingResponse {
    const fees = this.calculateFees(request.amount);
    
    // Calcular primera fecha de pago (30 días después de aprobación)
    const firstPaymentDate = new Date();
    firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

    return {
      success: true,
      transactionId: request.reference,
      gatewayTransactionId: application.id,
      status: this.mapAddiStatus(application.status),
      redirectUrl: `${this.config.baseUrl}/applications/${application.id}/approve`,
      gateway: this.name,
      method: request.method,
      amount: request.amount,
      fees,
      financingId: application.id,
      plan: request.selectedPlan,
      firstPaymentDate,
      approvalStatus: application.status as 'APPROVED' | 'PENDING' | 'DECLINED',
      metadata: {
        addiId: application.id,
        createdAt: application.created_at,
      },
    };
  }

  private mapAddiStatus(addiStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'PENDING': PaymentStatus.PENDING,
      'APPROVED': PaymentStatus.APPROVED,
      'DECLINED': PaymentStatus.DECLINED,
      'CANCELLED': PaymentStatus.CANCELLED,
      'EXPIRED': PaymentStatus.EXPIRED,
    };

    return statusMap[addiStatus] || PaymentStatus.PENDING;
  }

  private calculateFees(amount: number) {
    // ADDI no cobra comisiones al comercio, las absorbe del cliente
    return {
      gateway: 0,
      taxes: 0,
      total: 0,
    };
  }
}