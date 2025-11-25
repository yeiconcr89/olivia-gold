// Configuración centralizada de categorías
// Este archivo define todas las categorías disponibles en la aplicación

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'collares',
    name: 'Collares',
    description: 'Collares elegantes en oro laminado',
    icon: 'Circle'
  },
  {
    id: 'anillos',
    name: 'Anillos',
    description: 'Anillos de compromiso y moda',
    icon: 'Circle'
  },
  {
    id: 'pulseras',
    name: 'Pulseras',
    description: 'Pulseras delicadas y statement',
    icon: 'Circle'
  },
  {
    id: 'aretes',
    name: 'Aretes',
    description: 'Aretes para toda ocasión',
    icon: 'Circle'
  },
  {
    id: 'conjuntos',
    name: 'Conjuntos',
    description: 'Sets coordinados',
    icon: 'Package'
  },
  {
    id: 'relojes',
    name: 'Relojes',
    description: 'Relojes elegantes',
    icon: 'Clock'
  }
];

// Categoría especial para "todos los productos"
export const ALL_CATEGORIES: Category = {
  id: 'all',
  name: 'Todo',
  description: 'Todos los productos'
};

// Helper functions
export const getCategoryById = (id: string): Category | undefined => {
  if (id === 'all') return ALL_CATEGORIES;
  return CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || 'Categoría no encontrada';
};

export const getAllCategories = (): Category[] => {
  return [ALL_CATEGORIES, ...CATEGORIES];
};

// Subcategorías por categoría principal
export const SUBCATEGORIES: Record<string, string[]> = {
  collares: ['cadenas', 'colgantes', 'chokers'],
  anillos: ['compromiso', 'moda', 'matrimonio'],
  pulseras: ['elegantes', 'casuales', 'tenis'],
  aretes: ['perlas', 'cristales', 'colgantes'],
  conjuntos: ['romanticos', 'elegantes', 'casuales'],
  relojes: ['elegantes', 'deportivos', 'clasicos']
};

export const getSubcategories = (categoryId: string): string[] => {
  return SUBCATEGORIES[categoryId] || [];
};