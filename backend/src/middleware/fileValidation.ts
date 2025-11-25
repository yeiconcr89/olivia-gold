import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import SecurityLogger from './securityLogger';

/**
 * Configuración avanzada de validación de archivos
 */

// Tipos MIME permitidos con sus extensiones correspondientes
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'], // Solo para iconos, con validación especial
  'application/pdf': ['.pdf'], // Para documentos específicos
} as const;

// Límites de tamaño por tipo de archivo (en bytes)
const SIZE_LIMITS = {
  'image/jpeg': 5 * 1024 * 1024,    // 5MB
  'image/png': 5 * 1024 * 1024,     // 5MB
  'image/webp': 5 * 1024 * 1024,    // 5MB
  'image/gif': 10 * 1024 * 1024,    // 10MB (pueden ser más grandes)
  'image/svg+xml': 100 * 1024,      // 100KB (solo iconos)
  'application/pdf': 2 * 1024 * 1024, // 2MB
} as const;

// Tipos MIME peligrosos que nunca se deben permitir
const DANGEROUS_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program', 
  'application/x-executable',
  'application/x-winexe',
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'text/x-php',
  'application/x-php',
  'application/x-httpd-php',
];

// Extensiones peligrosas
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
  '.vbs', '.vbe', '.js', '.jar', '.php', '.asp',
  '.aspx', '.jsp', '.html', '.htm', '.xml'
];

/**
 * Detectar tipo MIME real del archivo usando magic numbers
 */
function detectRealMimeType(buffer: Buffer): string | null {
  // Magic numbers para diferentes tipos de archivo
  const magicNumbers = [
    { mime: 'image/jpeg', patterns: [[0xFF, 0xD8, 0xFF]] },
    { mime: 'image/png', patterns: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]] },
    { mime: 'image/gif', patterns: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]] },
    { mime: 'image/webp', patterns: [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]] },
    { mime: 'application/pdf', patterns: [[0x25, 0x50, 0x44, 0x46]] },
    // SVG es XML, más difícil de detectar por magic numbers
    { mime: 'image/svg+xml', patterns: [] }, // Se valida por contenido
  ];

  for (const { mime, patterns } of magicNumbers) {
    for (const pattern of patterns) {
      if (matchesPattern(buffer, pattern)) {
        return mime;
      }
    }
  }

  // Para SVG, verificar si es XML válido con elemento svg
  if (buffer.toString('utf8', 0, 100).includes('<svg')) {
    return 'image/svg+xml';
  }

  return null;
}

/**
 * Verificar si el buffer coincide con un patrón de magic numbers
 */
function matchesPattern(buffer: Buffer, pattern: (number | null)[]): boolean {
  if (buffer.length < pattern.length) return false;
  
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== null && buffer[i] !== pattern[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Sanitizar nombre de archivo
 */
function sanitizeFilename(filename: string): string {
  // Remover caracteres peligrosos
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Solo alfanuméricos, puntos, guiones y underscores
    .replace(/_{2,}/g, '_') // Remover múltiples underscores consecutivos
    .replace(/^[._-]+|[._-]+$/g, '') // Remover caracteres especiales al inicio/final
    .toLowerCase();

  // Asegurar que no esté vacío
  if (!sanitized || sanitized.length === 0) {
    return `file_${Date.now()}`;
  }

  // Limitar longitud
  if (sanitized.length > 100) {
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext).substring(0, 90);
    return base + ext;
  }

  return sanitized;
}

/**
 * Validar contenido SVG para detectar contenido malicioso
 */
function validateSVGContent(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload/i,
    /onerror/i,
    /onclick/i,
    /onmouseover/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /xlink:href.*javascript/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Configuración de multer con validación avanzada
 */
export const createMulterConfig = (options: {
  maxFileSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  folder?: string;
} = {}) => {
  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB por defecto
    maxFiles = 10,
    allowedMimeTypes = Object.keys(ALLOWED_MIME_TYPES),
    folder = 'uploads'
  } = options;

  const storage = multer.memoryStorage();

  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      // 1. Verificar extensión
      const ext = path.extname(file.originalname).toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(ext)) {
        SecurityLogger.logSuspiciousActivity(req, 'Dangerous file extension uploaded', {
          filename: file.originalname,
          extension: ext,
          mimetype: file.mimetype
        });
        return cb(new Error(`Extensión de archivo peligrosa: ${ext}`));
      }

      // 2. Verificar MIME type declarado
      if (DANGEROUS_MIME_TYPES.includes(file.mimetype)) {
        SecurityLogger.logSuspiciousActivity(req, 'Dangerous MIME type uploaded', {
          filename: file.originalname,
          mimetype: file.mimetype
        });
        return cb(new Error(`Tipo de archivo peligroso: ${file.mimetype}`));
      }

      // 3. Verificar que el MIME type esté permitido
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(
          `Tipo de archivo no permitido: ${file.mimetype}. ` +
          `Tipos permitidos: ${allowedMimeTypes.join(', ')}`
        ));
      }

      // 4. Verificar que la extensión coincida con el MIME type
      const allowedExtensions = ALLOWED_MIME_TYPES[file.mimetype as keyof typeof ALLOWED_MIME_TYPES];
      if (allowedExtensions && !allowedExtensions.includes(ext)) {
        return cb(new Error(
          `Extensión ${ext} no coincide con el tipo de archivo ${file.mimetype}. ` +
          `Extensiones permitidas: ${allowedExtensions.join(', ')}`
        ));
      }

      // 5. Verificar tamaño específico por tipo
      const sizeLimit = SIZE_LIMITS[file.mimetype as keyof typeof SIZE_LIMITS] || maxFileSize;
      if (file.size && file.size > sizeLimit) {
        return cb(new Error(
          `Archivo demasiado grande. Tamaño: ${Math.round(file.size / 1024)}KB, ` +
          `Límite: ${Math.round(sizeLimit / 1024)}KB`
        ));
      }

      cb(null, true);
    } catch (error) {
      logger.error('Error en filtro de archivos:', error);
      cb(new Error('Error validando archivo'));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fieldSize: 10 * 1024, // 10KB para campos de texto
      fieldNameSize: 100,    // 100 caracteres para nombres de campo
      headerPairs: 20,       // Máximo 20 headers
    },
  });
};

