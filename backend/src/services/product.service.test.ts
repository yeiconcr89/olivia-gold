
import { prisma } from '../utils/prisma';
import * as productService from './product.service';

// Datos de prueba
const productData = {
  name: 'Joya de Prueba',
  price: 199.99,
  originalPrice: 250.00,
  category: 'Anillos',
  subcategory: 'Plata',
  description: 'Una joya de prueba para las pruebas de integración.',
  materials: 'Plata 925',
  dimensions: 'Talla 7',
  care: 'Limpiar con cuidado.',
  inStock: true,
  featured: false,
  images: ['http://example.com/joya.jpg'],
  tags: ['prueba', 'plata'],
};

let createdProduct: any;

describe('Product Service - Pruebas de Integración', () => {

  // Limpiar la base de datos antes de todas las pruebas
  beforeAll(async () => {
    // Limpiar solo productos de prueba específicos
    await prisma.product.deleteMany({ where: { name: { contains: 'Joya de Prueba' } } });
  });

  // Desconectar Prisma después de todas las pruebas
  afterAll(async () => {
    // Limpiar solo productos de prueba específicos
    await prisma.product.deleteMany({ where: { name: { contains: 'Joya de Prueba' } } });
    await prisma.$disconnect();
  });

  it('debería crear un nuevo producto correctamente', async () => {
    createdProduct = await productService.createProduct(productData);

    expect(createdProduct).toBeDefined();
    expect(createdProduct.name).toBe(productData.name);
    expect(createdProduct.price).toBe(productData.price);
    expect(createdProduct.images).toHaveLength(1);
    expect(createdProduct.tags).toHaveLength(2);

    // Verificar directamente en la BD
    const dbProduct = await prisma.product.findUnique({ where: { id: createdProduct.id } });
    expect(dbProduct).not.toBeNull();
  });

  it('debería obtener un producto por su ID', async () => {
    const foundProduct = await productService.getProductById(createdProduct.id);

    expect(foundProduct).not.toBeNull();
    expect(foundProduct?.id).toBe(createdProduct.id);
    expect(foundProduct?.name).toBe(productData.name);
  });

  it('debería lanzar un error si el ID del producto no existe', async () => {
    const nonExistentId = 'clxkj3b4k0000a4b2v3c8d9e9'; // ID inventado
    
    await expect(productService.getProductById(nonExistentId)).rejects.toThrow('Producto no encontrado');
  });

  it('debería obtener todos los productos', async () => {
    const result = await productService.getAllProducts({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    expect(result.products.length).toBeGreaterThanOrEqual(1);
    // Buscar el producto creado en los resultados
    const foundProduct = result.products.find(p => p.id === createdProduct.id);
    expect(foundProduct).toBeDefined();
    expect(result.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('debería actualizar un producto existente', async () => {
    const updateData = {
      name: 'Joya de Prueba Actualizada',
      price: 210.00,
    };

    const updatedProduct = await productService.updateProduct(createdProduct.id, updateData);

    expect(updatedProduct).toBeDefined();
    expect(updatedProduct.name).toBe(updateData.name);
    expect(updatedProduct.price).toBe(updateData.price);

    // Verificar directamente en la BD
    const dbProduct = await prisma.product.findUnique({ where: { id: createdProduct.id } });
    expect(dbProduct?.name).toBe(updateData.name);
  });

  it('debería eliminar un producto existente', async () => {
    await productService.deleteProduct(createdProduct.id);

    // Verificar directamente en la BD
    const dbProduct = await prisma.product.findUnique({ where: { id: createdProduct.id } });
    expect(dbProduct).toBeNull();
  });

});
