import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  FileText, 
  Loader2,
  Eye,
  Save,
  X
} from 'lucide-react';

interface Product {
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  description: string;
  materials: string;
  dimensions: string;
  care: string;
  inStock: boolean;
  featured: boolean;
  images: string[];
  tags: string[];
}

interface ValidationError {
  row: number;
  field: string;
  value: unknown;
  message: string;
}

interface BulkImportProps {
  onImport: (products: Product[]) => Promise<void>;
}

const BulkImport: React.FC<BulkImportProps> = ({ onImport }) => {
  const [step, setStep] = useState<'upload' | 'validate' | 'preview' | 'importing' | 'complete'>('upload');
  const [validProducts, setValidProducts] = useState<Product[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plantilla CSV para descarga
  const csvTemplate = `name,price,originalPrice,category,subcategory,description,materials,dimensions,care,inStock,featured,images,tags
"Collar Elegante","89900","","collares","oro","Hermoso collar de oro laminado 18k","Oro laminado 18k","45cm de largo","Limpiar con paño suave","true","false","https://res.cloudinary.com/dflhmlbrz/image/upload/products/collar_elegante_01.jpg|https://res.cloudinary.com/dflhmlbrz/image/upload/products/collar_elegante_02.jpg","elegante|dorado|collar"
"Anillo Clásico","45000","55000","anillos","plata","Anillo clásico con diseño atemporal","Plata 925","Talla 6","Evitar contacto con perfumes","true","true","https://res.cloudinary.com/dflhmlbrz/image/upload/products/anillo_clasico_01.jpg","clásico|plata|anillo"
"Pulsera Sofisticada","67500","","pulseras","oro","Elegante pulsera para ocasiones especiales","Oro laminado 14k","18cm ajustable","Guardar en estuche seco","true","false","https://res.cloudinary.com/dflhmlbrz/image/upload/products/pulsera_sofisticada_01.jpg","sofisticada|ocasión|pulsera"
"Aretes Modernos","32000","38000","aretes","plata","Aretes con diseño contemporáneo","Plata 925 con cristales","2cm de largo","Limpiar después de cada uso","true","true","https://res.cloudinary.com/dflhmlbrz/image/upload/products/aretes_modernos_01.jpg","modernos|cristales|aretes"`;

  const downloadTemplate = () => {
    // Añadir BOM (Byte Order Mark) para asegurar correcta codificación UTF-8
    const BOM = '\uFEFF';
    const csvContent = BOM + csvTemplate;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_productos.csv';
    link.click();
  };

  // Detecta automáticamente el separador (coma o punto y coma)
  const detectSeparator = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return ',';
    
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    
    // Si hay más punto y coma que comas, usar punto y coma
    return semicolonCount > commaCount ? ';' : ',';
  };

  const parseCSV = (text: string): Record<string, unknown>[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Detectar separador automáticamente
    const separator = detectSeparator(text);
    console.log(`🔍 Separador detectado: "${separator}" (${separator === ',' ? 'coma' : 'punto y coma'})`);

    const headers = lines[0].split(separator).map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const parseCSVLine = (line: string, separator: string = ','): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const validateProducts = (data: Record<string, unknown>[]): { valid: Product[]; errors: ValidationError[] } => {
    const valid: Product[] = [];
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowErrors: ValidationError[] = [];

      // Validación de campos requeridos
      if (!row.name || row.name.length < 2) {
        rowErrors.push({
          row: index + 2,
          field: 'name',
          value: row.name,
          message: 'El nombre debe tener al menos 2 caracteres'
        });
      }

      const price = parseFloat(row.price);
      if (isNaN(price) || price <= 0) {
        rowErrors.push({
          row: index + 2,
          field: 'price',
          value: row.price,
          message: 'El precio debe ser un número positivo'
        });
      }

      if (!row.category) {
        rowErrors.push({
          row: index + 2,
          field: 'category',
          value: row.category,
          message: 'La categoría es requerida'
        });
      }

      if (!row.description || row.description.length < 10) {
        rowErrors.push({
          row: index + 2,
          field: 'description',
          value: row.description,
          message: 'La descripción debe tener al menos 10 caracteres'
        });
      }

      // Validar imágenes
      const images = row.images ? row.images.split('|').filter(img => img.trim()) : [];
      if (images.length === 0) {
        rowErrors.push({
          row: index + 2,
          field: 'images',
          value: row.images,
          message: 'Al menos una imagen es requerida'
        });
      }

      errors.push(...rowErrors);

      // Si no hay errores, agregar a productos válidos
      if (rowErrors.length === 0) {
        const originalPrice = row.originalPrice ? parseFloat(row.originalPrice) : undefined;
        const tags = row.tags ? row.tags.split('|').map(tag => tag.trim()).filter(tag => tag) : [];

        valid.push({
          name: row.name,
          price: price,
          originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
          category: row.category,
          subcategory: row.subcategory || '',
          description: row.description,
          materials: row.materials || '',
          dimensions: row.dimensions || '',
          care: row.care || '',
          inStock: row.inStock?.toLowerCase() === 'true',
          featured: row.featured?.toLowerCase() === 'true',
          images: images,
          tags: tags
        });
      }
    });

    return { valid, errors };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo CSV válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      
      if (data.length === 0) {
        alert('El archivo CSV está vacío o tiene un formato incorrecto');
        return;
      }

      setStep('validate');

      // Validar datos inmediatamente
      const { valid, errors } = validateProducts(data);
      setValidProducts(valid);
      setValidationErrors(errors);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (validProducts.length === 0) return;

    setStep('importing');
    setImportProgress(0);

    try {
      // Simular progreso
      const totalProducts = validProducts.length;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validProducts.length; i++) {
        try {
          // Aquí se llamaría a la API para crear cada producto
          await onImport([validProducts[i]]);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error importando producto ${i + 1}:`, error);
        }

        setImportProgress(((i + 1) / totalProducts) * 100);
        
        // Pequeña pausa para mostrar el progreso
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({ success: successCount, errors: errorCount });
      setStep('complete');
    } catch (error) {
      console.error('Error durante la importación:', error);
      alert('Error durante la importación. Por favor intenta nuevamente.');
      setStep('preview');
    }
  };

  const resetImport = () => {
    setStep('upload');
    setValidProducts([]);
    setValidationErrors([]);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elegant-900 mb-2">
              Importación Masiva de Productos
            </h2>
            <p className="text-elegant-600">
              Importa múltiples productos desde un archivo CSV
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 border border-elegant-300 rounded-lg hover:border-gold-500 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Descargar Plantilla</span>
          </button>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">ℹ</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Instrucciones para usar la plantilla CSV
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">📷 Imágenes:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Sube las imágenes a Cloudinary en la carpeta "products/"</li>
                  <li>• Usa nombres descriptivos (ej: collar_elegante_01.jpg)</li>
                  <li>• Para múltiples imágenes, sepáralas con "|"</li>
                  <li>• Formato: JPG o PNG, máximo 5MB</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">📝 Datos:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Los precios van sin puntos ni comas (ej: 45000)</li>
                  <li>• Categorías: collares, anillos, pulseras, aretes</li>
                  <li>• Usa "true"/"false" para inStock y featured</li>
                  <li>• Separa tags con "|" (ej: elegante|dorado|collar)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>💡 Consejo:</strong> Descarga la plantilla, abre en Excel/Google Sheets, y sigue los ejemplos incluidos.
                Puedes acceder a Cloudinary desde: Admin Panel → Configuración → Cloudinary
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center space-x-2 ${step === 'upload' ? 'text-gold-600' : step !== 'upload' ? 'text-green-600' : 'text-elegant-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-gold-100' : step !== 'upload' ? 'bg-green-100' : 'bg-elegant-100'}`}>
              {step !== 'upload' ? <CheckCircle className="h-5 w-5" /> : <span>1</span>}
            </div>
            <span className="font-medium">Subir CSV</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${step === 'validate' || step === 'preview' ? 'text-gold-600' : step === 'importing' || step === 'complete' ? 'text-green-600' : 'text-elegant-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'validate' || step === 'preview' ? 'bg-gold-100' : step === 'importing' || step === 'complete' ? 'bg-green-100' : 'bg-elegant-100'}`}>
              {step === 'importing' || step === 'complete' ? <CheckCircle className="h-5 w-5" /> : <span>2</span>}
            </div>
            <span className="font-medium">Validar Datos</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${step === 'importing' ? 'text-gold-600' : step === 'complete' ? 'text-green-600' : 'text-elegant-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'importing' ? 'bg-gold-100' : step === 'complete' ? 'bg-green-100' : 'bg-elegant-100'}`}>
              {step === 'complete' ? <CheckCircle className="h-5 w-5" /> : step === 'importing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>3</span>}
            </div>
            <span className="font-medium">Importar</span>
          </div>
        </div>
      </div>

      {/* Content based on step */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl shadow-elegant p-8">
          <div className="text-center">
            <div className="border-2 border-dashed border-elegant-300 rounded-lg p-12 hover:border-gold-500 transition-colors">
              <Upload className="h-16 w-16 text-elegant-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-elegant-900 mb-2">
                Selecciona un archivo CSV
              </h3>
              <p className="text-elegant-600 mb-6">
                Arrastra y suelta tu archivo aquí o haz clic para seleccionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center px-6 py-3 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-lg transition-all cursor-pointer font-medium"
              >
                <FileText className="h-5 w-5 mr-2" />
                Seleccionar Archivo CSV
              </label>
            </div>
          </div>
        </div>
      )}

      {(step === 'validate' || step === 'preview') && (
        <div className="space-y-6">
          {/* Validation Results */}
          <div className="bg-white rounded-xl shadow-elegant p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-elegant-900">
                Resultados de Validación
              </h3>
              <div className="flex space-x-4">
                <span className="text-green-600 font-medium">
                  ✓ {validProducts.length} productos válidos
                </span>
                <span className="text-red-600 font-medium">
                  ✗ {validationErrors.length} errores
                </span>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2">Errores encontrados:</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      Fila {error.row}, campo "{error.field}": {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('preview')}
                disabled={validProducts.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-elegant-300 disabled:cursor-not-allowed"
              >
                <Eye className="h-5 w-5" />
                <span>Vista Previa ({validProducts.length})</span>
              </button>
              <button
                onClick={resetImport}
                className="flex items-center space-x-2 px-4 py-2 border border-elegant-300 rounded-lg hover:border-red-500 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>

          {step === 'preview' && validProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-elegant-900">
                  Vista Previa de Productos a Importar
                </h3>
                <button
                  onClick={handleImport}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Save className="h-5 w-5" />
                  <span>Importar {validProducts.length} Productos</span>
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-elegant-50">
                    <tr>
                      <th className="text-left p-3 border-b">Nombre</th>
                      <th className="text-left p-3 border-b">Precio</th>
                      <th className="text-left p-3 border-b">Categoría</th>
                      <th className="text-left p-3 border-b">En Stock</th>
                      <th className="text-left p-3 border-b">Imágenes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validProducts.map((product, index) => (
                      <tr key={index} className="border-b hover:bg-elegant-50">
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3">${product.price.toLocaleString()}</td>
                        <td className="p-3">{product.category}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.inStock ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="p-3">{product.images.length} imagen(es)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'importing' && (
        <div className="bg-white rounded-xl shadow-elegant p-8">
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-gold-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-elegant-900 mb-2">
              Importando Productos...
            </h3>
            <p className="text-elegant-600 mb-6">
              Por favor espera mientras procesamos los productos
            </p>
            <div className="w-full bg-elegant-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-elegant-600">
              {Math.round(importProgress)}% completado
            </p>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="bg-white rounded-xl shadow-elegant p-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-elegant-900 mb-2">
              Importación Completada
            </h3>
            <div className="space-y-2 mb-6">
              <p className="text-green-600 font-medium">
                ✓ {importResults.success} productos importados exitosamente
              </p>
              {importResults.errors > 0 && (
                <p className="text-red-600 font-medium">
                  ✗ {importResults.errors} productos con errores
                </p>
              )}
            </div>
            <button
              onClick={resetImport}
              className="px-6 py-3 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Importar Más Productos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;