import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Función para generar números de pedido para el seed con fechas específicas
async function generateOrderNumberForDate(orderDate: Date): Promise<string> {
  // Formatear fecha como AAMMDD
  const year = orderDate.getFullYear().toString().slice(-2);
  const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
  const day = orderDate.getDate().toString().padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // Buscar el último número de pedido para esa fecha específica
  const startOfDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
  const endOfDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate() + 1);
  
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
      id: {
        startsWith: `PED-${datePrefix}-`,
      },
    },
    orderBy: {
      id: 'desc',
    },
    select: {
      id: true,
    },
  });

  let sequence = 1;
  
  if (lastOrder && lastOrder.id.startsWith(`PED-${datePrefix}-`)) {
    const lastSequence = lastOrder.id.split('-')[2];
    if (lastSequence && !isNaN(parseInt(lastSequence))) {
      sequence = parseInt(lastSequence) + 1;
    }
  }

  const sequenceStr = sequence.toString().padStart(3, '0');
  return `PED-${datePrefix}-${sequenceStr}`;
}

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@joyceriaelegante.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        email: 'admin@joyceriaelegante.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        profile: {
          create: {
            name: 'Administrador',
            phone: '+57 300 123 4567',
          },
        },
      },
    });

    console.log('✅ Usuario administrador creado');

    // Crear productos de ejemplo usando identificadores únicos para evitar duplicados
    const products = [
      {
        name: 'Collar Veneciano Premium',
        price: 89900,
        originalPrice: 129900,
        category: 'collares',
        subcategory: 'cadenas',
        description: 'Elegante collar veneciano en oro laminado 18k. Diseño atemporal que combina con cualquier ocasión.',
        materials: 'Oro laminado 18k sobre base de acero inoxidable',
        dimensions: 'Largo: 45cm, Ancho: 3mm',
        care: 'Evitar contacto con perfumes y agua. Limpiar con paño suave.',
        inStock: true,
        featured: true,
        rating: 4.8,
        reviewCount: 156,
        images: [
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/collar_elegante_01_xfmq31.png',
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752999725/products/pulsera_sofisticada_02-1752999721407-fh07i07n3js.png'
        ],
        tags: ['elegante', 'clasico', 'premium']
      },
      {
        name: 'Anillo Solitario Diamante',
        price: 149900,
        originalPrice: 199900,
        category: 'anillos',
        subcategory: 'compromiso',
        description: 'Anillo solitario con cristal de zirconia cúbica en oro laminado. Perfecto para momentos especiales.',
        materials: 'Oro laminado 18k, zirconia cúbica premium',
        dimensions: 'Tallas disponibles: 6-20',
        care: 'Evitar exposición prolongada al agua y químicos.',
        inStock: true,
        featured: true,
        rating: 4.9,
        reviewCount: 89,
        images: [
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/anillo_clasico_01_o5i8dm.png',
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1753003807/products/olivia_gold-removebg-preview-1753003803496-dbdivus7cct.png'
        ],
        tags: ['romantico', 'compromiso', 'lujo']
      },
      {
        name: 'Pulsera Tenis Brillante',
        price: 119900,
        category: 'pulseras',
        subcategory: 'elegantes',
        description: 'Pulsera tipo tenis con cristales brillantes. Elegancia que destaca en cada movimiento.',
        materials: 'Oro laminado 18k, cristales Swarovski',
        dimensions: 'Largo: 18cm ajustable',
        care: 'Guardar en estuche original. Limpiar regularmente.',
        inStock: true,
        featured: false,
        rating: 4.7,
        reviewCount: 134,
        images: [
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/pulsera_sofisticada_01_mseuda.png'
        ],
        tags: ['brillante', 'elegante', 'ajustable']
      },
      {
        name: 'Aretes Perla Clásicos',
        price: 69900,
        originalPrice: 89900,
        category: 'aretes',
        subcategory: 'perlas',
        description: 'Aretes con perlas cultivadas y baño en oro. Sofisticación atemporal.',
        materials: 'Oro laminado 14k, perlas cultivadas',
        dimensions: 'Diámetro perla: 8mm',
        care: 'Las perlas requieren cuidado especial. Evitar químicos.',
        inStock: true,
        featured: true,
        rating: 4.6,
        reviewCount: 203,
        images: [
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/aretes_modernos_01_llgxla.png'
        ],
        tags: ['clasico', 'perlas', 'sofisticado']
      },
      {
        name: 'Conjunto Romántico Corazón',
        price: 179900,
        originalPrice: 249900,
        category: 'conjuntos',
        subcategory: 'romanticos',
        description: 'Conjunto de collar y aretes con motivo de corazón. Regalo perfecto para ocasiones especiales.',
        materials: 'Oro laminado 18k, zirconia cúbica',
        dimensions: 'Collar: 40cm, Aretes: 1.5cm',
        care: 'Almacenar por separado. Evitar humedad.',
        inStock: true,
        featured: true,
        rating: 4.8,
        reviewCount: 97,
        images: [
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/collar_elegante_01_xfmq31.png'
        ],
        tags: ['romantico', 'conjunto', 'regalo']
      },
      {
        name: 'Reloj Elegante Dorado',
        price: 199900,
        category: 'relojes',
        subcategory: 'elegantes',
        description: 'Reloj con movimiento de cuarzo y acabado en oro laminado. Precisión y estilo unidos.',
        materials: 'Oro laminado 18k, movimiento suizo',
        dimensions: 'Caja: 36mm, Pulsera ajustable',
        care: 'Resistente al agua hasta 30m. Servicio anual recomendado.',
        inStock: true,
        featured: false,
        rating: 4.5,
        reviewCount: 67,
        images: [
          'https://res.cloudinary.com/dflhmlbrz/image/upload/v1753003807/products/olivia_gold-removebg-preview-1753003803496-dbdivus7cct.png'
        ],
        tags: ['reloj', 'precision', 'elegante']
      }
    ];

    for (const productData of products) {
      // Verificar si el producto ya existe por nombre
      const existingProduct = await prisma.product.findFirst({
        where: { name: productData.name }
      });

      if (existingProduct) {
        console.log(`⏭️  Producto ya existe, omitiendo: ${productData.name}`);
        continue;
      }

      const product = await prisma.product.create({
        data: {
          name: productData.name,
          price: productData.price,
          originalPrice: productData.originalPrice,
          category: productData.category,
          subcategory: productData.subcategory,
          description: productData.description,
          materials: productData.materials,
          dimensions: productData.dimensions,
          care: productData.care,
          inStock: productData.inStock,
          featured: productData.featured,
          rating: productData.rating,
          reviewCount: productData.reviewCount,
          images: {
            create: productData.images.map((url, index) => ({
              url,
              isPrimary: index === 0,
              order: index,
            })),
          },
          tags: {
            create: productData.tags.map(tag => ({ tag })),
          },
          inventory: {
            create: {
              quantity: Math.floor(Math.random() * 50) + 10,
            },
          },
        },
      });

      console.log(`✅ Producto creado: ${product.name}`);
    }

    // Crear clientes de ejemplo
    const customers = [
      {
        name: 'María González',
        email: 'maria@email.com',
        phone: '+57 300 123 4567',
        status: 'VIP' as const,
        totalOrders: 5,
        totalSpent: 450000,
        wishlistItems: 3,
        preferences: ['collares', 'anillos'],
        addresses: [
          {
            street: 'Calle 123 #45-67',
            city: 'Bogotá',
            state: 'Cundinamarca',
            zipCode: '110111',
            country: 'Colombia',
            isDefault: true,
          },
        ],
      },
      {
        name: 'Carlos Rodríguez',
        email: 'carlos@email.com',
        phone: '+57 301 234 5678',
        status: 'ACTIVE' as const,
        totalOrders: 2,
        totalSpent: 299800,
        wishlistItems: 1,
        preferences: ['anillos'],
        addresses: [
          {
            street: 'Carrera 45 #67-89',
            city: 'Medellín',
            state: 'Antioquia',
            zipCode: '050001',
            country: 'Colombia',
            isDefault: true,
          },
        ],
      },
    ];

    for (const customerData of customers) {
      const customer = await prisma.customer.upsert({
        where: { email: customerData.email },
        update: {},
        create: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          status: customerData.status,
          totalOrders: customerData.totalOrders,
          totalSpent: customerData.totalSpent,
          wishlistItems: customerData.wishlistItems,
          preferences: customerData.preferences,
          addresses: {
            create: customerData.addresses,
          },
        },
      });

      console.log(`✅ Cliente creado: ${customer.name}`);
    }

    // Crear páginas SEO de ejemplo
    const seoPages = [
      {
        url: '/',
        title: 'Joyería Elegante - Oro Laminado de Alta Calidad | Brilla con Elegancia',
        metaDescription: 'Descubre nuestra exclusiva colección de joyería en oro laminado 18k. Collares, anillos, pulseras y aretes de alta calidad. Envío gratis en Colombia.',
        keywords: ['joyería oro laminado', 'collares elegantes', 'anillos compromiso', 'pulseras premium'],
        h1: 'Joyería Elegante - Brilla con Elegancia',
        canonicalUrl: 'https://joyceriaelegante.com/',
        ogTitle: 'Joyería Elegante - Oro Laminado Premium',
        ogDescription: 'Colección exclusiva de joyería en oro laminado 18k. Calidad premium, diseños únicos.',
        status: 'OPTIMIZED' as const,
        score: 92,
        issues: [],
      },
      {
        url: '/productos/collares',
        title: 'Collares de Oro Laminado - Joyería Elegante',
        metaDescription: 'Hermosos collares en oro laminado 18k. Diseños únicos y elegantes para toda ocasión.',
        keywords: ['collares oro laminado', 'collares elegantes', 'joyería premium'],
        h1: 'Collares de Oro Laminado',
        status: 'NEEDS_WORK' as const,
        score: 76,
        issues: ['Meta descripción muy corta', 'Faltan palabras clave en el contenido'],
      },
    ];

    for (const seoData of seoPages) {
      const seoPage = await prisma.sEOPage.upsert({
        where: { url: seoData.url },
        update: {},
        create: seoData,
      });

      console.log(`✅ Página SEO creada: ${seoPage.url}`);
    }

    // Crear hero slides de ejemplo (con gestión inteligente de orderIndex)
    const heroSlidesData = [
      {
        title: 'Nueva Colección Primavera',
        subtitle: 'Descubre nuestra exclusiva línea de joyería',
        description: 'Piezas únicas en oro laminado 18k que destacan tu elegancia natural. Diseños contemporáneos con la calidad de siempre.',
        imageUrl: 'https://images.pexels.com/photos/1639729/pexels-photo-1639729.jpeg?auto=compress&cs=tinysrgb&w=1920',
        ctaText: 'Ver Colección',
        ctaLink: '/productos',
        offerText: 'Hasta 30% OFF',
        isActive: true,
      },
      {
        title: 'Envío Gratis en Colombia',
        subtitle: 'En compras superiores a $200.000',
        description: 'Recibe tus joyas favoritas sin costo adicional. Envío seguro y con seguimiento a todo el país.',
        imageUrl: 'https://images.pexels.com/photos/1458691/pexels-photo-1458691.jpeg?auto=compress&cs=tinysrgb&w=1920',
        ctaText: 'Comprar Ahora',
        ctaLink: '/?category=collares',
        offerText: 'Envío Gratis',
        isActive: true,
      },
      {
        title: 'Anillos de Compromiso',
        subtitle: 'Momentos únicos merecen joyas especiales',
        description: 'Encuentra el anillo perfecto para esa propuesta inolvidable. Diseños clásicos y modernos en oro laminado de alta calidad.',
        imageUrl: 'https://images.pexels.com/photos/1346086/pexels-photo-1346086.jpeg?auto=compress&cs=tinysrgb&w=1920',
        ctaText: 'Ver Anillos',
        ctaLink: '/?category=anillos',
        offerText: 'Diseños Únicos',
        isActive: true,
      },
    ];

    // Verificar slides existentes y obtener el próximo orderIndex disponible
    const existingSlides = await prisma.heroSlide.findMany({
      orderBy: { orderIndex: 'desc' },
      take: 1
    });
    
    let nextOrderIndex = existingSlides.length > 0 ? existingSlides[0].orderIndex + 1 : 1;

    for (const slideData of heroSlidesData) {
      const existingSlide = await prisma.heroSlide.findFirst({
        where: { title: slideData.title }
      });

      if (existingSlide) {
        console.log(`⏭️  Hero slide ya existe, omitiendo: ${slideData.title}`);
        continue;
      }

      const heroSlide = await prisma.heroSlide.create({
        data: {
          ...slideData,
          orderIndex: nextOrderIndex
        },
      });

      console.log(`✅ Hero slide creado: ${heroSlide.title} (orden: ${heroSlide.orderIndex})`);
      nextOrderIndex++;
    }

    // Crear reseñas de ejemplo
    const reviews = [
      {
        productName: 'Collar Veneciano Premium',
        rating: 5,
        title: 'Excelente calidad',
        comment: 'Superó mis expectativas. El collar es hermoso y la calidad del oro laminado es excepcional. Lo recomiendo 100%.',
        verified: true,
        status: 'APPROVED' as const,
      },
      {
        productName: 'Anillo Solitario Diamante',
        rating: 5,
        title: 'Perfecto para mi propuesta',
        comment: 'Compré este anillo para mi propuesta de matrimonio y fue perfecto. Mi novia quedó encantada con el diseño y la calidad.',
        verified: true,
        status: 'APPROVED' as const,
      },
      {
        productName: 'Aretes Perla Clásicos',
        rating: 4,
        title: 'Muy elegantes',
        comment: 'Los aretes son muy elegantes y van perfecto con cualquier outfit. Las perlas se ven de muy buena calidad.',
        verified: true,
        status: 'APPROVED' as const,
      },
    ];

    for (const reviewData of reviews) {
      const product = await prisma.product.findFirst({
        where: { name: reviewData.productName }
      });

      if (!product) {
        console.log(`⚠️  Producto no encontrado para reseña: ${reviewData.productName}`);
        continue;
      }

      const existingReview = await prisma.review.findFirst({
        where: { 
          productId: product.id,
          title: reviewData.title 
        }
      });

      if (existingReview) {
        console.log(`⏭️  Reseña ya existe, omitiendo: ${reviewData.title}`);
        continue;
      }

      const review = await prisma.review.create({
        data: {
          productId: product.id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
          verified: reviewData.verified,
          status: reviewData.status,
        },
      });

      console.log(`✅ Reseña creada: ${review.title}`);
    }

    // Crear órdenes de ejemplo
    const sampleOrders = [
      {
        customerName: 'María González',
        customerEmail: 'maria@email.com',
        customerPhone: '+57 300 123 4567',
        total: 179900,
        status: 'DELIVERED' as const,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'Tarjeta de Crédito',
        orderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
        products: ['Collar Veneciano Premium'],
      },
      {
        customerName: 'Carlos Rodríguez',
        customerEmail: 'carlos@email.com',
        customerPhone: '+57 301 234 5678',
        total: 149900,
        status: 'PROCESSING' as const,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'PSE',
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
        products: ['Anillo Solitario Diamante'],
      },
    ];

    for (const orderData of sampleOrders) {
      const customer = await prisma.customer.findFirst({
        where: { email: orderData.customerEmail }
      });

      if (!customer) {
        console.log(`⚠️  Cliente no encontrado para orden: ${orderData.customerEmail}`);
        continue;
      }

      // Generar número de pedido único basado en la fecha de la orden
      const orderNumber = await generateOrderNumberForDate(orderData.orderDate);
      
      const order = await prisma.order.create({
        data: {
          id: orderNumber,
          orderNumber: orderNumber,
          customerId: customer.id,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          total: orderData.total,
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          paymentMethod: orderData.paymentMethod,
          orderDate: orderData.orderDate,
        },
      });

      // Agregar items a la orden
      for (const productName of orderData.products) {
        const product = await prisma.product.findFirst({
          where: { name: productName }
        });

        if (product) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              quantity: 1,
              price: product.price,
            },
          });
        }
      }

      console.log(`✅ Orden creada: ${order.id}`);
    }

    console.log('🎉 Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });