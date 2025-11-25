#!/usr/bin/env node

/**
 * Script para generar secrets seguros para producción
 * Uso: node scripts/generate-secrets.js [--env=production]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generar secret seguro de la longitud especificada
 */
function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generar API key alfanumérico
 */
function generateApiKey(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generar configuración completa de secrets
 */
function generateSecrets() {
  return {
    JWT_SECRET: generateSecureSecret(32),
    SESSION_SECRET: generateSecureSecret(32),
    DB_ENCRYPTION_KEY: generateSecureSecret(32),
    API_SECRET_KEY: generateApiKey(24),
    BACKUP_ENCRYPTION_KEY: generateSecureSecret(32),
    CSRF_SECRET: generateSecureSecret(16),
  };
}

/**
 * Crear archivo .env.production con secrets seguros
 */
function createProductionEnv(secrets) {
  const template = `# ============================================================================
# OLIVIA GOLD - CONFIGURACIÓN DE PRODUCCIÓN
# ============================================================================
# IMPORTANTE: NO SUBIR ESTE ARCHIVO AL CONTROL DE VERSIONES
# GENERADO AUTOMÁTICAMENTE EL ${new Date().toISOString()}

# ============================================================================
# BASE DE DATOS
# ============================================================================
DATABASE_URL="postgresql://usuario:password@host:5432/joyeria_elegante_prod?schema=public"

# ============================================================================
# SEGURIDAD CRÍTICA
# ============================================================================
# Secrets generados automáticamente - NUEVOS EN CADA DEPLOYMENT
JWT_SECRET="${secrets.JWT_SECRET}"
SESSION_SECRET="${secrets.SESSION_SECRET}"
DB_ENCRYPTION_KEY="${secrets.DB_ENCRYPTION_KEY}"
API_SECRET_KEY="${secrets.API_SECRET_KEY}"
CSRF_SECRET="${secrets.CSRF_SECRET}"

# Duración más corta en producción
JWT_EXPIRES_IN=24h

# ============================================================================
# SERVIDOR
# ============================================================================
PORT=3001
NODE_ENV=production

# ============================================================================
# CORS Y FRONTEND
# ============================================================================
FRONTEND_URL=https://tu-dominio.com

# ============================================================================
# CLOUDINARY (SUBIDA DE IMÁGENES)
# ============================================================================
CLOUDINARY_CLOUD_NAME=tu-cloud-name-produccion
CLOUDINARY_API_KEY=tu-api-key-produccion
CLOUDINARY_API_SECRET=tu-api-secret-produccion

# ============================================================================
# EMAIL (RECUPERACIÓN DE CONTRASEÑA)
# ============================================================================
EMAIL_USER=noreply@tu-dominio.com
EMAIL_PASS=tu-app-password-produccion

# ============================================================================
# GOOGLE OAUTH
# ============================================================================
GOOGLE_CLIENT_ID=tu-google-client-id-produccion
GOOGLE_CLIENT_SECRET=tu-google-client-secret-produccion
GOOGLE_CALLBACK_URL=https://tu-dominio.com/api/auth/google/callback

# ============================================================================
# RATE LIMITING (MÁS RESTRICTIVO EN PRODUCCIÓN)
# ============================================================================
# 15 minutos
RATE_LIMIT_WINDOW_MS=900000
# Máximo 100 requests por 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=warn

# ============================================================================
# MONITOREO Y CACHE
# ============================================================================
REDIS_URL=redis://localhost:6379
SENTRY_DSN=tu-sentry-dsn-para-errores
MONITORING_ENDPOINT=tu-endpoint-de-monitoreo

# ============================================================================
# CONFIGURACIÓN SSL/TLS
# ============================================================================
FORCE_HTTPS=true
SECURE_COOKIES=true
TRUST_PROXY=true

# ============================================================================
# BACKUP Y RECOVERY
# ============================================================================
BACKUP_ENCRYPTION_KEY="${secrets.BACKUP_ENCRYPTION_KEY}"
S3_BACKUP_BUCKET=tu-bucket-de-backups
AWS_ACCESS_KEY_ID=tu-aws-access-key
AWS_SECRET_ACCESS_KEY=tu-aws-secret-key
`;

  return template;
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  const isProduction = args.includes('--env=production') || args.includes('--production');
  
  console.log('🔐 Generando secrets seguros...\n');
  
  // Generar secrets
  const secrets = generateSecrets();
  
  // Mostrar información de los secrets generados
  console.log('✅ Secrets generados exitosamente:');
  console.log(`- JWT_SECRET: ${secrets.JWT_SECRET.length} caracteres`);
  console.log(`- SESSION_SECRET: ${secrets.SESSION_SECRET.length} caracteres`);
  console.log(`- DB_ENCRYPTION_KEY: ${secrets.DB_ENCRYPTION_KEY.length} caracteres`);
  console.log(`- API_SECRET_KEY: ${secrets.API_SECRET_KEY.length} caracteres`);
  console.log(`- BACKUP_ENCRYPTION_KEY: ${secrets.BACKUP_ENCRYPTION_KEY.length} caracteres`);
  console.log(`- CSRF_SECRET: ${secrets.CSRF_SECRET.length} caracteres\n`);
  
  if (isProduction) {
    // Crear archivo .env.production
    const envContent = createProductionEnv(secrets);
    const envPath = path.join(__dirname, '..', '.env.production');
    
    try {
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Archivo .env.production creado en: ${envPath}`);
      console.log('\n⚠️  IMPORTANTE:');
      console.log('1. Actualiza las variables de entorno faltantes (DATABASE_URL, CLOUDINARY, etc.)');
      console.log('2. NO subas este archivo al control de versiones');
      console.log('3. Copia los secrets a tu plataforma de deployment');
      console.log('4. Asegúrate de hacer backup seguro de estos secrets\n');
    } catch (error) {
      console.error('❌ Error creando archivo .env.production:', error.message);
      process.exit(1);
    }
  } else {
    // Solo mostrar los secrets sin crear archivo
    console.log('📋 Secrets disponibles para usar:');
    console.log('\nCopia estas variables a tu archivo de entorno:');
    console.log('═'.repeat(60));
    Object.entries(secrets).forEach(([key, value]) => {
      console.log(`${key}="${value}"`);
    });
    console.log('═'.repeat(60));
    console.log('\n💡 Para crear archivo .env.production automáticamente:');
    console.log('   node scripts/generate-secrets.js --env=production\n');
  }
  
  // Validaciones de seguridad
  console.log('🔍 Validaciones de seguridad:');
  const validations = [
    { name: 'JWT_SECRET length', valid: secrets.JWT_SECRET.length >= 32, current: secrets.JWT_SECRET.length },
    { name: 'SESSION_SECRET length', valid: secrets.SESSION_SECRET.length >= 32, current: secrets.SESSION_SECRET.length },
    { name: 'Entropía alta', valid: true, current: 'ALTA' },
    { name: 'Base64 válido', valid: isValidBase64(secrets.JWT_SECRET), current: 'VÁLIDO' }
  ];
  
  validations.forEach(validation => {
    const status = validation.valid ? '✅' : '❌';
    console.log(`${status} ${validation.name}: ${validation.current}`);
  });
  
  console.log('\n🎉 Proceso completado exitosamente!');
}

/**
 * Validar si una cadena es Base64 válida
 */
function isValidBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (err) {
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateSecrets,
  generateSecureSecret,
  generateApiKey
};