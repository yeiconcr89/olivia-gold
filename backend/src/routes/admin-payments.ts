import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PaymentRouterService } from '../services/payment/payment-router.service';

const router = Router();
const prisma = new PrismaClient();
const paymentRouter = new PaymentRouterService();

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const transactionFiltersSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'REFUNDED']).optional(),
  gateway: z.enum(['wompi', 'payu']).optional(),
  method: z.enum(['card', 'pse', 'nequi', 'cash']).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});

// GET /api/admin/payments/dashboard - Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const dateFilter = {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    };

    // Get overview metrics
    const [
      totalTransactions,
      approvedTransactions,
      totalVolume,
      approvedVolume,
      refundedTransactions,
      refundedVolume,
      failedTransactions,
    ] = await Promise.all([
      // Total transactions
      prisma.paymentTransaction.count({
        where: dateFilter,
      }),
      
      // Approved transactions
      prisma.paymentTransaction.count({
        where: {
          ...dateFilter,
          status: 'APPROVED',
        },
      }),
      
      // Total volume
      prisma.paymentTransaction.aggregate({
        where: dateFilter,
        _sum: { amount: true },
      }),
      
      // Approved volume
      prisma.paymentTransaction.aggregate({
        where: {
          ...dateFilter,
          status: 'APPROVED',
        },
        _sum: { amount: true },
      }),
      
      // Refunded transactions
      prisma.paymentTransaction.count({
        where: {
          ...dateFilter,
          status: 'REFUNDED',
        },
      }),
      
      // Refunded volume
      prisma.paymentRefund.aggregate({
        where: {
          createdAt: dateFilter.createdAt,
          status: 'APPROVED',
        },
        _sum: { amount: true },
      }),
      
      // Failed transactions
      prisma.paymentTransaction.count({
        where: {
          ...dateFilter,
          status: { in: ['REJECTED', 'FAILED'] },
        },
      }),
    ]);

    // Calculate metrics
    const successRate = totalTransactions > 0 
      ? (approvedTransactions / totalTransactions) * 100 
      : 0;
    
    const averageTransactionValue = approvedTransactions > 0
      ? (approvedVolume._sum.amount || 0) / approvedTransactions
      : 0;

    // Get payment method breakdown
    const paymentMethodStats = await prisma.paymentTransaction.groupBy({
      by: ['method'],
      where: {
        ...dateFilter,
        status: 'APPROVED',
      },
      _count: { method: true },
      _sum: { amount: true },
    });

    // Get gateway performance
    const gatewayStats = await prisma.paymentTransaction.groupBy({
      by: ['gateway'],
      where: dateFilter,
      _count: { gateway: true },
      _avg: { amount: true },
    });

    // Get daily transaction trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrends = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
        SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as volume
      FROM payment_transactions 
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    res.json({
      success: true,
      data: {
        overview: {
          totalTransactions,
          approvedTransactions,
          failedTransactions,
          refundedTransactions,
          totalVolume: totalVolume._sum.amount || 0,
          approvedVolume: approvedVolume._sum.amount || 0,
          refundedVolume: refundedVolume._sum.amount || 0,
          successRate: Math.round(successRate * 100) / 100,
          averageTransactionValue: Math.round(averageTransactionValue),
        },
        paymentMethods: paymentMethodStats.map(stat => ({
          method: stat.method,
          count: stat._count.method,
          volume: stat._sum.amount || 0,
          percentage: totalTransactions > 0 
            ? Math.round((stat._count.method / totalTransactions) * 100 * 100) / 100
            : 0,
        })),
        gateways: gatewayStats.map(stat => ({
          gateway: stat.gateway,
          count: stat._count.gateway,
          averageAmount: Math.round(stat._avg.amount || 0),
        })),
        trends: dailyTrends,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard data',
    });
  }
});

