/**
 * Test Data Factories
 * Provides consistent, reusable test data generators
 */

import { faker } from '@faker-js/faker';

// Set seed for consistent fake data in tests
faker.seed(12345);

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  password?: string;
  createdAt?: Date;
}

export interface TestProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  materials: string;
  dimensions: string;
  care: string;
  inStock: boolean;
  featured: boolean;
  images: TestProductImage[];
  tags: string[];
  inventory?: {
    quantity: number;
    reserved: number;
  };
}

export interface TestProductImage {
  id?: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  order: number;
}

export interface TestCustomer {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  addresses: TestAddress[];
  createdAt?: Date;
}

export interface TestAddress {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface TestOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  paymentMethod: string;
  items: TestOrderItem[];
  shippingAddress: TestAddress;
  createdAt?: Date;
}

export interface TestOrderItem {
  id?: string;
  productId: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface TestPaymentMethod {
  id: string;
  name: string;
  type: 'PSE' | 'CARD' | 'NEQUI' | 'CASH' | 'FINANCING';
  enabled: boolean;
  description: string;
  processingTime: string;
  fees: {
    percentage: number;
    fixed: number;
  };
}

/**
 * User Factory
 */
export class UserFactory {
  static create(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: 'CUSTOMER',
      password: 'TestPassword123!',
      createdAt: faker.date.recent(),
      ...overrides
    };
  }

  static createAdmin(overrides: Partial<TestUser> = {}): TestUser {
    return this.create({
      role: 'ADMIN',
      email: faker.internet.email({ provider: 'admin.oliviagold.com' }),
      ...overrides
    });
  }

  static createBatch(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

/**
 * Product Factory
 */
export class ProductFactory {
  private static readonly CATEGORIES = ['Anillos', 'Collares', 'Pulseras', 'Aretes', 'Conjuntos'];
  private static readonly SUBCATEGORIES = ['Oro', 'Plata', 'Oro Rosa', 'Acero'];
  private static readonly MATERIALS = [
    'Oro laminado 14k',
    'Oro laminado 18k',
    'Plata 925',
    'Acero quirúrgico',
    'Oro rosa laminado'
  ];

  static create(overrides: Partial<TestProduct> = {}): TestProduct {
    const category = faker.helpers.arrayElement(this.CATEGORIES);
    const subcategory = faker.helpers.arrayElement(this.SUBCATEGORIES);
    
    return {
      id: faker.string.uuid(),
      name: `${category.slice(0, -1)} ${faker.commerce.productAdjective()}`,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 50, max: 800 })),
      category,
      subcategory,
      materials: faker.helpers.arrayElement(this.MATERIALS),
      dimensions: `${faker.number.int({ min: 1, max: 5 })}cm x ${faker.number.int({ min: 1, max: 5 })}cm`,
      care: 'Limpiar con paño suave, evitar contacto con químicos',
      inStock: true,
      featured: faker.datatype.boolean(),
      images: this.createImages(faker.number.int({ min: 1, max: 4 })),
      tags: faker.helpers.arrayElements(['elegante', 'moderno', 'clásico', 'casual', 'formal'], { min: 1, max: 3 }),
      inventory: {
        quantity: faker.number.int({ min: 0, max: 100 }),
        reserved: faker.number.int({ min: 0, max: 10 })
      },
      ...overrides
    };
  }

  static createFeatured(overrides: Partial<TestProduct> = {}): TestProduct {
    return this.create({
      featured: true,
      inStock: true,
      price: parseFloat(faker.commerce.price({ min: 200, max: 800 })),
      ...overrides
    });
  }

  private static createImages(count: number): TestProductImage[] {
    return Array.from({ length: count }, (_, index) => ({
      id: faker.string.uuid(),
      url: faker.image.url({ width: 400, height: 400 }),
      altText: faker.commerce.productName(),
      isPrimary: index === 0,
      order: index
    }));
  }

  static createBatch(count: number, overrides: Partial<TestProduct> = {}): TestProduct[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createByCategory(category: string, count: number = 5): TestProduct[] {
    return this.createBatch(count, { category });
  }
}

/**
 * Customer Factory
 */
