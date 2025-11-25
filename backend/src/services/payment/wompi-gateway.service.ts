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
  PSEBank,
  PSEPaymentRequest,
  CashPaymentResponse,
  PaymentGatewayError,
  PaymentValidationError,
  PaymentNetworkError,
} from './payment-gateway.interface';

// ============================================================================
// WOMPI GATEWAY IMPLEMENTATION
// ============================================================================

interface WompiConfig {
  publicKey: string;
  privateKey: string;
  baseUrl: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
}

interface WompiTransaction {
  id: string;
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: any;
  redirect_url: string;
  reference: string;
  status: string;
  created_at: string;
  finalized_at?: string;
  payment_link_id?: string;
  payment_source_id?: string;
}

export class WompiGatewayService implements PaymentGateway {
  name = 'Wompi';
  enabled = true;
  
  private client: AxiosInstance;
  private config: WompiConfig;

  constructor() {
    this.config = {
      publicKey: process.env.WOMPI_PUBLIC_KEY || '',
      privateKey: process.env.WOMPI_PRIVATE_KEY || '',
      baseUrl: process.env.WOMPI_BASE_URL || 'https://production.wompi.co/v1',
      webhookSecret: process.env.WOMPI_WEBHOOK_SECRET || '',
      environment: (process.env.WOMPI_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    if (this.config.environment === 'sandbox') {
      this.config.baseUrl = 'https://sandbox.wompi.co/v1';
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.privateKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Wompi API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Wompi API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Wompi API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Wompi API Response Error:', {
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
      // Wompi payment methods for Colombia
      return [
        {
          id: 'pse',
          name: 'PSE',
          type: 'PSE',
          icon: '/images/payment-methods/pse.png',
          description: 'Paga desde tu cuenta bancaria',
          enabled: true,
          minAmount: 1000, // $1,000 COP
          maxAmount: 50000000, // $50,000,000 COP
          processingTime: 'Inmediato',
          fees: {
            percentage: 2.59,
            fixed: 900,
          },
        },
        {
          id: 'card',
          name: 'Tarjeta de Crédito/Débito',
          type: 'CARD',
          icon: '/images/payment-methods/cards.png',
          description: 'Visa, Mastercard, American Express',
          enabled: true,
          minAmount: 1000,
          maxAmount: 20000000,
          processingTime: 'Inmediato',
          fees: {
            percentage: 2.99,
            fixed: 900,
          },
        },
        {
          id: 'nequi',
          name: 'Nequi',
          type: 'NEQUI',
          icon: '/images/payment-methods/nequi.png',
          description: 'Paga con tu Nequi',
          enabled: true,
          minAmount: 1000,
          maxAmount: 4000000,
          processingTime: 'Inmediato',
          fees: {
            percentage: 2.59,
            fixed: 900,
          },
        },
        {
          id: 'bancolombia_transfer',
          name: 'Transferencia Bancolombia',
          type: 'BANK_TRANSFER',
          icon: '/images/payment-methods/bancolombia.png',
          description: 'Transferencia desde Bancolombia',
          enabled: true,
          minAmount: 1000,
          maxAmount: 50000000,
          processingTime: 'Inmediato',
          fees: {
            percentage: 2.59,
            fixed: 900,
          },
        },
      ];
    } catch (error) {
      logger.error('Error getting Wompi payment methods:', error);
      throw new PaymentGatewayError(
        'Failed to get payment methods',
        'GET_METHODS_ERROR',
        this.name
      );
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      const wompiRequest = this.buildWompiRequest(request);
      const response = await this.client.post('/transactions', wompiRequest);
      
      const transaction = response.data.data;
      
      return this.mapWompiResponse(transaction, request);
    } catch (error) {
      logger.error('Error creating Wompi payment:', error);
      
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new PaymentNetworkError(
          errorData?.error?.reason || 'Network error creating payment',
          this.name,
          error
        );
      }
      
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const response = await this.client.get(`/transactions/${transactionId}`);
      const transaction = response.data.data;
      
      return {
        transactionId,
        status: this.mapWompiStatus(transaction.status),
        gatewayStatus: transaction.status,
        amount: transaction.amount_in_cents / 100,
        paidAmount: transaction.amount_in_cents / 100,
        approvalCode: transaction.payment_method?.extra?.approval_code,
        processedAt: transaction.finalized_at ? new Date(transaction.finalized_at) : undefined,
        gateway: this.name,
        metadata: {
          wompiId: transaction.id,
          paymentMethod: transaction.payment_method,
        },
      };
    } catch (error) {
      logger.error('Error verifying Wompi payment:', error);
      throw new PaymentGatewayError(
        'Failed to verify payment',
        'VERIFY_ERROR',
        this.name,
        transactionId
      );
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      // Wompi doesn't support partial refunds via API
      // Full refunds only through dashboard or contact support
      throw new PaymentGatewayError(
        'Wompi refunds must be processed through dashboard',
        'REFUND_NOT_SUPPORTED',
        this.name,
        request.transactionId
      );
    } catch (error) {
      logger.error('Error processing Wompi refund:', error);
      throw error;
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
      const transaction = payload.data?.transaction;

      if (!transaction) {
        throw new PaymentGatewayError(
          'Invalid webhook payload',
          'INVALID_PAYLOAD',
          this.name
        );
      }

      return {
        gateway: this.name,
        event,
        transactionId: transaction.reference,
        status: this.mapWompiStatus(transaction.status),
        data: payload,
        timestamp: new Date(payload.timestamp || Date.now()),
      };
    } catch (error) {
      logger.error('Error handling Wompi webhook:', error);
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
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error validating Wompi webhook signature:', error);
      return false;
    }
  }

  async getTransaction(transactionId: string): Promise<PaymentVerification> {
    return this.verifyPayment(transactionId);
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    try {
      await this.client.get('/merchants/' + this.config.publicKey);
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Failed to connect to Wompi API',
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.amount || request.amount < 1000) {
      throw new PaymentValidationError(
        'Amount must be at least $1,000 COP',
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
  }

  private buildWompiRequest(request: PaymentRequest): any {
    const baseRequest = {
      amount_in_cents: Math.round(request.amount * 100),
      currency: 'COP',
      customer_email: request.customer.email,
      reference: request.reference,
      redirect_url: request.returnUrl,
    };

    // Add payment method specific data
    switch (request.method.type) {
      case 'PSE':
        const pseRequest = request as PSEPaymentRequest;
        return {
          ...baseRequest,
          payment_method: {
            type: 'PSE',
            user_type: pseRequest.userType || 'NATURAL',
            user_legal_id_type: request.customer.document.type,
            user_legal_id: request.customer.document.number,
            financial_institution_code: pseRequest.bank.code,
            payment_description: request.description,
          },
        };

      case 'CARD':
        return {
          ...baseRequest,
          payment_method: {
            type: 'CARD',
            installments: 1,
          },
          payment_source_id: undefined, // Will be set by frontend
        };

      case 'NEQUI':
        return {
          ...baseRequest,
          payment_method: {
            type: 'NEQUI',
            phone_number: request.customer.phone,
          },
        };

      case 'BANK_TRANSFER':
        return {
          ...baseRequest,
          payment_method: {
            type: 'BANCOLOMBIA_TRANSFER',
            user_type: 'NATURAL',
            user_legal_id_type: request.customer.document.type,
            user_legal_id: request.customer.document.number,
          },
        };

      default:
        throw new PaymentValidationError(
          `Unsupported payment method: ${request.method.type}`,
          this.name
        );
    }
  }

  private mapWompiResponse(transaction: WompiTransaction, request: PaymentRequest): PaymentResponse {
    const fees = this.calculateFees(request.amount, request.method);

    return {
      success: true,
      transactionId: request.reference,
      gatewayTransactionId: transaction.id,
      status: this.mapWompiStatus(transaction.status),
      redirectUrl: transaction.payment_link_id 
        ? `${this.config.baseUrl.replace('/v1', '')}/link/${transaction.payment_link_id}`
        : undefined,
      gateway: this.name,
      method: request.method,
      amount: request.amount,
      fees,
      metadata: {
        wompiId: transaction.id,
        paymentLinkId: transaction.payment_link_id,
      },
    };
  }

  private mapWompiStatus(wompiStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'PENDING': PaymentStatus.PENDING,
      'APPROVED': PaymentStatus.APPROVED,
      'DECLINED': PaymentStatus.DECLINED,
      'VOIDED': PaymentStatus.CANCELLED,
      'ERROR': PaymentStatus.ERROR,
    };

    return statusMap[wompiStatus] || PaymentStatus.PENDING;
  }

  private calculateFees(amount: number, method: PaymentMethod) {
    const gatewayFee = (amount * method.fees.percentage / 100) + method.fees.fixed;
    const taxes = gatewayFee * 0.19; // IVA 19%
    
    return {
      gateway: Math.round(gatewayFee),
      taxes: Math.round(taxes),
      total: Math.round(gatewayFee + taxes),
    };
  }

  // ============================================================================
  // PSE SPECIFIC METHODS
  // ============================================================================

  async getPSEBanks(): Promise<PSEBank[]> {
    try {
      const response = await this.client.get('/pse/financial_institutions');
      
      return response.data.data.map((bank: any) => ({
        code: bank.financial_institution_code,
        name: bank.financial_institution_name,
        logo: `/images/banks/${bank.financial_institution_code.toLowerCase()}.png`,
        enabled: true,
      }));
    } catch (error) {
      logger.error('Error getting PSE banks:', error);
      throw new PaymentGatewayError(
        'Failed to get PSE banks',
        'GET_BANKS_ERROR',
        this.name
      );
    }
  }
}