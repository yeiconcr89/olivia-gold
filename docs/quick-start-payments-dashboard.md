# 🚀 Guía Rápida - Dashboard de Pagos en Tiempo Real

## 📋 Pasos para Ver el Dashboard Funcionando

### **1. Configurar Variables de Entorno**

Copia el archivo de ejemplo y configura las variables:

```bash
# En el directorio backend/
cp .env.example .env
```

Edita el archivo `.env` con tus datos:

```bash
# Database (asegúrate de que tu PostgreSQL esté corriendo)
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/olivia_gold"

# JWT & Sessions (genera claves seguras)
JWT_SECRET="tu-clave-jwt-super-secreta-aqui"
SESSION_SECRET="tu-clave-session-super-secreta-aqui"

# Wompi Sandbox (estas son claves de prueba públicas)
WOMPI_PUBLIC_KEY="pub_test_G4GCnfxXKYvkzDat2lHwXNe4jdGjOeKz"
WOMPI_PRIVATE_KEY="prv_test_QhKnfxXKYvkzDat2lHwXNe4jdGjOeKz"
WOMPI_WEBHOOK_SECRET="test-webhook-secret-123"
WOMPI_ENVIRONMENT="sandbox"

# Otros (opcional)
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:5173"
```

### **2. Preparar la Base de Datos**

```bash
# En el directorio backend/
npm run db:push          # Aplicar schema a la base de datos
npm run db:seed:payments # Crear datos de prueba para pagos
```

### **3. Iniciar el Backend**

```bash
# En el directorio backend/
npm run dev
```

Deberías ver:
```
✅ Database connected successfully
🚀 Server running on port 3001
📊 Payment system initialized
```

### **4. Iniciar el Frontend**

```bash
# En el directorio raíz del proyecto
npm run dev
```

Deberías ver:
```
Local:   http://localhost:5173/
```

### **5. Acceder al Dashboard**

1. **Abrir el navegador**: `http://localhost:5173`

2. **Iniciar sesión como admin**:
   - Si no tienes usuario admin, puedes usar el DevRoleSwitch (botón en la esquina)
   - O crear un usuario y cambiar su rol en la base de datos

3. **Ir al panel admin**: 
   - Hacer clic en el menú de usuario
   - Seleccionar "Panel de Administración"
   - O ir directamente a: `http://localhost:5173/admin`

4. **Acceder al Dashboard de Pagos**:
   - En el panel admin, hacer clic en la pestaña **"Pagos"**
   - O ir directamente a: `http://localhost:5173/admin/payments`

---

## 🎯 **Lo que Verás en el Dashboard**

### **Dashboard Overview**
- **Métricas principales**: Total transacciones, tasa de éxito, volumen
- **Gráfico de tendencias**: Últimos 30 días
- **Breakdown por método**: PSE, Tarjetas, Nequi
- **Performance de gateways**: Wompi status

### **Lista de Transacciones**
- **5 transacciones de prueba** con diferentes estados:
  - ✅ PSE Aprobado - $450,000 COP
  - ✅ Tarjeta Aprobada - $320,000 COP  
  - ❌ Tarjeta Rechazada - $850,000 COP
  - ✅ Nequi Aprobado - $640,000 COP
  - ⏳ PSE Pendiente - $100,000 COP

### **Analytics Avanzados**
- **Gráficos de ingresos** por día
- **Performance por método** de pago
- **Análisis de errores** con razones
- **Métricas de clientes** únicos

### **Configuración del Sistema**
- **Configuración de Wompi** (sandbox)
- **Límites de transacción**
- **Webhooks y notificaciones**

---

## 🔧 **Funcionalidades que Puedes Probar**

### **1. Filtros y Búsqueda**
- Buscar por ID de transacción
- Filtrar por estado (Aprobado, Rechazado, Pendiente)
- Filtrar por método (PSE, Tarjeta, Nequi)
- Filtrar por fechas

### **2. Exportar Datos**
- Hacer clic en "Exportar" en Analytics
- Se descargará un CSV con los datos

### **3. Ver Detalles de Transacción**
- Hacer clic en "Ver" en cualquier transacción
- Ver información completa del pago

### **4. Procesar Reembolsos**
- En una transacción aprobada, hacer clic en "Reembolsar"
- Ingresar monto y razón
- Ver el reembolso procesado

### **5. Monitoreo en Tiempo Real**
- Hacer clic en "Actualizar" para refresh
- Ver cambios de estado en tiempo real
- Monitorear salud del sistema

---

## 📊 **Datos de Prueba Incluidos**

El script de seed crea:

### **Clientes**
- María García (Bogotá)
- Carlos Rodríguez (Medellín)  
- Ana Martínez (Cali)

### **Productos**
- Collar de Oro 18k - $450,000
- Aretes de Diamante - $320,000
- Anillo de Compromiso - $850,000

### **Transacciones**
- **2 PSE**: 1 aprobado, 1 pendiente
- **2 Tarjetas**: 1 aprobada, 1 rechazada
- **1 Nequi**: aprobado
- **1 Reembolso**: parcial de $160,000

### **Eventos**
- 3 webhooks procesados
- 2 intentos fallidos
- 2 logs de gateway

---

## 🚨 **Troubleshooting**

### **Error de Base de Datos**
```bash
# Verificar que PostgreSQL esté corriendo
sudo service postgresql start

# Verificar conexión
psql -h localhost -U tu_usuario -d olivia_gold
```

### **Error de Variables de Entorno**
```bash
# Verificar que el archivo .env existe
ls -la backend/.env

# Verificar que las variables están cargadas
echo $DATABASE_URL
```

### **Error de Puertos**
```bash
# Verificar que los puertos estén libres
lsof -i :3001  # Backend
lsof -i :5173  # Frontend
```

### **Error de Permisos Admin**
```sql
-- Conectar a la base de datos y actualizar rol
UPDATE customers SET role = 'ADMIN' WHERE email = 'tu-email@ejemplo.com';
```

---

## 🎉 **¡Listo!**

Una vez que sigas estos pasos, tendrás el dashboard de pagos completamente funcional con:

- ✅ **Dashboard en tiempo real** con métricas
- ✅ **Lista de transacciones** con filtros
- ✅ **Analytics avanzados** con gráficos
- ✅ **Sistema de reembolsos** funcional
- ✅ **Monitoreo de salud** del sistema
- ✅ **Datos de prueba** realistas

**¿Necesitas ayuda?** Si encuentras algún problema, revisa los logs del backend y frontend para identificar el error específico.

---

*Guía creada: Marzo 2025*  
*Dashboard de Pagos Colombia - Versión 1.0*