// GET /api/admin/payments/transactions - List transactions with filters
router.get('/transactions', async (req, res) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const filters = transactionFiltersSchema.parse(req.query);
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const where: any = {
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(filters.status && { status: filters.status }),
      ...(filters.gateway && { gateway: filters.gateway }),
      ...(filters.method && { method: filters.method }),
      ...(filters.minAmount && { amount: { gte: filters.minAmount } }),
      ...(filters.maxAmount && { 
        amount: { 
          ...(filters.minAmount && { gte: filters.minAmount }),
          lte: filters.maxAmount 
        } 
      }),
    };

    const [transactions, totalCount] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          refunds: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      
      prisma.paymentTransaction.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pagination.limit);

    res.json({
      success: true,
      data: {
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          orderId: transaction.orderId,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          method: transaction.method,
          gateway: transaction.gateway,
          gatewayTransactionId: transaction.gatewayTransactionId,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          customer: transaction.order?.customer,
          refunds: transaction.refunds,
          hasRefunds: transaction.refunds.length > 0,
          totalRefunded: transaction.refunds
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => sum + r.amount, 0),
        })),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Transactions list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading transactions',
    });
  }
});

// GET /api/admin/payments/transaction/:id - Get transaction details
router.get('/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
        failedAttempts: {
          orderBy: { createdAt: 'desc' },
        },
        webhookEvents: {
          orderBy: { createdAt: 'desc' },
        },
        gatewayLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: {
        transaction: {
          ...transaction,
          gatewayResponse: transaction.gatewayResponse 
            ? JSON.parse(transaction.gatewayResponse as string)
            : null,
        },
      },
    });
  } catch (error) {
    console.error('Transaction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading transaction details',
    });
  }
});

// POST /api/admin/payments/transaction/:id/refund - Process refund
router.post('/transaction/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = z.object({
      amount: z.number().min(1),
      reason: z.string().min(1).max(500),
    }).parse(req.body);

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        refunds: {
          where: { status: 'APPROVED' },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Only approved transactions can be refunded',
      });
    }

    // Calculate already refunded amount
    const alreadyRefunded = transaction.refunds.reduce(
      (sum, refund) => sum + refund.amount, 
      0
    );

    if (alreadyRefunded + amount > transaction.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds available balance',
      });
    }

    // Process refund through payment gateway
    const refundResult = await paymentRouter.processRefund({
      transactionId: transaction.gatewayTransactionId!,
      amount,
      reason,
    });

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.message || 'Refund failed',
      });
    }

    // Save refund to database
    const refund = await prisma.paymentRefund.create({
      data: {
        paymentTransactionId: transaction.id,
        amount,
        reason,
        status: 'APPROVED',
        gatewayRefundId: refundResult.refundId,
        gatewayResponse: JSON.stringify(refundResult),
      },
    });

    // Update transaction status if fully refunded
    const totalRefunded = alreadyRefunded + amount;
    if (totalRefunded >= transaction.amount) {
      await prisma.paymentTransaction.update({
        where: { id },
        data: { status: 'REFUNDED' },
      });
    }

    res.json({
      success: true,
      data: {
        refund: {
          id: refund.id,
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status,
          createdAt: refund.createdAt,
        },
        totalRefunded,
        remainingAmount: transaction.amount - totalRefunded,
      },
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
    });
  }
});

