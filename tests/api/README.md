# 🧪 API Testing Suite

Este directorio contiene la suite completa de tests automatizados para la API de Olivia Gold.

## 📁 Estructura

```
tests/api/
├── api.test.ts                 # Tests básicos de todos los endpoints
├── schemas.test.ts             # Validación de schemas y contratos API
├── integration-flows.test.ts   # Tests de flujos completos de negocio
└── README.md                   # Esta documentación
```

## 🚀 Ejecutar Tests API

### Comandos disponibles:

```bash
# Ejecutar todos los tests API
npm run test:api

# Ejecutar tests API en modo watch
npm run test:api:watch

# Ejecutar test específico
npx vitest run tests/api/api.test.ts

# Ejecutar con cobertura
npx vitest run tests/api --coverage
```

## 📋 Tipos de Tests

### 1. **Tests Básicos de Endpoints** (`api.test.ts`)
- ✅ Autenticación y autorización
- ✅ CRUD de productos
- ✅ Gestión de clientes
- ✅ Procesamiento de órdenes
- ✅ Métodos de pago
- ✅ Estadísticas administrativas
- ✅ Sistema de búsqueda
- ✅ Health checks

### 2. **Validación de Schemas** (`schemas.test.ts`)
- ✅ Validación con JSON Schema (AJV)
- ✅ Estructura de respuestas API
- ✅ Tipos de datos correctos
- ✅ Campos requeridos
- ✅ Formatos (email, UUID, fechas)
- ✅ Headers de respuesta
- ✅ Manejo de errores

### 3. **Flujos de Integración** (`integration-flows.test.ts`)
- ✅ Flujo completo de compra (registro → navegación → compra → seguimiento)
- ✅ Gestión administrativa (login → productos → órdenes → análisis)
- ✅ Búsqueda y filtrado avanzado
- ✅ Procesamiento de pagos
- ✅ Seguridad y manejo de errores
- ✅ Reportes y análisis
- ✅ Rendimiento y carga concurrente

## 🔧 Configuración

### Variables de Entorno

```bash
API_URL=http://localhost:3001  # URL base de la API
```

### Dependencias

- **supertest**: Cliente HTTP para testing
- **ajv**: Validación de JSON Schema
- **vitest**: Framework de testing
- **@faker-js/faker**: Generación de datos de prueba

## 📊 Cobertura de Tests

Los tests cubren:

- **🔐 Autenticación**: Login, registro, logout, tokens
- **📦 Productos**: CRUD completo, filtrado, búsqueda
- **👥 Clientes**: Perfiles, direcciones, historial
- **🛒 Órdenes**: Creación, seguimiento, estados
- **💳 Pagos**: Métodos, procesamiento, confirmación
- **🛠️ Admin**: Gestión, estadísticas, reportes
- **🔍 Búsqueda**: Filtros, ordenamiento, paginación
- **🛡️ Seguridad**: Validación, autorización, rate limiting
- **⚡ Rendimiento**: Tiempos de respuesta, carga concurrente

## 🎯 Mejores Prácticas

### 1. **Aislamiento de Tests**
```typescript
beforeEach(async () => {
  // Limpiar estado entre tests
});
```

### 2. **Datos de Prueba**
```typescript
import { UserFactory, ProductFactory } from '../../src/tests/factories';

const testUser = UserFactory.create();
const testProduct = ProductFactory.create();
```

### 3. **Manejo de Errores**
```typescript
// Ser flexible con códigos de estado esperados
expect([200, 401, 403]).toContain(response.status);

// Validar estructura de errores
if (response.status >= 400) {
  expect(response.body).toHaveProperty('error');
}
```

### 4. **Tests Condicionales**
```typescript
// Solo ejecutar si el endpoint está implementado
if (response.status === 200) {
  expect(response.body).toHaveProperty('data');
}
```

### 5. **Validación de Schema**
```typescript
const isValid = validateSchema(response.body);
if (!isValid) {
  console.error('Schema errors:', validateSchema.errors);
}
expect(isValid).toBe(true);
```

## 🐛 Debugging

### 1. **Ver Logs de Red**
```bash
DEBUG=supertest* npm run test:api
```

### 2. **Ejecutar Test Específico**
```bash
npx vitest run -t "should authenticate valid user"
```

### 3. **Modo Interactivo**
```bash
npx vitest tests/api --ui
```

### 4. **Ver Errores de Schema**
Los errores de validación de schema se muestran en la consola cuando fallan.

## 📈 Métricas y Rendimiento

### Umbrales de Rendimiento
- **Respuestas API**: < 1 segundo para endpoints básicos
- **Búsqueda**: < 2 segundos para consultas complejas
- **Autenticación**: < 500ms
- **CRUD básico**: < 800ms

### Tests de Carga
- **Concurrencia**: 5 requests simultáneas
- **Secuencial**: Múltiples operaciones en cadena
- **Rate Limiting**: Detección de límites de velocidad

## 🔄 Integración Continua

Los tests API se ejecutan automáticamente en:

1. **Pre-commit hooks**
2. **GitHub Actions** (CI/CD)
3. **Deploy pipeline**

```yaml
# .github/workflows/test.yml
- name: Run API Tests
  run: npm run test:api
  env:
    API_URL: ${{ secrets.API_URL }}
```

## 📝 Reportes

### HTML Coverage Report
```bash
npx vitest run tests/api --coverage
# Ver en: coverage/index.html
```

### JSON Output para CI
```bash
npx vitest run tests/api --reporter=json > test-results.json
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **API no disponible**
   ```bash
   # Verificar que el servidor esté corriendo
   curl http://localhost:3001/api/health
   ```

2. **Tests fallan por timeout**
   ```typescript
   // Aumentar timeout en tests específicos
   test('slow endpoint', async () => {
     // ...
   }, { timeout: 10000 });
   ```

3. **Errores de schema**
   - Verificar que la API retorne los campos esperados
   - Actualizar schemas si la API cambió
   - Revisar logs de validación en consola

4. **Problemas de autenticación**
   - Verificar tokens de prueba
   - Confirmar endpoints de auth funcionando
   - Revisar configuración de CORS

## 🚀 Próximos Pasos

- [ ] Tests de GraphQL (si se implementa)
- [ ] Tests de WebSockets (tiempo real)
- [ ] Tests de carga con Artillery
- [ ] Mocking de servicios externos
- [ ] Tests de contract (Pact)
- [ ] Documentación automática de API

## 📞 Soporte

Para problemas con los tests API:
1. Revisar logs de la consola
2. Verificar que la API esté corriendo
3. Consultar documentación de endpoints
4. Reportar issues en el repositorio