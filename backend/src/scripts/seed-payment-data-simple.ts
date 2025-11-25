import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPaymentDataSimple() {
  console.log('🌱 Seeding payment data (simple)...');

  try {
    // Get existing customers and orders
    const customers = await prisma.customer.findMany({ take: 3 });
    const orders = await prisma.order.findMany({ take: 4 });

    if (customers.length === 0 || orders.length === 0) {
      console.log('⚠️ No customers or orders found. Run npm run db:seed first.');
      return;
    }

    console.log(`Found ${customers.length} customers and ${orders.length} orders`);

    // Create payment transactions with realistic data
    const now = new Date();
    const paymentTransactions = [
      {
        id: 'txn-1',
        orderId: orders[0]?.id || 'order-1',
        amount: 450000,
        currency: 'COP',
        method: 'pse',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_001',
        status: 'PAID',
        metadata: {
          status: 'approved',
          bank: 'bancolombia',
          reference: 'PSE001',
        },
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'txn-2',
        orderId: orders[1]?.id || 'order-2',
        amount: 320000,
        currency: 'COP',
        method: 'card',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_002',
        status: 'PAID',
        metadata: {
          status: 'approved',
          cardType: 'visa',
          last4: '4242',
        },
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'txn-3',
        orderId: orders[2]?.id || 'order-3',
        amount: 850000,
        currency: 'COP',
        method: 'card',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_003',
        status: 'FAILED',
        metadata: {
          status: 'rejected',
          reason: 'insufficient_funds',
        },
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        id: 'txn-4',
        orderId: orders[3]?.id || orders[0]?.id || 'order-4',
        amount: 640000,
        currency: 'COP',
        method: 'nequi',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_004',
        status: 'PAID',
        metadata: {
          status: 'approved',
          phone: '+573001234567',
        },
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        id: 'txn-5',
        orderId: orders[0]?.id || 'order-1',
        amount: 100000,
        currency: 'COP',
        method: 'pse',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_005',
        status: 'PENDING',
        metadata: {
          status: 'pending',
          redirectUrl: 'https://sandbox.wompi.co/redirect/test',
        },
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ];

    for (const transaction of paymentTransactions) {
      await prisma.paymentTransaction.upsert({
        where: { id: transaction.id },
        update: {},
        create: transaction,
      });
    }

    // Create some failed attempts
    const failedAttempts = [
      {
        orderId: orders[2]?.id || 'order-3',
        gateway: 'wompi',
        method: 'card',
        amount: 850000,
        errorCode: 'INSUFFICIENT_FUNDS',
        errorMessage: 'Fondos insuficientes',
        metadata: {
          cardType: 'visa',
          last4: '0002',
          reason: 'Fondos insuficientes en la tarjeta',
        },
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        orderId: orders[1]?.id || 'order-2',
        gateway: 'wompi',
        method: 'pse',
        amount: 320000,
        errorCode: 'BANK_TIMEOUT',
        errorMessage: 'Timeout del banco',
        metadata: {
          bank: 'davivienda',
          reason: 'El banco no respondió a tiempo',
        },
        createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
      },
    ];

    for (const attempt of failedAttempts) {
      await prisma.paymentFailedAttempt.create({
        data: attempt,
      });
    }

    // Create some webhook events
    const webhookEvents = [
      {
        gateway: 'wompi',
        event: 'payment.approved',
        transactionId: 'txn-1',
        status: 'PAID',
        data: JSON.stringify({
          transactionId: 'txn-1',
          status: 'approved',
          amount: 450000,
        }),
        processedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        gateway: 'wompi',
        event: 'payment.approved',
        transactionId: 'txn-2',
        status: 'PAID',
        data: JSON.stringify({
          transactionId: 'txn-2',
          status: 'approved',
          amount: 320000,
        }),
        processedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        gateway: 'wompi',
        event: 'payment.rejected',
        transactionId: 'txn-3',
        status: 'FAILED',
        data: JSON.stringify({
          transactionId: 'txn-3',
          status: 'rejected',
          reason: 'insufficient_funds',
        }),
        processedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    ];

    for (const event of webhookEvents) {
      await prisma.paymentWebhookEvent.create({
        data: event,
      });
    }

    // Create a refund example
    await prisma.paymentRefund.create({
      data: {
        amount: 160000, // Partial refund
        reason: 'Cliente solicitó reembolso parcial',
        status: 'REFUNDED',
        gateway: 'wompi',
        gatewayRefundId: 'wompi_refund_001',
        metadata: {
          status: 'approved',
          refundId: 'wompi_refund_001',
        },
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        transaction: {
          connect: { id: 'txn-2' }
        }
      },
    });

    // Create gateway logs
    const gatewayLogs = [
      {
        gateway: 'wompi',
        operation: 'create_payment',
        request: JSON.stringify({
          amount: 450000,
          method: 'pse',
          bank: 'bancolombia',
        }),
        response: JSON.stringify({
          status: 'approved',
          transactionId: 'wompi_txn_001',
        }),
        responseTime: 1250,
        success: true,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        gateway: 'wompi',
        operation: 'create_payment',
        request: JSON.stringify({
          amount: 320000,
          method: 'card',
          cardType: 'visa',
        }),
        response: JSON.stringify({
          status: 'approved',
          transactionId: 'wompi_txn_002',
        }),
        responseTime: 890,
        success: true,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const log of gatewayLogs) {
      await prisma.paymentGatewayLog.create({
        data: log,
      });
    }

    console.log('✅ Payment data seeded successfully!');
    console.log(`
📊 Created:
- ${paymentTransactions.length} payment transactions
- ${failedAttempts.length} failed attempts
- ${webhookEvents.length} webhook events
- 1 refund
- ${gatewayLogs.length} gateway logs
    `);

  } catch (error) {
    console.error('❌ Error seeding payment data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedPaymentDataSimple()
    .then(() => {
      console.log('🎉 Payment data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Payment data seeding failed:', error);
      process.exit(1);
    });
}

export { seedPaymentDataSimple };