import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';
import { useToast } from './useToast';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  offerText?: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHeroSlideData {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  offerText?: string;
  isActive?: boolean;
  orderIndex?: number;
}

export type UpdateHeroSlideData = Partial<CreateHeroSlideData>;

export interface ReorderSlideData {
  id: string;
  orderIndex: number;
}

interface UseHeroSliderOptions {
  // Funciones de toast externas (opcional)
  externalToast?: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
  };
}

// DEDUPE Y CACHE A NIVEL DE MÓDULO PARA EVITAR PETICIONES EN TORMENTA
let HERO_SLIDES_CACHE: HeroSlide[] = [];
let HERO_SLIDES_LAST_FETCH = 0;
let HERO_SLIDES_IN_FLIGHT: Promise<HeroSlide[]> | null = null;
let ADMIN_SLIDES_IN_FLIGHT: Promise<HeroSlide[]> | null = null;

// Fallback estático para cuando el backend no responde y no hay cache
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    title: 'Elegancia atemporal',
    subtitle: 'Descubre piezas únicas hechas a mano',
    description: 'Joyas diseñadas para brillar en cada momento especial.',
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'Ver colección',
    ctaLink: '/products',
    offerText: 'Nueva colección 2025',
    isActive: true,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    title: 'Detalles que enamoran',
    subtitle: 'Acabados en oro y plata de la mejor calidad',
    description: 'Cada pieza cuenta una historia: la tuya.',
    imageUrl: 'https://images.unsplash.com/photo-1601057463239-28141b9d1b7a?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'Explorar ahora',
    ctaLink: '/products',
    offerText: 'Edición limitada',
    isActive: true,
    orderIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface UseHeroSliderOptionsExtended extends UseHeroSliderOptions {
  // Si es true, no hace llamados automáticos (para admin)
  manualInit?: boolean;
}

