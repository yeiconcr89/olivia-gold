# Olivia Gold - Panel de Administración

Este proyecto contiene el panel de administración para la tienda en línea Olivia Gold, especializada en joyería de oro laminado.

## Características

- Gestión completa de productos
- Gestión de inventario
- Gestión de pedidos
- Gestión de clientes
- Sistema de reseñas
- Analíticas y reportes
- Gestión de SEO
- Integración con Cloudinary para imágenes

## Requisitos previos

- Node.js 18.x o superior
- PostgreSQL 14.x o superior
- Cuenta en Cloudinary para almacenamiento de imágenes

## Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd olivia-gold
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..
```

### 3. Configurar variables de entorno

#### Frontend (.env.local)

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```
VITE_API_URL=http://localhost:3001
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

#### Backend (.env)

Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/olivia_gold?schema=public"

# JWT
JWT_SECRET="una-clave-secreta-larga-y-segura"
JWT_EXPIRES_IN=7d

# Servidor
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (para recuperación de contraseña)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Session
SESSION_SECRET=una-clave-secreta-para-sesiones
```

### 4. Configurar la base de datos

```bash
cd backend

# Generar el cliente de Prisma
npm run db:generate

# Aplicar migraciones
npm run db:push

# Poblar la base de datos con datos iniciales
npm run db:seed
```

### 5. Configurar Cloudinary

Sigue las instrucciones en [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) para configurar Cloudinary correctamente.

## Ejecución

### Desarrollo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Producción

```bash
# Construir el frontend
npm run build

# Construir el backend
cd backend
npm run build

# Iniciar el backend en producción
npm start
```

## Estructura del proyecto

```
/
├── backend/                # API y lógica del servidor
│   ├── prisma/             # Esquema de la base de datos y migraciones
│   └── src/                # Código fuente del backend
│       ├── config/         # Configuración
│       ├── middleware/     # Middleware de Express
│       ├── routes/         # Rutas de la API
│       ├── scripts/        # Scripts de utilidad
│       └── utils/          # Utilidades
├── public/                 # Archivos estáticos
└── src/                    # Código fuente del frontend
    ├── components/         # Componentes React
    ├── context/            # Contextos de React
    ├── hooks/              # Hooks personalizados
    └── types/              # Definiciones de tipos TypeScript
```

## Panel de Administrador

### Acceso

El panel de administrador está disponible en la ruta `/admin`. Para acceder, necesitas iniciar sesión con una cuenta que tenga rol de `ADMIN` o `MANAGER`.

### Secciones principales

1. **Dashboard**: Resumen general y estadísticas
2. **Productos**: Gestión completa de productos
3. **Inventario**: Control de stock
4. **Pedidos**: Gestión de pedidos de clientes
5. **Clientes**: Gestión de clientes
6. **Reseñas**: Gestión de reseñas de productos
7. **Analíticas**: Reportes y estadísticas
8. **SEO**: Gestión de metadatos para SEO
9. **Cloudinary**: Configuración y estadísticas de almacenamiento de imágenes

## Contribución

1. Crea un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.