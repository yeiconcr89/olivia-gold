# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## Descripción del Proyecto

Este es "Olivia Gold" - una aplicación e-commerce full-stack para una joyería especializada en joyas de oro laminado. El proyecto consiste en:

- **Frontend**: Aplicación React + TypeScript + Vite con Tailwind CSS
- **Backend**: API Node.js + Express + TypeScript con Prisma ORM
- **Base de datos**: PostgreSQL con esquema completo de e-commerce
- **Despliegue**: Configuración Docker Compose con nginx

## Comandos de Desarrollo

### Frontend (Directorio Raíz)
```bash
npm run dev          # Iniciar servidor de desarrollo (Vite)
npm run build        # Construir para producción
npm run lint         # Ejecutar ESLint
npm run preview      # Vista previa del build de producción
```

### Backend (./backend)
```bash
npm run dev          # Iniciar servidor de desarrollo con hot reload
npm run build        # Compilar TypeScript a JavaScript
npm run start        # Iniciar servidor de producción
npm run test         # Ejecutar pruebas con Jest
npm run test:watch   # Ejecutar pruebas en modo watch
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir problemas de ESLint automáticamente
```

### Operaciones de Base de Datos (./backend)
```bash
npm run db:generate  # Generar cliente de Prisma
npm run db:push      # Enviar cambios del esquema a la base de datos
npm run db:migrate   # Ejecutar migraciones de base de datos
npm run db:studio    # Abrir Prisma Studio (GUI de base de datos)
npm run db:seed      # Poblar base de datos con datos iniciales (idempotente)
npm run db:seed:seo  # Poblar datos SEO específicamente
npm run db:clean     # Limpiar datos duplicados existentes
npm run db:reset     # ELIMINAR TODOS los datos (uso con precaución)
npm run db:fresh     # Reset completo + seed (útil para desarrollo)
```

### Despliegue con Docker
```bash
docker-compose up -d  # Iniciar todos los servicios en modo detached
docker-compose down   # Detener todos los servicios
```

## Arquitectura y Estructura

### Arquitectura del Frontend
- **React Router** para navegación con rutas protegidas de administrador
- **Context API** para manejo de estado (Auth, Cart)
- **Custom hooks** en `/src/hooks/` para obtención de datos y lógica de negocio
- **Jerarquía de componentes**: Layouts → Pages → Components → UI Elements
- **Diseño responsivo** con Tailwind CSS y enfoque mobile-first

### Arquitectura del Backend
- **Servidor Express.js** con TypeScript
- **Stack de middleware**: Autenticación, validación (Zod), rate limiting, CORS
- **Organización basada en rutas** en `/src/routes/`
- **Prisma ORM** con base de datos PostgreSQL
- **Autenticación JWT** con control de acceso basado en roles
- **Subida de archivos** via integración con Cloudinary
- **Logging** con Winston (consola + archivo)

### Esquema de Base de Datos
El esquema de Prisma incluye entidades completas de e-commerce:
- **Usuarios y Autenticación**: Usuarios, perfiles, tokens de restablecimiento de contraseña
- **Productos**: Productos, imágenes, etiquetas, seguimiento de inventario
- **Pedidos**: Pedidos, elementos de pedido, direcciones de envío
- **Clientes**: Gestión de clientes, direcciones, historial de compras
- **Reseñas**: Reseñas de productos con moderación de administrador
- **SEO**: Seguimiento de optimización SEO a nivel de página
- **Auditoría**: Logs de auditoría del sistema para cumplimiento

### Características Principales
- **Sistema multi-rol**: Roles Admin, Manager, Customer
- **Gestión de inventario**: Seguimiento de stock con historial de movimientos
- **Gestión de clientes**: Perfiles detallados de clientes y analíticas de compras
- **Sistema de reseñas**: Reseñas de clientes con flujo de aprobación de administrador
- **Optimización SEO**: Herramientas integradas de seguimiento y optimización SEO
- **Analíticas**: Seguimiento de pedidos, analíticas de clientes, reportes de ventas

## Notas Importantes

### Flujo de Autenticación
- Tokens JWT para manejo de sesiones
- Protección de rutas basada en roles (rutas de Admin requieren rol ADMIN/MANAGER)
- Restablecimiento de contraseña via tokens de email
- Verificación de email para nuevos usuarios

### Subida de Archivos
- Imágenes subidas a Cloudinary
- Soporte para imágenes de productos, avatares de usuario
- Validación de tipo de archivo y límites de tamaño aplicados

### Variables de Entorno
El backend requiere estas variables de entorno clave:
- `DATABASE_URL`: String de conexión PostgreSQL
- `JWT_SECRET`: Secreto para firma de tokens JWT
- `CLOUDINARY_*`: Configuración de Cloudinary para subida de imágenes
- `NODE_ENV`: Entorno (development/production)

### Admin Panel Access
Para acceder al panel de administración:
- **URL**: `http://localhost:5173/admin` (en desarrollo)
- **Credenciales por defecto**:
  - Email: `admin@joyceriaelegante.com`
  - Password: `admin123`
- **Configuración inicial**: Ejecutar `npm run db:seed` desde el directorio backend

### Autenticación Google OAuth
Se implementó login con Google además del tradicional email/contraseña:
- **Frontend**: Botón de Google en LoginModal usando Google Sign-In API
- **Backend**: Configuración completa de Passport Google OAuth
- **Base de datos**: Campo `googleId` agregado al modelo User
- **Rutas**: `/api/auth/google` y `/api/auth/google/callback` para OAuth flow
- **Variables de entorno**: Configuración de Google Client ID y Secret

### Correcciones Aplicadas (Julio 2025)
Se corrigieron los siguientes problemas críticos:
1. **Tipos de Usuario**: Actualizado interface User para coincidir con respuesta del backend (con profile anidado)
2. **Proxy de Vite**: Configurado proxy para redirigir `/api/*` al backend en puerto 3001
3. **AdminDashboard**: Restaurado AdminDashboard original completo con todas las funcionalidades
4. **Rutas Admin**: Verificada protección de rutas y autenticación JWT
5. **Importaciones**: Corregida ruta de importación en Footer.tsx
6. **Google OAuth**: Implementado login dual (email + Google) para clientes

### Pruebas
- El backend usa Jest para pruebas unitarias/integración
- Framework de pruebas del frontend aún no configurado
- Seeding de base de datos disponible para configuración de datos de prueba

### Despliegue en Producción
- Configuración Docker Compose incluye PostgreSQL, backend y frontend nginx
- Variables de entorno configuradas via archivo `.env`
- Migraciones de base de datos se ejecutan automáticamente en el despliegue