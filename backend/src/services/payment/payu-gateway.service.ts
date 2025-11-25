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
} from './payment-gateway.interface';

// ============================================================================
// PAYU GATEWAY IMPLEMENTATION - COLOMBIA
// ============================================================================

interface PayUConfig {
  apiKey: string;
  merchantId: string;
  accountId: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

interface PayUTransaction {
  orderId: string;
  transactionId: string;
  state: string;
  paymentNetworkResponseCode: string;
  paymentNetworkResponseErrorMessage?: string;
  trazabilityCode?: string;
  authorizationCode?: string;
  pendingReason?: string;
  responseCode: string;
  errorCode?: string;
  responseMessage: string;
  transactionDate: string;
  transactionTime: string;
  operationDate: string;
  extraParameters: any;
}

export class PayUGatewayService implements PaymentGateway {
  name = 'PayU';
  enabled = true;

  private client: AxiosInstance;
  private config: PayUConfig;

  constructor() {
    this.config = {
      apiKey: process.env.PAYU_API_KEY || '',
      merchantId: process.env.PAYU_MERCHANT_ID || '',
      accountId: process.env.PAYU_ACCOUNT_ID || '',
      baseUrl: process.env.PAYU_BASE_URL || 'https://api.payulatam.com',
      environment: (process.env.PAYU_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    if (this.config.environment === 'sandbox') {
      this.config.baseUrl = 'https://sandbox.api.payulatam.com';
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 60000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`PayU API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('PayU API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`PayU API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('PayU API Response Error:', {
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
          id: 'payu_pse',
          name: 'PSE (PayU)',
          type: 'PSE',
          icon: '/images/payment-methods/pse.png',
          description: 'Paga desde tu banco con PSE',
          enabled: true,
          minAmount: 1000,
          maxAmount: 50000000,
          processingTime: 'Inmediato',
          fees: {
            percentage: 3.49,
            fixed: 800,
          },
        },
        {
          id: 'payu_card',
          name: 'Tarjetas (PayU)',
          type: 'CARD',
          icon: '/images/payment-methods/cards.png',
          description: 'Visa, Mastercard, Diners, Amex',
          enabled: true,
          minAmount: 1000,
          maxAmount: 20000000,
          processingTime: 'Inmediato',
          fees: {
            percentage: 3.49,
            fixed: 800,
          },
        },
        {
          id: 'payu_cash',
          name: 'Efectivo (PayU)',
          type: 'CASH',
          icon: '/images/payment-methods/cash.png',
          description: 'Efecty, Baloto, Oxxo, y otros',
          enabled: true,
          minAmount: 1000,
          maxAmount: 5000000,
          processingTime: '24-72 horas',
          fees: {
            percentage: 2.2,
            fixed: 800,
          },
        },
      ];
    } catch (error) {
      logger.error('Error getting PayU payment methods:', error);
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

      // PayU uses different endpoints for different payment methods
      if (request.method.type === 'PSE') {
        return this.createPSEPayment(request);
      } else if (request.method.type === 'CASH') {
        return this.createCashPayment(request);
      } else {
        return this.createCardPayment(request);
      }
    } catch (error) {
      logger.error('Error creating PayU payment:', error);
      throw error;
    }
  }

  private async createCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const payuRequest = {
      language: 'es',
      command: 'SUBMIT_TRANSACTION',
      merchant: {
        apiKey: this.config.apiKey,
        apiLogin: this.config.merchantId,
      },
      transaction: {
        order: {
          accountId: this.config.accountId,
          referenceCode: request.reference,
          description: request.description,
          language: 'es',
          signature: this.generateSignature(request.reference, request.amount),
          notifyUrl: request.notificationUrl,
          additionalValues: {
            TX_VALUE: {
              value: request.amount,
              currency: 'COP',
            },
          },
          buyer: {
            merchantBuyerId: request.customer.document.number,
            fullName: request.customer.name,
            emailAddress: request.customer.email,
            contactPhone: request.customer.phone,
            dniNumber: request.customer.document.number,
            dniType: request.customer.document.type,
          },
        },
        type: 'AUTHORIZATION_AND_CAPTURE',
        paymentMethod: 'VISA', // This would be determined by card type
        paymentCountry: 'CO',
        deviceSessionId: `${Date.now()}`,
        ipAddress: '127.0.0.1',
        userAgent: 'PayU SDK',
        extraParameters: {
          RESPONSE_URL: request.returnUrl,
          CONFIRMATION_URL: request.notificationUrl,
        },
      },
    };

    const response = await this.client.post('/payments-api/4.0/service.cgi', payuRequest);
    const payuResponse = response.data;

    if (payuResponse.code === 'ERROR') {
      throw new PaymentGatewayError(
        payuResponse.error || 'PayU payment failed',
        'PAYMENT_ERROR',
        this.name,
        request.reference
      );
    }

    return this.mapPayUResponse(payuResponse, request);
  }

  private async createPSEPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Similar implementation for PSE
    // PayU requires bank list and user selection
    const payuRequest = {
      language: 'es',
      command: 'SUBMIT_TRANSACTION',
      merchant: {
        apiKey: this.config.apiKey,
        apiLogin: this.config.merchantId,
      },
      transaction: {
        order: {
          accountId: this.config.accountId,
          referenceCode: request.reference,
          description: request.description,
          language: 'es',
          signature: this.generateSignature(request.reference, request.amount),
          notifyUrl: request.notificationUrl,
          additionalValues: {
            TX_VALUE: {
              value: request.amount,
              currency: 'COP',
            },
          },
          buyer: {
            merchantBuyerId: request.customer.document.number,
            fullName: request.customer.name,
            emailAddress: request.customer.email,
            contactPhone: request.customer.phone,
            dniNumber: request.customer.document.number,
            dniType: request.customer.document.type,
          },
        },
        type: 'AUTHORIZATION_AND_CAPTURE',
        paymentMethod: 'PSE',
        paymentCountry: 'CO',
        deviceSessionId: `${Date.now()}`,
        ipAddress: '127.0.0.1',
        userAgent: 'PayU SDK',
        extraParameters: {
          RESPONSE_URL: request.returnUrl,
          CONFIRMATION_URL: request.notificationUrl,
          FINANCIAL_INSTITUTION_CODE: '1007', // Bancolombia default
          USER_TYPE: 'N',
          PSE_REFERENCE1: request.customer.document.number,
          PSE_REFERENCE2: request.customer.document.type,
        },
      },
    };

    const response = await this.client.post('/payments-api/4.0/service.cgi', payuRequest);
    return this.mapPayUResponse(response.data, request);
  }

