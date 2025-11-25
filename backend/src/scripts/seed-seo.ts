import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para calcular el score SEO
const calculateSEOScore = (page: any): { score: number; issues: string[] } => {
  let score = 0;
  const issues: string[] = [];

  // Título (0-20 puntos)
  if (page.title && page.title.length >= 30 && page.title.length <= 60) {
    score += 20;
  } else if (page.title && page.title.length >= 10 && page.title.length <= 70) {
    score += 15;
    issues.push('Título fuera del rango óptimo (30-60 caracteres)');
  } else {
    issues.push('Título muy corto o muy largo');
  }

  // Meta descripción (0-20 puntos)
  if (page.metaDescription && page.metaDescription.length >= 120 && page.metaDescription.length <= 160) {
    score += 20;
  } else if (page.metaDescription && page.metaDescription.length >= 50 && page.metaDescription.length <= 200) {
    score += 15;
    issues.push('Meta descripción fuera del rango óptimo (120-160 caracteres)');
  } else {
    issues.push('Meta descripción muy corta o muy larga');
  }

  // H1 (0-15 puntos)
  if (page.h1 && page.h1.length > 0) {
    score += 15;
  } else {
    issues.push('Falta H1');
  }

  // Palabras clave (0-15 puntos)
  if (page.keywords && page.keywords.length >= 3 && page.keywords.length <= 8) {
    score += 15;
  } else if (page.keywords && page.keywords.length > 0) {
    score += 10;
    issues.push('Pocas o demasiadas palabras clave');
  } else {
    issues.push('Sin palabras clave');
  }

  // Open Graph (0-15 puntos)
  if (page.ogTitle && page.ogDescription && page.ogImage) {
    score += 15;
  } else if (page.ogTitle || page.ogDescription) {
    score += 10;
    issues.push('Open Graph incompleto');
  } else {
    issues.push('Sin Open Graph');
  }

  // URL canónica (0-10 puntos)
  if (page.canonicalUrl) {
    score += 10;
  } else {
    issues.push('Sin URL canónica');
  }

  // Contenido (0-5 puntos)
  if (page.h1 && page.h1.length > 10) {
    score += 5;
  } else {
    issues.push('Contenido H1 muy corto');
  }

  return { score, issues };
};

// Función para determinar el estado SEO
const determineSEOStatus = (score: number): 'OPTIMIZED' | 'NEEDS_WORK' | 'POOR' => {
  if (score >= 80) return 'OPTIMIZED';
  if (score >= 60) return 'NEEDS_WORK';
  return 'POOR';
};

