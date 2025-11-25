// Configuración global para pruebas
import dotenv from 'dotenv';
import path from 'path';

// CRÍTICO: Cargar variables de entorno de PRUEBAS
const envPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: envPath });

// Verificar que estamos usando la base de datos de pruebas
if (!process.env.DATABASE_URL?.includes('_test')) {
  console.error('🚨 ERROR: No se detectó base de datos de pruebas en DATABASE_URL');
  console.error('DATABASE_URL actual:', process.env.DATABASE_URL);
  console.error('Debe contener "_test" para evitar contaminar datos reales');
  process.exit(1);
}

// Configurar NODE_ENV para pruebas
process.env.NODE_ENV = 'test';

console.log('✅ Configuración de pruebas cargada');
console.log('📁 Database URL:', process.env.DATABASE_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// Configurar timeout global para operaciones de base de datos
// En Vitest esto se configura en vitest.config.ts, pero si necesitamos hacerlo aquí:
// import { vi } from 'vitest';
// vi.setConfig({ testTimeout: 30000 });
// Por ahora lo comentamos ya que jest no existe
// jest.setTimeout(30000);