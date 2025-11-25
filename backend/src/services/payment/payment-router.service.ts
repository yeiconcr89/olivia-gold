import { logger } from '../../utils/logger';
import { prisma } from '../../config/database-optimized';
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
  FinancingGateway,
  FinancingPlan,
  FinancingRequest,
} from './payment-gateway.interface';
import { WompiGatewayService } from './wompi-gateway.service';
import { AddiGatewayService } from './addi-gateway.service';
// import { PayUGatewayService } from './payu-gateway.service'; // To be implemented

// ============================================================================
// PAYMENT ROUTER SERVICE
// ============================================================================

interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  priority: number;
  enabled: boolean;
  methods: string[]; // Payment method IDs this gateway supports
  maxRetries: number;
}

interface PaymentTransaction {
  id: string;
  orderId: string;
  gatewayTransactionId: string;
  gateway: string;
  method: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

export class PaymentRouterService {
  private gateways: PaymentGatewayConfig[] = [];
  private defaultRetries = 2;

  constructor() {
    this.initializeGateways();
  }

  private initializeGateways() {
    // Initialize Wompi as primary gateway
    const wompiGateway = new WompiGatewayService();
    this.gateways.push({
      gateway: wompiGateway,
      priority: 1,
      enabled: true,
      methods: ['pse', 'card', 'nequi', 'bancolombia_transfer'],
      maxRetries: 3,
    });

    // Initialize ADDI as financing gateway
    const addiGateway = new AddiGatewayService();
    this.gateways.push({
      gateway: addiGateway,
      priority: 2,
      enabled: true,
      methods: ['addi_3_months', 'addi_6_months', 'addi_12_months'],
      maxRetries: 2,
    });

    // TODO: Add PayU as secondary gateway
    // const payuGateway = new PayUGatewayService();
    // this.gateways.push({
    //   gateway: payuGateway,
    //   priority: 3,
    //   enabled: true,
    //   methods: ['pse', 'card', 'cash'],
    //   maxRetries: 2,
    // });

    // Sort by priority
    this.gateways.sort((a, b) => a.priority - b.priority);
    
    logger.info(`Payment router initialized with ${this.gateways.length} gateways`);
  }

  /**
   * Get all available payment methods from all gateways
   */
  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    const allMethods: PaymentMethod[] = [];
    const methodIds = new Set<string>();

    for (const config of this.gateways.filter(g => g.enabled)) {
      try {
        const methods = await config.gateway.getPaymentMethods();
        
        for (const method of methods) {
          // Avoid duplicates, prefer higher priority gateway
          if (!methodIds.has(method.id)) {
            methodIds.add(method.id);
            allMethods.push({
              ...method,
              // Add gateway info to metadata
              metadata: {
                ...method.metadata,
                preferredGateway: config.gateway.name,
              },
            });
          }
        }
      } catch (error) {
        logger.error(`Error getting methods from ${config.gateway.name}:`, error);
      }
    }

    return allMethods;
  }

