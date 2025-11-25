import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  TrendingUp, 
  Eye, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import FileUploader from './FileUploader';

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

interface SEOManagerProps {
  pages: SEOPage[];
  onUpdatePage: (pageId: string, updates: Partial<SEOPage>) => void;
  onDeletePage: (pageId: string) => void;
  onAddPage: (page: Omit<SEOPage, 'id'>) => void;
}

const SEOManager: React.FC<SEOManagerProps> = ({
  pages,
  onUpdatePage,
  onDeletePage,
  onAddPage
}) => {
  const [selectedPage, setSelectedPage] = useState<SEOPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPages = pages.filter(page =>
    page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const seoStats = {
    totalPages: pages.length,
    optimized: pages.filter(p => p.status === 'optimized').length,
    needsWork: pages.filter(p => p.status === 'needs-work').length,
    poor: pages.filter(p => p.status === 'poor').length,
    averageScore: pages.length > 0 
      ? pages.reduce((sum, p) => sum + p.score, 0) / pages.length 
      : 0
  };

  const getStatusColor = (status: string) => {
    const colors = {
      optimized: 'bg-green-100 text-green-800',
      'needs-work': 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      optimized: CheckCircle,
      'needs-work': AlertCircle,
      poor: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAddNewPage = () => {
    setSelectedPage(null);
    setIsEditing(true);
  };

  const handleSavePage = (pageData: Partial<SEOPage>) => {
    if (selectedPage) {
      onUpdatePage(selectedPage.id, pageData);
    } else {
      onAddPage(pageData as Omit<SEOPage, 'id'>);
    }
    setSelectedPage(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-elegant p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600 text-sm lg:text-base">Total Páginas</p>
              <p className="text-xl lg:text-2xl admin-heading">
                {seoStats.totalPages}
              </p>
            </div>
            <Globe className="h-6 w-6 lg:h-8 lg:w-8 text-gold-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600 text-sm lg:text-base">Optimizadas</p>
              <p className="text-xl lg:text-2xl admin-heading text-green-600">
                {seoStats.optimized}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600 text-sm lg:text-base">Necesitan Trabajo</p>
              <p className="text-xl lg:text-2xl admin-heading text-yellow-600">
                {seoStats.needsWork}
              </p>
            </div>
            <AlertCircle className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label text-elegant-600 text-sm lg:text-base">Puntuación Promedio</p>
              <p className={`text-xl lg:text-2xl admin-heading ${getScoreColor(seoStats.averageScore)}`}>
                {seoStats.averageScore.toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-elegant p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-elegant-400" />
            <input
              type="text"
              placeholder="Buscar páginas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
            />
          </div>
          <button
            onClick={handleAddNewPage}
            className="flex items-center justify-center space-x-2 bg-gradient-gold text-elegant-900 px-4 py-2 rounded-lg admin-button hover:shadow-gold transition-all w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Página</span>
          </button>
        </div>
      </div>

      {/* Pages - Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full text-sm">
            <thead className="bg-elegant-50">
              <tr>
                <th className="px-4 py-3 text-left admin-table-header">
                  URL
                </th>
                <th className="px-4 py-3 text-left admin-table-header">
                  Título
                </th>
                <th className="px-4 py-3 text-left admin-table-header">
                  Score
                </th>
                <th className="px-4 py-3 text-left admin-table-header">
                  Estado
                </th>
                <th className="px-4 py-3 text-left admin-table-header">
                  Problemas
                </th>
                <th className="px-4 py-3 text-left admin-table-header">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-elegant-200">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-elegant-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <div className="admin-table-cell font-semibold text-xs truncate max-w-[200px]">
                        {page.url}
                      </div>
                      <div className="admin-body text-elegant-500 text-xs">
                        {new Date(page.lastUpdated).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="admin-table-cell max-w-[250px] truncate text-xs">
                      {page.title}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className={`text-sm font-bold ${getScoreColor(page.score)}`}>
                        {page.score}%
                      </div>
                      <div className="ml-2 w-12 bg-elegant-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            page.score >= 80 ? 'bg-green-500' :
                            page.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${page.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(page.status)}`}>
                      {getStatusIcon(page.status)}
                      <span className="ml-1 capitalize">
                        {page.status === 'needs-work' ? 'Necesita trabajo' : 
                         page.status === 'optimized' ? 'Optimizada' : 'Pobre'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="admin-body text-red-600 text-xs">
                      {page.issues.length} problemas
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPage(page);
                          setIsEditing(false);
                        }}
                        className="text-gold-600 hover:text-gold-900 p-1"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPage(page);
                          setIsEditing(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeletePage(page.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          <div className="p-4 space-y-4">
            {filteredPages.map((page) => (
              <div key={page.id} className="bg-elegant-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="admin-subheading text-sm font-semibold text-elegant-900">
                      {page.url}
                    </h3>
                    <p className="admin-body text-xs text-elegant-500 mt-1">
                      Actualizado: {new Date(page.lastUpdated).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPage(page);
                        setIsEditing(false);
                      }}
                      className="p-2 text-gold-600 hover:bg-gold-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPage(page);
                        setIsEditing(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeletePage(page.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="admin-body text-sm text-elegant-700 line-clamp-2">
                    {page.title}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${getScoreColor(page.score)}`}>
                      {page.score}%
                    </div>
                    <div className="w-12 bg-elegant-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          page.score >= 80 ? 'bg-green-500' :
                          page.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${page.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(page.status)}`}>
                    {getStatusIcon(page.status)}
                    <span className="ml-1 capitalize">
                      {page.status === 'needs-work' ? 'Necesita trabajo' : 
                       page.status === 'optimized' ? 'Optimizada' : 'Pobre'}
                    </span>
                  </span>
                </div>

                <div className="text-xs text-red-600">
                  {page.issues.length} problemas detectados
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEO Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 lg:p-6 border border-blue-200">
          <h3 className="text-base lg:text-lg admin-subheading text-blue-900 mb-3">
            💡 Tips de SEO
          </h3>
          <ul className="space-y-2 admin-body text-blue-800 text-sm">
            <li>• Títulos entre 50-60 caracteres</li>
            <li>• Meta descripciones entre 150-160 caracteres</li>
            <li>• Usar palabras clave en H1 y título</li>
            <li>• Optimizar imágenes con alt text</li>
            <li>• URLs amigables y descriptivas</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 lg:p-6 border border-green-200">
          <h3 className="text-base lg:text-lg admin-subheading text-green-900 mb-3">
            🎯 Palabras Clave Principales
          </h3>
          <div className="flex flex-wrap gap-2">
            {['joyería oro laminado', 'anillos compromiso', 'collares elegantes', 'pulseras premium', 'aretes oro', 'conjuntos joyería'].map((keyword, index) => (
              <span key={index} className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Page Detail/Edit Modal - RESPONSIVE */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedPage(null)} />
          
          <div className="absolute inset-2 sm:inset-4 bg-white rounded-2xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl admin-heading">
                  {isEditing ? 'Editar SEO' : 'Detalles SEO'}
                </h2>
                <button
                  onClick={() => setSelectedPage(null)}
                  className="p-2 hover:bg-elegant-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>

              {isEditing ? (
                <SEOForm page={selectedPage} onSave={handleSavePage} onCancel={() => setSelectedPage(null)} />
              ) : (
                <SEODetails page={selectedPage} onEdit={() => setIsEditing(true)} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nueva Página */}
      {!selectedPage && isEditing && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsEditing(false)} />
          
          <div className="absolute inset-2 sm:inset-4 bg-white rounded-2xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl admin-heading">
                  Nueva Página SEO
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover:bg-elegant-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>

              <SEOForm page={null} onSave={handleSavePage} onCancel={() => setIsEditing(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar detalles SEO - RESPONSIVE
const SEODetails: React.FC<{ page: SEOPage; onEdit: () => void }> = ({ page, onEdit }) => (
  <div className="space-y-4 sm:space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4">
        <div className={`text-2xl sm:text-3xl font-bold ${
          page.score >= 80 ? 'text-green-600' :
          page.score >= 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {page.score}%
        </div>
        <div>
          <h3 className="admin-subheading text-sm sm:text-base">{page.url}</h3>
          <p className="admin-body text-elegant-600 text-xs sm:text-sm">Puntuación SEO</p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="w-full sm:w-auto bg-gradient-gold text-elegant-900 px-4 py-2 rounded-lg admin-button hover:shadow-gold transition-all"
      >
        Editar
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="space-y-4">
        <div>
          <h4 className="admin-subheading mb-2 text-sm sm:text-base">Título SEO</h4>
          <p className="admin-body text-sm">{page.title}</p>
        </div>
        <div>
          <h4 className="admin-subheading mb-2 text-sm sm:text-base">Meta Descripción</h4>
          <p className="admin-body text-sm">{page.metaDescription}</p>
        </div>
        <div>
          <h4 className="admin-subheading mb-2 text-sm sm:text-base">H1</h4>
          <p className="admin-body text-sm">{page.h1}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="admin-subheading mb-2 text-sm sm:text-base">Palabras Clave</h4>
          <div className="flex flex-wrap gap-2">
            {page.keywords.map((keyword, index) => (
              <span key={index} className="bg-gold-100 text-gold-800 px-2 py-1 rounded-full text-xs">
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="admin-subheading mb-2 text-sm sm:text-base">Problemas Detectados</h4>
          <ul className="space-y-1">
            {page.issues.map((issue, index) => (
              <li key={index} className="text-red-600 admin-body text-sm flex items-center">
                <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// Componente para editar SEO - RESPONSIVE
const SEOForm: React.FC<{ 
  page: SEOPage | null; 
  onSave: (data: Partial<SEOPage>) => void; 
  onCancel: () => void 
}> = ({ page, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    url: page?.url || '',
    title: page?.title || '',
    metaDescription: page?.metaDescription || '',
    keywords: page?.keywords || [],
    h1: page?.h1 || '',
    canonicalUrl: page?.canonicalUrl || '',
    ogTitle: page?.ogTitle || '',
    ogDescription: page?.ogDescription || '',
    ogImage: page?.ogImage || ''
  });

  const [ogImages, setOgImages] = useState<string[]>(
    page?.ogImage ? [page.ogImage] : []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      ogImage: ogImages.length > 0 ? ogImages[0] : undefined,
      lastUpdated: new Date().toISOString(),
      score: Math.floor(Math.random() * 40) + 60,
      status: 'needs-work' as const,
      issues: []
    });
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...formData.keywords];
    newKeywords[index] = value;
    setFormData({ ...formData, keywords: newKeywords });
  };

  const addKeywordField = () => {
    setFormData({ ...formData, keywords: [...formData.keywords, ''] });
  };

  const removeKeywordField = (index: number) => {
    const newKeywords = formData.keywords.filter((_, i) => i !== index);
    setFormData({ ...formData, keywords: newKeywords });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Información Básica */}
      <div className="bg-elegant-50 p-4 sm:p-6 rounded-xl">
        <h3 className="text-base sm:text-lg admin-subheading mb-4">
          Información Básica de la Página
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block admin-label mb-2 text-sm">
              URL de la Página *
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
              placeholder="/productos/collares"
              required
            />
            <p className="text-xs admin-body text-elegant-500 mt-1">
              Ejemplo: /productos/collares, /sobre-nosotros, /contacto
            </p>
          </div>

          <div>
            <label className="block admin-label mb-2 text-sm">
              H1 Principal *
            </label>
            <input
              type="text"
              value={formData.h1}
              onChange={(e) => setFormData({...formData, h1: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
              placeholder="Collares de Oro Laminado Premium"
              required
            />
            <p className="text-xs admin-body text-elegant-500 mt-1">
              El título principal que aparece en la página
            </p>
          </div>
        </div>
      </div>

      {/* SEO Meta Tags */}
      <div className="bg-elegant-50 p-4 sm:p-6 rounded-xl">
        <h3 className="text-base sm:text-lg admin-subheading mb-4">
          Meta Tags SEO
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block admin-label mb-2 text-sm">
              Título SEO (50-60 caracteres) *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
              maxLength={60}
              placeholder="Collares de Oro Laminado - Joyería Elegante"
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="admin-body text-elegant-500 text-xs">
                Este título aparece en los resultados de Google
              </p>
              <span className={`text-xs font-semibold ${
                formData.title.length > 60 ? 'text-red-600' : 
                formData.title.length > 50 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {formData.title.length}/60
              </span>
            </div>
          </div>

          <div>
            <label className="block admin-label mb-2 text-sm">
              Meta Descripción (150-160 caracteres) *
            </label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
              maxLength={160}
              placeholder="Descubre nuestra exclusiva colección de collares en oro laminado 18k. Diseños únicos y elegantes para toda ocasión. Envío gratis en Colombia."
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="admin-body text-elegant-500 text-xs">
                Descripción que aparece bajo el título en Google
              </p>
              <span className={`text-xs font-semibold ${
                formData.metaDescription.length > 160 ? 'text-red-600' : 
                formData.metaDescription.length > 150 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {formData.metaDescription.length}/160
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Palabras Clave */}
      <div className="bg-elegant-50 p-4 sm:p-6 rounded-xl">
        <h3 className="text-base sm:text-lg admin-subheading mb-4">
          Palabras Clave
        </h3>
        
        <div className="space-y-3">
          {formData.keywords.length === 0 && (
            <button
              type="button"
              onClick={addKeywordField}
              className="text-gold-600 hover:text-gold-700 admin-button text-sm"
            >
              + Agregar primera palabra clave
            </button>
          )}
          
          {formData.keywords.map((keyword, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleKeywordChange(index, e.target.value)}
                placeholder="Ej: collares oro laminado"
                className="flex-1 px-3 sm:px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
              />
              <button
                type="button"
                onClick={() => removeKeywordField(index)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {formData.keywords.length > 0 && (
            <button
              type="button"
              onClick={addKeywordField}
              className="text-gold-600 hover:text-gold-700 admin-button text-sm"
            >
              + Agregar palabra clave
            </button>
          )}
        </div>
      </div>

      {/* Open Graph */}
      <div className="bg-elegant-50 p-4 sm:p-6 rounded-xl">
        <h3 className="text-base sm:text-lg admin-subheading mb-4">
          Open Graph (Redes Sociales)
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block admin-label mb-2 text-sm">
              Título para Redes Sociales
            </label>
            <input
              type="text"
              value={formData.ogTitle}
              onChange={(e) => setFormData({...formData, ogTitle: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
              placeholder="Deja vacío para usar el título SEO"
            />
          </div>

          <div>
            <label className="block admin-label mb-2 text-sm">
              Descripción para Redes Sociales
            </label>
            <textarea
              value={formData.ogDescription}
              onChange={(e) => setFormData({...formData, ogDescription: e.target.value})}
              rows={2}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
              placeholder="Deja vacío para usar la meta descripción"
            />
          </div>

          <div>
            <label className="block admin-label mb-2 text-sm">
              Imagen para Redes Sociales
            </label>
            <p className="admin-body text-elegant-600 mb-4 text-sm">
              Imagen que aparece cuando se comparte la página en redes sociales (recomendado: 1200x630px)
            </p>
            
            <FileUploader
              images={ogImages}
              onImagesChange={setOgImages}
              maxImages={1}
              maxFileSize={2}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
          </div>
        </div>
      </div>

      {/* URL Canónica */}
      <div className="bg-elegant-50 p-4 sm:p-6 rounded-xl">
        <h3 className="text-base sm:text-lg admin-subheading mb-4">
          Configuración Avanzada
        </h3>
        
        <div>
          <label className="block admin-label mb-2 text-sm">
            URL Canónica (Opcional)
          </label>
          <input
            type="url"
            value={formData.canonicalUrl}
            onChange={(e) => setFormData({...formData, canonicalUrl: e.target.value})}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
            placeholder="https://joyceriaelegante.com/productos/collares"
          />
          <p className="text-xs admin-body text-elegant-500 mt-1">
            URL principal de esta página para evitar contenido duplicado
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-2 border border-elegant-300 text-elegant-700 rounded-lg admin-button hover:bg-elegant-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2 bg-gradient-gold text-elegant-900 rounded-lg admin-button hover:shadow-gold transition-all"
        >
          {page ? 'Actualizar Página' : 'Crear Página'}
        </button>
      </div>
    </form>
  );
};

export default SEOManager;