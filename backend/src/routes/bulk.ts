import express from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const bulkProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  price: z.number().positive('El precio debe ser positivo'),
  originalPrice: z.number().positive().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  subcategory: z.string().optional(),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  care: z.string().optional(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z.array(z.string().url('URL de imagen inválida')).min(1, 'Al menos una imagen es requerida'),
  tags: z.array(z.string()).default([])
});

const bulkImportSchema = z.object({
  products: z.array(bulkProductSchema).min(1, 'Al menos un producto es requerido').max(100, 'Máximo 100 productos por lote')
});

const bulkUpdateSchema = z.object({
  productIds: z.array(z.string().cuid()).min(1, 'Al menos un ID de producto es requerido'),
  updates: z.object({
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    category: z.string().min(1).optional(),
    subcategory: z.string().optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
    materials: z.string().optional(),
    dimensions: z.string().optional(),
    care: z.string().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado"
  })
});

const bulkDeleteSchema = z.object({
  productIds: z.array(z.string().cuid()).min(1, 'Al menos un ID de producto es requerido').max(50, 'Máximo 50 productos por lote')
});

// ============================================================================
// RUTAS DE IMPORTACIÓN MASIVA
// ============================================================================

/**
 * @route   POST /api/bulk/import
 * @desc    Importar múltiples productos desde CSV
 * @access  Private (Admin/Manager)
 */
router.post('/import', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validate(bulkImportSchema), 
  async (req: AuthRequest, res) => {
    try {
      const { products } = req.body;
      const userId = req.user!.id;
      
      logger.info(`Iniciando importación masiva de ${products.length} productos por usuario ${userId}`);

      const results = {
        success: [] as any[],
        errors: [] as { index: number; product: any; error: string }[]
      };

      // Procesar productos en lotes para evitar sobrecarga
      const batchSize = 10;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        // Procesar lote actual
        const batchPromises = batch.map(async (productData, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            // Verificar si ya existe un producto con el mismo nombre
            const existingProduct = await prisma.product.findFirst({
              where: { name: productData.name }
            });

            if (existingProduct) {
              throw new Error(`Ya existe un producto con el nombre "${productData.name}"`);
            }

            // Crear producto con imágenes y tags
            const product = await prisma.product.create({
              data: {
                name: productData.name,
                price: productData.price,
                originalPrice: productData.originalPrice,
                category: productData.category,
                subcategory: productData.subcategory || '',
                description: productData.description,
                materials: productData.materials || '',
                dimensions: productData.dimensions || '',
                care: productData.care || '',
                inStock: productData.inStock,
                featured: productData.featured,
                images: {
                  create: productData.images.map((url, index) => ({
                    url,
                    isPrimary: index === 0,
                    order: index,
                    altText: `${productData.name} - Imagen ${index + 1}`
                  }))
                },
                tags: {
                  create: productData.tags.map(tag => ({ tag }))
                }
              },
              include: {
                images: true,
                tags: true
              }
            });

            results.success.push({
              index: globalIndex,
              product: {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                category: product.category
              }
            });

            logger.info(`Producto importado exitosamente: ${product.name} (${globalIndex + 1}/${products.length})`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            results.errors.push({
              index: globalIndex,
              product: productData,
              error: errorMessage
            });
            logger.error(`Error importando producto ${globalIndex + 1}: ${errorMessage}`);
          }
        });

        // Esperar a que termine el lote actual
        await Promise.all(batchPromises);
        
        // Pequeña pausa entre lotes para no sobrecargar la DB
        if (i + batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info(`Importación masiva completada: ${results.success.length} éxitos, ${results.errors.length} errores`);

      res.json({
        message: 'Importación masiva completada',
        summary: {
          total: products.length,
          success: results.success.length,
          errors: results.errors.length
        },
        results: results
      });

    } catch (error) {
      logger.error('Error en importación masiva:', error);
      res.status(500).json({ error: 'Error interno del servidor durante la importación' });
    }
  }
);

// ============================================================================
// RUTAS DE OPERACIONES EN LOTE
// ============================================================================

/**
 * @route   PATCH /api/bulk/update
 * @desc    Actualizar múltiples productos
 * @access  Private (Admin/Manager)
 */
router.patch('/update', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validate(bulkUpdateSchema), 
  async (req: AuthRequest, res) => {
    try {
      const { productIds, updates } = req.body;
      const userId = req.user!.id;

      logger.info(`Iniciando actualización masiva de ${productIds.length} productos por usuario ${userId}`);

      // Verificar que todos los productos existen
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      });

      const foundIds = existingProducts.map(p => p.id);
      const notFoundIds = productIds.filter(id => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        return res.status(404).json({ 
          error: `Productos no encontrados: ${notFoundIds.join(', ')}` 
        });
      }

      // Realizar actualización masiva
      const updateResult = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: updates
      });

      // Obtener productos actualizados para el log
      const updatedProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      });

      logger.info(`Actualización masiva completada: ${updateResult.count} productos actualizados`);
      
      // Log individual para auditoría
      updatedProducts.forEach(product => {
        logger.info(`Producto actualizado en lote: ${product.name} por usuario ${userId}`);
      });

      res.json({
        message: `${updateResult.count} productos actualizados exitosamente`,
        updated: updateResult.count,
        products: updatedProducts
      });

    } catch (error) {
      logger.error('Error en actualización masiva:', error);
      res.status(500).json({ error: 'Error interno del servidor durante la actualización' });
    }
  }
);