  /**
   * Process payment with automatic gateway selection and failover
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const eligibleGateways = this.getEligibleGateways(request.method.id);
    
    if (eligibleGateways.length === 0) {
      throw new PaymentGatewayError(
        `No gateway available for payment method: ${request.method.id}`,
        'NO_GATEWAY_AVAILABLE',
        'PaymentRouter'
      );
    }

    let lastError: Error | null = null;

    // Try each gateway in priority order
    for (const config of eligibleGateways) {
      try {
        logger.info(`Attempting payment with ${config.gateway.name} for method ${request.method.id}`);
        
        const response = await this.attemptPaymentWithRetry(
          config.gateway,
          request,
          config.maxRetries
        );

        // Store transaction record
        await this.storeTransaction({
          id: response.transactionId,
          orderId: request.orderId,
          gatewayTransactionId: response.gatewayTransactionId,
          gateway: config.gateway.name,
          method: request.method.id,
          amount: request.amount,
          status: response.status,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            request: this.sanitizeRequest(request),
            response: this.sanitizeResponse(response),
          },
        });

        logger.info(`Payment successful with ${config.gateway.name}: ${response.transactionId}`);
        return response;

      } catch (error) {
        lastError = error as Error;
        logger.warn(`Payment failed with ${config.gateway.name}:`, error);
        
        // Store failed attempt
        await this.storeFailedAttempt(request, config.gateway.name, error as Error);
        
        // Continue to next gateway
        continue;
      }
    }

    // All gateways failed
    logger.error('All payment gateways failed for request:', {
      orderId: request.orderId,
      method: request.method.id,
      amount: request.amount,
    });

    throw new PaymentGatewayError(
      'All payment gateways failed',
      'ALL_GATEWAYS_FAILED',
      'PaymentRouter',
      request.orderId,
      lastError
    );
  }

  /**
   * Verify payment status across all gateways
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    // Get transaction record to know which gateway to use
    const transaction = await this.getTransactionRecord(transactionId);
    
    if (!transaction) {
      throw new PaymentGatewayError(
        'Transaction not found',
        'TRANSACTION_NOT_FOUND',
        'PaymentRouter',
        transactionId
      );
    }

    const gateway = this.getGatewayByName(transaction.gateway);
    if (!gateway) {
      throw new PaymentGatewayError(
        `Gateway not found: ${transaction.gateway}`,
        'GATEWAY_NOT_FOUND',
        'PaymentRouter',
        transactionId
      );
    }

    try {
      const verification = await gateway.verifyPayment(transaction.gatewayTransactionId);
      
      // Update transaction status if changed
      if (verification.status !== transaction.status) {
        await this.updateTransactionStatus(transactionId, verification.status);
      }

      return verification;
    } catch (error) {
      logger.error(`Error verifying payment ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    const transaction = await this.getTransactionRecord(request.transactionId);
    
    if (!transaction) {
      throw new PaymentGatewayError(
        'Transaction not found',
        'TRANSACTION_NOT_FOUND',
        'PaymentRouter',
        request.transactionId
      );
    }

    const gateway = this.getGatewayByName(transaction.gateway);
    if (!gateway) {
      throw new PaymentGatewayError(
        `Gateway not found: ${transaction.gateway}`,
        'GATEWAY_NOT_FOUND',
        'PaymentRouter',
        request.transactionId
      );
    }

    try {
      const refundResponse = await gateway.refundPayment({
        ...request,
        transactionId: transaction.gatewayTransactionId,
      });

      // Store refund record
      await this.storeRefundRecord(request.transactionId, refundResponse);

      return refundResponse;
    } catch (error) {
      logger.error(`Error processing refund for ${request.transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Handle webhook from any gateway
   */
  async handleWebhook(gatewayName: string, payload: any, signature?: string): Promise<WebhookPayload> {
    const gateway = this.getGatewayByName(gatewayName);
    
    if (!gateway) {
      throw new PaymentGatewayError(
        `Gateway not found: ${gatewayName}`,
        'GATEWAY_NOT_FOUND',
        'PaymentRouter'
      );
    }

    try {
      const webhookPayload = await gateway.handleWebhook(payload, signature);
      
      // Update transaction status
      await this.updateTransactionStatus(
        webhookPayload.transactionId,
        webhookPayload.status
      );

      // Store webhook event
      await this.storeWebhookEvent(webhookPayload);

      return webhookPayload;
    } catch (error) {
      logger.error(`Error handling webhook from ${gatewayName}:`, error);
      throw error;
    }
  }

  /**
   * Get financing plans from ADDI gateway
   */
  async getFinancingPlans(amount: number, customerData: any): Promise<FinancingPlan[]> {
    const addiGateway = this.getGatewayByName('ADDI') as AddiGatewayService;
    
    if (!addiGateway) {
      throw new PaymentGatewayError(
        'ADDI gateway not available',
        'GATEWAY_NOT_FOUND',
        'PaymentRouter'
      );
    }

    try {
      return await addiGateway.getFinancingPlans(amount, customerData);
    } catch (error) {
      logger.error('Error getting financing plans:', error);
      throw error;
    }
  }

  /**
   * Check customer eligibility for financing
   */
  async checkFinancingEligibility(customerData: any): Promise<{
    eligible: boolean;
    creditLimit?: number;
    reason?: string;
  }> {
    const addiGateway = this.getGatewayByName('ADDI') as AddiGatewayService;
    
    if (!addiGateway) {
      throw new PaymentGatewayError(
        'ADDI gateway not available',
        'GATEWAY_NOT_FOUND',
        'PaymentRouter'
      );
    }

    try {
      return await addiGateway.checkEligibility(customerData);
    } catch (error) {
      logger.error('Error checking financing eligibility:', error);
      throw error;
    }
  }