export class CustomerFactory {
  static create(overrides: Partial<TestCustomer> = {}): TestCustomer {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      phone: '+57' + faker.phone.number('### ### ####'),
      status: 'ACTIVE',
      addresses: [this.createAddress({ isDefault: true })],
      createdAt: faker.date.recent(),
      ...overrides
    };
  }

  static createAddress(overrides: Partial<TestAddress> = {}): TestAddress {
    return {
      id: faker.string.uuid(),
      street: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']),
      state: faker.helpers.arrayElement(['Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Bolívar']),
      zipCode: faker.location.zipCode('#####'),
      country: 'Colombia',
      isDefault: false,
      ...overrides
    };
  }

  static createWithMultipleAddresses(addressCount: number = 3): TestCustomer {
    const addresses = Array.from({ length: addressCount }, (_, index) =>
      this.createAddress({ isDefault: index === 0 })
    );

    return this.create({ addresses });
  }

  static createBatch(count: number, overrides: Partial<TestCustomer> = {}): TestCustomer[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

/**
 * Order Factory
 */
export class OrderFactory {
  static create(overrides: Partial<TestOrder> = {}): TestOrder {
    const customer = CustomerFactory.create();
    const items = this.createOrderItems(faker.number.int({ min: 1, max: 5 }));
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.19; // 19% IVA Colombia
    const shippingAmount = subtotal > 200 ? 0 : 15; // Free shipping over $200
    const discountAmount = 0;
    const total = subtotal + taxAmount + shippingAmount - discountAmount;

    return {
      id: faker.string.uuid(),
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']),
      total: parseFloat(total.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      shippingAmount,
      discountAmount,
      paymentMethod: faker.helpers.arrayElement(['Tarjeta de Crédito', 'PSE', 'Nequi', 'Contraentrega']),
      items,
      shippingAddress: customer.addresses[0],
      createdAt: faker.date.recent(),
      ...overrides
    };
  }

  private static createOrderItems(count: number): TestOrderItem[] {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      productId: faker.string.uuid(),
      quantity: faker.number.int({ min: 1, max: 3 }),
      price: parseFloat(faker.commerce.price({ min: 50, max: 300 })),
      size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'Única'])
    }));
  }

  static createPending(overrides: Partial<TestOrder> = {}): TestOrder {
    return this.create({
      status: 'PENDING',
      ...overrides
    });
  }

  static createDelivered(overrides: Partial<TestOrder> = {}): TestOrder {
    return this.create({
      status: 'DELIVERED',
      createdAt: faker.date.past(),
      ...overrides
    });
  }

  static createBatch(count: number, overrides: Partial<TestOrder> = {}): TestOrder[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

/**
 * Payment Method Factory
 */
export class PaymentMethodFactory {
  static create(overrides: Partial<TestPaymentMethod> = {}): TestPaymentMethod {
    return {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement(['Tarjeta de Crédito', 'PSE', 'Nequi', 'Daviplata']),
      type: faker.helpers.arrayElement(['CARD', 'PSE', 'NEQUI', 'CASH']),
      enabled: true,
      description: faker.lorem.sentence(),
      processingTime: faker.helpers.arrayElement(['Inmediato', '1-2 días hábiles', '3-5 días hábiles']),
      fees: {
        percentage: parseFloat(faker.number.float({ min: 0, max: 0.05, fractionDigits: 3 }).toFixed(3)),
        fixed: parseFloat(faker.commerce.price({ min: 0, max: 5 }))
      },
      ...overrides
    };
  }

  static createCreditCard(): TestPaymentMethod {
    return this.create({
      name: 'Tarjeta de Crédito',
      type: 'CARD',
      processingTime: 'Inmediato',
      fees: { percentage: 0.029, fixed: 0 }
    });
  }

  static createPSE(): TestPaymentMethod {
    return this.create({
      name: 'PSE',
      type: 'PSE',
      processingTime: 'Inmediato',
      fees: { percentage: 0.019, fixed: 0 }
    });
  }

  static createBatch(count: number): TestPaymentMethod[] {
    return Array.from({ length: count }, () => this.create());
  }
}

/**
 * Database Seeder for Tests
 */
export class TestDataSeeder {
  static async seedBasicData() {
    const products = ProductFactory.createBatch(20);
    const customers = CustomerFactory.createBatch(10);
    const orders = OrderFactory.createBatch(15);
    const paymentMethods = PaymentMethodFactory.createBatch(5);

    return {
      products,
      customers,
      orders,
      paymentMethods
    };
  }

  static async seedEcommerceScenario() {
    // Featured products
    const featuredProducts = ProductFactory.createBatch(5, { featured: true });
    
    // Products by category
    const rings = ProductFactory.createByCategory('Anillos', 8);
    const necklaces = ProductFactory.createByCategory('Collares', 6);
    const bracelets = ProductFactory.createByCategory('Pulseras', 4);
    
    // Customers with different profiles
    const vipCustomers = CustomerFactory.createBatch(3, { status: 'ACTIVE' });
    const regularCustomers = CustomerFactory.createBatch(10);
    
    // Orders with different statuses
    const pendingOrders = OrderFactory.createBatch(5, { status: 'PENDING' });
    const deliveredOrders = OrderFactory.createBatch(10, { status: 'DELIVERED' });
    
    // Payment methods
    const paymentMethods = [
      PaymentMethodFactory.createCreditCard(),
      PaymentMethodFactory.createPSE(),
      PaymentMethodFactory.create({ name: 'Nequi', type: 'NEQUI' }),
      PaymentMethodFactory.create({ name: 'Contraentrega', type: 'CASH' })
    ];

    return {
      products: [...featuredProducts, ...rings, ...necklaces, ...bracelets],
      customers: [...vipCustomers, ...regularCustomers],
      orders: [...pendingOrders, ...deliveredOrders],
      paymentMethods
    };
  }
}

/**
 * Test Utilities
 */
export class TestUtils {
  static async waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }

  static randomString(length = 10): string {
    return faker.string.alpha(length);
  }

  static randomEmail(): string {
    return faker.internet.email();
  }

  static randomPrice(min = 10, max = 1000): number {
    return parseFloat(faker.commerce.price({ min, max }));
  }

  static colombianPhone(): string {
    return '+57' + faker.phone.number('### ### ####');
  }

  static colombianAddress(): TestAddress {
    return CustomerFactory.createAddress();
  }
}

// Export factories for easy importing
export {
  UserFactory as User,
  ProductFactory as Product,
  CustomerFactory as Customer,
  OrderFactory as Order,
  PaymentMethodFactory as PaymentMethod
};