async function main() {
  console.log('🌐 Poblando base de datos con datos SEO reales...');

  // Datos SEO reales y consistentes para Joyería Elegante
  const seoPages = [
    {
      url: '/',
      title: 'Joyería Elegante - Oro Laminado Premium | Envío Gratis Colombia',
      metaDescription: 'Descubre nuestra exclusiva colección de joyería en oro laminado 18k. Collares, anillos, pulseras y aretes de alta calidad. Envío gratis en Colombia. Garantía de calidad.',
      keywords: ['joyería oro laminado', 'collares oro', 'anillos compromiso', 'pulseras elegantes', 'aretes oro', 'joyería elegante', 'oro 18k', 'joyería Colombia'],
      h1: 'Joyería Elegante - Oro Laminado Premium',
      canonicalUrl: 'https://joyceriaelegante.com/',
      ogTitle: 'Joyería Elegante - Oro Laminado Premium | Envío Gratis',
      ogDescription: 'Colección exclusiva de joyería en oro laminado 18k. Calidad premium, diseños únicos. Envío gratis en Colombia.',
      ogImage: 'https://joyceriaelegante.com/images/og-home.jpg'
    },
    {
      url: '/productos',
      title: 'Productos de Joyería - Oro Laminado | Joyería Elegante',
      metaDescription: 'Explora nuestra completa colección de productos de joyería en oro laminado. Collares, anillos, pulseras, aretes y conjuntos. Diseños únicos y elegantes.',
      keywords: ['productos joyería', 'catalogo joyería', 'joyería oro laminado', 'collares anillos pulseras', 'accesorios oro'],
      h1: 'Productos de Joyería - Oro Laminado',
      canonicalUrl: 'https://joyceriaelegante.com/productos',
      ogTitle: 'Productos de Joyería - Oro Laminado',
      ogDescription: 'Explora nuestra completa colección de productos de joyería en oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-productos.jpg'
    },
    {
      url: '/productos/collares',
      title: 'Collares de Oro Laminado - Joyería Elegante | Envío Gratis',
      metaDescription: 'Descubre nuestra colección de collares en oro laminado 18k. Diseños únicos y elegantes para cada ocasión. Envío gratis en Colombia. Garantía de calidad.',
      keywords: ['collares oro laminado', 'collares elegantes', 'joyería oro', 'collares 18k', 'accesorios oro', 'collares Colombia'],
      h1: 'Collares de Oro Laminado',
      canonicalUrl: 'https://joyceriaelegante.com/productos/collares',
      ogTitle: 'Collares de Oro Laminado - Joyería Elegante',
      ogDescription: 'Descubre nuestra colección de collares en oro laminado 18k. Diseños únicos y elegantes.',
      ogImage: 'https://joyceriaelegante.com/images/og-collares.jpg'
    },
    {
      url: '/productos/anillos',
      title: 'Anillos de Oro Laminado - Joyería Elegante | Compromiso y Bodas',
      metaDescription: 'Encuentra el anillo perfecto en nuestra colección de anillos de oro laminado. Anillos de compromiso, bodas y ocasiones especiales. Envío gratis en Colombia.',
      keywords: ['anillos oro laminado', 'anillos compromiso', 'anillos boda', 'joyería oro', 'anillos 18k', 'anillos Colombia'],
      h1: 'Anillos de Oro Laminado',
      canonicalUrl: 'https://joyceriaelegante.com/productos/anillos',
      ogTitle: 'Anillos de Oro Laminado - Joyería Elegante',
      ogDescription: 'Encuentra el anillo perfecto en nuestra colección de anillos de oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-anillos.jpg'
    },
    {
      url: '/productos/pulseras',
      title: 'Pulseras de Oro Laminado - Joyería Elegante | Diseños Únicos',
      metaDescription: 'Explora nuestra colección de pulseras en oro laminado 18k. Elegancia y sofisticación en cada diseño. Envío gratis en Colombia. Garantía de calidad.',
      keywords: ['pulseras oro laminado', 'pulseras elegantes', 'joyería oro', 'pulseras 18k', 'accesorios oro', 'pulseras Colombia'],
      h1: 'Pulseras de Oro Laminado',
      canonicalUrl: 'https://joyceriaelegante.com/productos/pulseras',
      ogTitle: 'Pulseras de Oro Laminado - Joyería Elegante',
      ogDescription: 'Explora nuestra colección de pulseras en oro laminado 18k. Elegancia y sofisticación.',
      ogImage: 'https://joyceriaelegante.com/images/og-pulseras.jpg'
    },
    {
      url: '/productos/aretes',
      title: 'Aretes de Oro Laminado - Joyería Elegante | Diseños Exclusivos',
      metaDescription: 'Descubre nuestra colección de aretes en oro laminado 18k. Diseños únicos que complementan tu belleza natural. Envío gratis en Colombia.',
      keywords: ['aretes oro laminado', 'aretes elegantes', 'joyería oro', 'aretes 18k', 'accesorios oro', 'aretes Colombia'],
      h1: 'Aretes de Oro Laminado',
      canonicalUrl: 'https://joyceriaelegante.com/productos/aretes',
      ogTitle: 'Aretes de Oro Laminado - Joyería Elegante',
      ogDescription: 'Descubre nuestra colección de aretes en oro laminado 18k. Diseños únicos.',
      ogImage: 'https://joyceriaelegante.com/images/og-aretes.jpg'
    },
    {
      url: '/productos/conjuntos',
      title: 'Conjuntos de Joyería - Oro Laminado | Joyería Elegante',
      metaDescription: 'Encuentra conjuntos perfectos de joyería en oro laminado. Collares y aretes coordinados para ocasiones especiales. Envío gratis en Colombia.',
      keywords: ['conjuntos joyería', 'conjuntos oro laminado', 'collares aretes', 'joyería conjuntos', 'accesorios coordinados'],
      h1: 'Conjuntos de Joyería - Oro Laminado',
      canonicalUrl: 'https://joyceriaelegante.com/productos/conjuntos',
      ogTitle: 'Conjuntos de Joyería - Oro Laminado',
      ogDescription: 'Encuentra conjuntos perfectos de joyería en oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-conjuntos.jpg'
    },
    {
      url: '/productos/relojes',
      title: 'Relojes Elegantes - Joyería Elegante | Precisión y Estilo',
      metaDescription: 'Descubre nuestra colección de relojes elegantes con acabados en oro laminado. Precisión suiza y diseño sofisticado. Envío gratis en Colombia.',
      keywords: ['relojes elegantes', 'relojes oro laminado', 'relojes suizos', 'accesorios relojes', 'joyería relojes'],
      h1: 'Relojes Elegantes',
      canonicalUrl: 'https://joyceriaelegante.com/productos/relojes',
      ogTitle: 'Relojes Elegantes - Joyería Elegante',
      ogDescription: 'Descubre nuestra colección de relojes elegantes con acabados en oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-relojes.jpg'
    },
    {
      url: '/ofertas',
      title: 'Ofertas de Joyería - Oro Laminado | Descuentos Especiales',
      metaDescription: 'Aprovecha nuestras ofertas especiales en joyería de oro laminado. Descuentos únicos en collares, anillos, pulseras y aretes. Envío gratis en Colombia.',
      keywords: ['ofertas joyería', 'descuentos oro laminado', 'joyería barata', 'ofertas collares', 'ofertas anillos'],
      h1: 'Ofertas de Joyería - Oro Laminado',
      canonicalUrl: 'https://joyceriaelegante.com/ofertas',
      ogTitle: 'Ofertas de Joyería - Oro Laminado',
      ogDescription: 'Aprovecha nuestras ofertas especiales en joyería de oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-ofertas.jpg'
    },
    {
      url: '/sobre-nosotros',
      title: 'Sobre Nosotros - Joyería Elegante | Historia y Calidad',
      metaDescription: 'Conoce la historia de Joyería Elegante. Más de 15 años de experiencia en joyería de oro laminado. Calidad garantizada y servicio al cliente excepcional.',
      keywords: ['sobre nosotros', 'historia joyería', 'joyería elegante', 'calidad garantizada', 'experiencia joyería'],
      h1: 'Sobre Nosotros - Joyería Elegante',
      canonicalUrl: 'https://joyceriaelegante.com/sobre-nosotros',
      ogTitle: 'Sobre Nosotros - Joyería Elegante',
      ogDescription: 'Conoce la historia de Joyería Elegante. Más de 15 años de experiencia.',
      ogImage: 'https://joyceriaelegante.com/images/og-sobre-nosotros.jpg'
    },
    {
      url: '/contacto',
      title: 'Contacto - Joyería Elegante | Atención al Cliente',
      metaDescription: 'Contáctanos para cualquier consulta sobre nuestra joyería de oro laminado. Atención al cliente personalizada. WhatsApp, teléfono y email disponibles.',
      keywords: ['contacto joyería', 'atención cliente', 'whatsapp joyería', 'consulta joyería', 'soporte cliente'],
      h1: 'Contacto - Joyería Elegante',
      canonicalUrl: 'https://joyceriaelegante.com/contacto',
      ogTitle: 'Contacto - Joyería Elegante',
      ogDescription: 'Contáctanos para cualquier consulta sobre nuestra joyería de oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-contacto.jpg'
    },
    {
      url: '/garantia',
      title: 'Garantía - Joyería Elegante | Calidad Garantizada',
      metaDescription: 'Nuestra garantía de calidad en joyería de oro laminado. Garantía de por vida en nuestros productos. Política de devoluciones y cambios transparente.',
      keywords: ['garantía joyería', 'calidad garantizada', 'devoluciones joyería', 'política garantía', 'garantía oro laminado'],
      h1: 'Garantía - Joyería Elegante',
      canonicalUrl: 'https://joyceriaelegante.com/garantia',
      ogTitle: 'Garantía - Joyería Elegante',
      ogDescription: 'Nuestra garantía de calidad en joyería de oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-garantia.jpg'
    },
    {
      url: '/envio',
      title: 'Envío Gratis - Joyería Elegante | Colombia',
      metaDescription: 'Envío gratis en toda Colombia en compras de joyería de oro laminado. Entrega rápida y segura. Rastreo en tiempo real de tu pedido.',
      keywords: ['envío gratis', 'envío Colombia', 'entrega joyería', 'rastreo pedido', 'envío seguro'],
      h1: 'Envío Gratis - Joyería Elegante',
      canonicalUrl: 'https://joyceriaelegante.com/envio',
      ogTitle: 'Envío Gratis - Joyería Elegante',
      ogDescription: 'Envío gratis en toda Colombia en compras de joyería de oro laminado.',
      ogImage: 'https://joyceriaelegante.com/images/og-envio.jpg'
    },
    {
      url: '/blog',
      title: 'Blog - Joyería Elegante | Tips y Tendencias',
      metaDescription: 'Descubre tips de cuidado de joyería, tendencias y consejos de moda en nuestro blog. Artículos sobre oro laminado y accesorios elegantes.',
      keywords: ['blog joyería', 'tips joyería', 'tendencias joyería', 'cuidado oro laminado', 'moda accesorios'],
      h1: 'Blog - Joyería Elegante',
      canonicalUrl: 'https://joyceriaelegante.com/blog',
      ogTitle: 'Blog - Joyería Elegante',
      ogDescription: 'Descubre tips de cuidado de joyería, tendencias y consejos de moda.',
      ogImage: 'https://joyceriaelegante.com/images/og-blog.jpg'
    }
  ];

  try {
    // Limpiar datos existentes
    await prisma.sEOPage.deleteMany();
    console.log('🗑️ Datos SEO anteriores eliminados');

    // Crear nuevas páginas SEO
    for (const pageData of seoPages) {
      const { score, issues } = calculateSEOScore(pageData);
      const status = determineSEOStatus(score);

      await prisma.sEOPage.create({
        data: {
          ...pageData,
          status,
          score,
          issues,
          lastUpdated: new Date(),
        },
      });

      console.log(`✅ Página SEO creada: ${pageData.url} (Score: ${score}, Status: ${status})`);
    }

    console.log('🎉 Base de datos SEO poblada exitosamente');
    console.log(`📊 Total de páginas SEO: ${seoPages.length}`);

    // Mostrar estadísticas
    const stats = await prisma.sEOPage.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    console.log('\n📈 Estadísticas SEO:');
    stats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status} páginas`);
    });

  } catch (error) {
    console.error('❌ Error poblando datos SEO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 