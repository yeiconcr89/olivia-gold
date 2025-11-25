# Guía de Deploy - Olivia Gold

## Estado de la aplicación ✅

La aplicación está lista para deploy con las siguientes características:

- ✅ Frontend (React + TypeScript + Vite) compilando correctamente
- ✅ Backend (Node.js + Express + Prisma) compilando correctamente  
- ✅ Base de datos PostgreSQL configurada
- ✅ Autenticación JWT implementada
- ✅ Sistema de productos, órdenes, clientes e inventario
- ✅ Panel de administración completo
- ✅ Configuración Docker lista

## Deploy con Docker (Recomendado)

### 1. Preparar variables de entorno
```bash
cp .env.docker .env
# Editar .env con valores reales
```

### 2. Iniciar servicios
```bash
docker-compose up -d
```

### 3. Migrar base de datos
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

## Deploy manual

### Backend
1. Configurar `.env` en `/backend/`
2. `npm install && npm run build`
3. `npx prisma migrate deploy`
4. `npm start`

### Frontend  
1. Configurar `.env.production`
2. `npm install && npm run build`
3. Servir carpeta `dist/` con nginx

## Variables de entorno requeridas

### Backend (.env)
- `DATABASE_URL` - URL de PostgreSQL
- `JWT_SECRET` - Clave secreta para JWT
- `FRONTEND_URL` - URL del frontend

### Frontend (.env.production)
- `VITE_API_URL` - URL del backend API
- `VITE_FRONTEND_URL` - URL del frontend

## Notas importantes

- La aplicación usa PostgreSQL como base de datos
- Requiere Node.js 18 o superior
- Incluye migraciones de Prisma para setup inicial
- Panel admin disponible en `/admin`
- API documentada implícitamente en los endpoints

## Próximos pasos opcionales

- Configurar dominio y SSL
- Setup de backup de base de datos
- Monitoring y logs
- CDN para assets estáticos