  private async createCashPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Cash payment implementation
    const payuRequest = {
      language: 'es',
      command: 'SUBMIT_TRANSACTION',
      merchant: {
        apiKey: this.config.apiKey,
        apiLogin: this.config.merchantId,
      },
      transaction: {
        order: {
          accountId: this.config.accountId,
          referenceCode: request.reference,
          description: request.description,
          language: 'es',
          signature: this.generateSignature(request.reference, request.amount),
          notifyUrl: request.notificationUrl,
          additionalValues: {
            TX_VALUE: {
              value: request.amount,
              currency: 'COP',
            },
          },
          buyer: {
            merchantBuyerId: request.customer.document.number,
            fullName: request.customer.name,
            emailAddress: request.customer.email,
            contactPhone: request.customer.phone,
            dniNumber: request.customer.document.number,
            dniType: request.customer.document.type,
          },
        },
        type: 'AUTHORIZATION_AND_CAPTURE',
        paymentMethod: 'EFECTY',
        paymentCountry: 'CO',
        deviceSessionId: `${Date.now()}`,
        ipAddress: '127.0.0.1',
        userAgent: 'PayU SDK',
        extraParameters: {
          RESPONSE_URL: request.returnUrl,
          CONFIRMATION_URL: request.notificationUrl,
          EXPIRATION_DATE: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24 hours
        },
      },
    };

    const response = await this.client.post('/payments-api/4.0/service.cgi', payuRequest);
    return this.mapPayUResponse(response.data, request);
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const queryRequest = {
        language: 'es',
        command: 'ORDER_DETAIL_BY_REFERENCE_CODE',
        merchant: {
          apiKey: this.config.apiKey,
          apiLogin: this.config.merchantId,
        },
        details: {
          referenceCode: transactionId,
        },
      };

      const response = await this.client.post('/reports-api/4.0/service.cgi', queryRequest);
      const payuResponse = response.data;

      if (payuResponse.code === 'SUCCESS' && payuResponse.result?.payload?.length > 0) {
        const transaction = payuResponse.result.payload[0].transactions[0];
        
        return {
          transactionId,
          status: this.mapPayUStatus(transaction.state),
          gatewayStatus: transaction.state,
          amount: transaction.additionalValues?.TX_VALUE?.value || 0,
          paidAmount: transaction.state === 'APPROVED' ? transaction.additionalValues?.TX_VALUE?.value : 0,
          approvalCode: transaction.authorizationCode,
          errorCode: transaction.errorCode,
          errorMessage: transaction.responseMessage,
          processedAt: transaction.transactionDate ? new Date(transaction.transactionDate) : undefined,
          gateway: this.name,
          metadata: {
            payuTransactionId: transaction.id,
            trazabilityCode: transaction.trazabilityCode,
          },
        };
      }

