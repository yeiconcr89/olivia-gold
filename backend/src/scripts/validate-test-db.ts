#!/usr/bin/env tsx

/**
 * Script para validar que los tests usen la base de datos correcta
 * y no afecten la base de datos de desarrollo
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

async function validateDatabase() {
  // Cargar variables de entorno según el entorno
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'test') {
    config({ path: '.env.test', override: true });
  } else {
    config({ path: '.env' });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

  console.log('🔍 Validando configuración de bases de datos...');
  console.log(`📊 Entorno actual: ${nodeEnv}`);
  console.log(`🗄️  DATABASE_URL: ${DATABASE_URL}`);
  console.log(`🧪 TEST_DATABASE_URL: ${TEST_DATABASE_URL}`);

  // Validaciones de seguridad
  const validations = [
    {
      name: 'Base de datos de test debe contener "_test"',
      check: () => {
        if (nodeEnv === 'test') {
          return DATABASE_URL?.includes('_test') || DATABASE_URL?.includes('test');
        }
        return true;
      },
      error: 'La base de datos de test debe contener "_test" en el nombre para evitar conflictos'
    },
    {
      name: 'Base de datos de desarrollo no debe contener "_test"',
      check: () => {
        if (nodeEnv === 'development') {
          return !DATABASE_URL?.includes('_test');
        }
        return true;
      },
      error: 'La base de datos de desarrollo no debe contener "_test" en el nombre'
    },
    {
      name: 'URLs de base de datos deben ser diferentes',
      check: () => {
        // En modo test, es normal que DATABASE_URL y TEST_DATABASE_URL sean iguales
        if (nodeEnv === 'test') {
          return true;
        }
        if (DATABASE_URL && TEST_DATABASE_URL) {
          return DATABASE_URL !== TEST_DATABASE_URL;
        }
        return true;
      },
      error: 'Las URLs de base de datos de desarrollo y test deben ser diferentes'
    },
    {
      name: 'Variable DATABASE_URL debe estar definida',
      check: () => !!DATABASE_URL,
      error: 'DATABASE_URL no está definida'
    }
  ];

  let hasErrors = false;

  for (const validation of validations) {
    try {
      if (validation.check()) {
        console.log(`✅ ${validation.name}`);
      } else {
        console.error(`❌ ${validation.name}: ${validation.error}`);
        hasErrors = true;
      }
    } catch (error) {
      console.error(`❌ ${validation.name}: Error en validación - ${error}`);
      hasErrors = true;
    }
  }

  // Test de conexión
  if (!hasErrors) {
    console.log('\n🔌 Probando conexión a la base de datos...');
    
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Conexión exitosa a la base de datos');
      
      // Verificar que estamos en la base de datos correcta
      const result = await prisma.$queryRaw`SELECT current_database() as db_name`;
      const dbName = (result as any)[0]?.db_name;
      
      console.log(`📊 Base de datos actual: ${dbName}`);
      
      if (nodeEnv === 'test' && !dbName?.includes('test')) {
        console.error('❌ PELIGRO: Estás en modo test pero no estás usando una base de datos de test!');
        hasErrors = true;
      }
      
      if (nodeEnv === 'development' && dbName?.includes('test')) {
        console.error('❌ ADVERTENCIA: Estás en modo desarrollo pero estás usando una base de datos de test');
      }
      
    } catch (error) {
      console.error('❌ Error al conectar con la base de datos:', error);
      hasErrors = true;
    } finally {
      await prisma.$disconnect();
    }
  }

  if (hasErrors) {
    console.error('\n💥 Se encontraron errores en la configuración de base de datos');
    console.error('🛡️  Para proteger tus datos, revisa la configuración antes de continuar');
    process.exit(1);
  } else {
    console.log('\n🎉 Configuración de base de datos validada correctamente');
    console.log('🛡️  Tus datos están protegidos');
  }
}

// Ejecutar la validación
validateDatabase().catch((error) => {
  console.error('❌ Error fatal en validación:', error);
  process.exit(1);
});