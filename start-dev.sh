#!/bin/bash

echo "🚀 Iniciando proyecto completo..."

# Función para manejar Ctrl+C
cleanup() {
    echo "🛑 Deteniendo servicios..."
    pkill -f "vite|tsx|node" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT

# Detener procesos existentes
echo "🧹 Limpiando procesos existentes..."
pkill -f "vite|tsx|node" 2>/dev/null || true
sleep 2

# Iniciar backend en background
echo "🔧 Iniciando backend..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar un poco para que el backend inicie
echo "⏳ Esperando que el backend inicie..."
sleep 5

# Iniciar frontend
echo "🎨 Iniciando frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Servicios iniciados:"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:5173"
echo "   - Logs: backend.log y frontend.log"
echo ""
echo "📋 Para ver logs en tiempo real:"
echo "   tail -f backend.log"
echo "   tail -f frontend.log"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar a que terminen los procesos
wait $BACKEND_PID $FRONTEND_PID