// GET /api/admin/payments/analytics - Advanced analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const dateFilter = {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    };

    // Revenue analytics
    const revenueAnalytics = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as successful_transactions,
        SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as revenue,
        AVG(CASE WHEN status = 'APPROVED' THEN amount END) as avg_transaction_value,
        COUNT(CASE WHEN status IN ('REJECTED', 'FAILED') THEN 1 END) as failed_transactions
      FROM payment_transactions 
      WHERE created_at >= COALESCE(${startDate ? new Date(startDate) : null}, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE(${endDate ? new Date(endDate) : null}, NOW())
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `;

    // Payment method performance
    const methodPerformance = await prisma.$queryRaw`
      SELECT 
        method,
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as successful,
        COUNT(CASE WHEN status IN ('REJECTED', 'FAILED') THEN 1 END) as failed,
        SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as total_volume,
        AVG(CASE WHEN status = 'APPROVED' THEN amount END) as avg_amount,
        ROUND(
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0 / COUNT(*), 2
        ) as success_rate
      FROM payment_transactions 
      WHERE created_at >= COALESCE(${startDate ? new Date(startDate) : null}, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE(${endDate ? new Date(endDate) : null}, NOW())
      GROUP BY method
      ORDER BY total_volume DESC
    `;

    // Gateway performance
    const gatewayPerformance = await prisma.$queryRaw`
      SELECT 
        gateway,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as successful,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time,
        ROUND(
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0 / COUNT(*), 2
        ) as success_rate
      FROM payment_transactions 
      WHERE created_at >= COALESCE(${startDate ? new Date(startDate) : null}, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE(${endDate ? new Date(endDate) : null}, NOW())
      GROUP BY gateway
      ORDER BY total_requests DESC
    `;

    // Error analysis
    const errorAnalysis = await prisma.paymentFailedAttempt.groupBy({
      by: ['reason'],
      where: {
        createdAt: dateFilter.createdAt,
      },
      _count: { reason: true },
      orderBy: {
        _count: {
          reason: 'desc',
        },
      },
      take: 10,
    });

    // Customer insights
    const customerInsights = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT o.customer_id) as unique_customers,
        COUNT(*) as total_transactions,
        ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT o.customer_id), 2) as avg_transactions_per_customer,
        SUM(CASE WHEN pt.status = 'APPROVED' THEN pt.amount ELSE 0 END) / COUNT(DISTINCT o.customer_id) as avg_customer_value
      FROM payment_transactions pt
      JOIN orders o ON pt.order_id = o.id
      WHERE pt.created_at >= COALESCE(${startDate ? new Date(startDate) : null}, NOW() - INTERVAL '30 days')
        AND pt.created_at <= COALESCE(${endDate ? new Date(endDate) : null}, NOW())
    `;

    res.json({
      success: true,
      data: {
        revenue: revenueAnalytics,
        paymentMethods: methodPerformance,
        gateways: gatewayPerformance,
        errors: errorAnalysis.map(error => ({
          reason: error.reason,
          count: error._count.reason,
        })),
        customers: customerInsights[0] || {},
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading analytics data',
    });
  }
});

// GET /api/admin/payments/health - System health status
router.get('/health', async (req, res) => {
  try {
    // Get gateway health
    const gatewayHealth = await paymentRouter.getGatewayHealthStatus();

    // Get recent transaction stats (last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentStats = await prisma.paymentTransaction.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: oneHourAgo },
      },
      _count: { status: true },
    });

    // Get database health
    const dbHealth = await prisma.$queryRaw`SELECT 1 as healthy`;

    // Calculate system health score
    const totalRecent = recentStats.reduce((sum, stat) => sum + stat._count.status, 0);
    const successfulRecent = recentStats.find(s => s.status === 'APPROVED')?._count.status || 0;
    const recentSuccessRate = totalRecent > 0 ? (successfulRecent / totalRecent) * 100 : 100;

    const healthScore = Math.min(
      100,
      Math.round(
        (recentSuccessRate * 0.4) + // 40% weight on success rate
        (gatewayHealth.wompi?.status === 'healthy' ? 30 : 0) + // 30% weight on primary gateway
        (Array.isArray(dbHealth) && dbHealth.length > 0 ? 30 : 0) // 30% weight on database
      )
    );

    res.json({
      success: true,
      data: {
        overall: {
          status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
          score: healthScore,
          lastCheck: new Date().toISOString(),
        },
        gateways: gatewayHealth,
        database: {
          status: Array.isArray(dbHealth) && dbHealth.length > 0 ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
        },
        recentActivity: {
          totalTransactions: totalRecent,
          successfulTransactions: successfulRecent,
          successRate: Math.round(recentSuccessRate * 100) / 100,
          timeWindow: '1 hour',
        },
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking system health',
    });
  }
});

export default router;