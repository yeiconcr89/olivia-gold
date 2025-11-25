import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHeroSlider } from '../../hooks/useHeroSlider';

// Mock del módulo de API
vi.mock('../../config/api', () => ({
    API_CONFIG: {
        BASE_URL: 'http://localhost:3001',
    },
    apiRequest: vi.fn(),
    createAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
}));

// Mock del hook useToast
vi.mock('../../hooks/useToast', () => ({
    useToast: () => ({
        success: vi.fn(),
        error: vi.fn(),
    }),
}));

// Importar el mock después de definirlo
import { apiRequest } from '../../config/api';
const mockApiRequest = vi.mocked(apiRequest);

describe('useHeroSlider Hook', () => {
    const mockSlides = [
        {
            id: '1',
            title: 'Test Slide 1',
            subtitle: 'Test Subtitle 1',
            description: 'Test Description 1',
            imageUrl: 'https://example.com/image1.jpg',
            ctaText: 'Test CTA 1',
            ctaLink: '/test1',
            offerText: 'Test Offer 1',
            isActive: true,
            orderIndex: 1,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Inicialización', () => {
        it('debería inicializar con estado por defecto', () => {
            const { result } = renderHook(() => useHeroSlider({ manualInit: true }));

            expect(result.current.slides).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(null);
        });

        it('NO debería hacer llamado automático cuando manualInit es true', () => {
            renderHook(() => useHeroSlider({ manualInit: true }));

            expect(mockApiRequest).not.toHaveBeenCalled();
        });
    });

    describe('fetchAllSlides', () => {
        it('debería obtener slides correctamente', async () => {
            mockApiRequest.mockResolvedValueOnce({ slides: mockSlides });

            const { result } = renderHook(() => useHeroSlider({ manualInit: true }));

            await act(async () => {
                const slides = await result.current.fetchAllSlides();
                expect(slides).toEqual(mockSlides);
            });

            expect(result.current.slides).toEqual(mockSlides);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(null);
        });

        it('debería manejar errores correctamente', async () => {
            const errorMessage = 'Error al cargar slides';
            mockApiRequest.mockRejectedValueOnce({
                response: { data: { error: errorMessage } }
            });

            const { result } = renderHook(() => useHeroSlider({ manualInit: true }));

            await act(async () => {
                const slides = await result.current.fetchAllSlides();
                expect(slides).toEqual([]);
            });

            expect(result.current.error).toBe(errorMessage);
        });
    });

    describe('createSlide', () => {
        it('debería crear un slide correctamente', async () => {
            const newSlideData = {
                title: 'New Slide',
                subtitle: 'New Subtitle',
                description: 'New Description',
                imageUrl: 'https://example.com/new-image.jpg',
                ctaText: 'New CTA',
                isActive: true,
            };

            const createdSlide = {
                ...newSlideData,
                id: '3',
                orderIndex: 3,
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-01T00:00:00Z'
            };

            mockApiRequest.mockResolvedValueOnce({ slide: createdSlide });

            const { result } = renderHook(() => useHeroSlider({ manualInit: true }));

            await act(async () => {
                const slide = await result.current.createSlide(newSlideData);
                expect(slide).toEqual(createdSlide);
            });

            expect(result.current.slides).toContain(createdSlide);
        });
    });

    describe('updateSlide', () => {
        it('debería actualizar un slide correctamente', async () => {
            const updateData = { title: 'Updated Title' };
            const updatedSlide = { ...mockSlides[0], ...updateData };

            mockApiRequest.mockResolvedValueOnce({ slide: updatedSlide });

            const { result } = renderHook(() => useHeroSlider({ manualInit: true }));

            await act(async () => {
                const slide = await result.current.updateSlide('1', updateData);
                expect(slide).toEqual(updatedSlide);
            });
        });
    });

    describe('deleteSlide', () => {
        it('debería eliminar un slide correctamente', async () => {
            mockApiRequest.mockResolvedValueOnce({});

            const { result } = renderHook(() => useHeroSlider({ manualInit: true }));

            await act(async () => {
                const success = await result.current.deleteSlide('1');
                expect(success).toBe(true);
            });
        });
    });

    describe('toggleSlideStatus', () => {
        it('debería cambiar el estado de un slide correctamente', async () => {
            const toggledSlide = { ...mockSlides[0], isActive: false };
            mockApiRequest.mockResolvedValueOnce({ slide: toggledSlide });

            const { result } = renderHook(() => useHeroSlider({ manualInit: true }));

            await act(async () => {
                const slide = await result.current.toggleSlideStatus('1');
                expect(slide?.isActive).toBe(false);
            });
        });
    });
});