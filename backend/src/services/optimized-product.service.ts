import { prisma } from '../config/database-optimized';
import { logger } from '../utils/logger';
import { cacheService, CacheService } from './cache.service';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';

// ============================================================================
// OPTIMIZED QUERIES - Solving N+1 Problems
// ============================================================================

/**
 * Optimized product listing with selective fields and efficient includes
 */
export const getProductsOptimized = async (options: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    minPrice,
    maxPrice,
    inStock,
    featured,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Build cache key
  const cacheKey = `products:optimized:${JSON.stringify(options)}`;
  
  // Try cache first
  const cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    logger.debug(`Products cache HIT for optimized query`);
    return cachedResult;
  }

  // Build where clause
  const where: any = {};
  
  if (category) where.category = category;
  if (inStock !== undefined) where.inStock = inStock;
  if (featured !== undefined) where.featured = featured;
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { materials: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const offset = (page - 1) * limit;

  // OPTIMIZED: Use specific selects instead of full includes
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        category: true,
        subcategory: true,
        description: true,
        inStock: true,
        featured: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        // OPTIMIZED: Only get primary image to avoid N+1
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            isPrimary: true,
            order: true,
          },
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        // OPTIMIZED: Only get essential inventory info
        inventory: {
          select: {
            quantity: true,
            reservedQuantity: true,
          },
        },
        // OPTIMIZED: Limit tags to avoid large payloads
        tags: {
          select: {
            tag: true,
          },
          take: 5,
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    products: products.map(product => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      inStock: product.inStock,
      featured: product.featured,
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      createdAt: product.createdAt,
      primaryImage: product.images[0] || null,
      availableQuantity: product.inventory?.quantity || 0,
      tags: product.tags.map(t => t.tag),
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };

  // Cache with appropriate TTL
  const ttl = search ? CacheService.TTL.SHORT : CacheService.TTL.MEDIUM;
  await cacheService.set(cacheKey, result, { 
    ttl, 
    tags: ['products', 'product-lists'] 
  });

  return result;
};

/**
 * Optimized single product query with controlled includes
 */
export const getProductByIdOptimized = async (id: string) => {
  const cacheKey = `product:${id}:optimized`;
  
  // Try cache first
  const cachedProduct = await cacheService.get(cacheKey);
  if (cachedProduct) {
    logger.debug(`Product cache HIT for id: ${id}`);
    return cachedProduct;
  }

  logger.debug(`Product cache MISS for id: ${id}`);

  // OPTIMIZED: Use separate queries instead of deep nested includes
  const [product, images, tags, inventory, reviewStats] = await Promise.all([
    // Main product data
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        category: true,
        subcategory: true,
        description: true,
        materials: true,
        dimensions: true,
        care: true,
        inStock: true,
        featured: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    
    // Images separately
    prisma.productImage.findMany({
      where: { productId: id },
      select: {
        id: true,
        url: true,
        altText: true,
        isPrimary: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    }),
    
    // Tags separately
    prisma.productTag.findMany({
      where: { productId: id },
      select: {
        tag: true,
      },
    }),
    
    // Inventory separately
    prisma.inventory.findUnique({
      where: { productId: id },
      select: {
        quantity: true,
        reservedQuantity: true,
        minQuantity: true,
        location: true,
        lastChecked: true,
      },
    }),
    
    // Review statistics (avoid loading all reviews)
    prisma.review.aggregate({
      where: { 
        productId: id,
        status: 'APPROVED',
      },
      _count: true,
      _avg: { rating: true },
    }),
  ]);

  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }

  // Get recent reviews separately (limit to avoid N+1)
  const recentReviews = await prisma.review.findMany({
    where: { 
      productId: id,
      status: 'APPROVED',
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      date: true,
      user: {
        select: {
          email: true,
          profile: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 10, // Limit to recent reviews
  });

  const result = {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    rating: Number(product.rating),
    images: images.map(img => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
      order: img.order,
    })),
    tags: tags.map(t => t.tag),
    inventory: inventory ? {
      quantity: inventory.quantity,
      reservedQuantity: inventory.reservedQuantity,
      minQuantity: inventory.minQuantity,
      location: inventory.location,
      lastChecked: inventory.lastChecked,
    } : null,
    reviewStats: {
      count: reviewStats._count,
      averageRating: reviewStats._avg.rating ? Number(reviewStats._avg.rating) : 0,
    },
    recentReviews: recentReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      userName: review.user.profile?.name || review.user.email,
      userAvatar: review.user.profile?.avatar,
    })),
  };

  // Cache for 1 hour
  await cacheService.set(cacheKey, result, { 
    ttl: CacheService.TTL.LONG, 
    tags: ['products', `product:${id}`] 
  });

  return result;
};

/**
 * Optimized products by category with minimal data
 */
export const getProductsByCategoryOptimized = async (
  category: string,
  options: {
    page?: number;
    limit?: number;
    inStock?: boolean;
  } = {}
) => {
  const { page = 1, limit = 12, inStock } = options;
  const cacheKey = `products:category:${category}:${JSON.stringify(options)}`;
  
  const cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const where: any = { category };
  if (inStock !== undefined) where.inStock = inStock;

  const offset = (page - 1) * limit;

  // OPTIMIZED: Minimal select for category listings
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        subcategory: true,
        inStock: true,
        featured: true,
        rating: true,
        reviewCount: true,
        images: {
          select: {
            url: true,
            altText: true,
          },
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    products: products.map(product => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      subcategory: product.subcategory,
      inStock: product.inStock,
      featured: product.featured,
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      primaryImage: product.images[0]?.url || null,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };

  await cacheService.set(cacheKey, result, { 
    ttl: CacheService.TTL.MEDIUM, 
    tags: ['products', `category:${category}`] 
  });

  return result;
};

/**
 * Bulk product data for admin operations
 */
export const getProductsBulkOptimized = async (productIds: string[]) => {
  if (productIds.length === 0) return [];

  // OPTIMIZED: Single query with IN clause instead of multiple queries
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      price: true,
      category: true,
      inStock: true,
      inventory: {
        select: {
          quantity: true,
        },
      },
      images: {
        select: {
          url: true,
        },
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  return products.map(product => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    category: product.category,
    inStock: product.inStock,
    quantity: product.inventory?.quantity || 0,
    primaryImage: product.images[0]?.url || null,
  }));
};

export {
  // Re-export original functions for backward compatibility
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductOverviewStats,
} from './product.service';