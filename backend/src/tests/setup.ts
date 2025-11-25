import { PrismaClient } from '@prisma/client';
import testConfig from '../config/testing';

// Global test setup
let prisma: PrismaClient;

beforeAll(async () => {
  // Initialize test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: testConfig.database.url,
      },
    },
  });

  // Connect to database
  await prisma.$connect();
  
  // Clean database before tests
  await cleanDatabase();
});

afterAll(async () => {
  // Clean up after all tests
  await cleanDatabase();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});

async function cleanDatabase() {
  // Delete in correct order to respect foreign key constraints
  try {
    await prisma.paymentWebhookEvent.deleteMany();
  } catch (e) {
    // Table doesn't exist yet
  }
  try {
    await prisma.paymentGatewayLog.deleteMany();
  } catch (e) {
    // Table doesn't exist yet
  }
  try {
    await prisma.paymentRefund.deleteMany();
  } catch (e) {
    // Table doesn't exist yet
  }
  try {
    await prisma.paymentFailedAttempt.deleteMany();
  } catch (e) {
    // Table doesn't exist yet
  }
  try {
    await prisma.paymentTransaction.deleteMany();
  } catch (e) {
    // Table doesn't exist yet
  }
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
}

// Helper function to create test data
export async function createTestCustomer() {
  return await prisma.customer.create({
    data: {
      email: testConfig.testData.customer.email,
      name: testConfig.testData.customer.name,
      phone: testConfig.testData.customer.phone,
      status: 'ACTIVE',
      addresses: {
        create: {
          street: testConfig.testData.customer.address.line1,
          city: testConfig.testData.customer.address.city,
          state: testConfig.testData.customer.address.state,
          zipCode: testConfig.testData.customer.address.postalCode,
          country: 'Colombia',
          isDefault: true,
        }
      }
    },
  });
}

export async function createTestProduct() {
  return await prisma.product.create({
    data: {
      name: 'Test Product',
      description: 'Test product for payments',
      price: testConfig.testData.amounts.medium,
      category: 'test',
      subcategory: 'test-sub',
      materials: 'Test material',
      dimensions: '10x10cm',
      care: 'Test care instructions',
      inStock: true,
      featured: false,
      images: {
        create: {
          url: 'https://example.com/test-image.jpg',
          altText: 'Test image',
          isPrimary: true,
          order: 0,
        }
      },
      tags: {
        create: {
          tag: 'test'
        }
      }
    },
  });
}

export async function createTestOrder(customerId: string, productId: string) {
  return await prisma.order.create({
    data: {
      customerId,
      customerName: 'Test Customer',
      customerEmail: testConfig.testData.customer.email,
      customerPhone: testConfig.testData.customer.phone,
      status: 'PENDING',
      total: testConfig.testData.amounts.medium,
      subtotal: testConfig.testData.amounts.medium,
      taxAmount: testConfig.testData.amounts.medium * 0.19,
      shippingAmount: 0,
      discountAmount: 0,
      paymentMethod: 'Credit Card',
      items: {
        create: {
          productId,
          quantity: 1,
          price: testConfig.testData.amounts.medium,
        },
      },
      shippingAddress: {
        create: {
          street: testConfig.testData.customer.address.line1,
          city: testConfig.testData.customer.address.city,
          state: testConfig.testData.customer.address.state,
          zipCode: testConfig.testData.customer.address.postalCode,
          country: 'Colombia',
        }
      }
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            }
          }
        }
      },
      shippingAddress: true,
      customer: {
        select: {
          id: true,
          name: true,
          status: true,
        }
      }
    },
  });
}

export { prisma };
export default testConfig;