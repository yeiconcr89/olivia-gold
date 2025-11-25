# 🛡️ Protección de Base de Datos

Este documento explica cómo está configurado el proyecto para proteger la base de datos de desarrollo de ser afectada por los tests.

## 📊 Configuración de Bases de Datos

### Base de Datos de Desarrollo
- **Archivo**: `.env`
- **URL**: `postgresql://yeiconcr@localhost:5432/joyeria_elegante_dev`
- **Propósito**: Datos de desarrollo que se mantienen entre sesiones

### Base de Datos de Test
- **Archivo**: `.env.test`
- **URL**: `postgresql://yeiconcr@localhost:5432/joyeria_elegante_test`
- **Propósito**: Datos temporales que se limpian en cada test

## 🛡️ Mecanismos de Protección

### 1. Validación de Entorno
```bash
npm run test:validate
```
- Verifica que los tests usen la base de datos correcta
- Previene el uso accidental de la base de datos de desarrollo

### 2. Scripts de Protección
- `validate-test-db.ts`: Valida configuración antes de tests
- `protect-dev-db.ts`: Protección adicional en operaciones críticas
- `env.setup.js`: Configuración automática de entorno de test

### 3. Validaciones Automáticas
- Los tests fallan si no detectan una base de datos de test
- Verificación de nombres de base de datos
- Validación de URLs diferentes entre entornos

## 🚀 Comandos Seguros

### Para Desarrollo
```bash
npm run dev          # Usa base de datos de desarrollo
npm run db:seed      # Pobla base de datos de desarrollo
npm run db:studio    # Abre Prisma Studio en desarrollo
```

### Para Testing
```bash
npm run test         # Usa base de datos de test (con validación)
npm run test:watch   # Tests en modo watch (protegido)
npm run test:clean   # Limpia y prepara base de datos de test
```

## ⚠️ Señales de Alerta

Si ves estos mensajes, **DETENTE INMEDIATAMENTE**:

```
❌ PELIGRO: Modo test detectado pero no se está usando base de datos de test!
❌ PELIGRO: Intentando usar base de datos de desarrollo en tests!
🚨 OPERACIÓN CANCELADA PARA PROTEGER DATOS DE DESARROLLO
```

## 🔧 Solución de Problemas

### Error: "Base de datos no parece ser de test"
1. Verifica que `.env.test` existe
2. Confirma que `DATABASE_URL` en `.env.test` contiene "test"
3. Ejecuta `npm run test:validate` para diagnóstico

### Error: "DATABASE_URL no está definida"
1. Copia `.env.example` a `.env.test`
2. Actualiza la URL de base de datos para incluir "test"
3. Verifica que las credenciales son correctas

### Tests fallan por base de datos
1. Ejecuta `npm run test:clean` para resetear base de datos de test
2. Verifica que PostgreSQL está corriendo
3. Confirma que la base de datos de test existe

## 📋 Checklist de Seguridad

Antes de ejecutar tests, verifica:

- [ ] Archivo `.env.test` existe y está configurado
- [ ] Base de datos de test tiene "test" en el nombre
- [ ] URLs de desarrollo y test son diferentes
- [ ] `npm run test:validate` pasa sin errores
- [ ] No hay datos importantes en la base de datos de test

## 🆘 Recuperación de Datos

Si accidentalmente afectas la base de datos de desarrollo:

1. **Detén todos los procesos inmediatamente**
2. Verifica el backup más reciente en `backups/`
3. Restaura desde backup si es necesario
4. Ejecuta `npm run db:seed` para repoblar datos básicos
5. Revisa la configuración para prevenir futuros incidentes

## 📞 Contacto

Si tienes dudas sobre la configuración de base de datos o necesitas ayuda con la recuperación de datos, contacta al equipo de desarrollo.