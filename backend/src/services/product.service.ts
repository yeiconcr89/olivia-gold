
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { cacheService, CacheService } from './cache.service';

// Tipos para los datos de producto
type ProductData = {
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  description: string;
  materials: string;
  dimensions: string;
  care: string;
  inStock?: boolean;
  featured?: boolean;
  images: string[];
  tags?: string[];
};

// Esquema de validación para la consulta de productos
const productQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'rating', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Función para formatear la salida del producto
const formatProductOutput = (product: any) => ({
  id: product.id,
  name: product.name,
  price: Number(product.price),
  originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
  category: product.category,
  subcategory: product.subcategory,
  description: product.description,
  materials: product.materials,
  dimensions: product.dimensions,
  care: product.care,
  inStock: product.inStock,
  featured: product.featured,
  rating: Number(product.rating),
  reviewCount: product.reviewCount,
  images: product.images.map((img: any) => img.url),
  tags: product.tags.map((tag: any) => tag.tag),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const getAllProducts = async (query: z.infer<typeof productQuerySchema>) => {
  const { page, limit, search, category, subcategory, inStock, featured, minPrice, maxPrice, sortBy, sortOrder } = query;

  // Create cache key based on query parameters
  const filters = JSON.stringify({ search, category, subcategory, inStock, featured, minPrice, maxPrice, sortBy, sortOrder });
  const cacheKey = `products:${page}:${limit}:${Buffer.from(filters).toString('base64')}`;

  // Try to get from cache first
  const cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    logger.debug(`Products cache HIT for page ${page}, limit ${limit}`);
    return cachedResult;
  }

  logger.debug(`Products cache MISS for page ${page}, limit ${limit}`);

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { materials: { contains: search, mode: 'insensitive' } },
      { tags: { some: { tag: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (subcategory) {
    where.subcategory = subcategory;
  }

  if (inStock !== undefined) {
    where.inStock = inStock;
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const offset = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 10, // Limit images to prevent large payloads
        },
        tags: {
          take: 15, // Limit tags to most relevant
        },
        inventory: true,
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
    products: products.map(formatProductOutput),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };

  // Cache the result - use shorter TTL for search results, longer for regular listings
  const ttl = search ? CacheService.TTL.SHORT : CacheService.TTL.MEDIUM;
  await cacheService.set(cacheKey, result, { 
    ttl, 
    tags: ['products', 'product-lists'] 
  });

  return result;
};

export const getProductById = async (id: string) => {
  // Try to get from cache first
  const cacheKey = `product:${id}:detailed`;
  const cachedProduct = await cacheService.get(cacheKey);
  if (cachedProduct) {
    logger.debug(`Product cache HIT for id: ${id}`);
    return cachedProduct;
  }

  logger.debug(`Product cache MISS for id: ${id}`);

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      tags: true,
      inventory: true,
      reviews: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        where: {
          status: 'APPROVED',
        },
        orderBy: {
          date: 'desc',
        },
        take: 5, // Limit to recent reviews, use pagination endpoint for more
      },
    },
  });

  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }
  
  const result = {
    ...formatProductOutput(product),
    inventory: product.inventory ? {
      quantity: product.inventory.quantity,
      reservedQuantity: product.inventory.reservedQuantity,
    } : null,
    reviews: product.reviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      userName: review.user.profile?.name || review.user.email,
      userAvatar: review.user.profile?.avatar,
      createdAt: review.date,
    })),
  };

  // Cache the detailed product for 1 hour
  await cacheService.set(cacheKey, result, { 
    ttl: CacheService.TTL.LONG, 
    tags: ['products', `product:${id}`] 
  });

  return result;
};

export const createProduct = async (productData: ProductData) => {
  // Verificar si ya existe un producto con el mismo nombre
  const existingProduct = await prisma.product.findFirst({
    where: { 
      name: { 
        equals: productData.name, 
        mode: 'insensitive' 
      } 
    },
  });

  if (existingProduct) {
    throw new ConflictError('Ya existe un producto con este nombre');
  }

  // Validaciones básicas
  if (!productData.images || productData.images.length === 0) {
    throw new BadRequestError('El producto debe tener al menos una imagen');
  }

  if (productData.price <= 0) {
    throw new BadRequestError('El precio debe ser mayor a 0');
  }

  const product = await prisma.product.create({
    data: {
      name: productData.name,
      price: productData.price,
      originalPrice: productData.originalPrice,
      category: productData.category,
      subcategory: productData.subcategory || 'General',
      description: productData.description,
      materials: productData.materials,
      dimensions: productData.dimensions,
      care: productData.care,
      inStock: productData.inStock ?? true,
      featured: productData.featured ?? false,
      images: {
        create: productData.images.map((url: string, index: number) => ({
          url,
          isPrimary: index === 0,
          order: index,
        })),
      },
      tags: {
        create: productData.tags?.map((tag: string) => ({ tag })) || [],
      },
      inventory: {
        create: {
          quantity: 0, // Se debe actualizar después de la creación
        },
      },
    },
    include: {
      images: true,
      tags: true,
      inventory: true,
    },
  });
  
  logger.info(`Producto creado: ${product.name} (ID: ${product.id})`);
  
  // Invalidate product-related caches
  await Promise.all([
    cacheService.invalidateByTag('products'),
    cacheService.invalidateByTag('product-lists'),
    cacheService.invalidateByTag('featured'),
    cacheService.invalidateByTag('popular'),
    cacheService.invalidateByTag('stats')
  ]);
  
  return formatProductOutput(product);
};

