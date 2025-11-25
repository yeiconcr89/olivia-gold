/**
 * Configuración de entorno para tests
 * Este archivo se ejecuta antes de cada test para asegurar
 * que se use la configuración correcta
 */

const { config } = require('dotenv');
const path = require('path');

// Forzar el entorno de test
process.env.NODE_ENV = 'test';

// Cargar variables de entorno de test
config({ path: path.resolve(__dirname, '../../.env.test') });

// Validaciones de seguridad
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🧪 Configurando entorno de test...');

// Validar que estamos usando una base de datos de test
if (!DATABASE_URL) {
  throw new Error('❌ DATABASE_URL no está definida en el entorno de test');
}

if (!DATABASE_URL.includes('test')) {
  throw new Error(`❌ PELIGRO: La base de datos no parece ser de test: ${DATABASE_URL}`);
}

// Validar que no estamos usando la base de datos de desarrollo
if (DATABASE_URL.includes('joyeria_elegante_dev')) {
  throw new Error('❌ PELIGRO: Intentando usar la base de datos de desarrollo en tests!');
}

console.log(`✅ Base de datos de test configurada: ${DATABASE_URL.replace(/\/\/.*@/, '//***@')}`);
console.log('🛡️  Datos de desarrollo protegidos');