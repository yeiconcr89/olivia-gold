# Documentación de Base de Datos - Olivia Gold

## Estado Actual de la Base de Datos

### Esquema Actualizado
La base de datos está completamente documentada en `/backend/prisma/schema.prisma` con las siguientes entidades principales:

## 📊 Estructura de Tablas

### 🔐 Usuarios y Autenticación
- **users**: Información básica de usuarios (email, password, role, googleId)
- **user_profiles**: Perfiles detallados (nombre, teléfono, avatar, preferencias)
- **password_reset_tokens**: Tokens para restablecimiento de contraseña
- **email_verification_tokens**: Tokens para verificación de email

### 🛍️ Productos
- **products**: Información de productos (nombre, precio, categoría, descripción)
- **product_images**: Imágenes de productos con orden y flag de imagen principal
- **product_tags**: Etiquetas de productos para mejor búsqueda
- **inventory**: Control de inventario (cantidad, reservado, mínimo, máximo)
- **inventory_movements**: Historial de movimientos de inventario

### 👥 Clientes
- **customers**: Información detallada de clientes (estado VIP, total gastado, preferencias)
- **customer_addresses**: Direcciones de envío de clientes

### 📦 Pedidos
- **orders**: Pedidos con información completa (estado, pago, envío, tracking)
- **order_items**: Items individuales de cada pedido
- **shipping_addresses**: Direcciones de envío específicas por pedido
- **order_tracking**: Seguimiento detallado de pedidos
- **shipping_methods**: Métodos de envío disponibles

### 🛒 Carrito de Compras
- **carts**: Carritos por sesión o usuario
- **cart_items**: Items en el carrito con personalización

### 🎫 Promociones
- **coupons**: Cupones de descuento con reglas y límites

### ⭐ Reviews
- **reviews**: Reseñas de productos con moderación
- **review_responses**: Respuestas oficiales a reseñas

### 🎨 Contenido
- **hero_slides**: Slides del carrusel principal
- **seo_pages**: Optimización SEO por página

### 🔔 Notificaciones
- **notifications**: Sistema de notificaciones por email/SMS

### 🔍 Auditoría
- **audit_logs**: Registro completo de cambios en el sistema

## 🌱 Estado del Seed

### ✅ Datos Actualizados (Agosto 2025)
El archivo `/backend/src/scripts/seed.ts` contiene:

1. **Usuario Administrador**
   - Email: admin@joyceriaelegante.com
   - Password: admin123 (hasheado con bcrypt)
   - Rol: ADMIN
   - Perfil completo con teléfono

2. **Productos de Ejemplo (6 productos)**
   - Collar Veneciano Premium
   - Anillo Solitario Diamante  
   - Pulsera Tenis Brillante
   - Aretes Perla Clásicos
   - Conjunto Romántico Corazón
   - Reloj Elegante Dorado

3. **Clientes de Ejemplo**
   - María González (VIP)
   - Carlos Rodríguez (ACTIVE)

4. **Páginas SEO**
   - Página principal optimizada
   - Página de collares con mejoras pendientes

### 🚨 Problemas Identificados

#### 1. Datos Hardcodeados en Frontend
**Archivo**: `/src/data/products.ts`
- **Problema**: Productos duplicados entre seed y frontend
- **Impacto**: Inconsistencia entre datos reales y mock data
- **Solución**: Eliminar este archivo y usar solo datos de API

#### 2. Categorías Hardcodeadas
**Archivos**: 
- `/src/components/Header.tsx` (líneas 43-51)
- `/src/components/ProductForm.tsx`
- `/src/data/products.ts` (líneas 126-133)

**Problema**: Categorías definidas en múltiples lugares
**Solución**: Centralizar en base de datos o archivo de configuración

#### 3. Hero Slides Inconsistente
- Hay un script SQL manual: `/backend/insert-hero-slides.sql`
- No está integrado en el seed principal
- Datos pueden estar desactualizados

## 🛠️ Mejoras Recomendadas

### 1. Actualizar Seed Complete
```bash
cd backend
npm run db:fresh  # Reset completo + seed actualizado
```

### 2. Crear Tabla de Configuración
Agregar al schema:
```prisma
model AppConfig {
  id    String @id @default(cuid())
  key   String @unique
  value Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3. Centralizar Categorías
- Mover categorías a base de datos o archivo de configuración
- Crear endpoint `/api/categories`
- Actualizar componentes para usar datos dinámicos

### 4. Eliminar Datos Mock
- Eliminar `/src/data/products.ts`
- Verificar que todos los componentes usan `useProducts` hook
- Asegurar que no hay productos hardcodeados

### 5. Documentar Relaciones
- Todas las tablas tienen foreign keys correctas
- Indexes optimizados para consultas frecuentes
- Cascade deletes configurados apropiadamente

## 📈 Datos de Producción Recomendados

### Categorías Oficiales
```json
[
  {"id": "collares", "name": "Collares", "description": "Collares elegantes en oro laminado"},
  {"id": "anillos", "name": "Anillos", "description": "Anillos de compromiso y moda"},
  {"id": "pulseras", "name": "Pulseras", "description": "Pulseras delicadas y statement"},
  {"id": "aretes", "name": "Aretes", "description": "Aretes para toda ocasión"},
  {"id": "conjuntos", "name": "Conjuntos", "description": "Sets coordinados"},
  {"id": "relojes", "name": "Relojes", "description": "Relojes elegantes"}
]
```

### Hero Slides Recomendados
1. Slide principal: Nueva colección
2. Slide promocional: Envío gratis
3. Slide de temporada: Ofertas especiales

## 🔍 Verificación de Integridad

### Comandos de Verificación
```bash
# Verificar estructura
npx prisma db pull

# Verificar seed
npm run db:seed

# Verificar datos
npm run db:studio
```

### Queries de Verificación
```sql
-- Verificar productos sin imágenes
SELECT * FROM products WHERE id NOT IN (SELECT DISTINCT productId FROM product_images);

-- Verificar inventario sin productos
SELECT * FROM inventory WHERE productId NOT IN (SELECT id FROM products);

-- Verificar usuarios sin perfil
SELECT * FROM users WHERE id NOT IN (SELECT userId FROM user_profiles);
```

## ✅ Estado de Completitud

| Tabla | Documentada | Seed Actualizado | Datos de Prueba | Estado |
|-------|-------------|------------------|----------------|---------|
| users | ✅ | ✅ | ✅ | Completo |
| products | ✅ | ✅ | ✅ | Completo |
| customers | ✅ | ✅ | ✅ | Completo |
| orders | ✅ | ❌ | ❌ | Pendiente |
| hero_slides | ✅ | ❌ | ❌ | Pendiente |
| seo_pages | ✅ | ✅ | ✅ | Completo |
| reviews | ✅ | ❌ | ❌ | Pendiente |
| coupons | ✅ | ❌ | ❌ | Pendiente |

## 🎯 Próximos Pasos

1. **Inmediato**: Eliminar datos hardcodeados del frontend
2. **Corto plazo**: Completar seed con todos los datos necesarios
3. **Mediano plazo**: Crear sistema de configuración dinámico
4. **Largo plazo**: Implementar migrations para datos de producción

---
*Última actualización: Agosto 2025*
*Mantenido por: Equipo de desarrollo Olivia Gold*