/**
 * @route   DELETE /api/bulk/delete
 * @desc    Eliminar múltiples productos
 * @access  Private (Admin)
 */
router.delete('/delete', 
  authenticate, 
  authorize(['ADMIN']), 
  validate(bulkDeleteSchema), 
  async (req: AuthRequest, res) => {
    try {
      const { productIds } = req.body;
      const userId = req.user!.id;

      logger.info(`Iniciando eliminación masiva de ${productIds.length} productos por usuario ${userId}`);

      // Obtener información de productos antes de eliminar (para logs)
      const productsToDelete = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      });

      const foundIds = productsToDelete.map(p => p.id);
      const notFoundIds = productIds.filter(id => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        return res.status(404).json({ 
          error: `Productos no encontrados: ${notFoundIds.join(', ')}` 
        });
      }

      // Eliminar productos (las imágenes y tags se eliminan en cascada)
      const deleteResult = await prisma.product.deleteMany({
        where: { id: { in: foundIds } }
      });

      logger.info(`Eliminación masiva completada: ${deleteResult.count} productos eliminados`);
      
      // Log individual para auditoría
      productsToDelete.forEach(product => {
        logger.info(`Producto eliminado en lote: ${product.name} por usuario ${userId}`);
      });

      res.json({
        message: `${deleteResult.count} productos eliminados exitosamente`,
        deleted: deleteResult.count,
        products: productsToDelete
      });

    } catch (error) {
      logger.error('Error en eliminación masiva:', error);
      res.status(500).json({ error: 'Error interno del servidor durante la eliminación' });
    }
  }
);

/**
 * @route   POST /api/bulk/validate
 * @desc    Validar datos de productos antes de importar
 * @access  Private (Admin/Manager)
 */
router.post('/validate', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  async (req: AuthRequest, res) => {
    try {
      const { products } = req.body;

      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Se esperaba un array de productos' });
      }

      const validationResults = {
        valid: [] as any[],
        invalid: [] as { index: number; product: any; errors: string[] }[]
      };

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const errors: string[] = [];

        try {
          // Validar con schema Zod
          bulkProductSchema.parse(product);
          
          // Validaciones adicionales
          if (product.originalPrice && product.originalPrice <= product.price) {
            errors.push('El precio original debe ser mayor al precio actual');
          }

          // Verificar si ya existe un producto con el mismo nombre
          const existingProduct = await prisma.product.findFirst({
            where: { name: product.name }
          });

          if (existingProduct) {
            errors.push(`Ya existe un producto con el nombre "${product.name}"`);
          }

          if (errors.length === 0) {
            validationResults.valid.push({ index: i, product });
          } else {
            validationResults.invalid.push({ index: i, product, errors });
          }

        } catch (zodError) {
          if (zodError instanceof z.ZodError) {
            const zodErrors = zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            errors.push(...zodErrors);
          } else {
            errors.push('Error de validación desconocido');
          }
          
          validationResults.invalid.push({ index: i, product, errors });
        }
      }

      res.json({
        summary: {
          total: products.length,
          valid: validationResults.valid.length,
          invalid: validationResults.invalid.length
        },
        results: validationResults
      });

    } catch (error) {
      logger.error('Error en validación de productos:', error);
      res.status(500).json({ error: 'Error interno del servidor durante la validación' });
    }
  }
);

export default router;