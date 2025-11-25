# 🗄️ Análisis de Optimización de Base de Datos - Olivia Gold

## 🔍 Estado Actual

### ✅ **Índices YA Implementados (Fase 3.1):**
```sql
-- Products
CREATE INDEX "products_price_idx" ON "products" ("price");
CREATE INDEX "products_inStock_idx" ON "products" ("inStock");
CREATE INDEX "products_rating_idx" ON "products" ("rating");
CREATE INDEX "products_category_inStock_idx" ON "products" ("category", "inStock");
CREATE INDEX "products_featured_category_idx" ON "products" ("featured", "category");

-- Orders
CREATE INDEX "orders_customerEmail_idx" ON "orders" ("customerEmail");
CREATE INDEX "orders_customerEmail_status_idx" ON "orders" ("customerEmail", "status");
CREATE INDEX "orders_orderDate_status_idx" ON "orders" ("orderDate", "status");

-- Reviews
CREATE INDEX "reviews_productId_status_idx" ON "reviews" ("productId", "status");
```

## 🚨 **Oportunidades de Optimización Identificadas**

### 1. **Índices Compuestos Faltantes**

#### 🔍 **Consultas Frecuentes Sin Índices Óptimos:**

##### A) **Búsqueda de Productos Compleja**
```sql
-- Query común: Productos por categoría, en stock, ordenados por rating
SELECT * FROM products 
WHERE category = 'collares' 
  AND inStock = true 
  AND price BETWEEN 50000 AND 200000
ORDER BY rating DESC, createdAt DESC;

-- Índice necesario:
CREATE INDEX "products_category_inStock_price_rating_idx" 
ON "products" ("category", "inStock", "price", "rating" DESC);
```

##### B) **Dashboard de Órdenes**
```sql
-- Query común: Órdenes recientes por estado y fecha
SELECT * FROM orders 
WHERE status IN ('PENDING', 'PROCESSING') 
  AND orderDate >= '2025-01-01'
ORDER BY priority DESC, orderDate DESC;

-- Índice necesario:
CREATE INDEX "orders_status_date_priority_idx" 
ON "orders" ("status", "orderDate", "priority" DESC);
```

##### C) **Inventario Crítico**
```sql
-- Query común: Productos con stock bajo
SELECT p.*, i.quantity FROM products p
JOIN inventory i ON p.id = i.productId
WHERE i.quantity <= i.minQuantity
  AND p.inStock = true;

-- Índice necesario:
CREATE INDEX "inventory_quantity_min_idx" 
ON "inventory" ("quantity", "minQuantity") 
WHERE quantity <= minQuantity;
```

### 2. **Consultas N+1 Residuales**

#### 🚨 **Problemas Detectados:**
```typescript
// En getCustomers() - Carga órdenes para cada cliente
customers.forEach(customer => {
  // N+1: Una query por cada cliente para sus órdenes
  customer.orders = await getCustomerOrders(customer.id);
});
```

### 3. **Falta de Partitioning**

#### 📊 **Tablas Candidatas:**
- **orders** - Por fecha (monthly partitions)
- **inventory_movements** - Por fecha (monthly partitions)
- **audit_logs** - Por fecha (monthly partitions)
- **reviews** - Por producto (hash partitioning)

### 4. **Connection Pooling Subóptimo**

#### ⚙️ **Configuración Actual:**
```typescript
// Prisma usa connection pooling por defecto
// Pero no está optimizado para producción
```

### 5. **Falta de Análisis de Performance**

#### 📈 **Métricas Faltantes:**
- Query execution times
- Index usage statistics
- Connection pool utilization
- Lock contention analysis

## 🎯 **Plan de Optimización**

### **Fase 1: Índices Compuestos Avanzados**
- Crear índices para consultas complejas
- Índices parciales para casos específicos
- Índices de expresión para búsquedas

### **Fase 2: Query Optimization**
- Eliminar consultas N+1 residuales
- Optimizar joins complejos
- Implementar query hints

### **Fase 3: Connection & Performance**
- Optimizar connection pooling
- Implementar read replicas
- Query performance monitoring

### **Fase 4: Partitioning Strategy**
- Particionar tablas grandes
- Implementar archiving strategy
- Optimizar maintenance tasks

---
*Análisis completado: Marzo 2025*