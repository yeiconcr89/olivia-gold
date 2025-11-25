import { z } from 'zod';

/**
 * Schema de validación de variables de entorno con Zod
 * Valida y tipos todas las variables de entorno requeridas
 */

// Schema base para todos los ambientes
const baseEnvSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string()
    .url('DATABASE_URL debe ser una URL válida')
    .refine(url => url.startsWith('postgresql://'), {
      message: 'DATABASE_URL debe ser una conexión PostgreSQL'
    }),

  // Autenticación y seguridad
  JWT_SECRET: z.string()
    .min(16, 'JWT_SECRET debe tener al menos 16 caracteres')
    .refine(secret => !/^(secret|jwt|test|admin|password|123)$/i.test(secret), {
      message: 'JWT_SECRET no debe usar valores obvios'
    }),

  SESSION_SECRET: z.string()
    .min(16, 'SESSION_SECRET debe tener al menos 16 caracteres')
    .refine(secret => !/^(secret|session|test|admin|password|123)$/i.test(secret), {
      message: 'SESSION_SECRET no debe usar valores obvios'
    }),

  JWT_EXPIRES_IN: z.string()
    .regex(/^\d+[dhm]$/, 'JWT_EXPIRES_IN debe tener formato como "7d", "24h", "60m"')
    .default('7d'),

  // Servidor
  PORT: z.string()
    .regex(/^\d+$/, 'PORT debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(port => port >= 1000 && port <= 65535, {
      message: 'PORT debe estar entre 1000 y 65535'
    })
    .or(z.number())
    .default(3001),

  // Configuración de Email
  SMTP_HOST: z.string()
    .min(1, 'SMTP_HOST es requerido'),

  SMTP_PORT: z.string()
    .regex(/^\d+$/, 'SMTP_PORT debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(port => port >= 1 && port <= 65535, {
      message: 'SMTP_PORT debe estar entre 1 y 65535'
    }),

  SMTP_USER: z.string()
    .min(1, 'SMTP_USER es requerido'),

  SMTP_PASS: z.string()
    .min(1, 'SMTP_PASS es requerido'),

  SMTP_FROM_NAME: z.string()
    .min(1, 'SMTP_FROM_NAME es requerido')
    .default('Olivia Gold'),

  SMTP_FROM_EMAIL: z.string()
    .email('SMTP_FROM_EMAIL debe ser un email válido')
    .default('no-reply@oliviagold.com'),

  SMTP_SECURE: z.string()
    .transform(val => val === 'true')
    .or(z.boolean())
    .default(false),

  CONTACT_EMAIL: z.string()
    .email('CONTACT_EMAIL debe ser un email válido')
    .default('servicio@oliviagold.com'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string()
    .min(1, 'CLOUDINARY_CLOUD_NAME es requerido'),

  CLOUDINARY_API_KEY: z.string()
    .min(1, 'CLOUDINARY_API_KEY es requerido')
    .regex(/^\d+$/, 'CLOUDINARY_API_KEY debe ser numérico'),

  CLOUDINARY_API_SECRET: z.string()
    .min(20, 'CLOUDINARY_API_SECRET debe tener al menos 20 caracteres'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string()
    .min(1, 'GOOGLE_CLIENT_ID es requerido')
    .regex(/\.googleusercontent\.com$/, 'GOOGLE_CLIENT_ID debe terminar en .googleusercontent.com'),

  GOOGLE_CLIENT_SECRET: z.string()
    .min(20, 'GOOGLE_CLIENT_SECRET debe tener al menos 20 caracteres'),

  GOOGLE_CALLBACK_URL: z.string()
    .url('GOOGLE_CALLBACK_URL debe ser una URL válida')
    .refine(url => url.includes('/api/auth/google/callback'), {
      message: 'GOOGLE_CALLBACK_URL debe incluir /api/auth/google/callback'
    }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string()
    .regex(/^\d+$/, 'RATE_LIMIT_WINDOW_MS debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 60000, {
      message: 'RATE_LIMIT_WINDOW_MS debe ser al menos 60000 (1 minuto)'
    })
    .or(z.number())
    .default(900000), // 15 minutos

  RATE_LIMIT_MAX_REQUESTS: z.string()
    .regex(/^\d+$/, 'RATE_LIMIT_MAX_REQUESTS debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, {
      message: 'RATE_LIMIT_MAX_REQUESTS debe ser mayor a 0'
    })
    .or(z.number())
    .default(500),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug'])
    .default('info'),

  NODE_ENV: z.enum(['development', 'production', 'test', 'staging'])
    .default('development'),

  // CORS y Frontend
  FRONTEND_URL: z.string()
    .url('FRONTEND_URL debe ser una URL válida')
    .refine(url => {
      const nodeEnv = process.env.NODE_ENV || 'development';
      if (nodeEnv === 'production') {
        return !url.includes('localhost') && url.startsWith('https://');
      }
      return true;
    }, {
      message: 'En producción, FRONTEND_URL debe ser HTTPS y no localhost'
    }),
});

// Type inferido para el objeto de entorno validado
export type ValidatedEnv = z.infer<typeof baseEnvSchema>;

// Validar variables de entorno
export function validateEnvironment(): ValidatedEnv {
  try {
    return baseEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Error en validación de variables de entorno:');
      // Safely access errors
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
          console.error(`  • ${err.path.join('.')}: ${err.message}`);
        });
      } else {
        console.error('  • Error de validación desconocido:', error);
      }
      throw new Error('Variables de entorno inválidas');
    }
    console.error('Error inesperado validando entorno:', error);
    throw error;
  }
}