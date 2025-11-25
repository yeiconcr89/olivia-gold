import express from 'express';
import { z } from 'zod';
import {
  getProductReviews,
  getAllReviews,
  getProductReviewStats,
  getRecentReviews,
  updateReviewStatus,
  deleteReview,
  getApprovedReviews,
} from '../services/review.service';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
});

const reviewFiltersSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

/**
 * GET /api/reviews/approved
 * Get approved reviews for public testimonials section
 * NO AUTHENTICATION REQUIRED - Public endpoint
 */
router.get('/approved', async (req, res) => {
  try {
    const querySchema = z.object({
      limit: z.string().optional().transform(val => val ? parseInt(val) : 6),
    });

    const { limit } = querySchema.parse(req.query);

    const result = await getApprovedReviews(limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting approved reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener testimonios',
    });
  }
});

/**
 * GET /api/reviews/product/:productId
 * Get paginated reviews for a specific product
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const paginationData = paginationSchema.parse(req.query);
    const filtersData = reviewFiltersSchema.parse(req.query);

    const result = await getProductReviews(productId, {
      ...paginationData,
      ...filtersData,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting product reviews:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener reviews del producto',
    });
  }
});

/**
 * GET /api/reviews/product/:productId/stats
 * Get review statistics for a product
 */
router.get('/product/:productId/stats', async (req, res) => {
  try {
    const { productId } = req.params;

    const stats = await getProductReviewStats(productId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting product review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de reviews',
    });
  }
});

/**
 * GET /api/reviews
 * Get all reviews (admin only) with pagination and filters
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paginationData = paginationSchema.parse(req.query);
    const filtersData = reviewFiltersSchema.parse(req.query);

    const additionalFilters = z.object({
      search: z.string().optional(),
      sortBy: z.enum(['date', 'rating']).optional().default('date'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }).parse(req.query);

    const result = await getAllReviews({
      ...paginationData,
      ...filtersData,
      ...additionalFilters,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting all reviews:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener reviews',
    });
  }
});

/**
 * GET /api/reviews/recent
 * Get recent reviews for dashboard
 */
router.get('/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limitSchema = z.object({
      limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    });

    const { limit } = limitSchema.parse(req.query);

    const reviews = await getRecentReviews(limit);

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    logger.error('Error getting recent reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reviews recientes',
    });
  }
});

/**
 * PUT /api/reviews/:id/status
 * Update review status (approve/reject)
 */
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const statusSchema = z.object({
      status: z.enum(['APPROVED', 'REJECTED']),
    });

    const { status } = statusSchema.parse(req.body);

    const updatedReview = await updateReviewStatus(id, status, req.user?.id);

    logger.info(`Review ${id} status updated to ${status} by admin ${req.user?.email}`);

    res.json({
      success: true,
      data: updatedReview,
      message: `Review ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} exitosamente`,
    });
  } catch (error) {
    logger.error('Error updating review status:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de review',
    });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete review (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await deleteReview(id, req.user?.id);

    logger.info(`Review ${id} deleted by admin ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Review eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar review',
    });
  }
});

export default router;