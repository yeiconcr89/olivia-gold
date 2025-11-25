#!/bin/bash

# ============================================================================
# SCRIPT DE RESTAURACIÓN DE BASE DE DATOS - OLIVIA GOLD
# ============================================================================
# Este script permite restaurar la base de datos desde los backups creados
# Autor: Sistema de Backup Automatizado
# Fecha: $(date +%Y-%m-%d)

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="yeiconcr"
DB_NAME="joyeria_elegante"
BACKUP_DIR="$(dirname "$0")"

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_title() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
}

# Función para verificar prerequisitos
check_prerequisites() {
    print_title "VERIFICANDO PREREQUISITOS"
    
    # Verificar que PostgreSQL esté corriendo
    if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
        print_error "PostgreSQL no está corriendo en $DB_HOST:$DB_PORT"
        exit 1
    fi
    print_message "PostgreSQL está corriendo ✓"
    
    # Verificar que los archivos de backup existan
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Directorio de backups no encontrado: $BACKUP_DIR"
        exit 1
    fi
    print_message "Directorio de backups encontrado ✓"
}

# Función para listar backups disponibles
list_backups() {
    print_title "BACKUPS DISPONIBLES"
    echo
    echo "Archivos SQL (formato texto):"
    ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null | grep -v schema || echo "  No hay backups SQL disponibles"
    echo
    echo "Archivos BACKUP (formato personalizado PostgreSQL):"
    ls -lh "$BACKUP_DIR"/*.backup 2>/dev/null || echo "  No hay backups personalizados disponibles"
    echo
    echo "Archivos SCHEMA (solo estructura):"
    ls -lh "$BACKUP_DIR"/*schema*.sql 2>/dev/null || echo "  No hay backups de esquema disponibles"
    echo
}

# Función para restaurar desde backup SQL
restore_from_sql() {
    local backup_file="$1"
    
    print_title "RESTAURANDO DESDE BACKUP SQL"
    print_message "Archivo: $backup_file"
    
    print_warning "ATENCIÓN: Esto eliminará todos los datos existentes en la base de datos"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Operación cancelada"
        exit 0
    fi
    
    print_message "Restaurando base de datos..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f "$backup_file"
    
    print_message "Restauración completada ✓"
}

# Función para restaurar desde backup personalizado
restore_from_custom() {
    local backup_file="$1"
    
    print_title "RESTAURANDO DESDE BACKUP PERSONALIZADO"
    print_message "Archivo: $backup_file"
    
    print_warning "ATENCIÓN: Esto eliminará todos los datos existentes en la base de datos"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Operación cancelada"
        exit 0
    fi
    
    # Terminar conexiones existentes
    print_message "Terminando conexiones existentes..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" || true
    
    # Eliminar base de datos existente
    print_message "Eliminando base de datos existente..."
    dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER --if-exists $DB_NAME
    
    # Crear nueva base de datos
    print_message "Creando nueva base de datos..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    
    # Restaurar datos
    print_message "Restaurando datos..."
    pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --verbose "$backup_file"
    
    print_message "Restauración completada ✓"
}

# Función para restaurar solo esquema
restore_schema_only() {
    local backup_file="$1"
    
    print_title "RESTAURANDO SOLO ESQUEMA"
    print_message "Archivo: $backup_file"
    
    print_warning "ATENCIÓN: Esto recreará toda la estructura de la base de datos"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Operación cancelada"
        exit 0
    fi
    
    print_message "Restaurando esquema..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f "$backup_file"
    
    print_message "Restauración de esquema completada ✓"
}

# Función para verificar restauración
verify_restoration() {
    print_title "VERIFICANDO RESTAURACIÓN"
    
    # Verificar conexión
    if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "No se puede conectar a la base de datos restaurada"
        exit 1
    fi
    print_message "Conexión a base de datos restaurada ✓"
    
    # Contar tablas
    local table_count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    print_message "Tablas encontradas: $table_count"
    
    # Verificar tablas principales
    local main_tables=("users" "products" "orders" "customers")
    for table in "${main_tables[@]}"; do
        local count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "0")
        print_message "Registros en $table: $count"
    done
}

# Función principal
main() {
    print_title "SCRIPT DE RESTAURACIÓN - OLIVIA GOLD"
    
    check_prerequisites
    list_backups
    
    echo "Opciones de restauración:"
    echo "1) Restaurar desde backup SQL completo (recomendado)"
    echo "2) Restaurar desde backup personalizado PostgreSQL"
    echo "3) Restaurar solo esquema (sin datos)"
    echo "4) Salir"
    echo
    
    read -p "Selecciona una opción (1-4): " choice
    
    case $choice in
        1)
            echo
            echo "Backups SQL disponibles:"
            select backup_file in "$BACKUP_DIR"/*.sql; do
                if [[ -f "$backup_file" && "$backup_file" != *"schema"* ]]; then
                    restore_from_sql "$backup_file"
                    verify_restoration
                    break
                else
                    print_error "Selección inválida"
                fi
            done
            ;;
        2)
            echo
            echo "Backups personalizados disponibles:"
            select backup_file in "$BACKUP_DIR"/*.backup; do
                if [[ -f "$backup_file" ]]; then
                    restore_from_custom "$backup_file"
                    verify_restoration
                    break
                else
                    print_error "Selección inválida"
                fi
            done
            ;;
        3)
            echo
            echo "Backups de esquema disponibles:"
            select backup_file in "$BACKUP_DIR"/*schema*.sql; do
                if [[ -f "$backup_file" ]]; then
                    restore_schema_only "$backup_file"
                    verify_restoration
                    break
                else
                    print_error "Selección inválida"
                fi
            done
            ;;
        4)
            print_message "Saliendo..."
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            exit 1
            ;;
    esac
    
    print_title "RESTAURACIÓN COMPLETADA EXITOSAMENTE"
    print_message "La base de datos ha sido restaurada correctamente"
    print_message "Puedes verificar el estado ejecutando: npm run db:studio"
}

# Ejecutar función principal si el script se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi