# Joyería Elegante - Backend API

Backend API para el sistema de gestión de joyería en oro laminado de Joyería Elegante.

## 🚀 Tecnologías

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Prisma** - ORM y gestión de base de datos
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Joi** - Validación de datos
- **Winston** - Logging
- **Cloudinary** - Gestión de imágenes

## 📋 Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/joyeria_elegante"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:5173"
# ... otras variables
```

4. **Configurar base de datos**
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener perfil actual
- `POST /api/auth/refresh` - Renovar token

### Productos
- `GET /api/products` - Listar productos (público)
- `GET /api/products/:id` - Obtener producto (público)
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Clientes
- `GET /api/customers` - Listar clientes (admin)
- `GET /api/customers/:id` - Obtener cliente (admin)
- `POST /api/customers` - Crear cliente (admin)
- `PUT /api/customers/:id` - Actualizar cliente (admin)
- `DELETE /api/customers/:id` - Eliminar cliente (admin)

### Pedidos
- `GET /api/orders` - Listar pedidos (admin)
- `GET /api/orders/:id` - Obtener pedido (admin/owner)
- `POST /api/orders` - Crear pedido (público)
- `PUT /api/orders/:id/status` - Actualizar estado (admin)

### Reseñas
- `GET /api/reviews` - Listar reseñas (admin)
- `POST /api/reviews` - Crear reseña (público)
- `PUT /api/reviews/:id/status` - Moderar reseña (admin)
- `POST /api/reviews/:id/response` - Responder reseña (admin)

### SEO
- `GET /api/seo` - Listar páginas SEO (admin)
- `POST /api/seo` - Crear página SEO (admin)
- `PUT /api/seo/:id` - Actualizar página SEO (admin)
- `DELETE /api/seo/:id` - Eliminar página SEO (admin)

### Inventario
- `GET /api/inventory` - Obtener inventario (admin)
- `PUT /api/inventory/:productId` - Actualizar stock (admin)

## 🔐 Autenticación

La API usa JWT para autenticación. Incluir el token en el header:

```
Authorization: Bearer <token>
```

### Roles de Usuario
- **CUSTOMER** - Cliente regular
- **MANAGER** - Gestor de tienda
- **ADMIN** - Administrador completo

## 📊 Base de Datos

### Esquema Principal

```
Users (autenticación)
├── UserProfiles (información personal)

Products (catálogo)
├── ProductImages (imágenes)
├── ProductTags (etiquetas)
├── Inventory (stock)
└── InventoryMovements (movimientos)

Customers (clientes)
├── CustomerAddresses (direcciones)
└── Orders (pedidos)
    └── OrderItems (productos del pedido)

Reviews (reseñas)
└── ReviewResponses (respuestas admin)

SEOPages (optimización SEO)
AuditLogs (auditoría)
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 📝 Logging

Los logs se guardan en:
- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los logs

En desarrollo también se muestran en consola.

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor desarrollo
npm run build        # Compilar TypeScript
npm run start        # Servidor producción
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Sincronizar esquema
npm run db:migrate   # Ejecutar migraciones
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Poblar base de datos
npm test             # Ejecutar tests
npm run lint         # Linter
npm run lint:fix     # Corregir lint
```

## 🚀 Despliegue

### Variables de Entorno Producción

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="secure-production-secret"
FRONTEND_URL="https://your-domain.com"
```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 📈 Monitoreo

- **Health Check**: `GET /health`
- **Logs**: Winston con rotación automática
- **Métricas**: Preparado para Prometheus

## 🔒 Seguridad

- Rate limiting (100 req/15min por IP)
- Helmet para headers de seguridad
- Validación de entrada con Joi
- Sanitización automática
- CORS configurado
- JWT con expiración

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte técnico, contactar a: dev@joyceriaelegante.com