/**
 * Middleware de validación post-upload para verificar contenido real
 */
export const validateUploadedFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    const singleFile = req.file as Express.Multer.File;

    // Crear array unificado de archivos
    let filesToValidate: Express.Multer.File[] = [];
    
    if (singleFile) {
      filesToValidate = [singleFile];
    } else if (Array.isArray(files)) {
      filesToValidate = files;
    } else if (files && typeof files === 'object') {
      filesToValidate = Object.values(files).flat();
    }

    // Validar cada archivo
    for (const file of filesToValidate) {
      await validateSingleFile(req, file);
    }

    next();
  } catch (error) {
    logger.error('Error en validación post-upload:', error);
    res.status(400).json({
      error: 'Error validando archivo',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Validar un archivo individual
 */
async function validateSingleFile(req: Request, file: Express.Multer.File): Promise<void> {
  // 1. Detectar tipo MIME real
  const realMimeType = detectRealMimeType(file.buffer);
  
  if (!realMimeType) {
    throw new Error(`No se pudo determinar el tipo real del archivo: ${file.originalname}`);
  }

  // 2. Verificar que el MIME type real coincida con el declarado
  if (realMimeType !== file.mimetype) {
    SecurityLogger.logSuspiciousActivity(req, 'MIME type mismatch detected', {
      filename: file.originalname,
      declaredMimeType: file.mimetype,
      realMimeType: realMimeType
    });
    throw new Error(
      `Discrepancia en tipo de archivo: declarado como ${file.mimetype}, ` +
      `pero es realmente ${realMimeType}`
    );
  }

  // 3. Validación específica para SVG
  if (realMimeType === 'image/svg+xml') {
    const content = file.buffer.toString('utf8');
    if (!validateSVGContent(content)) {
      SecurityLogger.logSuspiciousActivity(req, 'Malicious SVG content detected', {
        filename: file.originalname
      });
      throw new Error('El archivo SVG contiene contenido potencialmente malicioso');
    }
  }

  // 4. Verificar que no sea un archivo ejecutable disfrazado
  const signature = file.buffer.toString('hex', 0, 4);
  const executableSignatures = [
    '4d5a9000', // PE executable
    '7f454c46', // ELF executable
    'cafebabe', // Java class file
    'feedface', // Mach-O binary
  ];

  if (executableSignatures.includes(signature)) {
    SecurityLogger.logSuspiciousActivity(req, 'Executable file disguised as image', {
      filename: file.originalname,
      signature: signature
    });
    throw new Error('Archivo ejecutable detectado');
  }

  // 5. Verificar tamaño de dimensiones para imágenes (prevenir zip bombs)
  if (realMimeType.startsWith('image/') && realMimeType !== 'image/svg+xml') {
    // Esta validación se puede hacer con libraries como 'image-size'
    // Por ahora, verificamos solo el tamaño del buffer
    if (file.buffer.length > 20 * 1024 * 1024) { // 20MB
      throw new Error('Imagen demasiado grande o potencialmente maliciosa');
    }
  }

  logger.info('Archivo validado exitosamente:', {
    filename: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    realMimeType: realMimeType
  });
}

/**
 * Generar nombre de archivo seguro y único
 */
export function generateSecureFilename(originalName: string, folder: string = 'uploads'): string {
  const ext = path.extname(originalName).toLowerCase();
  const sanitizedBase = sanitizeFilename(path.basename(originalName, ext));
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  
  return `${folder}/${sanitizedBase}-${timestamp}-${randomBytes}${ext}`;
}

/**
 * Middleware para logging de uploads
 */
export const logFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    // Log del resultado del upload
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const files = req.files || (req.file ? [req.file] : []);
      const fileCount = Array.isArray(files) ? files.length : Object.keys(files).length;
      
      logger.info('File upload completed successfully:', {
        userId: (req as any).user?.id,
        fileCount,
        totalSize: Array.isArray(files) ? 
          files.reduce((sum, file) => sum + file.size, 0) :
          req.file?.size || 0,
        endpoint: req.path
      });
    } else {
      logger.warn('File upload failed:', {
        userId: (req as any).user?.id,
        statusCode: res.statusCode,
        endpoint: req.path
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

export default {
  createMulterConfig,
  validateUploadedFiles,
  generateSecureFilename,
  logFileUpload,
  sanitizeFilename
};