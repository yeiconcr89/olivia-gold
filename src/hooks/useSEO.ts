import { useState, useEffect } from 'react';
import { createAuthHeaders, API_CONFIG, apiRequest } from '../config/api';

interface SEOPage {
  id: string;
  url: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  status: 'optimized' | 'needs-work' | 'poor';
  score: number;
  issues: string[];
  lastUpdated: string;
}

// Datos SEO reales y consistentes para Joyería Elegante
const mockSEOPages: SEOPage[] = [
  {
    id: 'SEO-001',
    url: '/',
    title: 'Joyería Elegante - Oro Laminado Premium | Envío Gratis Colombia',
    metaDescription: 'Descubre nuestra exclusiva colección de joyería en oro laminado 18k. Collares, anillos, pulseras y aretes de alta calidad. Envío gratis en Colombia. Garantía de calidad.',
    keywords: ['joyería oro laminado', 'collares oro', 'anillos compromiso', 'pulseras elegantes', 'aretes oro', 'joyería elegante', 'oro 18k', 'joyería Colombia'],
    h1: 'Joyería Elegante - Oro Laminado Premium',
    canonicalUrl: 'https://joyceriaelegante.com/',
    ogTitle: 'Joyería Elegante - Oro Laminado Premium | Envío Gratis',
    ogDescription: 'Colección exclusiva de joyería en oro laminado 18k. Calidad premium, diseños únicos. Envío gratis en Colombia.',
    ogImage: 'https://joyceriaelegante.com/images/og-home.jpg',
    status: 'optimized',
    score: 95,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-002',
    url: '/productos',
    title: 'Productos de Joyería - Oro Laminado | Joyería Elegante',
    metaDescription: 'Explora nuestra completa colección de productos de joyería en oro laminado. Collares, anillos, pulseras, aretes y conjuntos. Diseños únicos y elegantes.',
    keywords: ['productos joyería', 'catalogo joyería', 'joyería oro laminado', 'collares anillos pulseras', 'accesorios oro'],
    h1: 'Productos de Joyería - Oro Laminado',
    canonicalUrl: 'https://joyceriaelegante.com/productos',
    ogTitle: 'Productos de Joyería - Oro Laminado',
    ogDescription: 'Explora nuestra completa colección de productos de joyería en oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-productos.jpg',
    status: 'optimized',
    score: 88,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-003',
    url: '/productos/collares',
    title: 'Collares de Oro Laminado - Joyería Elegante | Envío Gratis',
    metaDescription: 'Descubre nuestra colección de collares en oro laminado 18k. Diseños únicos y elegantes para cada ocasión. Envío gratis en Colombia. Garantía de calidad.',
    keywords: ['collares oro laminado', 'collares elegantes', 'joyería oro', 'collares 18k', 'accesorios oro', 'collares Colombia'],
    h1: 'Collares de Oro Laminado',
    canonicalUrl: 'https://joyceriaelegante.com/productos/collares',
    ogTitle: 'Collares de Oro Laminado - Joyería Elegante',
    ogDescription: 'Descubre nuestra colección de collares en oro laminado 18k. Diseños únicos y elegantes.',
    ogImage: 'https://joyceriaelegante.com/images/og-collares.jpg',
    status: 'optimized',
    score: 92,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-004',
    url: '/productos/anillos',
    title: 'Anillos de Oro Laminado - Joyería Elegante | Compromiso y Bodas',
    metaDescription: 'Encuentra el anillo perfecto en nuestra colección de anillos de oro laminado. Anillos de compromiso, bodas y ocasiones especiales. Envío gratis en Colombia.',
    keywords: ['anillos oro laminado', 'anillos compromiso', 'anillos boda', 'joyería oro', 'anillos 18k', 'anillos Colombia'],
    h1: 'Anillos de Oro Laminado',
    canonicalUrl: 'https://joyceriaelegante.com/productos/anillos',
    ogTitle: 'Anillos de Oro Laminado - Joyería Elegante',
    ogDescription: 'Encuentra el anillo perfecto en nuestra colección de anillos de oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-anillos.jpg',
    status: 'optimized',
    score: 90,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-005',
    url: '/productos/pulseras',
    title: 'Pulseras de Oro Laminado - Joyería Elegante | Diseños Únicos',
    metaDescription: 'Explora nuestra colección de pulseras en oro laminado 18k. Elegancia y sofisticación en cada diseño. Envío gratis en Colombia. Garantía de calidad.',
    keywords: ['pulseras oro laminado', 'pulseras elegantes', 'joyería oro', 'pulseras 18k', 'accesorios oro', 'pulseras Colombia'],
    h1: 'Pulseras de Oro Laminado',
    canonicalUrl: 'https://joyceriaelegante.com/productos/pulseras',
    ogTitle: 'Pulseras de Oro Laminado - Joyería Elegante',
    ogDescription: 'Explora nuestra colección de pulseras en oro laminado 18k. Elegancia y sofisticación.',
    ogImage: 'https://joyceriaelegante.com/images/og-pulseras.jpg',
    status: 'optimized',
    score: 89,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-006',
    url: '/productos/aretes',
    title: 'Aretes de Oro Laminado - Joyería Elegante | Diseños Exclusivos',
    metaDescription: 'Descubre nuestra colección de aretes en oro laminado 18k. Diseños únicos que complementan tu belleza natural. Envío gratis en Colombia.',
    keywords: ['aretes oro laminado', 'aretes elegantes', 'joyería oro', 'aretes 18k', 'accesorios oro', 'aretes Colombia'],
    h1: 'Aretes de Oro Laminado',
    canonicalUrl: 'https://joyceriaelegante.com/productos/aretes',
    ogTitle: 'Aretes de Oro Laminado - Joyería Elegante',
    ogDescription: 'Descubre nuestra colección de aretes en oro laminado 18k. Diseños únicos.',
    ogImage: 'https://joyceriaelegante.com/images/og-aretes.jpg',
    status: 'optimized',
    score: 87,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-007',
    url: '/productos/conjuntos',
    title: 'Conjuntos de Joyería - Oro Laminado | Joyería Elegante',
    metaDescription: 'Encuentra conjuntos perfectos de joyería en oro laminado. Collares y aretes coordinados para ocasiones especiales. Envío gratis en Colombia.',
    keywords: ['conjuntos joyería', 'conjuntos oro laminado', 'collares aretes', 'joyería conjuntos', 'accesorios coordinados'],
    h1: 'Conjuntos de Joyería - Oro Laminado',
    canonicalUrl: 'https://joyceriaelegante.com/productos/conjuntos',
    ogTitle: 'Conjuntos de Joyería - Oro Laminado',
    ogDescription: 'Encuentra conjuntos perfectos de joyería en oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-conjuntos.jpg',
    status: 'needs-work',
    score: 75,
    issues: ['Meta descripción muy corta', 'Faltan palabras clave específicas'],
    lastUpdated: '2024-01-10T00:00:00Z'
  },
  {
    id: 'SEO-008',
    url: '/productos/relojes',
    title: 'Relojes Elegantes - Joyería Elegante | Precisión y Estilo',
    metaDescription: 'Descubre nuestra colección de relojes elegantes con acabados en oro laminado. Precisión suiza y diseño sofisticado. Envío gratis en Colombia.',
    keywords: ['relojes elegantes', 'relojes oro laminado', 'relojes suizos', 'accesorios relojes', 'joyería relojes'],
    h1: 'Relojes Elegantes',
    canonicalUrl: 'https://joyceriaelegante.com/productos/relojes',
    ogTitle: 'Relojes Elegantes - Joyería Elegante',
    ogDescription: 'Descubre nuestra colección de relojes elegantes con acabados en oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-relojes.jpg',
    status: 'needs-work',
    score: 72,
    issues: ['Título muy largo', 'Meta descripción necesita más palabras clave'],
    lastUpdated: '2024-01-08T00:00:00Z'
  },
  {
    id: 'SEO-009',
    url: '/ofertas',
    title: 'Ofertas de Joyería - Oro Laminado | Descuentos Especiales',
    metaDescription: 'Aprovecha nuestras ofertas especiales en joyería de oro laminado. Descuentos únicos en collares, anillos, pulseras y aretes. Envío gratis en Colombia.',
    keywords: ['ofertas joyería', 'descuentos oro laminado', 'joyería barata', 'ofertas collares', 'ofertas anillos'],
    h1: 'Ofertas de Joyería - Oro Laminado',
    canonicalUrl: 'https://joyceriaelegante.com/ofertas',
    ogTitle: 'Ofertas de Joyería - Oro Laminado',
    ogDescription: 'Aprovecha nuestras ofertas especiales en joyería de oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-ofertas.jpg',
    status: 'optimized',
    score: 85,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-010',
    url: '/sobre-nosotros',
    title: 'Sobre Nosotros - Joyería Elegante | Historia y Calidad',
    metaDescription: 'Conoce la historia de Joyería Elegante. Más de 15 años de experiencia en joyería de oro laminado. Calidad garantizada y servicio al cliente excepcional.',
    keywords: ['sobre nosotros', 'historia joyería', 'joyería elegante', 'calidad garantizada', 'experiencia joyería'],
    h1: 'Sobre Nosotros - Joyería Elegante',
    canonicalUrl: 'https://joyceriaelegante.com/sobre-nosotros',
    ogTitle: 'Sobre Nosotros - Joyería Elegante',
    ogDescription: 'Conoce la historia de Joyería Elegante. Más de 15 años de experiencia.',
    ogImage: 'https://joyceriaelegante.com/images/og-sobre-nosotros.jpg',
    status: 'optimized',
    score: 83,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-011',
    url: '/contacto',
    title: 'Contacto - Joyería Elegante | Atención al Cliente',
    metaDescription: 'Contáctanos para cualquier consulta sobre nuestra joyería de oro laminado. Atención al cliente personalizada. WhatsApp, teléfono y email disponibles.',
    keywords: ['contacto joyería', 'atención cliente', 'whatsapp joyería', 'consulta joyería', 'soporte cliente'],
    h1: 'Contacto - Joyería Elegante',
    canonicalUrl: 'https://joyceriaelegante.com/contacto',
    ogTitle: 'Contacto - Joyería Elegante',
    ogDescription: 'Contáctanos para cualquier consulta sobre nuestra joyería de oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-contacto.jpg',
    status: 'optimized',
    score: 86,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-012',
    url: '/garantia',
    title: 'Garantía - Joyería Elegante | Calidad Garantizada',
    metaDescription: 'Nuestra garantía de calidad en joyería de oro laminado. Garantía de por vida en nuestros productos. Política de devoluciones y cambios transparente.',
    keywords: ['garantía joyería', 'calidad garantizada', 'devoluciones joyería', 'política garantía', 'garantía oro laminado'],
    h1: 'Garantía - Joyería Elegante',
    canonicalUrl: 'https://joyceriaelegante.com/garantia',
    ogTitle: 'Garantía - Joyería Elegante',
    ogDescription: 'Nuestra garantía de calidad en joyería de oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-garantia.jpg',
    status: 'needs-work',
    score: 78,
    issues: ['Faltan palabras clave en el contenido', 'Meta descripción puede ser más específica'],
    lastUpdated: '2024-01-12T00:00:00Z'
  },
  {
    id: 'SEO-013',
    url: '/envio',
    title: 'Envío Gratis - Joyería Elegante | Colombia',
    metaDescription: 'Envío gratis en toda Colombia en compras de joyería de oro laminado. Entrega rápida y segura. Rastreo en tiempo real de tu pedido.',
    keywords: ['envío gratis', 'envío Colombia', 'entrega joyería', 'rastreo pedido', 'envío seguro'],
    h1: 'Envío Gratis - Joyería Elegante',
    canonicalUrl: 'https://joyceriaelegante.com/envio',
    ogTitle: 'Envío Gratis - Joyería Elegante',
    ogDescription: 'Envío gratis en toda Colombia en compras de joyería de oro laminado.',
    ogImage: 'https://joyceriaelegante.com/images/og-envio.jpg',
    status: 'optimized',
    score: 91,
    issues: [],
    lastUpdated: '2024-01-15T00:00:00Z'
  },
  {
    id: 'SEO-014',
    url: '/blog',
    title: 'Blog - Joyería Elegante | Tips y Tendencias',
    metaDescription: 'Descubre tips de cuidado de joyería, tendencias y consejos de moda en nuestro blog. Artículos sobre oro laminado y accesorios elegantes.',
    keywords: ['blog joyería', 'tips joyería', 'tendencias joyería', 'cuidado oro laminado', 'moda accesorios'],
    h1: 'Blog - Joyería Elegante',
    canonicalUrl: 'https://joyceriaelegante.com/blog',
    ogTitle: 'Blog - Joyería Elegante',
    ogDescription: 'Descubre tips de cuidado de joyería, tendencias y consejos de moda.',
    ogImage: 'https://joyceriaelegante.com/images/og-blog.jpg',
    status: 'poor',
    score: 45,
    issues: ['Título muy corto', 'Meta descripción muy corta', 'Sin palabras clave específicas', 'Falta contenido'],
    lastUpdated: '2024-01-05T00:00:00Z'
  }
];

export const useSEO = () => {
  const [seoPages, setSEOPages] = useState<SEOPage[]>(mockSEOPages);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSEOPages = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<{ pages: any[] }>(API_CONFIG.ENDPOINTS.SEO.LIST, {
          headers: createAuthHeaders(),
          timeout: 8000,
        });
        // Transformar datos del backend al formato esperado por el frontend
        const transformedPages = data.pages.map((page: any) => ({
          id: page.id,
          url: page.url,
          title: page.title,
          metaDescription: page.metaDescription,
          keywords: page.keywords || [],
          h1: page.h1,
          canonicalUrl: page.canonicalUrl,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          status: ((['optimized','needs-work','poor'].includes(String(page.status || 'needs-work').toLowerCase())
            ? String(page.status || 'needs-work').toLowerCase()
            : 'needs-work') as 'optimized' | 'needs-work' | 'poor'),
          score: page.score ?? 0,
          issues: page.issues || [],
          lastUpdated: page.lastUpdated,
        }));
        setSEOPages(transformedPages);
      } catch (err) {
        console.warn('Error conectando a API SEO, usando datos mock:', err);
        setSEOPages(mockSEOPages);
        setError('Error al cargar páginas SEO');
      } finally {
        setLoading(false);
      }
    };

    fetchSEOPages();
  }, []);

  const updateSEOPage = async (pageId: string, updates: Partial<SEOPage>) => {
    try {
      // Actualizar localmente primero para UI responsiva
      setSEOPages(prev => prev.map(page => 
        page.id === pageId ? { ...page, ...updates } : page
      ));

      // Intentar actualizar en el backend
      await apiRequest(API_CONFIG.ENDPOINTS.SEO.UPDATE(pageId), {
        method: 'PUT',
        headers: createAuthHeaders(),
        body: JSON.stringify(updates),
        timeout: 8000,
      });
    } catch (err) {
      console.warn('Error conectando al backend para actualizar SEO:', err);
    }
  };

  const addSEOPage = async (pageData: Omit<SEOPage, 'id'>) => {
    try {
      // Agregar localmente primero para UI responsiva
      const newPage: SEOPage = {
        ...pageData,
        id: `SEO-${Date.now()}`
      };
      setSEOPages(prev => [newPage, ...prev]);

      // Intentar agregar en el backend
      const createdPage: any = await apiRequest(API_CONFIG.ENDPOINTS.SEO.LIST, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(pageData),
        timeout: 8000,
      });

      // Actualizar con el ID real del backend (soporta createdPage.page.id o createdPage.id)
      const backendId = createdPage?.page?.id || createdPage?.id;
      if (backendId) {
        setSEOPages(prev => prev.map(page => 
          page.id === newPage.id ? { ...page, id: backendId } : page
        ));
      }
    } catch (err) {
      console.warn('Error conectando al backend para crear SEO:', err);
    }
  };

  const deleteSEOPage = async (pageId: string) => {
    try {
      // Eliminar localmente primero para UI responsiva
      setSEOPages(prev => prev.filter(page => page.id !== pageId));

      // Intentar eliminar en el backend
      await apiRequest(API_CONFIG.ENDPOINTS.SEO.UPDATE(pageId), {
        method: 'DELETE',
        headers: createAuthHeaders(),
        timeout: 8000,
      });
    } catch (err) {
      console.warn('Error conectando al backend para eliminar SEO:', err);
    }
  };

  return {
    seoPages,
    loading,
    error,
    updateSEOPage,
    addSEOPage,
    deleteSEOPage
  };
};