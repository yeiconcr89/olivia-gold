import express from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const paymentRequestSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(1000), // Minimum $1,000 COP
  customer: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().min(10),
    document: z.object({
      type: z.enum(['CC', 'CE', 'NIT', 'PP']),
      number: z.string().min(1),
    }),
  }),
  methodId: z.string().min(1),
  description: z.string().min(1),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// ============================================================================
// PAYMENT METHODS ENDPOINTS
// ============================================================================

// Get available payment methods
router.get('/methods', async (req, res) => {
  try {
    // Mock payment methods for now
    const methods = [
      {
        id: 'credit_card',
        name: 'Tarjeta de Crédito',
        type: 'CARD',
        enabled: true,
        fees: { percentage: 3.5, fixed: 900 },
        logo: 'https://via.placeholder.com/40x25/007bff/ffffff?text=CARD',
        description: 'Paga con tarjeta de crédito Visa, Mastercard'
      },
      {
        id: 'pse',
        name: 'PSE',
        type: 'BANK_TRANSFER',
        enabled: true,
        fees: { percentage: 1.95, fixed: 0 },
        logo: 'https://via.placeholder.com/40x25/28a745/ffffff?text=PSE',
        description: 'Débito desde tu cuenta bancaria'
      },
      {
        id: 'nequi',
        name: 'Nequi',
        type: 'DIGITAL_WALLET',
        enabled: true,
        fees: { percentage: 2.0, fixed: 0 },
        logo: 'https://via.placeholder.com/40x25/ff6b35/ffffff?text=NEQUI',
        description: 'Paga desde tu billetera Nequi'
      }
    ];

    res.json({
      success: true,
      methods
    });
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métodos de pago',
    });
  }
});

// ============================================================================
// PAYMENT PROCESSING ENDPOINTS
// ============================================================================

// Create payment request
router.post('/create', async (req, res) => {
  try {
    const validatedData = paymentRequestSchema.parse(req.body);
    
    // Mock payment creation
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate payment gateway response
    const paymentResponse = {
      id: paymentId,
      status: 'PENDING',
      amount: validatedData.amount,
      currency: 'COP',
      orderId: validatedData.orderId,
      paymentUrl: `https://checkout.wompi.co/p/${paymentId}`, // Mock URL
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    };

    logger.info('Payment created:', { paymentId, orderId: validatedData.orderId });

    res.json({
      success: true,
      payment: paymentResponse
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors
      });
    }

    logger.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el pago',
    });
  }
});

// Verify payment status
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Mock payment status verification
    const mockStatuses = ['PENDING', 'APPROVED', 'DECLINED', 'ERROR'];
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];

    const paymentStatus = {
      id: paymentId,
      status: randomStatus,
      statusMessage: randomStatus === 'APPROVED' ? 'Pago aprobado' : 
                    randomStatus === 'DECLINED' ? 'Pago rechazado' :
                    randomStatus === 'ERROR' ? 'Error en el pago' : 'Pago pendiente',
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      payment: paymentStatus
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el pago',
    });
  }
});

// ============================================================================
// WEBHOOK ENDPOINTS
// ============================================================================

// Handle payment webhooks
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    
    logger.info('Payment webhook received:', webhookData);

    // Mock webhook processing
    // In a real implementation, you would:
    // 1. Verify webhook signature
    // 2. Update payment status in database
    // 3. Update order status
    // 4. Send confirmation emails

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook',
    });
  }
});

// ============================================================================
// TRANSACTION HISTORY
// ============================================================================

// Get payment transactions
router.get('/transactions', async (req, res) => {
  try {
    // Mock transaction data
    const transactions = [
      {
        id: 'txn_1',
        paymentId: 'pay_123',
        orderId: 'order_456',
        amount: 150000,
        status: 'APPROVED',
        method: 'credit_card',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'txn_2',
        paymentId: 'pay_789',
        orderId: 'order_101',
        amount: 89900,
        status: 'PENDING',
        method: 'pse',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }
    ];

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones',
    });
  }
});

export default router;