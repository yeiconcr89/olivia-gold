import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * Script para corregir inconsistencias de inventario
 * Sincroniza el estado inStock con las cantidades reales
 */
async function fixInventoryInconsistencies() {
  try {
    logger.info('🔧 REPARACIÓN DE INCONSISTENCIAS DE INVENTARIO');

    // 1. Buscar productos inconsistentes (marcados agotados pero con stock)
    const inconsistentProducts = await prisma.product.findMany({
      where: {
        inStock: false,
        inventory: {
          quantity: {
            gt: 0
          }
        }
      },
      include: {
        inventory: true
      }
    });

    logger.info(`❌ PRODUCTOS INCONSISTENTES ENCONTRADOS: ${inconsistentProducts.length}`);

    if (inconsistentProducts.length === 0) {
      logger.info('✅ No se encontraron inconsistencias para corregir');
      return;
    }

    // 2. Mostrar productos que serán corregidos
    inconsistentProducts.forEach((product, index) => {
      logger.info(`${index + 1}. "${product.name}"`);
      logger.info(`   ID: ${product.id}`);
      logger.info(`   Estado actual: inStock=${product.inStock}, quantity=${product.inventory?.quantity}`);
      logger.info(`   Acción: cambiar inStock a true`);
    });

    // 3. Confirmar reparación
    logger.info('🔧 Iniciando reparación...');

    // 4. Corregir cada producto usando transacción
    const results = await prisma.$transaction(async (tx) => {
      const updatedProducts = [];

      for (const product of inconsistentProducts) {
        const updated = await tx.product.update({
          where: { id: product.id },
          data: {
            inStock: true  // Cambiar a true porque quantity > 0
          },
          include: {
            inventory: true
          }
        });

        updatedProducts.push(updated);
        
        logger.info(`✅ Corregido: "${product.name}" - inStock: false → true`);
      }

      return updatedProducts;
    });

    // 5. Verificar reparación
    logger.info('🔍 VERIFICANDO REPARACIÓN...');
    
    const stillInconsistent = await prisma.product.findMany({
      where: {
        inStock: false,
        inventory: {
          quantity: {
            gt: 0
          }
        }
      }
    });

    if (stillInconsistent.length === 0) {
      logger.info('✅ REPARACIÓN EXITOSA: Todas las inconsistencias han sido corregidas');
    } else {
      logger.error(`❌ AÚN QUEDAN ${stillInconsistent.length} INCONSISTENCIAS`);
    }

    // 6. También corregir productos marcados en stock pero con quantity 0
    const zeroStockInStock = await prisma.product.findMany({
      where: {
        inStock: true,
        inventory: {
          quantity: 0
        }
      },
      include: {
        inventory: true
      }
    });

    if (zeroStockInStock.length > 0) {
      logger.info(`🔧 CORRIGIENDO ${zeroStockInStock.length} PRODUCTOS CON QUANTITY 0 PERO MARCADOS EN STOCK...`);
      
      await prisma.$transaction(async (tx) => {
        for (const product of zeroStockInStock) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              inStock: false  // Cambiar a false porque quantity = 0
            }
          });
          
          logger.info(`✅ Corregido: "${product.name}" - inStock: true → false (quantity=0)`);
        }
      });
    }

    // 7. Resumen final
    logger.info('📊 RESUMEN DE REPARACIÓN:');
    logger.info(`   • Productos corregidos (false→true): ${results.length}`);
    logger.info(`   • Productos corregidos (true→false): ${zeroStockInStock.length}`);
    logger.info(`   • Total correcciones: ${results.length + zeroStockInStock.length}`);

  } catch (error) {
    logger.error('❌ Error durante la reparación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixInventoryInconsistencies()
    .then(() => {
      logger.info('🎉 Script de reparación completado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Script de reparación falló:', error);
      process.exit(1);
    });
}

export { fixInventoryInconsistencies };