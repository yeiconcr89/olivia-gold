import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * Script para auditar inconsistencias en el inventario
 */
async function auditInventoryInconsistencies() {
  try {
    logger.info('🔍 AUDITORÍA DE INCONSISTENCIAS DE INVENTARIO');

    // 1. Buscar productos que están marcados como agotados pero tienen stock
    const inconsistentProducts = await prisma.product.findMany({
      where: {
        inStock: false,  // Marcado como agotado
        inventory: {
          quantity: {
            gt: 0         // Pero tiene stock disponible
          }
        }
      },
      include: {
        inventory: true
      }
    });

    logger.info(`❌ PRODUCTOS INCONSISTENTES (marcados agotados pero con stock):`);
    logger.info(`Encontrados: ${inconsistentProducts.length} productos`);

    inconsistentProducts.forEach((product, index) => {
      logger.info(`${index + 1}. ${product.name}`);
      logger.info(`   ID: ${product.id}`);
      logger.info(`   inStock: ${product.inStock} ❌`);
      logger.info(`   inventory.quantity: ${product.inventory?.quantity || 'NO INVENTORY'}`);
      logger.info(`   inventory.reservedQuantity: ${product.inventory?.reservedQuantity || 'N/A'}`);
      logger.info(`   Precio: $${Number(product.price).toLocaleString()}`);
      logger.info(`   Categoría: ${product.category}`);
    });

    // 2. Buscar productos marcados en stock pero sin inventario
    const noInventoryProducts = await prisma.product.findMany({
      where: {
        inStock: true,
        inventory: null
      }
    });

    logger.info('⚠️  PRODUCTOS SIN INVENTARIO (marcados en stock pero sin tabla inventory):');
    logger.info(`Encontrados: ${noInventoryProducts.length} productos`);

    noInventoryProducts.forEach((product, index) => {
      logger.info(`${index + 1}. ${product.name} (ID: ${product.id})`);
    });

    // 3. Buscar productos con cantidad 0 pero marcados en stock
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

    logger.info('⚠️  PRODUCTOS CON STOCK 0 PERO MARCADOS DISPONIBLES:');
    logger.info(`Encontrados: ${zeroStockInStock.length} productos`);

    zeroStockInStock.forEach((product, index) => {
      logger.info(`${index + 1}. ${product.name} (ID: ${product.id})`);
    });

    // 4. Resumen de todos los productos y su estado
    const allProducts = await prisma.product.findMany({
      include: {
        inventory: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    logger.info('📊 RESUMEN COMPLETO DE PRODUCTOS:');
    logger.info(`Total productos: ${allProducts.length}`);

    let inconsistentCount = 0;
    allProducts.forEach((product, index) => {
      const hasInventory = Boolean(product.inventory);
      const quantity = product.inventory?.quantity || 0;
      const isConsistent = (product.inStock && quantity > 0) || (!product.inStock && quantity === 0);
      
      if (!isConsistent) {
        inconsistentCount++;
        logger.info(`${index + 1}. ${product.name}`);
        logger.info(`   inStock: ${product.inStock} | quantity: ${quantity} | consistent: ❌`);
        logger.info(`   🚨 INCONSISTENTE: inStock=${product.inStock} pero quantity=${quantity}`);
      }
    });

    logger.info(`📊 TOTAL INCONSISTENCIAS: ${inconsistentCount}/${allProducts.length}`);

  } catch (error) {
    logger.error('❌ Error en auditoría:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  auditInventoryInconsistencies();
}

export { auditInventoryInconsistencies };