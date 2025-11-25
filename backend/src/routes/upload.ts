import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { uploadLimiter } from '../middleware/rateLimiting';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { z } from 'zod';
import path from 'path';
import {
  createMulterConfig,
  validateUploadedFiles,
  generateSecureFilename,
  logFileUpload
} from '../middleware/fileValidation';
import SecurityLogger from '../middleware/securityLogger';

const router = express.Router();

// ============================================================================
// CONFIGURACIÓN DE CLOUDINARY
// ============================================================================

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Log de configuración de Cloudinary para debug
logger.info('Configuración de Cloudinary:', {
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey ? `${config.cloudinary.apiKey.substring(0, 6)}...` : 'NO CONFIGURADO',
  api_secret: config.cloudinary.apiSecret ? 'CONFIGURADO' : 'NO CONFIGURADO'
});

// ============================================================================
// CONFIGURACIÓN DE MULTER CON VALIDACIÓN AVANZADA
// ============================================================================

// Configuración segura para imágenes
const imageUpload = createMulterConfig({
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  folder: 'images'
});

// Configuración más permisiva para documentos (si es necesario)
const documentUpload = createMulterConfig({
  maxFileSize: 2 * 1024 * 1024, // 2MB
  maxFiles: 5,
  allowedMimeTypes: ['application/pdf'],
  folder: 'documents'
});

// Por defecto, usar configuración de imágenes
const upload = imageUpload;

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const uploadConfigSchema = z.object({
  folder: z.enum(['products', 'seo', 'general']).default('general'),
  quality: z.coerce.number().min(10).max(100).default(80),
  width: z.coerce.number().min(100).max(2000).optional(),
  height: z.coerce.number().min(100).max(2000).optional(),
  format: z.enum(['auto', 'jpg', 'png', 'webp']).default('auto'),
});

const transformSchema = z.object({
  publicId: z.string(),
  width: z.coerce.number().min(100).max(2000).optional(),
  height: z.coerce.number().min(100).max(2000).optional(),
  quality: z.coerce.number().min(10).max(100).default(80),
  format: z.enum(['auto', 'jpg', 'png', 'webp']).default('auto'),
  crop: z.enum(['scale', 'fit', 'limit', 'fill', 'crop']).default('limit'),
});

// ============================================================================
// UTILIDADES
// ============================================================================

// Usar la función segura de generación de nombres de archivo
// const generateFileName = generateSecureFilename; // Ya importada

