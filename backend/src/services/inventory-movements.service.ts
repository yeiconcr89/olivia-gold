import { prisma } from '../config/database-optimized';
import { logger } from '../utils/logger';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { cacheService, CacheService } from './cache.service';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface MovementFilters {
  type?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: string;
  reason?: string;
}

// ============================================================================
// PAGINATED INVENTORY MOVEMENTS SERVICES
// ============================================================================

/**
 * Get paginated inventory movements for a specific product
 */
export const getProductInventoryMovements = async (
  productId: string,
  options: PaginationOptions & MovementFilters = {}
) => {
  const {
    page = 1,
    limit = 20,
    type,
    dateFrom,
    dateTo,
    createdBy,
    reason,
  } = options;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throw new BadRequestError('Parámetros de paginación inválidos');
  }

  // Build cache key
  const cacheKey = `inventory:movements:${productId}:${JSON.stringify(options)}`;
  
  // Try cache first (short TTL since movements are frequently updated)
  const cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    logger.debug(`Inventory movements cache HIT for product ${productId}`);
    return cachedResult;
  }

  // Build where clause
  const where: any = { productId };
  if (type) where.type = type;
  if (createdBy) where.createdBy = createdBy;
  if (reason) where.reason = { contains: reason, mode: 'insensitive' };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  const offset = (page - 1) * limit;

  // Execute paginated query
  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      select: {
        id: true,
        quantity: true,
        type: true,
        reason: true,
        previousQuantity: true,
        newQuantity: true,
        createdAt: true,
        createdBy: true,
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  const result = {
    movements: movements.map(movement => ({
      id: movement.id,
      quantity: movement.quantity,
      type: movement.type,
      reason: movement.reason,
      previousQuantity: movement.previousQuantity,
      newQuantity: movement.newQuantity,
      createdAt: movement.createdAt,
      createdBy: movement.createdBy,
      productName: movement.product.name,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    summary: {
      totalMovements: total,
    },
  };

  // Cache for 5 minutes (short TTL for frequently changing data)
  await cacheService.set(cacheKey, result, { 
    ttl: CacheService.TTL.SHORT, 
    tags: ['inventory', `product:${productId}`, 'inventory-movements'] 
  });

  return result;
};

/**
 * Get all inventory movements (admin view) with pagination and filters
 */
export const getAllInventoryMovements = async (
  options: PaginationOptions & MovementFilters & {
    search?: string;
    sortBy?: 'createdAt' | 'quantity' | 'type';
    sortOrder?: 'asc' | 'desc';
  } = {}
) => {
  const {
    page = 1,
    limit = 20,
    type,
    dateFrom,
    dateTo,
    createdBy,
    reason,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Validate parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throw new BadRequestError('Parámetros de paginación inválidos');
  }

  // Build where clause
  const where: any = {};
  if (type) where.type = type;
  if (createdBy) where.createdBy = createdBy;
  if (reason) where.reason = { contains: reason, mode: 'insensitive' };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }
  if (search) {
    where.OR = [
      { reason: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { createdBy: { contains: search, mode: 'insensitive' } },
    ];
  }

  const offset = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      select: {
        id: true,
        quantity: true,
        type: true,
        reason: true,
        previousQuantity: true,
        newQuantity: true,
        createdAt: true,
        createdBy: true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return {
    movements: movements.map(movement => ({
      id: movement.id,
      quantity: movement.quantity,
      type: movement.type,
      reason: movement.reason,
      previousQuantity: movement.previousQuantity,
      newQuantity: movement.newQuantity,
      createdAt: movement.createdAt,
      createdBy: movement.createdBy,
      productId: movement.product.id,
      productName: movement.product.name,
      productCategory: movement.product.category,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get inventory movement statistics
 */
export const getInventoryMovementStats = async (
  productId?: string,
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
) => {
  const cacheKey = `inventory:stats:${productId || 'all'}:${timeframe}`;
  
  const cachedStats = await cacheService.get(cacheKey);
  if (cachedStats) {
    return cachedStats;
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  
  switch (timeframe) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  const where: any = {
    createdAt: { gte: startDate },
  };
  if (productId) where.productId = productId;

  const [totalMovements, movementsByType, quantityStats] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    
    prisma.inventoryMovement.groupBy({
      by: ['type'],
      where,
      _count: true,
      _sum: { quantity: true },
    }),
    
    prisma.inventoryMovement.aggregate({
      where,
      _sum: { quantity: true },
      _avg: { quantity: true },
      _max: { quantity: true },
      _min: { quantity: true },
    }),
  ]);

  const result = {
    timeframe,
    totalMovements,
    movementsByType: movementsByType.map(item => ({
      type: item.type,
      count: item._count,
      totalQuantity: item._sum.quantity || 0,
    })),
    quantityStats: {
      total: quantityStats._sum.quantity || 0,
      average: quantityStats._avg.quantity ? Number(quantityStats._avg.quantity) : 0,
      max: quantityStats._max.quantity || 0,
      min: quantityStats._min.quantity || 0,
    },
  };

  // Cache for 30 minutes
  await cacheService.set(cacheKey, result, { 
    ttl: CacheService.TTL.MEDIUM, 
    tags: ['inventory', 'inventory-stats'] 
  });

  return result;
};

/**
 * Get recent inventory movements for dashboard
 */
export const getRecentInventoryMovements = async (limit: number = 10) => {
  const movements = await prisma.inventoryMovement.findMany({
    select: {
      id: true,
      quantity: true,
      type: true,
      reason: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return movements.map(movement => ({
    id: movement.id,
    quantity: movement.quantity,
    type: movement.type,
    reason: movement.reason.substring(0, 50) + (movement.reason.length > 50 ? '...' : ''),
    createdAt: movement.createdAt,
    productId: movement.product.id,
    productName: movement.product.name,
  }));
};

/**
 * Export inventory movements to CSV format
 */
export const exportInventoryMovements = async (
  options: MovementFilters & { productId?: string } = {}
) => {
  const {
    productId,
    type,
    dateFrom,
    dateTo,
    createdBy,
    reason,
  } = options;

  // Build where clause
  const where: any = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;
  if (createdBy) where.createdBy = createdBy;
  if (reason) where.reason = { contains: reason, mode: 'insensitive' };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    select: {
      id: true,
      quantity: true,
      type: true,
      reason: true,
      previousQuantity: true,
      newQuantity: true,
      createdAt: true,
      createdBy: true,
      product: {
        select: {
          name: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10000, // Limit for export
  });

  // Convert to CSV format
  const csvHeaders = [
    'ID',
    'Producto',
    'Categoría',
    'Tipo',
    'Cantidad',
    'Cantidad Anterior',
    'Cantidad Nueva',
    'Razón',
    'Creado Por',
    'Fecha',
  ];

  const csvRows = movements.map(movement => [
    movement.id,
    movement.product.name,
    movement.product.category,
    movement.type,
    movement.quantity,
    movement.previousQuantity,
    movement.newQuantity,
    movement.reason,
    movement.createdBy,
    movement.createdAt.toISOString(),
  ]);

  return {
    headers: csvHeaders,
    rows: csvRows,
    totalRecords: movements.length,
  };
};