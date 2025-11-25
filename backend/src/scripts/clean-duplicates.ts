import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateProducts() {
  console.log('🧹 Iniciando limpieza de productos duplicados...');

  try {
    // Encontrar productos duplicados por nombre
    const duplicateProducts = await prisma.$queryRaw<Array<{name: string, count: number}>>`
      SELECT name, COUNT(*) as count
      FROM "products"
      GROUP BY name
      HAVING COUNT(*) > 1
    `;

    console.log(`🔍 Encontrados ${duplicateProducts.length} productos con duplicados`);

    for (const duplicate of duplicateProducts) {
      console.log(`🔄 Procesando duplicados de: ${duplicate.name}`);
      
      // Obtener todos los productos con este nombre, ordenados por fecha de creación
      const products = await prisma.product.findMany({
        where: { name: duplicate.name },
        orderBy: { createdAt: 'asc' },
        include: {
          images: true,
          tags: true,
          inventory: true,
        }
      });

      // Mantener el primer producto (más antiguo) y eliminar los demás
      const productToKeep = products[0];
      const productsToDelete = products.slice(1);

      console.log(`  ✅ Manteniendo producto: ${productToKeep.id} (${productToKeep.createdAt})`);
      
      for (const productToDelete of productsToDelete) {
        console.log(`  🗑️  Eliminando duplicado: ${productToDelete.id} (${productToDelete.createdAt})`);
        
        // Eliminar relaciones primero
        await prisma.productImage.deleteMany({
          where: { productId: productToDelete.id }
        });
        
        await prisma.productTag.deleteMany({
          where: { productId: productToDelete.id }
        });
        
        await prisma.inventory.deleteMany({
          where: { productId: productToDelete.id }
        });
        
        // Finalmente eliminar el producto
        await prisma.product.delete({
          where: { id: productToDelete.id }
        });
      }
    }

    console.log('✅ Limpieza de productos duplicados completada');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  }
}

async function cleanDuplicateCustomers() {
  console.log('🧹 Iniciando limpieza de clientes duplicados...');

  try {
    // Encontrar clientes duplicados por email
    const duplicateCustomers = await prisma.$queryRaw<Array<{email: string, count: number}>>`
      SELECT email, COUNT(*) as count
      FROM "customers"
      GROUP BY email
      HAVING COUNT(*) > 1
    `;

    console.log(`🔍 Encontrados ${duplicateCustomers.length} clientes con duplicados`);

    for (const duplicate of duplicateCustomers) {
      console.log(`🔄 Procesando duplicados de: ${duplicate.email}`);
      
      // Obtener todos los clientes con este email, ordenados por fecha de creación
      const customers = await prisma.customer.findMany({
        where: { email: duplicate.email },
        orderBy: { createdAt: 'asc' },
        include: {
          addresses: true,
        }
      });

      // Mantener el primer cliente (más antiguo) y eliminar los demás
      const customerToKeep = customers[0];
      const customersToDelete = customers.slice(1);

      console.log(`  ✅ Manteniendo cliente: ${customerToKeep.id} (${customerToKeep.createdAt})`);
      
      for (const customerToDelete of customersToDelete) {
        console.log(`  🗑️  Eliminando duplicado: ${customerToDelete.id} (${customerToDelete.createdAt})`);
        
        // Eliminar direcciones primero
        await prisma.address.deleteMany({
          where: { customerId: customerToDelete.id }
        });
        
        // Finalmente eliminar el cliente
        await prisma.customer.delete({
          where: { id: customerToDelete.id }
        });
      }
    }

    console.log('✅ Limpieza de clientes duplicados completada');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  }
}

async function main() {
  console.log('🧹 Iniciando limpieza de datos duplicados...');
  
  try {
    await cleanDuplicateProducts();
    await cleanDuplicateCustomers();
    
    console.log('🎉 Limpieza completada exitosamente');
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });