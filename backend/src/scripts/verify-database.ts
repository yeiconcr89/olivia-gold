import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verificando integridad de la base de datos...\n');

  try {
    // 1. Verificar usuarios
    const users = await prisma.user.findMany({ include: { profile: true } });
    console.log(`👥 Usuarios: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) ${user.profile?.name ? `- ${user.profile.name}` : ''}`);
    });

    // 2. Verificar productos
    const products = await prisma.product.findMany({ 
      include: { images: true, tags: true, inventory: true } 
    });
    console.log(`\n📦 Productos: ${products.length}`);
    products.forEach(product => {
      console.log(`  - ${product.name} ($${product.price}) - Imágenes: ${product.images.length}, Tags: ${product.tags.length}, Stock: ${product.inventory?.quantity || 'N/A'}`);
    });

    // 3. Verificar hero slides (el problema principal)
    const heroSlides = await prisma.heroSlide.findMany({ 
      orderBy: { orderIndex: 'asc' } 
    });
    console.log(`\n🎨 Hero Slides: ${heroSlides.length}`);
    
    // Verificar orderIndex únicos
    const orderIndexes = heroSlides.map(slide => slide.orderIndex);
    const uniqueOrderIndexes = [...new Set(orderIndexes)];
    const hasDuplicateOrders = orderIndexes.length !== uniqueOrderIndexes.length;
    
    if (hasDuplicateOrders) {
      console.log(`  ❌ ERROR: OrderIndex duplicados detectados!`);
      console.log(`  📊 OrderIndexes: [${orderIndexes.join(', ')}]`);
    } else {
      console.log(`  ✅ OrderIndex únicos y correctos`);
    }
    
    heroSlides.forEach(slide => {
      console.log(`  ${slide.orderIndex}. ${slide.title} (${slide.isActive ? 'Activo' : 'Inactivo'})`);
    });

    // 4. Verificar clientes
    const customers = await prisma.customer.findMany({ 
      include: { addresses: true } 
    });
    console.log(`\n👤 Clientes: ${customers.length}`);
    customers.forEach(customer => {
      console.log(`  - ${customer.name} (${customer.email}) - ${customer.status} - Direcciones: ${customer.addresses.length}`);
    });

    // 5. Verificar órdenes
    const orders = await prisma.order.findMany({ 
      include: { items: true } 
    });
    console.log(`\n🛒 Órdenes: ${orders.length}`);
    orders.forEach(order => {
      console.log(`  - ${order.customerName} - $${order.total} - ${order.status} - Items: ${order.items.length}`);
    });

    // 6. Verificar reseñas
    const reviews = await prisma.review.findMany({
      include: { product: { select: { name: true } } }
    });
    console.log(`\n⭐ Reseñas: ${reviews.length}`);
    reviews.forEach(review => {
      console.log(`  - ${review.product.name} - ${review.rating}⭐ - "${review.title}" (${review.status})`);
    });

    // 7. Verificar páginas SEO
    const seoPages = await prisma.sEOPage.findMany();
    console.log(`\n🔍 Páginas SEO: ${seoPages.length}`);
    seoPages.forEach(page => {
      console.log(`  - ${page.url} - Score: ${page.score} (${page.status})`);
    });

    // 8. Resumen de integridad
    console.log(`\n📊 Resumen de Integridad:`);
    console.log(`  ✅ Usuarios con perfil: ${users.filter(u => u.profile).length}/${users.length}`);
    console.log(`  ✅ Productos con imágenes: ${products.filter(p => p.images.length > 0).length}/${products.length}`);
    console.log(`  ✅ Productos con inventario: ${products.filter(p => p.inventory).length}/${products.length}`);
    console.log(`  ${hasDuplicateOrders ? '❌' : '✅'} Hero slides sin orderIndex duplicados`);
    console.log(`  ✅ Clientes con direcciones: ${customers.filter(c => c.addresses.length > 0).length}/${customers.length}`);
    console.log(`  ✅ Órdenes con items: ${orders.filter(o => o.items.length > 0).length}/${orders.length}`);

    if (hasDuplicateOrders) {
      console.log(`\n❌ ATENCIÓN: Se detectaron problemas de integridad en Hero Slides`);
      process.exit(1);
    } else {
      console.log(`\n🎉 ¡Base de datos verificada exitosamente! Todos los datos están correctos.`);
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });