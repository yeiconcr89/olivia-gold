import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// TIPOS
// ============================================================================

type InventoryMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';

type UpdateInventoryData = {
  quantity: number;
  reason: string;
  type: InventoryMovementType;
};

// Esquema de validación para consultas de inventario
const inventoryQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  lowStock: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['name', 'quantity', 'category', 'lastUpdated']).default('lastUpdated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Esquema de validación para consultas de movimientos
const movementQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  productId: z.string().optional(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(['createdAt', 'quantity', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

const formatInventoryItem = (item: any) => ({
  id: item.id,
  productId: item.productId,
  quantity: item.quantity,
  reservedQuantity: item.reservedQuantity,
  availableQuantity: item.quantity - item.reservedQuantity,
  lastUpdated: item.lastUpdated,
  product: {
    id: item.product.id,
    name: item.product.name,
    category: item.product.category,
    subcategory: item.product.subcategory,
    price: Number(item.product.price),
    images: item.product.images,
    inStock: item.product.inStock,
    featured: item.product.featured,
  },
  status: item.quantity === 0 ? 'out_of_stock' : 
          item.quantity <= 10 ? 'low_stock' : 'in_stock',
});

const formatMovement = (movement: any) => ({
  id: movement.id,
  productId: movement.productId,
  type: movement.type,
  quantity: movement.quantity,
  reason: movement.reason,
  createdAt: movement.createdAt,
  product: {
    id: movement.product.id,
    name: movement.product.name,
    category: movement.product.category,
    image: movement.product.images[0] || null,
  },
});

// ============================================================================
// FUNCIONES DEL SERVICIO
// ============================================================================

export const getAllInventory = async (query: z.infer<typeof inventoryQuerySchema>) => {
  const { page, limit, search, lowStock, outOfStock, category, sortBy, sortOrder } = query;

  // Construir filtros para productos
  const productWhere: any = {};
  
  if (search) {
    productWhere.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    productWhere.category = category;
  }

  // Construir filtros para inventario
  const inventoryWhere: any = {};

  if (lowStock) {
    inventoryWhere.quantity = { lte: 10, gt: 0 };
  }

  if (outOfStock) {
    inventoryWhere.quantity = 0;
  }

  const offset = (page - 1) * limit;

  const [inventoryItems, total] = await Promise.all([
    prisma.inventory.findMany({
      where: {
        ...inventoryWhere,
        product: productWhere,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            subcategory: true,
            price: true,
            images: true,
            inStock: true,
            featured: true,
          },
        },
      },
      orderBy: sortBy === 'name' || sortBy === 'category' 
        ? { product: { [sortBy]: sortOrder } }
        : { updatedAt: sortOrder },
      skip: offset,
      take: limit,
    }),
    prisma.inventory.count({
      where: {
        ...inventoryWhere,
        product: productWhere,
      },
    }),
  ]);

  return {
    inventory: inventoryItems.map(formatInventoryItem),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getInventoryByProductId = async (productId: string) => {
  const inventoryItem = await prisma.inventory.findUnique({
    where: { productId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          subcategory: true,
          price: true,
          images: true,
          inStock: true,
          featured: true,
        },
      },
    },
  });

  if (!inventoryItem) {
    throw new NotFoundError('Inventario no encontrado para este producto');
  }

  // Obtener movimientos recientes
  const recentMovements = await prisma.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    ...formatInventoryItem(inventoryItem),
    recentMovements: recentMovements.map(movement => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt,
    })),
  };
};

