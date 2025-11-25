import express, { Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, optionalAuth, AuthRequest } from '../middleware/auth';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { logger } from '../utils/logger';
import * as productService from '../services/product.service';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  price: z.number()
    .positive('El precio debe ser positivo')
    .max(99999999.99, 'El precio no puede exceder $99,999,999.99'),
  originalPrice: z.union([
    z.number()
      .min(0, 'El precio original no puede ser negativo')
      .max(99999999.99, 'El precio original no puede exceder $99,999,999.99'),
    z.string().transform((val) => (val === '' ? undefined : parseFloat(val))),
    z.undefined(),
  ]).optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  subcategory: z.string().optional().default('General'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  materials: z.string().min(1, 'Los materiales son requeridos'),
  dimensions: z.string().min(1, 'Las dimensiones son requeridas'),
  care: z.string().min(1, 'Las instrucciones de cuidado son requeridas'),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z.array(z.string().url('URL de imagen inválida')).min(1, 'Al menos una imagen es requerida'),
  tags: z.array(z.string()).default([]),
});

const updateProductSchema = createProductSchema.partial();

// ============================================================================
// RUTAS
// ============================================================================

// GET /api/products - Obtener todos los productos
router.get('/', 
  validateQuery(z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    inStock: z.string().transform((val) => val === 'true').optional(),
    featured: z.string().transform((val) => val === 'true').optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['price', 'name', 'rating', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  })), 
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const query = req.query as any;
      const result = await productService.getAllProducts(query);
      res.json(result);
    } catch (error) {
      logger.error('Error obteniendo productos:', error);
      throw error; // Re-lanzar para que el middleware lo capture
    }
  }
);

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id',
  validateParams(z.object({ id: z.string().cuid() })),
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      res.json(product);
    } catch (error) {
      logger.error('Error obteniendo producto:', error);
      throw error; // Re-lanzar para que el middleware lo capture
    }
  }
);

// POST /api/products - Crear un nuevo producto
router.post('/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validate(createProductSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const productData = req.body;
      const product = await productService.createProduct(productData);
      res.status(201).json({
        message: 'Producto creado exitosamente',
        product,
      });
    } catch (error) {
      logger.error('Error creando producto:', error);
      throw error; // Re-lanzar para que el middleware lo capture
    }
  }
);

// PUT/PATCH /api/products/:id - Actualizar un producto
const updateProductHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProduct = await productService.updateProduct(id, updateData);
    logger.info(`Producto actualizado: ${updatedProduct.name} por usuario ${req.user?.id}`);

    res.json({
      message: 'Producto actualizado exitosamente',
      product: updatedProduct,
    });
  } catch (error) {
    logger.error('Error actualizando producto:', error);
    throw error; // Re-lanzar para que el middleware lo capture
  }
};

router.put('/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateParams(z.object({ id: z.string().cuid() })),
  validate(updateProductSchema),
  updateProductHandler
);

router.patch('/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateParams(z.object({ id: z.string().cuid() })),
  validate(updateProductSchema),
  updateProductHandler
);

// DELETE /api/products/:id - Eliminar un producto
router.delete('/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(z.object({ id: z.string().cuid() })),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
      logger.error('Error eliminando producto:', error);
      throw error; // Re-lanzar para que el middleware lo capture
    }
  }
);

export default router;