  /**
   * Get gateway health status
   */
  async getGatewayHealthStatus(): Promise<Record<string, any>> {
    const healthStatus: Record<string, any> = {};

    for (const config of this.gateways) {
      try {
        const health = await config.gateway.healthCheck();
        healthStatus[config.gateway.name] = {
          ...health,
          enabled: config.enabled,
          priority: config.priority,
          methods: config.methods,
        };
      } catch (error) {
        healthStatus[config.gateway.name] = {
          status: 'unhealthy',
          error: (error as Error).message,
          enabled: config.enabled,
        };
      }
    }

    return healthStatus;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getEligibleGateways(methodId: string): PaymentGatewayConfig[] {
    return this.gateways.filter(
      config => config.enabled && config.methods.includes(methodId)
    );
  }

  private getGatewayByName(name: string): PaymentGateway | null {
    const config = this.gateways.find(g => g.gateway.name === name);
    return config?.gateway || null;
  }

  private async attemptPaymentWithRetry(
    gateway: PaymentGateway,
    request: PaymentRequest,
    maxRetries: number
  ): Promise<PaymentResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await gateway.createPayment(request);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
          logger.warn(`Payment attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private async storeTransaction(transaction: PaymentTransaction): Promise<void> {
    try {
      await prisma.paymentTransaction.create({
        data: {
          id: transaction.id,
          orderId: transaction.orderId,
          gatewayTransactionId: transaction.gatewayTransactionId,
          gateway: transaction.gateway,
          method: transaction.method,
          amount: transaction.amount,
          status: transaction.status,
          metadata: transaction.metadata,
        },
      });
    } catch (error) {
      logger.error('Error storing transaction:', error);
      // Don't throw - this shouldn't fail the payment
    }
  }

  private async storeFailedAttempt(
    request: PaymentRequest,
    gatewayName: string,
    error: Error
  ): Promise<void> {
    try {
      await prisma.paymentFailedAttempt.create({
        data: {
          orderId: request.orderId,
          gateway: gatewayName,
          method: request.method.id,
          amount: request.amount,
          errorCode: (error as any).code || 'UNKNOWN',
          errorMessage: error.message,
          metadata: {
            request: this.sanitizeRequest(request),
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          },
        },
      });
    } catch (dbError) {
      logger.error('Error storing failed attempt:', dbError);
    }
  }

  private async getTransactionRecord(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const record = await prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
      });

      return record as PaymentTransaction | null;
    } catch (error) {
      logger.error('Error getting transaction record:', error);
      return null;
    }
  }

  private async updateTransactionStatus(
    transactionId: string,
    status: PaymentStatus
  ): Promise<void> {
    try {
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating transaction status:', error);
    }
  }

  private async storeRefundRecord(transactionId: string, refund: RefundResponse): Promise<void> {
    try {
      await prisma.paymentRefund.create({
        data: {
          id: refund.refundId,
          transactionId,
          amount: refund.amount,
          status: refund.status,
          gateway: refund.gateway,
          processedAt: refund.processedAt,
          metadata: refund.metadata,
        },
      });
    } catch (error) {
      logger.error('Error storing refund record:', error);
    }
  }

  private async storeWebhookEvent(webhook: WebhookPayload): Promise<void> {
    try {
      await prisma.paymentWebhookEvent.create({
        data: {
          gateway: webhook.gateway,
          event: webhook.event,
          transactionId: webhook.transactionId,
          status: webhook.status,
          data: webhook.data,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error storing webhook event:', error);
    }
  }

  private sanitizeRequest(request: PaymentRequest): any {
    // Remove sensitive data before storing
    return {
      orderId: request.orderId,
      amount: request.amount,
      currency: request.currency,
      method: request.method.id,
      customer: {
        email: request.customer.email,
        name: request.customer.name,
        // Don't store full document number
        documentType: request.customer.document.type,
      },
      description: request.description,
      reference: request.reference,
    };
  }

  private sanitizeResponse(response: PaymentResponse): any {
    // Remove sensitive data before storing
    return {
      transactionId: response.transactionId,
      gatewayTransactionId: response.gatewayTransactionId,
      status: response.status,
      gateway: response.gateway,
      method: response.method.id,
      amount: response.amount,
      fees: response.fees,
    };
  }
}

// Export singleton instance
export const paymentRouter = new PaymentRouterService();