export const updateInventory = async (productId: string, updateData: UpdateInventoryData, userId: string) => {
  const { quantity, reason, type } = updateData;

  return await prisma.$transaction(async (tx) => {
    // Verificar que el producto existe
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    // Obtener inventario actual o crear uno nuevo
    let inventory = await tx.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      inventory = await tx.inventory.create({
        data: {
          productId,
          quantity: 0,
          reservedQuantity: 0,
        },
      });
    }

    // Calcular nueva cantidad según el tipo de movimiento
    let newQuantity = inventory.quantity;
    let newReservedQuantity = inventory.reservedQuantity;
    let movementQuantity = quantity;

    switch (type) {
      case 'IN':
        newQuantity += quantity;
        break;
      case 'OUT':
        if (quantity > inventory.quantity) {
          throw new BadRequestError('No hay suficiente stock disponible');
        }
        newQuantity = Math.max(0, newQuantity - quantity);
        movementQuantity = -quantity;
        break;
      case 'ADJUSTMENT':
        movementQuantity = quantity - newQuantity;
        newQuantity = quantity;
        break;
      case 'RESERVED':
        const maxReservable = newQuantity - newReservedQuantity;
        if (quantity > maxReservable) {
          throw new BadRequestError('No hay suficiente stock disponible para reservar');
        }
        newReservedQuantity = Math.min(inventory.reservedQuantity + quantity, newQuantity);
        movementQuantity = newReservedQuantity - inventory.reservedQuantity;
        break;
      case 'RELEASED':
        const releasableQuantity = Math.min(inventory.reservedQuantity, quantity);
        newReservedQuantity = inventory.reservedQuantity - releasableQuantity;
        movementQuantity = -releasableQuantity;
        break;
    }

    // Actualizar inventario y estado del producto en una sola transacción
    const [updatedInventory] = await Promise.all([
      tx.inventory.update({
        where: { productId },
        data: { 
          quantity: newQuantity,
          reservedQuantity: newReservedQuantity,
        },
      }),
      tx.product.update({
        where: { id: productId },
        data: { 
          inStock: newQuantity > 0 
        },
      })
    ]);

    // Actualizar estado del producto
    const shouldBeInStock = newQuantity > 0;
    if (product.inStock !== shouldBeInStock) {
      await tx.product.update({
        where: { id: productId },
        data: { inStock: shouldBeInStock },
      });
    }

    // Registrar movimiento
    await tx.inventoryMovement.create({
      data: {
        productId,
        type,
        quantity: Math.abs(movementQuantity),
        reason,
      },
    });

    logger.info(`Inventario actualizado: ${product.name} - ${type} ${quantity} por usuario ${userId}`);

    // Obtener inventario actualizado con producto
    const finalInventory = await tx.inventory.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            subcategory: true,
            price: true,
            images: true,
            inStock: true,
            featured: true,
          },
        },
      },
    });

    return formatInventoryItem(finalInventory);
  });
};

export const getInventoryMovements = async (query: z.infer<typeof movementQuerySchema>) => {
  const { page, limit, productId, type, startDate, endDate, sortBy, sortOrder } = query;

  // Construir filtros
  const where: any = {};

  if (productId) {
    where.productId = productId;
  }

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const offset = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            images: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: offset,
      take: limit,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return {
    movements: movements.map(formatMovement),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getInventoryOverviewStats = async () => {
  const [
    totalProducts,
    inStockProducts,
    lowStockProducts,
    outOfStockProducts,
    totalInventoryValue,
    recentMovements,
    topCategories,
  ] = await Promise.all([
    prisma.inventory.count(),
    prisma.inventory.count({ where: { quantity: { gt: 10 } } }),
    prisma.inventory.count({ where: { quantity: { lte: 10, gt: 0 } } }),
    prisma.inventory.count({ where: { quantity: 0 } }),
    // Calcular valor total de inventario
    prisma.inventory.findMany({
      include: {
        product: {
          select: { price: true },
        },
      },
    }).then(items => 
      items.reduce((total, item) => total + (item.quantity * Number(item.product.price)), 0)
    ),
    // Movimientos recientes
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
    }),
    // Top categorías por cantidad
    prisma.inventory.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    }).then(async (grouped) => {
      const categoryTotals: { [key: string]: number } = {};
      
      for (const item of grouped) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { category: true },
        });
        
        if (product) {
          categoryTotals[product.category] = (categoryTotals[product.category] || 0) + (item._sum.quantity || 0);
        }
      }
      
      return Object.entries(categoryTotals)
        .map(([category, quantity]) => ({ category, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    }),
  ]);

  return {
    totalProducts,
    inStockProducts,
    lowStockProducts,
    outOfStockProducts,
    totalInventoryValue,
    recentMovements: recentMovements.map(movement => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt,
      product: {
        id: movement.product.id,
        name: movement.product.name,
        image: movement.product.images[0] || null,
      },
    })),
    topCategories,
  };
};