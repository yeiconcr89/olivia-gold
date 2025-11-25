import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear roles si no existen
  const roles = await prisma.$transaction([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Administrador del sistema' },
    }),
    prisma.role.upsert({
      where: { name: 'STAFF' },
      update: {},
      create: { name: 'STAFF', description: 'Personal de la tienda' },
    }),
    prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: 'Cliente' },
    }),
  ]);

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@oliviagold.com' },
    update: {},
    create: {
      email: 'admin@oliviagold.com',
      password: hashedPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'Olivia Gold',
          phone: '+57 1234567890',
        },
      },
    },
  });
  console.log('✅ Usuario administrador creado');

  // Crear categorías
  const categories = [
    { name: 'Collares', slug: 'collares', description: 'Elegantes collares en oro laminado' },
    { name: 'Anillos', slug: 'anillos', description: 'Anillos únicos para cada ocasión' },
    { name: 'Aretes', slug: 'aretes', description: 'Aretes que destacan tu estilo' },
    { name: 'Pulseras', slug: 'pulseras', description: 'Pulseras finas y elegantes' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('✅ Categorías creadas');

  // Crear productos de ejemplo
  const products = [
    {
      name: 'Collar Veneciano Premium',
      slug: 'collar-veneciano-premium',
      description: 'Elegante collar en oro laminado 18k con detalles en baño de rodio.',
      price: 89900,
      stock: 15,
      sku: 'COL-VEN-001',
      categorySlug: 'collares',
      images: [
        'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Anillo Solitario Diamante',
      slug: 'anillo-solitario-diamante',
      description: 'Anillo en oro blanco 18k con diamante central talla única.',
      price: 249900,
      stock: 8,
      sku: 'ANI-SOL-001',
      categorySlug: 'anillos',
      images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  for (const product of products) {
    const { categorySlug, ...productData } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...productData,
        category: {
          connect: { slug: categorySlug },
        },
      },
    });
  }
  console.log('✅ Productos de ejemplo creados');

  console.log('🌱 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
