import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { cacheService, CacheService } from './cache.service';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface ReviewFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rating?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================================================
// PAGINATED REVIEW SERVICES
// ============================================================================

/**
 * Get paginated reviews for a specific product
 */
export const getProductReviews = async (
  productId: string,
  options: PaginationOptions & ReviewFilters = {}
) => {
  const {
    page = 1,
    limit = 10,
    status = 'APPROVED',
    rating,
    dateFrom,
    dateTo,
  } = options;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throw new BadRequestError('Parámetros de paginación inválidos');
  }

  // Build cache key
  const cacheKey = `reviews:product:${productId}:${JSON.stringify(options)}`;

  // Try cache first
  const cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    logger.debug(`Reviews cache HIT for product ${productId}`);
    return cachedResult;
  }

  // Build where clause
  const where: any = { productId };
  if (status) where.status = status;
  if (rating) where.rating = rating;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  const offset = (page - 1) * limit;

  // Execute paginated query
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      select: {
        id: true,
        rating: true,
        comment: true,
        date: true,
        status: true,
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
      skip: offset,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  const result = {
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      status: review.status,
      userName: review.user.profile?.name || review.user.email,
      userAvatar: review.user.profile?.avatar,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    stats: {
      totalReviews: total,
    },
  };

  // Cache for 30 minutes
  await cacheService.set(cacheKey, result, {
    ttl: CacheService.TTL.MEDIUM,
    tags: ['reviews', `product:${productId}`, 'product-reviews']
  });

  return result;
};

/**
 * Get approved reviews for testimonials section
 * Public endpoint without authentication
 */
export const getApprovedReviews = async (limit: number = 6) => {
  const cacheKey = `reviews:approved:${limit}`;

  // Try cache first
  const cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    logger.debug('Approved reviews cache HIT');
    return cachedResult;
  }

  const reviews = await prisma.review.findMany({
    where: {
      status: 'APPROVED',
      rating: { gte: 4 }, // Solo reviews de 4 y 5 estrellas para testimonios
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
    orderBy: [
      { rating: 'desc' },
      { date: 'desc' },
    ],
    take: limit,
  });

  const result = {
    reviews: reviews.map(review => ({
      id: review.id,
      name: review.user?.profile?.name || review.user?.email?.split('@')[0] || 'Cliente',
      rating: review.rating,
      comment: review.comment,
      image: review.user?.profile?.avatar || `https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150`,
    })),
    total: reviews.length,
  };

  // Cache for 30 minutes
  await cacheService.set(cacheKey, result, {
    ttl: CacheService.TTL.MEDIUM,
    tags: ['reviews', 'testimonials', 'approved-reviews'],
  });

  return result;
};

/**
 * Get paginated reviews for admin panel
 */
export const getAllReviews = async (
  options: PaginationOptions & ReviewFilters & {
    search?: string;
    sortBy?: 'date' | 'rating';
    sortOrder?: 'asc' | 'desc';
  } = {}
) => {
  const {
    page = 1,
    limit = 20,
    status,
    rating,
    dateFrom,
    dateTo,
    search,
    sortBy = 'date',
    sortOrder = 'desc',
  } = options;

  // Validate parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throw new BadRequestError('Parámetros de paginación inválidos');
  }

  // Build where clause
  const where: any = {};
  if (status) where.status = status;
  if (rating) where.rating = rating;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }
  if (search) {
    where.OR = [
      { comment: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { profile: { name: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const offset = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      select: {
        id: true,
        rating: true,
        comment: true,
        date: true,
        status: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      status: review.status,
      productId: review.product.id,
      productName: review.product.name,
      userName: review.user.profile?.name || review.user.email,
      userEmail: review.user.email,
      userAvatar: review.user.profile?.avatar,
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
 * Get review statistics for a product
 */
export const getProductReviewStats = async (productId: string) => {
  const cacheKey = `reviews:stats:${productId}`;

  const cachedStats = await cacheService.get(cacheKey);
  if (cachedStats) {
    return cachedStats;
  }

  const [stats, ratingDistribution] = await Promise.all([
    prisma.review.aggregate({
      where: { productId, status: 'APPROVED' },
      _count: true,
      _avg: { rating: true },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId, status: 'APPROVED' },
      _count: true,
      orderBy: { rating: 'desc' },
    }),
  ]);

  const result = {
    totalReviews: stats._count,
    averageRating: stats._avg.rating ? Number(stats._avg.rating) : 0,
    ratingDistribution: ratingDistribution.map(item => ({
      rating: item.rating,
      count: item._count,
    })),
  };

  // Cache for 1 hour
  await cacheService.set(cacheKey, result, {
    ttl: CacheService.TTL.LONG,
    tags: ['reviews', `product:${productId}`, 'review-stats']
  });

  return result;
};

/**
 * Get recent reviews for dashboard
 */
export const getRecentReviews = async (limit: number = 10) => {
  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      rating: true,
      comment: true,
      date: true,
      status: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          profile: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment.substring(0, 100) + (review.comment.length > 100 ? '...' : ''),
    date: review.date,
    status: review.status,
    productId: review.product.id,
    productName: review.product.name,
    userName: review.user.profile?.name || 'Usuario',
  }));
};

/**
 * Update review status (approve/reject)
 */
export const updateReviewStatus = async (
  reviewId: string,
  status: 'APPROVED' | 'REJECTED',
  adminUserId: string
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: true },
  });

  if (!review) {
    throw new NotFoundError('Review no encontrada');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });

  // Invalidate related caches
  await Promise.all([
    cacheService.invalidateByTag(`product:${review.productId}`),
    cacheService.invalidateByTag('reviews'),
    cacheService.invalidateByTag('review-stats'),
    cacheService.invalidateByTag('product-reviews'),
  ]);

  logger.info(`Review ${reviewId} status updated to ${status} by admin ${adminUserId}`);

  return updatedReview;
};

/**
 * Delete review
 */
export const deleteReview = async (reviewId: string, adminUserId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError('Review no encontrada');
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  // Invalidate related caches
  await Promise.all([
    cacheService.invalidateByTag(`product:${review.productId}`),
    cacheService.invalidateByTag('reviews'),
    cacheService.invalidateByTag('review-stats'),
    cacheService.invalidateByTag('product-reviews'),
  ]);

  logger.info(`Review ${reviewId} deleted by admin ${adminUserId}`);

  return { success: true };
};