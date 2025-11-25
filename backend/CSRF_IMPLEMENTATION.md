# 🔒 IMPLEMENTACIÓN DE PROTECCIÓN CSRF

## 📋 Resumen

Se ha implementado una protección CSRF robusta y moderna para proteger contra ataques Cross-Site Request Forgery.

## 🏗️ Arquitectura

### Backend
- **Middleware personalizado**: `/src/middleware/csrf.ts`
- **Generación de tokens**: Basada en secret de sesión + timestamp
- **Verificación temporal**: Tokens válidos por 1 hora con ventana deslizante
- **Rutas exentas**: Health checks, webhooks, OAuth callbacks

### Frontend
- **Hook personalizado**: `/src/hooks/useCsrf.ts`
- **Contexto global**: `/src/contexts/CsrfContext.tsx`
- **Fetch wrapper**: Incluye automáticamente tokens CSRF

## 🔧 Configuración

### Activación por Ambiente
```typescript
// Solo activo en producción por defecto
if (config.nodeEnv === 'production') {
  app.use(csrfProtection());
  app.use(csrfTokenGenerator());
}
```

### Opciones de Configuración
```typescript
const options = {
  secretLength: 18,        // Longitud del secret base
  tokenLength: 8,          // Longitud del token generado
  headerName: 'x-csrf-token',
  cookieName: 'csrf-token',
  sessionKey: 'csrfSecret',
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
};
```

## 📝 Uso en Frontend

### Hook básico
```typescript
import { useCsrf } from '../hooks/useCsrf';

const { token, csrfFetch, addCsrfToHeaders } = useCsrf();

// Fetch con protección automática
const response = await csrfFetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify(orderData)
});
```

### Con contexto global
```typescript
import { useCsrfContext } from '../contexts/CsrfContext';

const { getCurrentToken, csrfFetch } = useCsrfContext();
```

### Headers manuales
```typescript
const headers = addCsrfToHeaders({
  'Content-Type': 'application/json'
});
```

## 🛡️ Características de Seguridad

### Generación de Tokens
- **Base criptográfica**: SHA-256 con secret + timestamp
- **Rotación temporal**: Nuevos tokens cada 10 minutos
- **Ventana de validez**: 1 hora con múltiples tokens válidos

### Protección de Cookies
```typescript
// Producción
res.cookie('csrf-token', token, {
  httpOnly: false,  // Accesible desde JS
  secure: true,     // Solo HTTPS
  sameSite: 'strict'
});

// Desarrollo
res.cookie('csrf-token', token, {
  httpOnly: false,
  secure: false,
  sameSite: 'lax'
});
```

### Logging de Seguridad
```typescript
logger.warn('CSRF token verification failed', {
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  path: req.path,
  method: req.method,
  hasToken: !!token,
  timestamp: new Date().toISOString()
});
```

## 🔀 Rutas Exentas

Las siguientes rutas están exentas de protección CSRF:
- `/api/health` - Health checks
- `/api/webhooks/*` - Webhooks de terceros
- `/api/auth/google/callback` - OAuth callbacks
- `/api/payments/webhook` - Payment webhooks

## 🧪 Testing

### Desarrollo
- CSRF deshabilitado por defecto en desarrollo
- Advertencia en consola cuando está deshabilitado
- Fácil activación para testing: `NODE_ENV=production`

### Producción
- CSRF siempre activo
- Tokens requeridos en todos los métodos POST/PUT/DELETE
- Fallback automático si token expira

## 🚨 Manejo de Errores

### Error 403 - Token Inválido
```json
{
  "error": "Token CSRF inválido",
  "code": "CSRF_TOKEN_INVALID"
}
```

### Frontend - Reintento Automático
```typescript
// Si falla por token inválido, obtener nuevo token y reintentar
if (response.status === 403 && requiresToken) {
  const newToken = await fetchCsrfToken();
  if (newToken) {
    return fetch(url, { ...options, headers: newHeaders });
  }
}
```

## 📊 Monitoreo

### Métricas a Monitorear
- Fallos de verificación CSRF por IP
- Patrones de ataques (múltiples fallos)
- Rendimiento de generación de tokens
- Uso de rutas exentas

### Logs de Seguridad
```bash
# Buscar intentos de CSRF
grep "CSRF token verification failed" logs/combined.log

# Analizar patrones por IP
grep "CSRF" logs/combined.log | jq '.ip' | sort | uniq -c
```

## 🔄 Integración con Sistema Existente

### AuthContext
```typescript
// Agregar CsrfProvider en App.tsx
<CsrfProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</CsrfProvider>
```

### API Calls Existentes
- Todos los hooks existentes (`useOrders`, `useProducts`, etc.) deben actualizarse
- Usar `csrfFetch` en lugar de `fetch` nativo
- Aplicar interceptor a axios si se usa

## 🔧 Mantenimiento

### Rotación de Secrets
```bash
# Generar nuevos secrets
openssl rand -base64 32

# Actualizar en .env
SESSION_SECRET="nuevo-secret-seguro"
```

### Troubleshooting
1. **Token no encontrado**: Verificar cookies y headers
2. **Token expirado**: Implementar refresh automático
3. **Rutas bloqueadas**: Agregar a lista de exentas si necesario

## ✅ Checklist de Implementación

- [x] Middleware CSRF implementado
- [x] Configuración por ambiente
- [x] Hook de frontend creado
- [x] Contexto global configurado
- [x] Logging de seguridad
- [x] Manejo de errores
- [x] Documentación completa
- [ ] Tests unitarios
- [ ] Integración con hooks existentes
- [ ] Monitoreo configurado

## 🚀 Próximos Pasos

1. **Integrar con hooks existentes** (`useOrders`, `useProducts`)
2. **Escribir tests unitarios** para middleware y hook
3. **Configurar monitoreo** de fallos CSRF
4. **Documentar troubleshooting** común
5. **Training del equipo** en uso correcto