export const updateProduct = async (id: string, updateData: Partial<ProductData>) => {
  // Verificar que el producto existe
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new NotFoundError('Producto no encontrado');
  }

  // Verificar nombre único si se está actualizando
  if (updateData.name && updateData.name !== existingProduct.name) {
    const duplicateProduct = await prisma.product.findFirst({
      where: { 
        name: { 
          equals: updateData.name, 
          mode: 'insensitive' 
        },
        id: { not: id },
      },
    });

    if (duplicateProduct) {
      throw new ConflictError('Ya existe un producto con este nombre');
    }
  }

  // Validar precio si se está actualizando
  if (updateData.price !== undefined && updateData.price <= 0) {
    throw new BadRequestError('El precio debe ser mayor a 0');
  }

  const productUpdateData: any = {
    name: updateData.name,
    price: updateData.price ? Number(updateData.price) : undefined,
    originalPrice: updateData.originalPrice ? Number(updateData.originalPrice) : undefined,
    category: updateData.category,
    subcategory: updateData.subcategory,
    description: updateData.description,
    materials: updateData.materials,
    dimensions: updateData.dimensions,
    care: updateData.care,
    inStock: updateData.inStock,
    featured: updateData.featured,
  };

  if (updateData.images) {
    productUpdateData.images = {
      deleteMany: {},
      create: updateData.images.map((url: string, index: number) => ({
        url,
        isPrimary: index === 0,
        order: index,
      })),
    };
  }

  if (updateData.tags) {
    productUpdateData.tags = {
      deleteMany: {},
      create: updateData.tags.map((tag: string) => ({ tag })),
    };
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: productUpdateData,
    include: {
      images: true,
      tags: true,
      inventory: true,
    },
  });

  logger.info(`Producto actualizado: ${updatedProduct.name} (ID: ${updatedProduct.id})`);
  
  // Invalidate specific product cache and general product caches
  await Promise.all([
    cacheService.invalidateByTag(`product:${id}`),
    cacheService.invalidateByTag('products'),
    cacheService.invalidateByTag('product-lists'),
    cacheService.invalidateByTag('featured'),
    cacheService.invalidateByTag('popular'),
    cacheService.invalidateByTag('stats')
  ]);
  
  return formatProductOutput(updatedProduct);
};

export const deleteProduct = async (id: string) => {
  // Verificar que el producto existe
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      orderItems: true,
    },
  });

  if (!existingProduct) {
    throw new NotFoundError('Producto no encontrado');
  }

  // Verificar que no tenga pedidos asociados
  if (existingProduct.orderItems.length > 0) {
    throw new BadRequestError('No se puede eliminar un producto que tiene pedidos asociados');
  }

  await prisma.product.delete({
    where: { id },
  });

  logger.info(`Producto eliminado: ${existingProduct.name} (ID: ${id})`);
  
  // Invalidate all product-related caches since the product is deleted
  await Promise.all([
    cacheService.invalidateByTag(`product:${id}`),
    cacheService.invalidateByTag('products'),
    cacheService.invalidateByTag('product-lists'),
    cacheService.invalidateByTag('featured'),
    cacheService.invalidateByTag('popular'),
    cacheService.invalidateByTag('stats')
  ]);
};

// Función para obtener estadísticas generales de productos
export const getProductOverviewStats = async () => {
  const cacheKey = 'product:stats:overview';
  
  // Try to get from cache first
  const cachedStats = await cacheService.get(cacheKey);
  if (cachedStats) {
    logger.debug('Product stats cache HIT');
    return cachedStats;
  }

  logger.debug('Product stats cache MISS');

  const [
    totalProducts,
    inStockProducts,
    featuredProducts,
    outOfStockProducts,
    averagePrice,
    totalCategories,
    lowStockProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { inStock: true } }),
    prisma.product.count({ where: { featured: true } }),
    prisma.product.count({ where: { inStock: false } }),
    prisma.product.aggregate({
      _avg: { price: true },
    }),
    prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
    }),
    prisma.product.count({
      where: {
        inventory: {
          quantity: {
            lte: 5, // Umbral mínimo fijo
          },
        },
      },
    }),
  ]);

  const result = {
    totalProducts,
    inStockProducts,
    featuredProducts,
    outOfStockProducts,
    lowStockProducts,
    averagePrice: Number(averagePrice._avg.price || 0),
    totalCategories: totalCategories.length,
    categoriesData: totalCategories.map(cat => ({
      category: cat.category,
      count: cat._count.category,
    })),
  };

  // Cache stats for 10 minutes
  await cacheService.set(cacheKey, result, { 
    ttl: 600, 
    tags: ['products', 'stats'] 
  });

  return result;
};