const uploadToCloudinary = async (
  buffer: Buffer,
  fileName: string,
  options: any = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      public_id: fileName,
      resource_type: 'image' as const,
      quality: options.quality || 80,
    };

    // Solo agregar opciones definidas
    if (options.format) {
      uploadOptions.format = options.format;
    }
    if (options.width) uploadOptions.width = options.width;
    if (options.height) uploadOptions.height = options.height;

    // Si se especifican dimensiones, agregar transformación
    if (options.width || options.height) {
      uploadOptions.transformation = {
        width: options.width,
        height: options.height,
        crop: 'limit',
        quality: 'auto:good',
      };
    }

    logger.info(`Intentando subir a Cloudinary: ${fileName} con opciones:`, uploadOptions);

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error(`Error de Cloudinary para ${fileName}:`, error);
          reject(error);
        } else {
          logger.info(`Éxito subiendo a Cloudinary: ${fileName} -> ${result?.secure_url}`);
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// ============================================================================
// RUTAS
// ============================================================================

/**
 * @route   POST /api/upload/single
 * @desc    Subir una sola imagen
 * @access  Private (Admin/Manager)
 */
router.post('/single',
  uploadLimiter,
  authenticate,
  logFileUpload,
  upload.single('file'),  // Cambiado de 'image' a 'file' para coincidir con el frontend
  validateUploadedFiles,  // Validación post-upload
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No se ha proporcionado ningún archivo',
          details: 'Asegúrate de enviar un archivo en el campo "file"'
        });
      }

      // Validar y parsear los parámetros manualmente para ruta single
      const folder = req.body.folder || 'general';
      const quality = req.body.quality ? parseInt(req.body.quality) : 80;
      const width = req.body.width ? parseInt(req.body.width) : undefined;
      const height = req.body.height ? parseInt(req.body.height) : undefined;
      const format = req.body.format && req.body.format !== 'auto' ? req.body.format : undefined;

      // Generar nombre único y seguro, o usar publicId específico si se proporciona
      let fileName: string;
      if (req.body.publicId) {
        // Si se proporciona un publicId específico (para contenido estático)
        fileName = req.body.publicId;
        // Asegurarse de que no tenga extensión duplicada si el cliente la envió
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (fileName.endsWith(ext)) {
          fileName = fileName.substring(0, fileName.length - ext.length);
        }
      } else {
        fileName = generateSecureFilename(req.file.originalname, folder);
      }

      // Subir a Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, fileName, {
        quality,
        width,
        height,
        format,
      });

      logger.info(`Imagen subida: ${result.public_id} por usuario ${req.user!.id}`);

      // Log de seguridad para upload exitoso
      await SecurityLogger.logAdminAccess(req, req.user!.id, `Image uploaded: ${result.public_id}`);

      res.json({
        message: 'Imagen subida exitosamente',
        image: {
          id: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          folder: folder,
        },
      });
    } catch (error) {
      logger.error('Error subiendo imagen:', error);

      // Log de seguridad para upload fallido
      await SecurityLogger.logSuspiciousActivity(req, 'File upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype
      });

      res.status(500).json({
        error: 'Error al subir la imagen',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Subir múltiples imágenes
 * @access  Private (Admin/Manager)
 */
router.post('/multiple',
  uploadLimiter,
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  logFileUpload,
  upload.array('images', 10),
  validateUploadedFiles,
  async (req: AuthRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No se proporcionaron archivos',
        });
      }

      // Validar y parsear los parámetros manualmente
      const folder = req.body.folder || 'general';
      const quality = req.body.quality ? parseInt(req.body.quality) : 80;
      const width = req.body.width ? parseInt(req.body.width) : undefined;
      const height = req.body.height ? parseInt(req.body.height) : undefined;
      const format = req.body.format && req.body.format !== 'auto' ? req.body.format : undefined;

      // Subir todas las imágenes en paralelo
      const uploadPromises = files.map(async (file) => {
        try {
          const fileName = generateSecureFilename(file.originalname, folder);
          const result = await uploadToCloudinary(file.buffer, fileName, {
            quality,
            width,
            height,
            format,
          });

          return {
            success: true,
            originalName: file.originalname,
            image: {
              id: result.public_id,
              url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              size: result.bytes,
              folder: folder,
            },
          };
        } catch (error) {
          logger.error(`Error subiendo imagen ${file.originalname}:`, error);
          return {
            success: false,
            originalName: file.originalname,
            error: error instanceof Error ? error.message : 'Error desconocido',
          };
        }
      });

      const results = await Promise.all(uploadPromises);

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      logger.info(`Imágenes subidas: ${successful.length} exitosas, ${failed.length} fallidas por usuario ${req.user!.id}`);

      res.json({
        message: `${successful.length} imágenes subidas exitosamente`,
        successful: successful.map(r => r.image),
        failed: failed.map(r => ({
          originalName: r.originalName,
          error: r.error,
        })),
        summary: {
          total: files.length,
          successful: successful.length,
          failed: failed.length,
        },
      });
    } catch (error) {
      logger.error('Error subiendo imágenes múltiples:', error);
      res.status(500).json({
        error: 'Error al subir las imágenes',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
);

/**
 * @route   DELETE /api/upload/:publicId
 * @desc    Eliminar imagen de Cloudinary
 * @access  Private (Admin/Manager)
 */
router.delete('/:publicId',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: AuthRequest, res) => {
    try {
      const { publicId } = req.params;

      // Decodificar el public_id (puede venir con / codificados)
      const decodedPublicId = decodeURIComponent(publicId);

      // Eliminar de Cloudinary
      const result = await cloudinary.uploader.destroy(decodedPublicId);

      if (result.result === 'ok') {
        logger.info(`Imagen eliminada: ${decodedPublicId} por usuario ${req.user!.id}`);

        res.json({
          message: 'Imagen eliminada exitosamente',
          publicId: decodedPublicId,
        });
      } else {
        res.status(404).json({
          error: 'Imagen no encontrada',
          publicId: decodedPublicId,
        });
      }
    } catch (error) {
      logger.error('Error eliminando imagen:', error);
      res.status(500).json({
        error: 'Error al eliminar la imagen',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
);

/**
 * @route   GET /api/upload/gallery
 * @desc    Obtener galería de imágenes
 * @access  Private (Admin/Manager)
 */
router.get('/gallery',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: AuthRequest, res) => {
    try {
      const { folder, limit = 50, next_cursor } = req.query;

      const searchOptions: any = {
        resource_type: 'image',
        max_results: parseInt(limit as string),
        sort_by: [['created_at', 'desc']],
      };

      if (folder) {
        searchOptions.prefix = folder;
      }

      if (next_cursor) {
        searchOptions.next_cursor = next_cursor;
      }

      const result = await cloudinary.search
        .expression('resource_type:image')
        .sort_by('created_at', 'desc')
        .max_results(parseInt(limit as string))
        .execute();

      const images = result.resources.map((resource: any) => ({
        id: resource.public_id,
        url: resource.secure_url,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        size: resource.bytes,
        createdAt: resource.created_at,
        folder: resource.folder || 'general',
      }));

      res.json({
        images,
        nextCursor: result.next_cursor,
        totalCount: result.total_count,
      });
    } catch (error) {
      logger.error('Error obteniendo galería:', error);
      res.status(500).json({
        error: 'Error al obtener la galería',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
);

/**
 * @route   POST /api/upload/transform
 * @desc    Transformar imagen existente
 * @access  Private (Admin/Manager)
 */
router.post('/transform',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validate(transformSchema),
  async (req: AuthRequest, res) => {
    try {
      const { publicId, width, height, quality, format, crop } = req.body;

      // Construir URL de transformación
      const transformationOptions: any = {
        quality: quality || 'auto:good',
        format: format || 'auto',
      };

      if (width || height) {
        transformationOptions.width = width;
        transformationOptions.height = height;
        transformationOptions.crop = crop;
      }

      const transformedUrl = cloudinary.url(publicId, transformationOptions);

      logger.info(`Imagen transformada: ${publicId} por usuario ${req.user!.id}`);

      res.json({
        message: 'Transformación aplicada exitosamente',
        originalPublicId: publicId,
        transformedUrl,
        transformations: transformationOptions,
      });
    } catch (error) {
      logger.error('Error transformando imagen:', error);
      res.status(500).json({
        error: 'Error al transformar la imagen',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
);

/**
 * @route   GET /api/upload/stats
 * @desc    Obtener estadísticas de uso de almacenamiento
 * @access  Private (Admin)
 */
router.get('/stats',
  authenticate,
  authorize(['ADMIN']),
  async (req: Request, res) => {
    try {
      const authReq = req as AuthRequest;

      // Verificar configuración de Cloudinary
      if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
        logger.error('Cloudinary credentials not configured');
        return res.status(500).json({
          error: 'Credenciales de Cloudinary no configuradas correctamente'
        });
      }

      // Obtener estadísticas de uso
      let usage;
      try {
        logger.info('Intentando obtener estadísticas de Cloudinary con config:', {
          cloudName: config.cloudinary.cloudName,
          apiKeyConfigured: !!config.cloudinary.apiKey,
          apiSecretConfigured: !!config.cloudinary.apiSecret
        });

        usage = await cloudinary.api.usage();

        logger.info('Estadísticas de Cloudinary obtenidas:', usage);
      } catch (cloudinaryError: any) {
        logger.error('Cloudinary usage API error:', {
          error: cloudinaryError.message,
          code: cloudinaryError.http_code,
          stack: cloudinaryError.stack
        });
        return res.status(cloudinaryError.http_code || 500).json({
          error: 'Error al obtener estadísticas de Cloudinary',
          details: cloudinaryError.message,
          additionalInfo: process.env.NODE_ENV === 'development' ? cloudinaryError.stack : undefined
        });
      }

      // Obtener información por carpetas
      let folders;
      try {
        folders = await cloudinary.api.root_folders();
      } catch (foldersError: any) {
        logger.warn('Could not fetch Cloudinary folders:', foldersError.message);
        folders = { folders: [] };
      }

      const folderStats = await Promise.all(
        folders.folders.map(async (folder: any) => {
          try {
            const folderResources = await cloudinary.search
              .expression(`folder:${folder.name}`)
              .execute();

            return {
              name: folder.name,
              count: folderResources.total_count,
            };
          } catch (searchError) {
            logger.warn(`Error fetching resources for folder ${folder.name}:`, searchError);
            return {
              name: folder.name,
              count: 0,
              error: 'No se pudo obtener el conteo'
            };
          }
        })
      );

      res.json({
        usage: {
          credits: usage.credits,
          usedCredits: usage.credits_usage,
          bandwidth: usage.bandwidth,
          storage: usage.storage,
          requests: usage.requests,
          resources: usage.resources,
        },
        folders: folderStats,
        limits: {
          maxFileSize: '5MB',
          allowedFormats: ['JPEG', 'PNG', 'WebP', 'GIF'],
          maxFilesPerUpload: 10,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas de upload:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
);

export default router;