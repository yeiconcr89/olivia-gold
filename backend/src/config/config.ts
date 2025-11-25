import dotenv from 'dotenv';
import { validateEnvironment } from './env-validation';

dotenv.config();

// Validar y obtener configuración tipada
const validatedEnv = validateEnvironment();

export const config = {
  // Base de datos
  databaseUrl: validatedEnv.DATABASE_URL,

  // JWT
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,

  // Sesión
  sessionSecret: validatedEnv.SESSION_SECRET,

  // Servidor
  port: validatedEnv.PORT,
  nodeEnv: validatedEnv.NODE_ENV,

  // CORS
  frontendUrl: validatedEnv.FRONTEND_URL,

  // Cloudinary
  cloudinary: {
    cloudName: validatedEnv.CLOUDINARY_CLOUD_NAME,
    apiKey: validatedEnv.CLOUDINARY_API_KEY,
    apiSecret: validatedEnv.CLOUDINARY_API_SECRET,
  },

  // Rate Limiting
  rateLimitWindowMs: validatedEnv.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: validatedEnv.RATE_LIMIT_MAX_REQUESTS,

  // Logging
  logLevel: validatedEnv.LOG_LEVEL,

  // Validaciones
  get isProduction() {
    return this.nodeEnv === 'production';
  },

  get isDevelopment() {
    return this.nodeEnv === 'development';
  },

  get isTest() {
    return this.nodeEnv === 'test';
  },

  // Configuración de seguridad adicional para producción
  get securityConfig() {
    if (this.isProduction) {
      return {
        forceHttps: true,
        secureCookies: true,
        trustProxy: true,
      };
    }
    return {
      forceHttps: false,
      secureCookies: false,
      trustProxy: false,
    };
  },
};

// Las validaciones ahora se realizan en env-validation.ts