export const useHeroSlider = (options?: UseHeroSliderOptionsExtended) => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);
  
  // Usar toasts externos si se proporcionan, sino usar el hook interno
  const internalToast = useToast();
  const showSuccess = useCallback((title: string, message?: string) => {
    if (options?.externalToast?.success) {
      options.externalToast.success(title, message);
    } else {
      internalToast.success(title, message);
    }
  }, [options?.externalToast?.success, internalToast.success]);
  
  const showError = useCallback((title: string, message?: string) => {
    if (options?.externalToast?.error) {
      options.externalToast.error(title, message);
    } else {
      internalToast.error(title, message);
    }
  }, [options?.externalToast?.error, internalToast.error]);

  // Cache duration: 60 seconds
  const CACHE_DURATION = 60000;
  // Maximum number of retries (bajo para no bloquear la UI)
  const MAX_RETRIES = 2;
  // Delay between retries (in ms)
  const RETRY_DELAY = 1000;

  // ============================================================================
  // OBTENER SLIDES ACTIVOS (PÚBLICO)
  // ============================================================================

  const fetchActiveSlides = useCallback(async (): Promise<HeroSlide[]> => {
    const now = Date.now();

    // 1) Intentar usar cache global primero
    if (HERO_SLIDES_CACHE.length > 0 && (now - HERO_SLIDES_LAST_FETCH) < CACHE_DURATION) {
      // Sincronizar estado local
      setSlides(HERO_SLIDES_CACHE);
      setLastFetch(HERO_SLIDES_LAST_FETCH);
      setError(null);
      setRetryCount(0);
      return HERO_SLIDES_CACHE;
    }

    // 2) Si hay una petición en curso, reusar esa promesa
    if (HERO_SLIDES_IN_FLIGHT) {
      const result = await HERO_SLIDES_IN_FLIGHT;
      setSlides(result);
      setLastFetch(HERO_SLIDES_LAST_FETCH);
      return result;
    }

    setLoading(true);
    setError(null);

    // 3) Crear una promesa en curso con reintentos iterativos (sin recursión)
    HERO_SLIDES_IN_FLIGHT = (async () => {
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          const response = await apiRequest<{ slides: HeroSlide[] }>(
            `${API_CONFIG.BASE_URL}/api/hero-slider`,
            {
              method: 'GET',
              headers: createAuthHeaders(),
              // Timeout corto para no bloquear la UI del home
              timeout: 3000,
            }
          );
          const activeSlides = response?.slides || [];
          // Actualizar cache global
          HERO_SLIDES_CACHE = activeSlides;
          HERO_SLIDES_LAST_FETCH = Date.now();
          // Sincronizar estado local
          setSlides(activeSlides);
          setLastFetch(HERO_SLIDES_LAST_FETCH);
          setRetryCount(0);
          return activeSlides;
        } catch (e) {
          attempt += 1;
          setRetryCount(attempt);
          if (attempt >= MAX_RETRIES) {
            throw e;
          }
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      return [] as HeroSlide[]; // Satisface el tipo, nunca debería llegar aquí
    })();

    try {
      const result = await HERO_SLIDES_IN_FLIGHT;
      return result;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cargar slides del hero';
      console.error('❌ Error obteniendo slides activos:', err);
      // Mostrar toast, pero no bloquear la UI del home
      showError(errorMessage);

      // Usar cache global si existe aun en error
      if (HERO_SLIDES_CACHE.length > 0) {
        setSlides(HERO_SLIDES_CACHE);
        setLastFetch(HERO_SLIDES_LAST_FETCH);
        setError(null);
        return HERO_SLIDES_CACHE;
      }

      // Fallback: usar slides estáticos para no romper el home
      setSlides(FALLBACK_SLIDES);
      HERO_SLIDES_CACHE = FALLBACK_SLIDES;
      HERO_SLIDES_LAST_FETCH = Date.now();
      setLastFetch(HERO_SLIDES_LAST_FETCH);
      setError(null);
      return FALLBACK_SLIDES;
    } finally {
      setLoading(false);
      HERO_SLIDES_IN_FLIGHT = null;
    }
  }, [showError]);

  // ============================================================================
  // OBTENER TODOS LOS SLIDES (ADMIN)
  // ============================================================================

  const fetchAllSlides = useCallback(async (): Promise<HeroSlide[]> => {
    // Si ya hay una petición en curso, reusar esa promesa
    if (ADMIN_SLIDES_IN_FLIGHT) {
      console.log('🔄 Reusando petición en curso para admin slides');
      return await ADMIN_SLIDES_IN_FLIGHT;
    }

    setLoading(true);
    setError(null);
    
    ADMIN_SLIDES_IN_FLIGHT = (async () => {
      try {
        console.log('🔧 Admin obteniendo todos los slides del hero');
        const response = await apiRequest<{ slides: HeroSlide[] }>(
          `${API_CONFIG.BASE_URL}/api/hero-slider/admin`,
          {
            method: 'GET',
            headers: createAuthHeaders(),
            timeout: 8000,
          }
        );
        
        if (response?.slides) {
          const allSlides = response.slides;
          setSlides(allSlides);
          console.log('✅ Todos los slides obtenidos:', allSlides.length);
          return allSlides;
        }
        
        return [];
      } catch (err: unknown) {
        let errorMessage = 'Error desconocido al cargar slides';
        
        if (err && typeof err === 'object') {
          const errorObj = err as any;
          if (errorObj.response?.data?.error) {
            errorMessage = errorObj.response.data.error;
          } else if (errorObj.message) {
            errorMessage = errorObj.message;
          } else if (errorObj.name === 'AbortError') {
            errorMessage = 'Tiempo de espera agotado';
          }
        }
        
        console.error('❌ Error obteniendo todos los slides:', err);
        setError(errorMessage);
        showError('Error al cargar slides', errorMessage);
        return [];
      } finally {
        setLoading(false);
        ADMIN_SLIDES_IN_FLIGHT = null;
      }
    })();

    return await ADMIN_SLIDES_IN_FLIGHT;
  }, [showError]);

  // ============================================================================
  // OBTENER SLIDE POR ID
  // ============================================================================

  const fetchSlideById = async (id: string): Promise<HeroSlide | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Obteniendo slide del hero: ${id}`);
      const response = await apiRequest<{ slide: HeroSlide }>(
        `${API_CONFIG.BASE_URL}/api/hero-slider/${id}`,
        {
          method: 'GET',
          headers: createAuthHeaders(),
        }
      );
      
      if (response?.slide) {
        console.log('✅ Slide obtenido:', response.slide);
        return response.slide;
      }
      
      return null;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cargar slide';
      console.error('❌ Error obteniendo slide:', err);
      setError(errorMessage);
      showError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // CREAR SLIDE
  // ============================================================================

  const createSlide = async (slideData: CreateHeroSlideData): Promise<HeroSlide | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('➕ Creando nuevo slide del hero:', slideData);
      const response = await apiRequest<{ slide: HeroSlide }>(
        `${API_CONFIG.BASE_URL}/api/hero-slider`,
        {
          method: 'POST',
          headers: createAuthHeaders(),
          body: JSON.stringify(slideData),
        }
      );
      
      if (response?.slide) {
        const newSlide = response.slide;
        setSlides(prev => [...prev, newSlide].sort((a, b) => a.orderIndex - b.orderIndex));
        showSuccess('Slide creado exitosamente');
        console.log('✅ Slide creado:', newSlide);
        // Actualizar cache global para mantener consistencia
        HERO_SLIDES_CACHE = [...(HERO_SLIDES_CACHE || []), newSlide].sort((a, b) => a.orderIndex - b.orderIndex);
        HERO_SLIDES_LAST_FETCH = Date.now();
        return newSlide;
      }
      
      return null;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al crear slide';
      console.error('❌ Error creando slide:', err);
      setError(errorMessage);
      showError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // ACTUALIZAR SLIDE
  // ============================================================================

  const updateSlide = async (id: string, slideData: UpdateHeroSlideData): Promise<HeroSlide | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Actualizando slide del hero: ${id}`, slideData);
      const response = await apiRequest<{ slide: HeroSlide }>(
        `${API_CONFIG.BASE_URL}/api/hero-slider/${id}`,
        {
          method: 'PUT',
          headers: createAuthHeaders(),
          body: JSON.stringify(slideData),
        }
      );
      
      if (response?.slide) {
        const updatedSlide = response.slide;
        setSlides(prev => 
          prev.map(slide => 
            slide.id === id ? updatedSlide : slide
          ).sort((a, b) => a.orderIndex - b.orderIndex)
        );
        showSuccess('Slide actualizado exitosamente');
        console.log('✅ Slide actualizado:', updatedSlide);
        // Actualizar cache global para mantener consistencia
        HERO_SLIDES_CACHE = HERO_SLIDES_CACHE.map(s => s.id === id ? updatedSlide : s).sort((a, b) => a.orderIndex - b.orderIndex);
        HERO_SLIDES_LAST_FETCH = Date.now();
        return updatedSlide;
      }
      
      return null;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al actualizar slide';
      console.error('❌ Error actualizando slide:', err);
      setError(errorMessage);
      showError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // ELIMINAR SLIDE
  // ============================================================================

  const deleteSlide = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🗑️ Eliminando slide del hero: ${id}`);
      await apiRequest(
        `${API_CONFIG.BASE_URL}/api/hero-slider/${id}`,
        {
          method: 'DELETE',
          headers: createAuthHeaders(),
        }
      );
      
      setSlides(prev => prev.filter(slide => slide.id !== id));
      showSuccess('Slide eliminado exitosamente');
      console.log('✅ Slide eliminado');
      // Actualizar cache global
      HERO_SLIDES_CACHE = HERO_SLIDES_CACHE.filter(s => s.id !== id);
      HERO_SLIDES_LAST_FETCH = Date.now();
      return true;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al eliminar slide';
      console.error('❌ Error eliminando slide:', err);
      setError(errorMessage);
      showError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // REORDENAR SLIDES
  // ============================================================================

  const reorderSlides = async (reorderData: ReorderSlideData[]): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Reordenando slides del hero:', reorderData);
      await apiRequest(
        `${API_CONFIG.BASE_URL}/api/hero-slider/reorder`,
        {
          method: 'POST',
          headers: createAuthHeaders(),
          body: JSON.stringify(reorderData),
        }
      );
      
      // Actualizar el estado local con el nuevo orden
      setSlides(prev => {
        const updatedSlides = [...prev];
        reorderData.forEach(({ id, orderIndex }) => {
          const slideIndex = updatedSlides.findIndex(slide => slide.id === id);
          if (slideIndex !== -1) {
            updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], orderIndex } as HeroSlide;
          }
        });
        return updatedSlides.sort((a, b) => a.orderIndex - b.orderIndex);
      });
      
      // Actualizar cache global
      HERO_SLIDES_CACHE = reorderData.reduce((acc, { id, orderIndex }) => {
        const idx = acc.findIndex(s => s.id === id);
        if (idx !== -1) acc[idx] = { ...acc[idx], orderIndex } as HeroSlide;
        return acc;
      }, [...HERO_SLIDES_CACHE]).sort((a, b) => a.orderIndex - b.orderIndex);
      HERO_SLIDES_LAST_FETCH = Date.now();
      
      showSuccess('Slides reordenados exitosamente');
      console.log('✅ Slides reordenados');
      return true;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al reordenar slides';
      console.error('❌ Error reordenando slides:', err);
      setError(errorMessage);
      showError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // CAMBIAR ESTADO ACTIVO/INACTIVO
  // ============================================================================

  const toggleSlideStatus = async (id: string): Promise<HeroSlide | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Cambiando estado del slide del hero: ${id}`);
      const response = await apiRequest<{ slide: HeroSlide }>(
        `${API_CONFIG.BASE_URL}/api/hero-slider/${id}/toggle`,
        {
          method: 'PATCH',
          headers: createAuthHeaders(),
        }
      );
      
      if (response?.slide) {
        const updatedSlide = response.slide;
        setSlides(prev => 
          prev.map(slide => 
            slide.id === id ? updatedSlide : slide
          )
        );
        // Actualizar cache global
        HERO_SLIDES_CACHE = HERO_SLIDES_CACHE.map(s => s.id === id ? updatedSlide : s);
        HERO_SLIDES_LAST_FETCH = Date.now();
        showSuccess('Estado del slide cambiado exitosamente');
        console.log('✅ Estado del slide cambiado:', updatedSlide);
        return updatedSlide;
      }
      
      return null;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cambiar estado del slide';
      console.error('❌ Error cambiando estado del slide:', err);
      setError(errorMessage);
      showError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EFECTO INICIAL
  // ============================================================================

  useEffect(() => {
    // Solo inicializar una vez si no es manual
    if (!initialized && !options?.manualInit) {
      setInitialized(true);
      console.log('🚀 Inicializando useHeroSlider (automático)');
      fetchActiveSlides();
    } else if (!initialized && options?.manualInit) {
      setInitialized(true);
      console.log('🚀 Inicializando useHeroSlider (manual - sin llamados automáticos)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, options?.manualInit]); // Solo depende del estado de inicialización

  return {
    slides,
    loading,
    error,
    fetchActiveSlides,
    fetchAllSlides,
    fetchSlideById,
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    toggleSlideStatus,
  };
};