import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';
import { useAuth } from '../context/AuthContext';
import OptimizedImage from './OptimizedImage';

const StaticContentManager: React.FC = () => {
    const { token } = useAuth();
    const [uploading, setUploading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const staticImages = [
        {
            id: 'jewelry-care',
            title: 'Cuidado de Joyas - Guía de Limpieza',
            description: 'Imagen principal de la sección "Cómo limpiar tus joyas".',
            publicId: 'pages/jewelry-care/cleaning-guide',
            width: 800,
            height: 600,
            currentUrl: `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dflhmlbrz'}/image/upload/v1/pages/jewelry-care/cleaning-guide`
        }
        // Aquí se pueden agregar más imágenes estáticas en el futuro
    ];

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageConfig: typeof staticImages[0]) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(imageConfig.id);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('publicId', imageConfig.publicId);
        formData.append('folder', 'pages/jewelry-care'); // Opcional, ya que publicId define la ruta

        try {
            await apiRequest(API_CONFIG.ENDPOINTS.UPLOAD.SINGLE, {
                method: 'POST',
                headers: createAuthHeaders(token || undefined),
                body: formData,
            });

            setMessage({
                type: 'success',
                text: `Imagen actualizada exitosamente. Puede tardar unos minutos en reflejarse en el sitio público debido al caché.`
            });

            // Forzar recarga de la imagen añadiendo un timestamp
            setRefreshKey(prev => prev + 1);

        } catch (error: any) {
            console.error('Error uploading image:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Error al subir la imagen.'
            });
        } finally {
            setUploading(null);
            // Limpiar input
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-elegant p-6">
                <div className="flex items-center mb-6">
                    <ImageIcon className="h-6 w-6 text-gold-600 mr-3" />
                    <h2 className="text-xl font-semibold text-elegant-900">Gestión de Imágenes de Contenido</h2>
                </div>

                <p className="text-elegant-600 mb-8">
                    Aquí puedes actualizar las imágenes estáticas de las páginas de información.
                    Las imágenes se reemplazarán automáticamente en el sitio web.
                </p>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="grid gap-8">
                    {staticImages.map((img) => (
                        <div key={img.id} className="border border-elegant-200 rounded-xl p-6 bg-elegant-50">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Preview */}
                                <div className="w-full md:w-1/3">
                                    <div className="aspect-w-4 aspect-h-3 bg-gray-200 rounded-lg overflow-hidden relative group">
                                        <OptimizedImage
                                            key={`${img.id}-${refreshKey}`} // Force re-render on update
                                            src={img.currentUrl}
                                            alt={img.title}
                                            className="object-cover w-full h-full"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                                    </div>
                                    <p className="text-xs text-center text-elegant-500 mt-2">
                                        Vista actual (puede estar en caché)
                                    </p>
                                </div>

                                {/* Controls */}
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-elegant-900 mb-2">{img.title}</h3>
                                    <p className="text-sm text-elegant-600 mb-4">{img.description}</p>

                                    <div className="bg-white p-4 rounded-lg border border-elegant-200 mb-4">
                                        <h4 className="text-xs font-semibold text-elegant-500 uppercase tracking-wider mb-2">Especificaciones Recomendadas</h4>
                                        <ul className="text-sm text-elegant-700 space-y-1">
                                            <li>• Dimensiones: {img.width}x{img.height} px (aprox)</li>
                                            <li>• Formato: JPG, PNG o WebP</li>
                                            <li>• Peso máximo: 5MB</li>
                                        </ul>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="file"
                                            id={`upload-${img.id}`}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, img)}
                                            disabled={uploading === img.id}
                                        />
                                        <label
                                            htmlFor={`upload-${img.id}`}
                                            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-gold hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 cursor-pointer transition-all ${uploading === img.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {uploading === img.id ? (
                                                <>
                                                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                    Subiendo...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="-ml-1 mr-2 h-4 w-4" />
                                                    Subir Nueva Imagen
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaticContentManager;
