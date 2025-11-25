import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Iniciando reset completo de la base de datos...');
  console.log('Is prisma an instance of PrismaClient?', prisma instanceof PrismaClient);

  try {
    // Orden de eliminación respetando las relaciones de foreign keys
    console.log('🗑️  Eliminando datos existentes...');

    // 1. Eliminar tablas dependientes primero
    try {
      await prisma.auditLog.deleteMany({});
      console.log('  ✅ AuditLogs eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar AuditLogs:', e);
      throw e;
    }

    try {
      await prisma.review.deleteMany({});
      console.log('  ✅ Reviews eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar Reviews:', e);
      throw e;
    }

    try {
      await prisma.orderItem.deleteMany({});
      console.log('  ✅ OrderItems eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar OrderItems:', e);
      throw e;
    }

    try {
      await prisma.order.deleteMany({});
      console.log('  ✅ Orders eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar Orders:', e);
      throw e;
    }

    try {
      await prisma.customerAddress.deleteMany({});
      console.log('  ✅ Addresses eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar Addresses:', e);
      throw e;
    }

    try {
      await prisma.customer.deleteMany({});
      console.log('  ✅ Customers eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar Customers:', e);
      throw e;
    }

    try {
      await prisma.inventoryMovement.deleteMany({});
      console.log('  ✅ InventoryMovements eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar InventoryMovements:', e);
      throw e;
    }

    try {
      await prisma.inventory.deleteMany({});
      console.log('  ✅ Inventory eliminado');
    } catch (e) {
      console.error('  ❌ Error al eliminar Inventory:', e);
      throw e;
    }

    try {
      await prisma.productTag.deleteMany({});
      console.log('  ✅ ProductTags eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar ProductTags:', e);
      throw e;
    }

    try {
      await prisma.productImage.deleteMany({});
      console.log('  ✅ ProductImages eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar ProductImages:', e);
      throw e;
    }

    try {
      await prisma.product.deleteMany({});
      console.log('  ✅ Products eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar Products:', e);
      throw e;
    }

    try {
      await prisma.sEOPage.deleteMany({});
      console.log('  ✅ SEOPages eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar SEOPages:', e);
      throw e;
    }

    try {
      await prisma.emailVerificationToken.deleteMany({});
      console.log('  ✅ EmailVerificationTokens eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar EmailVerificationTokens:', e);
      throw e;
    }

    try {
      await prisma.passwordResetToken.deleteMany({});
      console.log('  ✅ PasswordResetTokens eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar PasswordResetTokens:', e);
      throw e;
    }

    try {
      await prisma.userProfile.deleteMany({});
      console.log('  ✅ Profiles eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar Profiles:', e);
      throw e;
    }

    try {
      await prisma.user.deleteMany({});
      console.log('  ✅ Users eliminados');
    } catch (e) {
      console.error('  ❌ Error al eliminar Users:', e);
      throw e;
    }

    console.log('🎉 Base de datos limpiada exitosamente');

    // Reset de secuencias de auto-incremento (si las hay)
    console.log('🔄 Reseteando secuencias...');
    
    // Resetear secuencias para PostgreSQL (si usas auto-incremento)
    // Nota: Prisma usa CUID por defecto, así que esto podría no ser necesario
    // pero lo dejamos por si hay campos con @default(autoincrement())
    
    const tables = [
      'User', 'Profile', 'Product', 'ProductImage', 'ProductTag', 
      'Customer', 'Address', 'Order', 'OrderItem', 'Inventory', 
      'Review', 'SEOPage', 'PasswordResetToken', 'EmailVerificationToken', 
      'AuditLog'
    ];

    for (const table of tables) {
      try {
        // Intentar resetear secuencia si existe
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS "${table}_id_seq" RESTART WITH 1;`);
      } catch (error) {
        // Ignorar errores si la secuencia no existe
        console.log(`  ⚠️  No hay secuencia para resetear en tabla ${table}`);
      }
    }

    console.log('✅ Reset de base de datos completado');

  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚨 ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos');
  console.log('⏰ Esperando 3 segundos antes de continuar...');
  
  // Esperar 3 segundos para que el usuario pueda cancelar
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await resetDatabase();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });