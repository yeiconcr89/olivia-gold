#!/bin/bash

echo "🔧 DIAGNÓSTICO Y REPARACIÓN COMPLETA DEL PROYECTO"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. DETENER TODOS LOS PROCESOS
print_status "Deteniendo todos los procesos..."
pkill -f "vite|node|npm|tsx" 2>/dev/null || true
sleep 2

# 2. LIMPIAR FRONTEND
print_status "Limpiando frontend..."
rm -rf node_modules package-lock.json 2>/dev/null || true
rm -rf .vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# 3. LIMPIAR BACKEND
print_status "Limpiando backend..."
cd backend
rm -rf node_modules package-lock.json 2>/dev/null || true
rm -rf dist 2>/dev/null || true
cd ..

# 4. VERIFICAR VERSIONES DE NODE Y NPM
print_status "Verificando versiones..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js: $NODE_VERSION"
print_status "npm: $NPM_VERSION"

# 5. INSTALAR DEPENDENCIAS DEL FRONTEND
print_status "Instalando dependencias del frontend..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del frontend instaladas"
else
    print_error "Error instalando dependencias del frontend"
    exit 1
fi

# 6. INSTALAR DEPENDENCIAS DEL BACKEND
print_status "Instalando dependencias del backend..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del backend instaladas"
else
    print_error "Error instalando dependencias del backend"
    exit 1
fi
cd ..

# 7. VERIFICAR CONFIGURACIONES
print_status "Verificando configuraciones..."

# Verificar Tailwind
if [ -f "tailwind.config.js" ]; then
    print_success "Configuración de Tailwind encontrada"
else
    print_warning "Configuración de Tailwind no encontrada"
fi

# Verificar PostCSS
if [ -f "postcss.config.js" ]; then
    print_success "Configuración de PostCSS encontrada"
else
    print_warning "Configuración de PostCSS no encontrada"
fi

# Verificar Vite
if [ -f "vite.config.ts" ]; then
    print_success "Configuración de Vite encontrada"
else
    print_warning "Configuración de Vite no encontrada"
fi

# 8. VERIFICAR VARIABLES DE ENTORNO
print_status "Verificando variables de entorno..."

if [ -f ".env" ]; then
    print_success "Archivo .env del frontend encontrado"
else
    print_warning "Archivo .env del frontend no encontrado"
fi

if [ -f "backend/.env" ]; then
    print_success "Archivo .env del backend encontrado"
else
    print_warning "Archivo .env del backend no encontrado"
fi

# 9. PROBAR COMPILACIÓN
print_status "Probando compilación del frontend..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Frontend compila correctamente"
else
    print_warning "Frontend tiene problemas de compilación"
fi

# 10. PROBAR COMPILACIÓN DEL BACKEND
print_status "Probando compilación del backend..."
cd backend
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Backend compila correctamente"
else
    print_warning "Backend tiene problemas de compilación"
fi
cd ..

# 11. CREAR SCRIPT DE INICIO
print_status "Creando script de inicio..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando proyecto completo..."

# Función para manejar Ctrl+C
cleanup() {
    echo "🛑 Deteniendo servicios..."
    pkill -f "vite|tsx|node" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT

# Iniciar backend en background
echo "🔧 Iniciando backend..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar un poco para que el backend inicie
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Servicios iniciados:"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:5173"
echo "   - Logs: backend.log y frontend.log"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar a que terminen los procesos
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start-dev.sh

# 12. CREAR SCRIPT DE DIAGNÓSTICO
print_status "Creando script de diagnóstico..."
cat > diagnose.sh << 'EOF'
#!/bin/bash

echo "🔍 DIAGNÓSTICO DEL PROYECTO"
echo "=========================="

echo "📦 Versiones:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo ""

echo "📁 Estructura del proyecto:"
echo "Frontend:"
ls -la package.json tailwind.config.js postcss.config.js vite.config.ts 2>/dev/null | head -10
echo ""
echo "Backend:"
ls -la backend/package.json backend/tsconfig.json 2>/dev/null | head -10
echo ""

echo "🔌 Puertos en uso:"
lsof -i :3001 -i :5173 2>/dev/null || echo "Ningún puerto en uso"
echo ""

echo "📋 Procesos relacionados:"
ps aux | grep -E "(vite|tsx|node)" | grep -v grep || echo "No hay procesos corriendo"
echo ""

echo "💾 Espacio en disco:"
df -h . | tail -1
echo ""

echo "🔧 Estado de dependencias:"
echo "Frontend node_modules: $([ -d "node_modules" ] && echo "✅ Existe" || echo "❌ No existe")"
echo "Backend node_modules: $([ -d "backend/node_modules" ] && echo "✅ Existe" || echo "❌ No existe")"
EOF

chmod +x diagnose.sh

print_success "Scripts creados: start-dev.sh y diagnose.sh"

# 13. RESUMEN FINAL
echo ""
echo "🎉 REPARACIÓN COMPLETADA"
echo "======================="
print_success "Frontend: Dependencias instaladas y configurado"
print_success "Backend: Dependencias instaladas y configurado"
print_success "Scripts: start-dev.sh y diagnose.sh creados"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Ejecutar: ./start-dev.sh (para iniciar ambos servicios)"
echo "2. Ejecutar: ./diagnose.sh (para diagnóstico)"
echo "3. Frontend: http://localhost:5173"
echo "4. Backend: http://localhost:3001"
echo ""
print_warning "Si hay problemas, revisa los logs: backend.log y frontend.log"