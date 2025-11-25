import express from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const createSEOPageSchema = z.object({
  url: z.string().min(1, 'La URL es requerida'),
  title: z.string().min(10, 'El título debe tener al menos 10 caracteres'),
  metaDescription: z.string().min(50, 'La meta descripción debe tener al menos 50 caracteres'),
  keywords: z.array(z.string()).default([]),
  h1: z.string().min(1, 'El H1 es requerido'),
  canonicalUrl: z.string().url().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional(),
});

const updateSEOPageSchema = createSEOPageSchema.partial();

const seoQuerySchema = z.object({
  page: z.preprocess(val => Number(val), z.number().min(1)).default(1),
  limit: z.preprocess(val => Number(val), z.number().min(1).max(100)).default(20),
  search: z.string().optional(),
  status: z.enum(['OPTIMIZED', 'NEEDS_WORK', 'POOR']).optional(),
  sortBy: z.enum(['url', 'score', 'lastUpdated']).default('lastUpdated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ============================================================================
// UTILIDADES
// ============================================================================

const calculateSEOScore = (page: any): { score: number; issues: string[] } => {
  let score = 100;
  const issues: string[] = [];

  // Verificar título
  if (!page.title || page.title.length < 10) {
    score -= 20;
    issues.push('Título muy corto o ausente');
  } else if (page.title.length > 60) {
    score -= 10;
    issues.push('Título muy largo');
  }

  // Verificar meta descripción
  if (!page.metaDescription || page.metaDescription.length < 50) {
    score -= 20;
    issues.push('Meta descripción muy corta o ausente');
  } else if (page.metaDescription.length > 160) {
    score -= 10;
    issues.push('Meta descripción muy larga');
  }

  // Verificar H1
  if (!page.h1) {
    score -= 15;
    issues.push('H1 ausente');
  }

  // Verificar palabras clave
  if (!page.keywords || page.keywords.length === 0) {
    score -= 10;
    issues.push('Sin palabras clave');
  }

  // Verificar Open Graph
  if (!page.ogTitle && !page.ogDescription) {
    score -= 5;
    issues.push('Sin configuración Open Graph');
  }

  return { score: Math.max(0, score), issues };
};

const determineSEOStatus = (score: number): 'OPTIMIZED' | 'NEEDS_WORK' | 'POOR' => {
  if (score >= 80) return 'OPTIMIZED';
  if (score >= 60) return 'NEEDS_WORK';
  return 'POOR';
};

// ============================================================================
// RUTAS PRIVADAS (ADMIN)
// ============================================================================

/**
 * @route   GET /api/seo
 * @desc    Obtener lista de páginas SEO con filtros y paginación
 * @access  Private (Admin)
 */
router.get('/', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validateQuery(seoQuerySchema), 
  async (req: AuthRequest, res) => {
    try {
      const query = seoQuerySchema.parse(req.query);
      const { page, limit, search, status, sortBy, sortOrder } = query;

      // Construir filtros
      const where: any = {};

      if (search) {
        where.OR = [
          { url: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { h1: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Obtener páginas SEO
      const [seoPages, total] = await Promise.all([
        prisma.sEOPage.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: offset,
          take: limit
        }),
        prisma.sEOPage.count({ where })
      ]);

      // Formatear respuesta
      const formattedPages = seoPages.map(page => ({
        id: page.id,
        url: page.url,
        title: page.title,
        metaDescription: page.metaDescription,
        keywords: page.keywords,
        h1: page.h1,
        canonicalUrl: page.canonicalUrl,
        ogTitle: page.ogTitle,
        ogDescription: page.ogDescription,
        ogImage: page.ogImage,
        status: page.status.toLowerCase(),
        score: page.score,
        issues: page.issues,
        lastUpdated: page.lastUpdated,
        createdAt: page.createdAt
      }));

      res.json({
        pages: formattedPages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo páginas SEO:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

/**
 * @route   GET /api/seo/:id
 * @desc    Obtener página SEO por ID
 * @access  Private (Admin)
 */
router.get('/:id', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validateParams(z.object({ id: z.string() })), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const seoPage = await prisma.sEOPage.findUnique({
        where: { id }
      });

      if (!seoPage) {
        return res.status(404).json({ error: 'Página SEO no encontrada' });
      }

      // Formatear respuesta
      const formattedPage = {
        id: seoPage.id,
        url: seoPage.url,
        title: seoPage.title,
        metaDescription: seoPage.metaDescription,
        keywords: seoPage.keywords,
        h1: seoPage.h1,
        canonicalUrl: seoPage.canonicalUrl,
        ogTitle: seoPage.ogTitle,
        ogDescription: seoPage.ogDescription,
        ogImage: seoPage.ogImage,
        status: seoPage.status.toLowerCase(),
        score: seoPage.score,
        issues: seoPage.issues,
        lastUpdated: seoPage.lastUpdated,
        createdAt: seoPage.createdAt
      };

      res.json(formattedPage);
    } catch (error) {
      logger.error('Error obteniendo página SEO:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

/**
 * @route   POST /api/seo
 * @desc    Crear nueva página SEO
 * @access  Private (Admin)
 */
router.post('/', 
  authenticate, 
  authorize(['ADMIN']), 
  validate(createSEOPageSchema), 
  async (req: AuthRequest, res) => {
    try {
      const seoData = req.body;

      // Verificar si la URL ya existe
      const existingPage = await prisma.sEOPage.findUnique({
        where: { url: seoData.url }
      });

      if (existingPage) {
        return res.status(409).json({ error: 'Ya existe una página SEO con esta URL' });
      }

      // Calcular score y status
      const { score, issues } = calculateSEOScore(seoData);
      const status = determineSEOStatus(score);

      // Crear página SEO
      const seoPage = await prisma.sEOPage.create({
        data: {
          url: seoData.url,
          title: seoData.title,
          metaDescription: seoData.metaDescription,
          keywords: seoData.keywords,
          h1: seoData.h1,
          canonicalUrl: seoData.canonicalUrl,
          ogTitle: seoData.ogTitle,
          ogDescription: seoData.ogDescription,
          ogImage: seoData.ogImage,
          status,
          score,
          issues
        }
      });

      logger.info(`Página SEO creada: ${seoPage.url} por usuario ${req.user!.id}`);

      res.status(201).json({
        message: 'Página SEO creada exitosamente',
        page: {
          id: seoPage.id,
          url: seoPage.url,
          title: seoPage.title,
          metaDescription: seoPage.metaDescription,
          keywords: seoPage.keywords,
          h1: seoPage.h1,
          canonicalUrl: seoPage.canonicalUrl,
          ogTitle: seoPage.ogTitle,
          ogDescription: seoPage.ogDescription,
          ogImage: seoPage.ogImage,
          status: seoPage.status.toLowerCase(),
          score: seoPage.score,
          issues: seoPage.issues,
          lastUpdated: seoPage.lastUpdated,
          createdAt: seoPage.createdAt
        }
      });
    } catch (error) {
      logger.error('Error creando página SEO:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

/**
 * @route   PUT /api/seo/:id
 * @desc    Actualizar página SEO
 * @access  Private (Admin)
 */
router.put('/:id', 
  authenticate, 
  authorize(['ADMIN']), 
  validateParams(z.object({ id: z.string() })),
  validate(updateSEOPageSchema), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar que la página existe
      const existingPage = await prisma.sEOPage.findUnique({
        where: { id }
      });

      if (!existingPage) {
        return res.status(404).json({ error: 'Página SEO no encontrada' });
      }

      // Si se actualiza la URL, verificar que no exista otra página con esa URL
      if (updateData.url && updateData.url !== existingPage.url) {
        const urlExists = await prisma.sEOPage.findUnique({
          where: { url: updateData.url }
        });

        if (urlExists) {
          return res.status(409).json({ error: 'Ya existe una página SEO con esta URL' });
        }
      }

      // Calcular nuevo score y status
      const updatedPageData = { ...existingPage, ...updateData };
      const { score, issues } = calculateSEOScore(updatedPageData);
      const status = determineSEOStatus(score);

      // Actualizar página SEO
      const updatedPage = await prisma.sEOPage.update({
        where: { id },
        data: {
          ...updateData,
          status,
          score,
          issues,
          lastUpdated: new Date()
        }
      });

      logger.info(`Página SEO actualizada: ${updatedPage.url} por usuario ${req.user!.id}`);

      res.json({
        message: 'Página SEO actualizada exitosamente',
        page: {
          id: updatedPage.id,
          url: updatedPage.url,
          title: updatedPage.title,
          metaDescription: updatedPage.metaDescription,
          keywords: updatedPage.keywords,
          h1: updatedPage.h1,
          canonicalUrl: updatedPage.canonicalUrl,
          ogTitle: updatedPage.ogTitle,
          ogDescription: updatedPage.ogDescription,
          ogImage: updatedPage.ogImage,
          status: updatedPage.status.toLowerCase(),
          score: updatedPage.score,
          issues: updatedPage.issues,
          lastUpdated: updatedPage.lastUpdated,
          createdAt: updatedPage.createdAt
        }
      });
    } catch (error) {
      logger.error('Error actualizando página SEO:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

/**
 * @route   DELETE /api/seo/:id
 * @desc    Eliminar página SEO
 * @access  Private (Admin)
 */
router.delete('/:id', 
  authenticate, 
  authorize(['ADMIN']), 
  validateParams(z.object({ id: z.string() })),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      // Verificar que la página existe
      const existingPage = await prisma.sEOPage.findUnique({
        where: { id }
      });

      if (!existingPage) {
        return res.status(404).json({ error: 'Página SEO no encontrada' });
      }

      // Eliminar página SEO
      await prisma.sEOPage.delete({
        where: { id }
      });

      logger.info(`Página SEO eliminada: ${existingPage.url} por usuario ${req.user!.id}`);

      res.json({
        message: 'Página SEO eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando página SEO:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

export default router;