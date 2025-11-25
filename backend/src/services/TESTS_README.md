# ⚠️ IMPORTANTE - CONFIGURACIÓN DE PRUEBAS

## 🚨 ADVERTENCIA CRÍTICA

**NUNCA ejecutar pruebas sin verificar la configuración de base de datos**

### ✅ Base de Datos Correcta para Pruebas
```
DATABASE_URL="postgresql://yeiconcr@localhost:5432/joyeria_elegante_test?schema=public"
```

### ❌ Base de Datos REAL (NO USAR en pruebas)
```
DATABASE_URL="postgresql://yeiconcr@localhost:5432/joyeria_elegante?schema=public"
```

## 🔧 Comandos Seguros

### Para ejecutar pruebas:
```bash
npm test                    # Usa automáticamente la DB de pruebas
npm run test:setup         # Configura schema en DB de pruebas
npm run test:watch         # Modo watch con DB de pruebas
```

### Para desarrollo normal:
```bash
npm run dev                 # Usa la DB real
npm run db:seed            # Semilla en DB real
npm run db:studio          # Abre DB real
```

## 🛡️ Protecciones Implementadas

1. **test-setup.ts**: Verifica que se use DB de pruebas
2. **Variables de entorno separadas**: .env vs .env.test
3. **NODE_ENV=test**: Configuración automática
4. **Base de datos separada**: joyeria_elegante_test

## 📊 Estado Actual

- ✅ Base de datos real restaurada con seed completo
- ✅ Base de datos de pruebas configurada y separada
- ✅ Protecciones implementadas contra contaminación
- ✅ Scripts de prueba seguros configurados

## 🚨 En caso de emergencia

Si las pruebas contaminan la DB real nuevamente:

```bash
npm run db:fresh    # Resetea y resemilla la DB real
```