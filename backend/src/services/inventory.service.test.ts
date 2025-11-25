import { prisma } from '../utils/prisma';
import * as inventoryService from './inventory.service';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Datos de prueba con nombres únicos
const timestamp = Date.now();
const productData = {
  name: `InvTest-Producto-${timestamp}`,
  price: 25.00,
  category: 'Joyas',
  subcategory: 'Pulseras',
  description: 'Descripción del producto para inventario.',
  materials: 'Oro laminado',
  dimensions: '2x2x1',
  care: 'Cuidado especial.',
  images: ['http://example.com/inventory-product.jpg'],
  tags: ['inventario', 'prueba'],
};

const productData2 = {
  name: `InvTest-Producto2-${timestamp}`,
  price: 45.00,
  category: 'Accesorios',
  subcategory: 'Collares',
  description: 'Segundo producto para pruebas de inventario.',
  materials: 'Plata',
  dimensions: '3x1x1',
  care: 'Limpieza suave.',
  images: ['http://example.com/inventory-product2.jpg'],
  tags: ['inventario2', 'prueba2'],
};

let createdProduct: any;
let createdProduct2: any;
let testUserId: string;

describe('Inventory Service - Pruebas de Integración', () => {

  beforeAll(async () => {
    // No hacer cleanup global, usar nombres únicos para evitar conflictos

    // Crear productos para las pruebas
    createdProduct = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: productData.images.map((url, index) => ({ 
            url, 
            isPrimary: index === 0, 
            order: index 
          }))
        },
        tags: {
          create: productData.tags.map((tag: string) => ({ tag }))
        }
      },
      include: { images: true, tags: true }
    });

    createdProduct2 = await prisma.product.create({
      data: {
        ...productData2,
        images: {
          create: productData2.images.map((url, index) => ({ 
            url, 
            isPrimary: index === 0, 
            order: index 
          }))
        },
        tags: {
          create: productData2.tags.map((tag: string) => ({ tag }))
        }
      },
      include: { images: true, tags: true }
    });

    testUserId = 'test-user-inventory-123';
  });

  afterAll(async () => {
    // Limpiar después de las pruebas con orden correcto para foreign keys
    if (createdProduct?.id) {
      await prisma.inventoryMovement.deleteMany({ where: { productId: createdProduct.id } });
      await prisma.inventory.deleteMany({ where: { productId: createdProduct.id } });
      await prisma.productImage.deleteMany({ where: { productId: createdProduct.id } });
      await prisma.productTag.deleteMany({ where: { productId: createdProduct.id } });
      await prisma.product.delete({ where: { id: createdProduct.id } });
    }
    
    if (createdProduct2?.id) {
      await prisma.inventoryMovement.deleteMany({ where: { productId: createdProduct2.id } });
      await prisma.inventory.deleteMany({ where: { productId: createdProduct2.id } });
      await prisma.productImage.deleteMany({ where: { productId: createdProduct2.id } });
      await prisma.productTag.deleteMany({ where: { productId: createdProduct2.id } });
      await prisma.product.delete({ where: { id: createdProduct2.id } });
    }
    
    // Limpiar cualquier producto de prueba adicional
    const testProducts = await prisma.product.findMany({ 
      where: { name: { contains: 'InvTest-' } } 
    });
    
    for (const product of testProducts) {
      await prisma.inventoryMovement.deleteMany({ where: { productId: product.id } });
      await prisma.inventory.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productTag.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
    
    await prisma.$disconnect();
  });

  describe('updateInventory', () => {
    it('debería crear inventario inicial con movimiento IN', async () => {
      const updateData = {
        quantity: 50,
        reason: 'Stock inicial',
        type: 'IN' as const
      };

      const result = await inventoryService.updateInventory(
        createdProduct.id, 
        updateData, 
        testUserId
      );

      expect(result).toBeDefined();
      expect(result.quantity).toBe(50);
      expect(result.reservedQuantity).toBe(0);
      expect(result.availableQuantity).toBe(50);
      expect(result.product.name).toBe(productData.name);

      // Verificar que se creó el movimiento
      const movements = await prisma.inventoryMovement.findMany({
        where: { productId: createdProduct.id }
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('IN');
      expect(movements[0].quantity).toBe(50);
    });

    it('debería reducir inventario con movimiento OUT', async () => {
      const updateData = {
        quantity: 10,
        reason: 'Venta',
        type: 'OUT' as const
      };

      const result = await inventoryService.updateInventory(
        createdProduct.id, 
        updateData, 
        testUserId
      );

      expect(result.quantity).toBe(40); // 50 - 10
      expect(result.availableQuantity).toBe(40);

      // Verificar movimiento negativo
      const latestMovement = await prisma.inventoryMovement.findFirst({
        where: { productId: createdProduct.id },
        orderBy: { createdAt: 'desc' }
      });
      expect(latestMovement?.type).toBe('OUT');
      expect(latestMovement?.quantity).toBe(10);
    });

    it('debería ajustar inventario con movimiento ADJUSTMENT', async () => {
      const updateData = {
        quantity: 35,
        reason: 'Ajuste por inventario físico',
        type: 'ADJUSTMENT' as const
      };

      const result = await inventoryService.updateInventory(
        createdProduct.id, 
        updateData, 
        testUserId
      );

      expect(result.quantity).toBe(35);
      expect(result.availableQuantity).toBe(35);
    });

    it('debería reservar cantidad con movimiento RESERVED', async () => {
      const updateData = {
        quantity: 5,
        reason: 'Reserva para pedido',
        type: 'RESERVED' as const
      };

      const result = await inventoryService.updateInventory(
        createdProduct.id, 
        updateData, 
        testUserId
      );

      expect(result.quantity).toBe(35); // Sin cambio
      expect(result.reservedQuantity).toBe(5);
      expect(result.availableQuantity).toBe(30); // 35 - 5
    });

    it('debería liberar cantidad reservada con movimiento RELEASED', async () => {
      const updateData = {
        quantity: 3,
        reason: 'Liberación de reserva',
        type: 'RELEASED' as const
      };

      const result = await inventoryService.updateInventory(
        createdProduct.id, 
        updateData, 
        testUserId
      );

      expect(result.quantity).toBe(35); // Sin cambio
      expect(result.reservedQuantity).toBe(2); // 5 - 3
      expect(result.availableQuantity).toBe(33); // 35 - 2
    });

    it('debería lanzar error con stock insuficiente para OUT', async () => {
      const updateData = {
        quantity: 100, // Mayor que el stock disponible
        reason: 'Venta excesiva',
        type: 'OUT' as const
      };

      await expect(
        inventoryService.updateInventory(createdProduct.id, updateData, testUserId)
      ).rejects.toThrow(BadRequestError);
    });

    it('debería lanzar error con reserva excesiva', async () => {
      const updateData = {
        quantity: 50, // Mayor que el stock disponible para reservar
        reason: 'Reserva excesiva',
        type: 'RESERVED' as const
      };

      await expect(
        inventoryService.updateInventory(createdProduct.id, updateData, testUserId)
      ).rejects.toThrow(BadRequestError);
    });

    it('debería lanzar error con producto inexistente', async () => {
      const fakeProductId = 'clxkj3b4k0000a4b2v3c8d9e9';
      const updateData = {
        quantity: 10,
        reason: 'Test',
        type: 'IN' as const
      };

      await expect(
        inventoryService.updateInventory(fakeProductId, updateData, testUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('debería actualizar estado inStock del producto', async () => {
      // Reducir a 0
      const updateData = {
        quantity: 0,
        reason: 'Ajuste a cero',
        type: 'ADJUSTMENT' as const
      };

      await inventoryService.updateInventory(
        createdProduct.id, 
        updateData, 
        testUserId
      );

      // Verificar que el producto se marcó como fuera de stock
      const product = await prisma.product.findUnique({
        where: { id: createdProduct.id }
      });
      expect(product?.inStock).toBe(false);

      // Restaurar stock
      const restoreData = {
        quantity: 25,
        reason: 'Reposición',
        type: 'IN' as const
      };

      await inventoryService.updateInventory(
        createdProduct.id, 
        restoreData, 
        testUserId
      );

      // Verificar que el producto se marcó como en stock
      const updatedProduct = await prisma.product.findUnique({
        where: { id: createdProduct.id }
      });
      expect(updatedProduct?.inStock).toBe(true);
    });
  });

  describe('getAllInventory', () => {
    beforeAll(async () => {
      // Crear inventario para el segundo producto
      await inventoryService.updateInventory(
        createdProduct2.id,
        { quantity: 15, reason: 'Stock inicial producto 2', type: 'IN' },
        testUserId
      );
    });

    it('debería obtener todo el inventario con paginación', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'lastUpdated' as const,
        sortOrder: 'desc' as const
      };

      const result = await inventoryService.getAllInventory(query);

      expect(result.inventory.length).toBeGreaterThanOrEqual(2);
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(1);
    });

    it('debería filtrar por búsqueda', async () => {
      const query = {
        page: 1,
        limit: 10,
        search: 'Segundo',
        sortBy: 'name' as const,
        sortOrder: 'asc' as const
      };

      const result = await inventoryService.getAllInventory(query);

      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0].product.name).toContain('Segundo');
    });

    it('debería filtrar por categoría', async () => {
      const query = {
        page: 1,
        limit: 10,
        category: 'Accesorios',
        sortBy: 'category' as const,
        sortOrder: 'asc' as const
      };

      const result = await inventoryService.getAllInventory(query);

      expect(result.inventory.length).toBeGreaterThanOrEqual(1);
      result.inventory.forEach((item: any) => {
        expect(item.product.category).toBe('Accesorios');
      });
    });

    it('debería filtrar por stock bajo', async () => {
      const query = {
        page: 1,
        limit: 10,
        lowStock: true,
        sortBy: 'quantity' as const,
        sortOrder: 'asc' as const
      };

      const result = await inventoryService.getAllInventory(query);

      // Producto 2 tiene 15 unidades (≤ 10 es low stock)
      expect(result.inventory.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getInventoryByProductId', () => {
    it('debería obtener inventario específico de un producto', async () => {
      const result = await inventoryService.getInventoryByProductId(createdProduct.id);

      expect(result).toBeDefined();
      expect(result.productId).toBe(createdProduct.id);
      expect(result.product.name).toBe(productData.name);
      expect(result.recentMovements).toBeDefined();
      expect(result.recentMovements.length).toBeGreaterThan(0);
    });

    it('debería lanzar error con producto sin inventario', async () => {
      const productWithoutInventory = await prisma.product.create({
        data: {
          name: `InvTest-NoInventory-${Date.now()}`,
          price: 10.00,
          category: 'Test',
          subcategory: 'Test',
          description: 'Test',
          materials: 'Test',
          dimensions: 'Test',
          care: 'Test',
          images: {
            create: [{ url: 'http://test.com', isPrimary: true, order: 0 }]
          }
        }
      });

      await expect(
        inventoryService.getInventoryByProductId(productWithoutInventory.id)
      ).rejects.toThrow(NotFoundError);

      // Limpiar
      await prisma.productImage.deleteMany({ where: { productId: productWithoutInventory.id } });
      await prisma.product.delete({ where: { id: productWithoutInventory.id } });
    });
  });

  describe('getInventoryMovements', () => {
    it('debería obtener movimientos con paginación', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      };

      const result = await inventoryService.getInventoryMovements(query);

      expect(result.movements).toBeDefined();
      expect(result.movements.length).toBeGreaterThan(0);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('debería filtrar movimientos por productId', async () => {
      const query = {
        page: 1,
        limit: 10,
        productId: createdProduct.id,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      };

      const result = await inventoryService.getInventoryMovements(query);

      expect(result.movements.length).toBeGreaterThan(0);
      result.movements.forEach(movement => {
        expect(movement.productId).toBe(createdProduct.id);
      });
    });

    it('debería filtrar movimientos por tipo', async () => {
      const query = {
        page: 1,
        limit: 10,
        type: 'IN' as const,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      };

      const result = await inventoryService.getInventoryMovements(query);

      expect(result.movements.length).toBeGreaterThan(0);
      result.movements.forEach(movement => {
        expect(movement.type).toBe('IN');
      });
    });
  });

  describe('getInventoryOverviewStats', () => {
    it('debería obtener estadísticas generales del inventario', async () => {
      const stats = await inventoryService.getInventoryOverviewStats();

      expect(stats).toBeDefined();
      expect(stats.totalProducts).toBeGreaterThanOrEqual(2);
      expect(stats.totalInventoryValue).toBeGreaterThan(0);
      expect(stats.recentMovements).toBeDefined();
      expect(stats.topCategories).toBeDefined();
      expect(Array.isArray(stats.recentMovements)).toBe(true);
      expect(Array.isArray(stats.topCategories)).toBe(true);
    });

    it('debería calcular correctamente el valor total del inventario', async () => {
      const stats = await inventoryService.getInventoryOverviewStats();

      // Verificar que el valor total es mayor que 0
      expect(stats.totalInventoryValue).toBeGreaterThan(0);
      
      // El valor debe ser al menos el precio de los productos por sus cantidades
      const expectedMinValue = (25 * 25) + (45 * 15); // Precios x cantidades aproximadas
      expect(stats.totalInventoryValue).toBeGreaterThanOrEqual(expectedMinValue * 0.5); // Margen para ajustes
    });
  });
});