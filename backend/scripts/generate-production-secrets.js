#!/usr/bin/env node

/**
 * Script para generar secrets seguros para producción
 * Ejecutar: node scripts/generate-production-secrets.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateProductionEnv() {
  const secrets = {
    JWT_SECRET: generateSecureSecret(32),
    SESSION_SECRET: generateSecureSecret(32),
    DB_ENCRYPTION_KEY: generateSecureSecret(32),
    API_SECRET_KEY: generateSecureSecret(24)
  };

  const productionEnvTemplate = `# ============================================================================
# OLIVIA GOLD - CONFIGURACIÓN DE PRODUCCIÓN
# ============================================================================
# IMPORTANTE: NO SUBIR ESTE ARCHIVO AL CONTROL DE VERSIONES
# GENERAR NUEVOS SECRETS PARA CADA DEPLOYMENT

# ============================================================================
# BASE DE DATOS
# ============================================================================
DATABASE_URL="postgresql://usuario:password@host:5432/joyeria_elegante_prod?schema=public"

# ============================================================================
# SEGURIDAD CRÍTICA
# ============================================================================
# Secrets generados automáticamente - NO MODIFICAR
JWT_SECRET="${secrets.JWT_SECRET}"
SESSION_SECRET="${secrets.SESSION_SECRET}"
DB_ENCRYPTION_KEY="${secrets.DB_ENCRYPTION_KEY}"
API_SECRET_KEY="${secrets.API_SECRET_KEY}"

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
BACKUP_ENCRYPTION_KEY="${generateSecureSecret(32)}"
S3_BACKUP_BUCKET=tu-bucket-de-backups
AWS_ACCESS_KEY_ID=tu-aws-access-key
AWS_SECRET_ACCESS_KEY=tu-aws-secret-key
`;

  const secretsInfo = `
# ============================================================================
# SECRETS GENERADOS PARA PRODUCCIÓN
# ============================================================================
# Fecha de generación: ${new Date().toISOString()}
# 
# IMPORTANTE: 
# 1. Estos secrets son únicos y seguros
# 2. NO compartir estos valores
# 3. Almacenar en un gestor de secrets (AWS Secrets Manager, etc.)
# 4. Regenerar si hay sospecha de compromiso
#
# Secrets generados:
# - JWT_SECRET: ${secrets.JWT_SECRET.substring(0, 8)}...
# - SESSION_SECRET: ${secrets.SESSION_SECRET.substring(0, 8)}...
# - DB_ENCRYPTION_KEY: ${secrets.DB_ENCRYPTION_KEY.substring(0, 8)}...
# - API_SECRET_KEY: ${secrets.API_SECRET_KEY.substring(0, 8)}...
#
# Para usar:
# 1. Copiar .env.production.example a .env.production
# 2. Completar con los valores reales de tu infraestructura
# 3. Configurar en tu servidor de producción
# ============================================================================
`;

  return { productionEnvTemplate, secretsInfo, secrets };
}

function main() {
  console.log('🔐 Generando configuración segura para producción...\n');

  const { productionEnvTemplate, secretsInfo, secrets } = generateProductionEnv();

  // Crear archivo de ejemplo para producción
  const examplePath = path.join(__dirname, '..', '.env.production.example');
  fs.writeFileSync(examplePath, productionEnvTemplate);
  console.log('✅ Archivo creado:', examplePath);

  // Crear archivo de información de secrets
  const secretsPath = path.join(__dirname, '..', 'PRODUCTION_SECRETS_INFO.txt');
  fs.writeFileSync(secretsPath, secretsInfo);
  console.log('✅ Información de secrets:', secretsPath);

  console.log('\n🚨 IMPORTANT SECURITY NOTES:');
  console.log('1. NO subir .env.production al control de versiones');
  console.log('2. Usar un gestor de secrets en producción');
  console.log('3. Rotar secrets periódicamente');
  console.log('4. Configurar monitoring de seguridad');
  
  console.log('\n📋 PRÓXIMOS PASOS:');
  console.log('1. Revisar .env.production.example');
  console.log('2. Crear .env.production con valores reales');
  console.log('3. Configurar infrastructure secrets');
  console.log('4. Test en staging environment');

  console.log('\n✅ Configuración de producción generada exitosamente!');
}

if (require.main === module) {
  main();
}

module.exports = { generateProductionEnv, generateSecureSecret };