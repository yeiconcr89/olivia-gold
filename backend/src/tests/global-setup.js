/**
 * Setup global para tests
 * Se ejecuta una vez antes de todos los tests
 */

const { config } = require('dotenv');
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Iniciando setup global de tests...');
  
  // Asegurar que estamos en modo test
  process.env.NODE_ENV = 'test';
  
  // Cargar variables de entorno de test
  config({ path: path.resolve(__dirname, '../../.env.test') });
  
  // Validar configuración de base de datos
  try {
    console.log('🔍 Validando configuración de base de datos...');
    execSync('tsx src/scripts/validate-test-db.ts', { 
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
  } catch (error) {
    console.error('❌ Error en validación de base de datos:', error.message);
    process.exit(1);
  }
  
  // Preparar base de datos de test
  try {
    console.log('🗄️  Preparando base de datos de test...');
    execSync('npx prisma db push --force-reset', { 
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    console.log('✅ Base de datos de test preparada');
  } catch (error) {
    console.error('❌ Error preparando base de datos de test:', error.message);
    // No salir aquí, puede que la base de datos no exista aún
  }
  
  console.log('🎉 Setup global completado');
};