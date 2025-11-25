import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPaymentData() {
  console.log('🌱 Seeding payment data...');

  try {
    // Create test customers if they don't exist
    const testCustomers = [
      {
        id: 'customer-1',
        email: 'maria.garcia@email.com',
        name: 'María García',
        phone: '+573001234567',
        status: 'ACTIVE' as const,
        notes: 'Cliente de Bogotá - Documento CC: 12345678',
      },
      {
        id: 'customer-2',
        email: 'carlos.rodriguez@email.com',
        name: 'Carlos Rodríguez',
        phone: '+573009876543',
        status: 'ACTIVE' as const,
        notes: 'Cliente de Medellín - Documento CC: 87654321',
      },
      {
        id: 'customer-3',
        email: 'ana.martinez@email.com',
        name: 'Ana Martínez',
        phone: '+573005555555',
        status: 'ACTIVE' as const,
        notes: 'Cliente de Cali - Documento CC: 11111111',
      },
    ];

    for (const customer of testCustomers) {
      await prisma.customer.upsert({
        where: { id: customer.id },
        update: {},
        create: customer,
      });
    }

    // Create test products if they don't exist
    const testProducts = [
      {
        id: 'product-1',
        name: 'Collar de Oro 18k',
        description: 'Hermoso collar de oro laminado 18k',
        price: 450000,
        category: 'collares',
        subcategory: 'oro',
        materials: 'Oro laminado 18k',
        dimensions: '45cm de largo',
        care: 'Limpiar con paño suave y seco',
        inStock: true,
        featured: true,
      },
      {
        id: 'product-2',
        name: 'Aretes de Diamante',
        description: 'Elegantes aretes con diamantes',
        price: 320000,
        category: 'aretes',
        subcategory: 'diamante',
        materials: 'Oro blanco 14k, diamantes',
        dimensions: '1.5cm de diámetro',
        care: 'Limpiar con paño suave, evitar químicos',
        inStock: true,
        featured: false,
      },
      {
        id: 'product-3',
        name: 'Anillo de Compromiso',
        description: 'Anillo de compromiso en oro blanco',
        price: 850000,
        category: 'anillos',
        subcategory: 'compromiso',
        materials: 'Oro blanco 18k, diamante central',
        dimensions: 'Tallas disponibles 6-10',
        care: 'Limpieza profesional recomendada',
        inStock: true,
        featured: true,
      },
    ];

    for (const product of testProducts) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {},
        create: {
          ...product,
          images: {
            create: [
              {
                url: `https://example.com/${product.category}1.jpg`,
                altText: product.name,
                isPrimary: true,
              }
            ]
          }
        },
      });
    }

    // Create test orders
    const testOrders = [
      {
        id: 'order-1',
        customerId: 'customer-1',
        status: 'PAID',
        total: 450000,
        subtotal: 378151,
        tax: 71849,
        shipping: 0,
      },
      {
        id: 'order-2',
        customerId: 'customer-2',
        status: 'PAID',
        total: 320000,
        subtotal: 268908,
        tax: 51092,
        shipping: 0,
      },
      {
        id: 'order-3',
        customerId: 'customer-3',
        status: 'PENDING',
        total: 850000,
        subtotal: 714286,
        tax: 135714,
        shipping: 0,
      },
      {
        id: 'order-4',
        customerId: 'customer-1',
        status: 'PAID',
        total: 640000,
        subtotal: 537815,
        tax: 102185,
        shipping: 0,
      },
    ];

    for (const order of testOrders) {
      await prisma.order.upsert({
        where: { id: order.id },
        update: {},
        create: order,
      });
    }

    // Create order items
    const orderItems = [
      { orderId: 'order-1', productId: 'product-1', quantity: 1, price: 450000 },
      { orderId: 'order-2', productId: 'product-2', quantity: 1, price: 320000 },
      { orderId: 'order-3', productId: 'product-3', quantity: 1, price: 850000 },
      { orderId: 'order-4', productId: 'product-2', quantity: 2, price: 320000 },
    ];

    for (const item of orderItems) {
      await prisma.orderItem.upsert({
        where: {
          orderId_productId: {
            orderId: item.orderId,
            productId: item.productId,
          },
        },
        update: {},
        create: item,
      });
    }

    // Create payment transactions with realistic data
    const now = new Date();
    const paymentTransactions = [
      {
        id: 'txn-1',
        orderId: 'order-1',
        amount: 450000,
        currency: 'COP',
        method: 'pse',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_001',
        status: 'APPROVED',
        gatewayResponse: JSON.stringify({
          status: 'approved',
          bank: 'bancolombia',
          reference: 'PSE001',
        }),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'txn-2',
        orderId: 'order-2',
        amount: 320000,
        currency: 'COP',
        method: 'card',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_002',
        status: 'APPROVED',
        gatewayResponse: JSON.stringify({
          status: 'approved',
          cardType: 'visa',
          last4: '4242',
        }),
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'txn-3',
        orderId: 'order-3',
        amount: 850000,
        currency: 'COP',
        method: 'card',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_003',
        status: 'REJECTED',
        gatewayResponse: JSON.stringify({
          status: 'rejected',
          reason: 'insufficient_funds',
        }),
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        id: 'txn-4',
        orderId: 'order-4',
        amount: 640000,
        currency: 'COP',
        method: 'nequi',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_004',
        status: 'APPROVED',
        gatewayResponse: JSON.stringify({
          status: 'approved',
          phone: '+573001234567',
        }),
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        id: 'txn-5',
        orderId: 'order-1',
        amount: 100000,
        currency: 'COP',
        method: 'pse',
        gateway: 'wompi',
        gatewayTransactionId: 'wompi_txn_005',
        status: 'PENDING',
        gatewayResponse: JSON.stringify({
          status: 'pending',
          redirectUrl: 'https://sandbox.wompi.co/redirect/test',
        }),
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
        orderId: 'order-3',
        gateway: 'wompi',
        method: 'card',
        amount: 850000,
        errorCode: 'INSUFFICIENT_FUNDS',
        errorMessage: 'Fondos insuficientes',
        reason: 'Fondos insuficientes en la tarjeta',
        metadata: JSON.stringify({
          cardType: 'visa',
          last4: '0002',
        }),
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        orderId: 'order-2',
        gateway: 'wompi',
        method: 'pse',
        amount: 320000,
        errorCode: 'BANK_TIMEOUT',
        errorMessage: 'Timeout del banco',
        reason: 'El banco no respondió a tiempo',
        metadata: JSON.stringify({
          bank: 'davivienda',
        }),
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
        status: 'APPROVED',
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
        status: 'APPROVED',
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
        status: 'REJECTED',
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
        paymentTransactionId: 'txn-2',
        amount: 160000, // Partial refund
        reason: 'Cliente solicitó reembolso parcial',
        status: 'APPROVED',
        gatewayRefundId: 'wompi_refund_001',
        gatewayResponse: JSON.stringify({
          status: 'approved',
          refundId: 'wompi_refund_001',
        }),
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
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
- ${testCustomers.length} customers
- ${testProducts.length} products  
- ${testOrders.length} orders
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
  seedPaymentData()
    .then(() => {
      console.log('🎉 Payment data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Payment data seeding failed:', error);
      process.exit(1);
    });
}

export { seedPaymentData };