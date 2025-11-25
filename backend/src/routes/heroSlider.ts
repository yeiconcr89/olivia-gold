import express from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getAllHeroSlides,
  getActiveHeroSlides,
  getHeroSlideById,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  toggleHeroSlideStatus,
} from '../services/heroSlider.service';
import { logger } from '../utils/logger';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const createHeroSlideSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  subtitle: z.string().min(1, 'El subtítulo es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  imageUrl: z.string().url('URL de imagen inválida'),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  offerText: z.string().optional(),
  isActive: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

const updateHeroSlideSchema = createHeroSlideSchema.partial();

const reorderSlidesSchema = z.array(
  z.object({
    id: z.string(),
    orderIndex: z.number().int().min(0),
  })
);

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

/**
 * @route GET /api/hero-slider
 * @desc Obtener slides activos del hero
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    logger.info('📱 Obteniendo slides activos del hero');
    const slides = await getActiveHeroSlides();
    res.json({ slides });
  } catch (error) {
    logger.error('❌ Error al obtener slides del hero:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================================================
// RUTAS ADMINISTRATIVAS
// ============================================================================

/**
 * @route GET /api/hero-slider/admin
 * @desc Obtener todos los slides (incluyendo inactivos)
 * @access Admin
 */
router.get('/admin', authenticate, requireRole(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    logger.info('🔧 Admin obteniendo todos los slides del hero');
    const slides = await getAllHeroSlides(true);
    res.json({ slides });
  } catch (error) {
    logger.error('❌ Error al obtener slides del hero (admin):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route GET /api/hero-slider/:id
 * @desc Obtener un slide específico
 * @access Admin
 */
router.get('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    logger.info(`🔍 Obteniendo slide del hero: ${id}`);
    const slide = await getHeroSlideById(id);
    res.json({ slide });
  } catch (error: any) {
    logger.error('❌ Error al obtener slide del hero:', error);
    if (error.message === 'Slide no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

/**
 * @route POST /api/hero-slider
 * @desc Crear un nuevo slide
 * @access Admin
 */
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const validatedData = createHeroSlideSchema.parse(req.body);
    logger.info('➕ Creando nuevo slide del hero');
    const slide = await createHeroSlide(validatedData);
    res.status(201).json({ slide, message: 'Slide creado exitosamente' });
  } catch (error: any) {
    logger.error('❌ Error al crear slide del hero:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

/**
 * @route PUT /api/hero-slider/:id
 * @desc Actualizar un slide
 * @access Admin
 */
router.put('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateHeroSlideSchema.parse(req.body);
    logger.info(`🔄 Actualizando slide del hero: ${id}`);
    const slide = await updateHeroSlide(id, validatedData);
    res.json({ slide, message: 'Slide actualizado exitosamente' });
  } catch (error: any) {
    logger.error('❌ Error al actualizar slide del hero:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    } else if (error.message === 'Slide no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

/**
 * @route DELETE /api/hero-slider/:id
 * @desc Eliminar un slide
 * @access Admin
 */
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    logger.info(`🗑️ Eliminando slide del hero: ${id}`);
    await deleteHeroSlide(id);
    res.json({ message: 'Slide eliminado exitosamente' });
  } catch (error: any) {
    logger.error('❌ Error al eliminar slide del hero:', error);
    if (error.message === 'Slide no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

/**
 * @route POST /api/hero-slider/reorder
 * @desc Reordenar slides
 * @access Admin
 */
router.post('/reorder', authenticate, requireRole(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const validatedData = reorderSlidesSchema.parse(req.body);
    logger.info('🔄 Reordenando slides del hero');
    await reorderHeroSlides(validatedData);
    res.json({ message: 'Slides reordenados exitosamente' });
  } catch (error: any) {
    logger.error('❌ Error al reordenar slides del hero:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

/**
 * @route PATCH /api/hero-slider/:id/toggle
 * @desc Cambiar estado activo/inactivo de un slide
 * @access Admin
 */
router.patch('/:id/toggle', authenticate, requireRole(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    logger.info(`🔄 Cambiando estado del slide del hero: ${id}`);
    const slide = await toggleHeroSlideStatus(id);
    res.json({ slide, message: 'Estado del slide cambiado exitosamente' });
  } catch (error: any) {
    logger.error('❌ Error al cambiar estado del slide del hero:', error);
    if (error.message === 'Slide no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

export default router;