      throw new PaymentGatewayError(
        'Transaction not found',
        'TRANSACTION_NOT_FOUND',
        this.name,
        transactionId
      );
    } catch (error) {
      logger.error('Error verifying PayU payment:', error);
      throw error;
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refundRequest = {
        language: 'es',
        command: 'SUBMIT_TRANSACTION',
        merchant: {
          apiKey: this.config.apiKey,
          apiLogin: this.config.merchantId,
        },
        transaction: {
          order: {
            id: request.transactionId,
          },
          type: 'REFUND',
          reason: request.reason,
          parentTransactionId: request.transactionId,
        },
      };

      if (request.amount) {
        refundRequest.transaction['additionalValues'] = {
          TX_VALUE: {
            value: request.amount,
            currency: 'COP',
          },
        };
      }

      const response = await this.client.post('/payments-api/4.0/service.cgi', refundRequest);
      const payuResponse = response.data;

      if (payuResponse.code === 'SUCCESS') {
        return {
          success: true,
          refundId: payuResponse.transactionResponse?.transactionId || '',
          transactionId: request.transactionId,
          amount: request.amount || 0,
          status: 'PENDING',
          processedAt: new Date(),
          gateway: this.name,
          metadata: {
            payuOrderId: payuResponse.transactionResponse?.orderId,
          },
        };
      }

      throw new PaymentGatewayError(
        payuResponse.error || 'Refund failed',
        'REFUND_ERROR',
        this.name,
        request.transactionId
      );
    } catch (error) {
      logger.error('Error processing PayU refund:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    try {
      // PayU webhook validation and processing
      const event = payload.state_pol === '4' ? 'APPROVED' : 
                   payload.state_pol === '6' ? 'DECLINED' : 'PENDING';

      return {
        gateway: this.name,
        event,
        transactionId: payload.reference_sale,
        status: this.mapPayUWebhookStatus(payload.state_pol),
        data: payload,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Error handling PayU webhook:', error);
      throw error;
    }
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    try {
      const signatureString = `${this.config.apiKey}~${this.config.merchantId}~${payload.reference_sale}~${payload.value}~${payload.currency}~${payload.state_pol}`;
      const expectedSignature = crypto
        .createHash('md5')
        .update(signatureString)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Error validating PayU webhook signature:', error);
      return false;
    }
  }

  async getTransaction(transactionId: string): Promise<PaymentVerification> {
    return this.verifyPayment(transactionId);
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    try {
      const pingRequest = {
        language: 'es',
        command: 'PING',
        merchant: {
          apiKey: this.config.apiKey,
          apiLogin: this.config.merchantId,
        },
      };

      const response = await this.client.post('/payments-api/4.0/service.cgi', pingRequest);
      
      if (response.data.code === 'SUCCESS') {
        return { status: 'healthy' };
      }

      return {
        status: 'unhealthy',
        message: 'PayU API is not responding correctly',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Failed to connect to PayU API',
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

  private generateSignature(referenceCode: string, amount: number): string {
    const signatureString = `${this.config.apiKey}~${this.config.merchantId}~${referenceCode}~${amount}~COP`;
    return crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');
  }

  private mapPayUResponse(payuResponse: any, request: PaymentRequest): PaymentResponse {
    const transaction = payuResponse.transactionResponse;
    const fees = this.calculateFees(request.amount, request.method);

    return {
      success: payuResponse.code === 'SUCCESS',
      transactionId: request.reference,
      gatewayTransactionId: transaction?.transactionId || '',
      status: this.mapPayUStatus(transaction?.state),
      redirectUrl: transaction?.extraParameters?.URL_PAYMENT_RECEIPT_HTML,
      gateway: this.name,
      method: request.method,
      amount: request.amount,
      fees,
      metadata: {
        payuOrderId: transaction?.orderId,
        trazabilityCode: transaction?.trazabilityCode,
        authorizationCode: transaction?.authorizationCode,
      },
    };
  }

  private mapPayUStatus(payuStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'APPROVED': PaymentStatus.APPROVED,
      'DECLINED': PaymentStatus.DECLINED,
      'PENDING': PaymentStatus.PENDING,
      'ERROR': PaymentStatus.ERROR,
      'EXPIRED': PaymentStatus.EXPIRED,
    };

    return statusMap[payuStatus] || PaymentStatus.PENDING;
  }

  private mapPayUWebhookStatus(statePol: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      '4': PaymentStatus.APPROVED,    // Aprobada
      '6': PaymentStatus.DECLINED,    // Rechazada
      '104': PaymentStatus.ERROR,     // Error
      '7': PaymentStatus.PENDING,     // Pendiente
      '5': PaymentStatus.EXPIRED,     // Expirada
    };

    return statusMap[statePol] || PaymentStatus.PENDING;
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
}