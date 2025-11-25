// ============================================================================
// PAYMENT GATEWAY INTERFACE - COLOMBIA
// ============================================================================

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'PSE' | 'CARD' | 'NEQUI' | 'DAVIPLATA' | 'CASH' | 'BANK_TRANSFER' | 'FINANCING';
  icon: string;
  description: string;
  enabled: boolean;
  minAmount?: number;
  maxAmount?: number;
  processingTime: string;
  fees: {
    percentage: number;
    fixed: number; // COP
  };
  financing?: {
    minInstallments: number;
    maxInstallments: number;
    interestRate: number;
    provider: string;
  };
}

export interface PaymentRequest {
  orderId: string;
  amount: number; // COP
  currency: 'COP';
  customer: {
    email: string;
    name: string;
    phone: string;
    document: {
      type: 'CC' | 'CE' | 'NIT' | 'PP';
      number: string;
    };
  };
  method: PaymentMethod;
  returnUrl: string;
  cancelUrl: string;
  notificationUrl: string;
  description: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  gatewayTransactionId: string;
  status: PaymentStatus;
  redirectUrl?: string;
  qrCode?: string;
  paymentInstructions?: string;
  expiresAt?: Date;
  gateway: string;
  method: PaymentMethod;
  amount: number;
  fees: {
    gateway: number;
    taxes: number;
    total: number;
  };
  metadata?: Record<string, any>;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  ERROR = 'ERROR',
}

export interface PaymentVerification {
  transactionId: string;
  status: PaymentStatus;
  gatewayStatus: string;
  amount: number;
  paidAmount?: number;
  approvalCode?: string;
  errorCode?: string;
  errorMessage?: string;
  processedAt?: Date;
  gateway: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  processedAt?: Date;
  gateway: string;
  metadata?: Record<string, any>;
}

export interface WebhookPayload {
  gateway: string;
  event: string;
  transactionId: string;
  status: PaymentStatus;
  data: Record<string, any>;
  signature?: string;
  timestamp: Date;
}

// ============================================================================
// PAYMENT GATEWAY INTERFACE
// ============================================================================

export interface PaymentGateway {
  name: string;
  enabled: boolean;
  
  /**
   * Get available payment methods for this gateway
   */
  getPaymentMethods(): Promise<PaymentMethod[]>;
  
  /**
   * Create a payment transaction
   */
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  
  /**
   * Verify payment status
   */
  verifyPayment(transactionId: string): Promise<PaymentVerification>;
  
  /**
   * Process refund
   */
  refundPayment(request: RefundRequest): Promise<RefundResponse>;
  
  /**
   * Handle webhook notifications
   */
  handleWebhook(payload: any, signature?: string): Promise<WebhookPayload>;
  
  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: any, signature: string): boolean;
  
  /**
   * Get transaction details
   */
  getTransaction(transactionId: string): Promise<PaymentVerification>;
  
  /**
   * Check gateway health
   */
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }>;
}

// ============================================================================
// COLOMBIA SPECIFIC INTERFACES
// ============================================================================

export interface PSEBank {
  code: string;
  name: string;
  logo: string;
  enabled: boolean;
}

export interface PSEPaymentRequest extends PaymentRequest {
  bank: PSEBank;
  userType: 'NATURAL' | 'JURIDICA';
}

export interface CashPaymentResponse extends PaymentResponse {
  paymentCode: string;
  barcode: string;
  instructions: string;
  paymentLocations: string[];
}

export interface CardPaymentRequest extends PaymentRequest {
  card?: {
    token?: string;
    installments?: number;
  };
  saveCard?: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public code: string,
    public gateway: string,
    public transactionId?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

export class PaymentValidationError extends PaymentGatewayError {
  constructor(message: string, gateway: string, field?: string) {
    super(message, 'VALIDATION_ERROR', gateway);
    this.name = 'PaymentValidationError';
  }
}

export class PaymentNetworkError extends PaymentGatewayError {
  constructor(message: string, gateway: string, originalError?: any) {
    super(message, 'NETWORK_ERROR', gateway, undefined, originalError);
    this.name = 'PaymentNetworkError';
  }
}

export class PaymentDeclinedError extends PaymentGatewayError {
  constructor(
    message: string, 
    gateway: string, 
    transactionId: string,
    public declineReason?: string
  ) {
    super(message, 'PAYMENT_DECLINED', gateway, transactionId);
    this.name = 'PaymentDeclinedError';
  }
}

// ============================================================================
// FINANCING SPECIFIC INTERFACES
// ============================================================================

export interface FinancingPlan {
  installments: number;
  monthlyAmount: number;
  totalAmount: number;
  interestRate: number;
  provider: string;
  description: string;
}

export interface FinancingRequest extends PaymentRequest {
  selectedPlan: FinancingPlan;
  customerAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface FinancingResponse extends PaymentResponse {
  financingId: string;
  plan: FinancingPlan;
  firstPaymentDate?: Date;
  approvalStatus: 'APPROVED' | 'PENDING' | 'DECLINED';
  creditLimit?: number;
}

export interface FinancingGateway extends PaymentGateway {
  /**
   * Get available financing plans for a given amount
   */
  getFinancingPlans(amount: number, customerData: any): Promise<FinancingPlan[]>;
  
  /**
   * Check customer eligibility for financing
   */
  checkEligibility(customerData: any): Promise<{
    eligible: boolean;
    creditLimit?: number;
    reason?: string;
  }>;
  
  /**
   * Create financing application
   */
  createFinancing(request: FinancingRequest): Promise<FinancingResponse>;
}