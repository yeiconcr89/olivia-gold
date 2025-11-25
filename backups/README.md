# 🗄️ BACKUPS DE BASE DE DATOS - OLIVIA GOLD

Este directorio contiene todos los backups de la base de datos PostgreSQL del proyecto Olivia Gold.

## 📋 TIPOS DE BACKUP DISPONIBLES

### 1. Backup Completo SQL (`.sql`)
- **Formato**: Texto SQL plano
- **Contiene**: Estructura + Datos + Configuración
- **Tamaño**: ~67KB
- **Ventajas**: 
  - Legible por humanos
  - Compatible con cualquier versión de PostgreSQL
  - Fácil de editar si es necesario
- **Uso**: Restauración completa o migración entre sistemas

### 2. Backup Personalizado PostgreSQL (`.backup`)
- **Formato**: Binario comprimido de PostgreSQL
- **Contiene**: Estructura + Datos + Configuración
- **Tamaño**: ~69KB (comprimido nivel 9)
- **Ventajas**:
  - Más eficiente para restauraciones grandes
  - Permite restauración selectiva
  - Verificación de integridad integrada
- **Uso**: Restauración rápida y eficiente

### 3. Backup Solo Esquema (`.sql`)
- **Formato**: Texto SQL
- **Contiene**: Solo estructura (tablas, índices, constraints)
- **Tamaño**: ~40KB
- **Ventajas**:
  - Útil para recrear estructura sin datos
  - Ideal para entornos de desarrollo
- **Uso**: Configuración de nuevos ambientes

## 🔧 INSTRUCCIONES DE RESTAURACIÓN

### Método 1: Script Automatizado (Recomendado)
```bash
# Ejecutar el script interactivo
./restore_database.sh
```

### Método 2: Restauración Manual

#### Desde Backup SQL Completo:
```bash
# Restaurar backup completo
psql -h localhost -p 5432 -U yeiconcr -d postgres -f joyeria_elegante_backup_YYYYMMDD_HHMMSS.sql
```

#### Desde Backup Personalizado:
```bash
# Eliminar base de datos existente (¡CUIDADO!)
dropdb -h localhost -p 5432 -U yeiconcr joyeria_elegante

# Crear nueva base de datos
createdb -h localhost -p 5432 -U yeiconcr joyeria_elegante

# Restaurar datos
pg_restore -h localhost -p 5432 -U yeiconcr -d joyeria_elegante joyeria_elegante_backup_YYYYMMDD_HHMMSS.backup
```

#### Solo Esquema:
```bash
# Restaurar solo estructura
psql -h localhost -p 5432 -U yeiconcr -d postgres -f joyeria_elegante_schema_YYYYMMDD_HHMMSS.sql
```

## 📊 CONTENIDO DE LA BASE DE DATOS

### Tablas Principales:
- **users**: 1 registro (admin)
- **products**: 6 productos de joyería
- **customers**: 2 clientes de prueba
- **orders**: 2 órdenes de ejemplo
- **hero_slides**: 3 slides para carousel
- **reviews**: 3 reseñas de productos
- **seo_pages**: 2 páginas optimizadas
- **security_logs**: Logs de eventos de seguridad

### Datos de Prueba Incluidos:
- ✅ Usuario administrador configurado
- ✅ Catálogo de productos completo
- ✅ Clientes y órdenes de ejemplo
- ✅ Contenido SEO
- ✅ Configuración de hero slides

## 🔐 CREDENCIALES DE ACCESO

### Usuario Administrador:
- **Email**: admin@joyceriaelegante.com
- **Contraseña**: admin123
- **Rol**: ADMIN

### Clientes de Prueba:
- **María González**: maria.gonzalez@email.com
- **Carlos Rodríguez**: carlos.rodriguez@email.com

## ⚠️ CONSIDERACIONES IMPORTANTES

### Antes de Restaurar:
1. **Hacer backup actual** si tienes datos importantes
2. **Detener el servidor** backend para evitar conflictos
3. **Verificar conexiones** activas a la base de datos

### Después de Restaurar:
1. **Regenerar cliente Prisma**: `npm run db:generate`
2. **Verificar integridad**: `npm run db:studio`
3. **Reiniciar servidor**: `npm run dev`

## 🕐 INFORMACIÓN DE BACKUP

### Backup Creado:
- **Fecha**: $(date '+%Y-%m-%d %H:%M:%S')
- **Versión PostgreSQL**: 14.18 (Homebrew)
- **Versión Prisma**: 5.22.0
- **Total de Tablas**: 27 tablas
- **Total de Registros**: ~50+ registros

### Estructura Completa Incluida:
- ✅ Todos los ENUMs de Prisma
- ✅ Todas las tablas con datos
- ✅ Índices y constraints
- ✅ Relaciones foreign key
- ✅ Configuración de tipos personalizados

## 🔄 AUTOMATIZACIÓN

Para crear backups automáticos en el futuro:

```bash
# Backup completo
pg_dump -h localhost -p 5432 -U yeiconcr -d joyeria_elegante \
  --clean --create --if-exists \
  > "joyeria_elegante_backup_$(date +%Y%m%d_%H%M%S).sql"

# Backup comprimido
pg_dump -h localhost -p 5432 -U yeiconcr -d joyeria_elegante \
  --format=custom --compress=9 \
  --file="joyeria_elegante_backup_$(date +%Y%m%d_%H%M%S).backup"
```

## 📞 SOPORTE

Si encuentras problemas durante la restauración:

1. Verifica que PostgreSQL esté corriendo
2. Confirma permisos de usuario de base de datos
3. Revisa logs de error en la consola
4. Consulta la documentación de PostgreSQL

---

**🎯 Backup creado exitosamente - Sistema listo para restauración**