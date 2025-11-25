#!/usr/bin/env tsx

/**
 * Script de protección para evitar que los tests afecten la base de datos de desarrollo
 */

import { config } from 'dotenv';

// Cargar variables de entorno
const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'test') {
  config({ path: '.env.test' });
} else {
  config({ path: '.env' });
}

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🛡️  Verificando protección de base de datos...');

// Si estamos en modo test, verificar que usamos base de datos de test
if (nodeEnv === 'test') {
  if (!DATABASE_URL?.includes('test')) {
    console.error('❌ PELIGRO: Modo test detectado pero no se está usando base de datos de test!');
    console.error(`📊 DATABASE_URL actual: ${DATABASE_URL}`);
    console.error('🚨 OPERACIÓN CANCELADA PARA PROTEGER DATOS DE DESARROLLO');
    process.exit(1);
  }
  
  if (DATABASE_URL.includes('joyeria_elegante_dev')) {
    console.error('❌ PELIGRO: Intentando usar base de datos de desarrollo en tests!');
    console.error('🚨 OPERACIÓN CANCELADA PARA PROTEGER DATOS DE DESARROLLO');
    process.exit(1);
  }
  
  console.log('✅ Base de datos de test verificada');
  console.log(`📊 Usando: ${DATABASE_URL.replace(/\/\/.*@/, '//***@')}`);
}

// Si estamos en desarrollo, verificar que no usamos base de datos de test
if (nodeEnv === 'development') {
  if (DATABASE_URL?.includes('_test')) {
    console.warn('⚠️  ADVERTENCIA: Estás en desarrollo pero usando base de datos de test');
  } else {
    console.log('✅ Base de datos de desarrollo verificada');
  }
}

console.log('🛡️  Verificación completada - Datos protegidos');