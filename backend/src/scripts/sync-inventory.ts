#!/usr/bin/env tsx

/**
 * Script para sincronizar productos existentes con registros de inventario
 * 
 * Este script crea registros de inventario para todos los productos que no los tienen,
 * inicializando cada uno con una cantidad base de stock.
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface ProductInventorySync {
  productId: string;
  productName: string;
  category: string;
  hasInventory: boolean;
}

const INITIAL_STOCK_BY_CATEGORY: Record<string, number> = {
  'collares': 15,
  'anillos': 20,
  'pulseras': 12,
  'aretes': 25,
  'conjuntos': 8,
  'relojes': 5,
};

const DEFAULT_INITIAL_STOCK = 10;

async function syncProductInventory() {
  try {
    logger.info('🔄 Iniciando sincronización de inventario...');

    // 1. Obtener todos los productos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        inStock: true,
      },
    });

    logger.info(`📦 Encontrados ${products.length} productos`);

    // 2. Verificar qué productos ya tienen inventario
    const existingInventory = await prisma.inventory.findMany({
      select: {
        productId: true,
      },
    });

    const existingInventoryProductIds = new Set(
      existingInventory.map(inv => inv.productId)
    );

    // 3. Identificar productos sin inventario
    const productsSyncInfo: ProductInventorySync[] = products.map(product => ({
      productId: product.id,
      productName: product.name,
      category: product.category,
      hasInventory: existingInventoryProductIds.has(product.id),
    }));

    const productsWithoutInventory = productsSyncInfo.filter(p => !p.hasInventory);

    logger.info(`📊 Productos con inventario: ${productsSyncInfo.length - productsWithoutInventory.length}`);
    logger.info(`❗ Productos SIN inventario: ${productsWithoutInventory.length}`);

    if (productsWithoutInventory.length === 0) {
      logger.info('✅ Todos los productos ya tienen registros de inventario');
      return;
    }

    // 4. Crear registros de inventario para productos sin ellos
    logger.info('🔧 Creando registros de inventario faltantes...');

    const inventoryCreationPromises = productsWithoutInventory.map(async (productInfo) => {
      const initialStock = INITIAL_STOCK_BY_CATEGORY[productInfo.category.toLowerCase()] || DEFAULT_INITIAL_STOCK;

      try {
        // Crear inventario
        const inventory = await prisma.inventory.create({
          data: {
            productId: productInfo.productId,
            quantity: initialStock,
            reservedQuantity: 0,
            minQuantity: 5,
            location: 'Almacén Principal',
          },
        });

        // Crear movimiento inicial
        await prisma.inventoryMovement.create({
          data: {
            productId: productInfo.productId,
            type: 'IN',
            quantity: initialStock,
            reason: 'Stock inicial - sincronización automática',
            previousQuantity: 0,
            newQuantity: initialStock,
            createdBy: 'system-sync',
          },
        });

        // Actualizar estado del producto
        await prisma.product.update({
          where: { id: productInfo.productId },
          data: { inStock: initialStock > 0 },
        });

        logger.info(`✅ Inventario creado: ${productInfo.productName} - Stock inicial: ${initialStock}`);

        return {
          success: true,
          productName: productInfo.productName,
          initialStock,
        };
      } catch (error) {
        logger.error(`❌ Error creando inventario para ${productInfo.productName}:`, error);
        return {
          success: false,
          productName: productInfo.productName,
          error: error instanceof Error ? error.message : 'Error desconocido',
        };
      }
    });

    // Ejecutar todas las creaciones
    const results = await Promise.allSettled(inventoryCreationPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    // 5. Estadísticas finales
    logger.info('📈 Sincronización completada:');
    logger.info(`   ✅ Exitosos: ${successful}`);
    logger.info(`   ❌ Fallidos: ${failed}`);

    // Verificación final
    const finalInventoryCount = await prisma.inventory.count();
    const finalProductCount = await prisma.product.count();

    logger.info(`📊 Estado final:`);
    logger.info(`   📦 Total productos: ${finalProductCount}`);
    logger.info(`   🏪 Total inventarios: ${finalInventoryCount}`);
    
    if (finalInventoryCount === finalProductCount) {
      logger.info('🎉 ¡Sincronización perfecta! Todos los productos tienen inventario');
    } else {
      logger.warn(`⚠️  Discrepancia: ${finalProductCount - finalInventoryCount} productos aún sin inventario`);
    }

  } catch (error) {
    logger.error('💥 Error crítico en sincronización de inventario:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  syncProductInventory()
    .then(() => {
      logger.info('🏁 Script de sincronización terminado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💀 Script de sincronización falló:', error);
      process.exit(1);
    });
}

export { syncProductInventory };