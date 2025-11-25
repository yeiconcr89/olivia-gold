
import express from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/database-optimized';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

const createCheckoutDataSchema = z.object({
  orderId: z.string(),
});

router.post('/create-checkout-data', authenticateToken, async (req, res) => {
  try {
    const { orderId } = createCheckoutDataSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const reference = `OG-${order.id.substring(0, 8)}-${Date.now()}`;
    const amountInCents = Math.round(order.total * 100);
    const currency = 'COP';
    const wompiPublicKey = process.env.WOMPI_PUBLIC_KEY || '';
    const wompiIntegritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';

    const concatenatedString = `${reference}${amountInCents}${currency}${wompiIntegritySecret}`;
    const signature = crypto.createHash('sha256').update(concatenatedString).digest('hex');

    res.json({
      success: true,
      data: {
        publicKey: wompiPublicKey,
        reference,
        amountInCents,
        currency,
        signature,
        redirectUrl: `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`
      },
    });
  } catch (error) {
    logger.error('Error creating Wompi checkout data:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid request body', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
