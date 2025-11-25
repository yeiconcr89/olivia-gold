import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useHeroSlider } from '../hooks/useHeroSlider';
import { Link } from 'react-router-dom';

const HeroSlider: React.FC = () => {
  const { slides, loading, error } = useHeroSlider();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Use browser-compatible timer type to avoid NodeJS namespace issues
  const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Ensure currentSlide is within bounds when slides change
  useEffect(() => {
    if (slides.length > 0 && currentSlide >= slides.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Navegación de slides
  const nextSlide = useCallback(() => {
    if (isTransitioning || slides.length === 0 || !isMountedRef.current) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsTransitioning(false);
      }
    }, 300);
  }, [isTransitioning, slides.length]);

  const prevSlide = useCallback(() => {
    if (isTransitioning || slides.length === 0 || !isMountedRef.current) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsTransitioning(false);
      }
    }, 300);
  }, [isTransitioning, slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide || !isMountedRef.current) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsTransitioning(false);
      }
    }, 300);
  }, [isTransitioning, currentSlide]);

  // Auto-play - solo si hay slides y no hay transición
  useEffect(() => {
    if (slides.length <= 1 || isTransitioning || !isMountedRef.current) {
      return;
    }

    // Limpiar intervalo existente
    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current);
    }

    // Crear nuevo intervalo
    autoplayIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && !isTransitioning) {
        nextSlide();
      }
    }, 6000); // 6 segundos para reducir frecuencia

    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = null;
      }
    };
  }, [slides.length, nextSlide, isTransitioning]);

  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = null;
      }
    };
  }, []);

  // Estados de carga y error
  if (loading) {
    return (
      <div className="relative h-[60vh] md:h-[80vh] bg-gray-200 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-xl">Cargando slider...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-[60vh] md:h-[80vh] bg-red-50 border border-red-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-600 text-xl">Error al cargar el slider: {error}</div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative h-[60vh] md:h-[80vh] bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-xl">No hay slides disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[50vh] sm:h-[60vh] lg:h-[75vh] xl:h-[80vh] overflow-hidden bg-elegant-900">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
            index === currentSlide
              ? 'translate-x-0'
              : index < currentSlide
              ? '-translate-x-full'
              : 'translate-x-full'
          }`}
          style={{
            backgroundImage: `url(${slide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay de degradado elegante */}
          <div className="absolute inset-0 bg-gradient-to-r from-elegant-900/80 via-elegant-900/50 to-transparent" />

          {/* Contenido del slide */}
          <div className="relative h-full w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-full flex flex-col justify-center items-center text-center max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <Sparkles className="h-5 w-5" />
                <span className="text-amber-100 text-sm font-medium tracking-wide">
                  {slide.offerText || 'Joyas que cuentan tu historia'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                {slide.title}
              </h1>

              <p className="text-lg sm:text-xl text-elegant-100 mb-6">
                {slide.subtitle}
              </p>

              {slide.description && (
                <p className="text-base sm:text-lg text-elegant-200 mb-8">
                  {slide.description}
                </p>
              )}

              <div className="flex items-center gap-4">
                {slide.ctaLink && (
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full text-base font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                  >
                    {slide.ctaText || 'Ver colección'}
                  </Link>
                )}
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full text-base font-medium bg-white/10 backdrop-blur-[2px] text-white hover:bg-white/20 transition-colors border border-white/20"
                >
                  Explorar productos
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Controles de navegación */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/20"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/20"
        aria-label="Slide siguiente"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? 'w-6 bg-amber-500' : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;