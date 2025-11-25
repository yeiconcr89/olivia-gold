-- ===========================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE PERFORMANCE - OLIVIA GOLD
-- ===========================================================================
-- Este archivo contiene los índices recomendados para mejorar el performance
-- de las queries más frecuentes en la aplicación.

-- ===========================================================================
-- ÍNDICES PARA PRODUCTOS
-- ===========================================================================

-- Índice compuesto para búsqueda por categoría y stock
CREATE INDEX IF NOT EXISTS "idx_products_category_stock" ON "products" ("category", "inStock");

-- Índice para búsqueda por subcategoría
CREATE INDEX IF NOT EXISTS "idx_products_subcategory" ON "products" ("subcategory");

-- Índice para productos destacados
CREATE INDEX IF NOT EXISTS "idx_products_featured" ON "products" ("featured") WHERE "featured" = true;

-- Índice para búsqueda de texto en nombre y descripción (PostgreSQL)
CREATE INDEX IF NOT EXISTS "idx_products_search" ON "products" USING gin(to_tsvector('spanish', "name" || ' ' || "description"));

-- Índice para ordenar por precio
CREATE INDEX IF NOT EXISTS "idx_products_price" ON "products" ("price");

-- Índice para ordenar por rating
CREATE INDEX IF NOT EXISTS "idx_products_rating" ON "products" ("rating") WHERE "rating" IS NOT NULL;

-- Índice para ordenar por fecha de creación (más recientes)
CREATE INDEX IF NOT EXISTS "idx_products_created_at" ON "products" ("createdAt" DESC);

-- ===========================================================================
-- ÍNDICES PARA CLIENTES
-- ===========================================================================

-- Índice único para email (ya existe por unique constraint)
-- CREATE UNIQUE INDEX IF NOT EXISTS "idx_customers_email" ON "customers" ("email");

-- Índice para búsqueda por estatus
CREATE INDEX IF NOT EXISTS "idx_customers_status" ON "customers" ("status");

-- Índice para búsqueda por fecha de creación
CREATE INDEX IF NOT EXISTS "idx_customers_created_at" ON "customers" ("createdAt" DESC);

-- Índice para búsqueda de texto en nombre
CREATE INDEX IF NOT EXISTS "idx_customers_name_search" ON "customers" USING gin(to_tsvector('spanish', "name"));

-- ===========================================================================
-- ÍNDICES PARA PEDIDOS
-- ===========================================================================

-- Índice compuesto para pedidos por cliente y estatus
CREATE INDEX IF NOT EXISTS "idx_orders_customer_status" ON "orders" ("customerId", "status");

-- Índice para búsqueda por estatus
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status");

-- Índice para ordenar por fecha de creación
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders" ("createdAt" DESC);

-- Índice para búsqueda por fecha de pedido
CREATE INDEX IF NOT EXISTS "idx_orders_order_date" ON "orders" ("orderDate" DESC);

-- Índice para reportes por rango de fechas y total
CREATE INDEX IF NOT EXISTS "idx_orders_date_total" ON "orders" ("orderDate", "total");

-- ===========================================================================
-- ÍNDICES PARA ITEMS DE PEDIDOS
-- ===========================================================================

-- Índice para items por pedido
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "orderItems" ("orderId");

-- Índice para items por producto (para reportes de ventas)
CREATE INDEX IF NOT EXISTS "idx_order_items_product_id" ON "orderItems" ("productId");

-- ===========================================================================
-- ÍNDICES PARA INVENTARIO
-- ===========================================================================

-- Índice para inventario por producto
CREATE INDEX IF NOT EXISTS "idx_inventory_product_id" ON "inventory" ("productId");

-- Índice para productos con bajo stock
CREATE INDEX IF NOT EXISTS "idx_inventory_low_stock" ON "inventory" ("quantity") WHERE "quantity" < 10;

-- ===========================================================================
-- ÍNDICES PARA RESEÑAS
-- ===========================================================================

-- Índice compuesto para reseñas por producto y estatus
CREATE INDEX IF NOT EXISTS "idx_reviews_product_status" ON "reviews" ("productId", "status");

-- Índice para reseñas aprobadas
CREATE INDEX IF NOT EXISTS "idx_reviews_approved" ON "reviews" ("status", "createdAt" DESC) WHERE "status" = 'APPROVED';

-- ===========================================================================
-- ÍNDICES PARA IMÁGENES DE PRODUCTOS
-- ===========================================================================

-- Índice para imágenes por producto
CREATE INDEX IF NOT EXISTS "idx_product_images_product_id" ON "productImages" ("productId");

-- Índice para imagen principal
CREATE INDEX IF NOT EXISTS "idx_product_images_primary" ON "productImages" ("productId", "isPrimary") WHERE "isPrimary" = true;

-- Índice para orden de imágenes
CREATE INDEX IF NOT EXISTS "idx_product_images_order" ON "productImages" ("productId", "order");

-- ===========================================================================
-- ÍNDICES PARA TAGS DE PRODUCTOS
-- ===========================================================================

-- Índice para tags por producto
CREATE INDEX IF NOT EXISTS "idx_product_tags_product_id" ON "productTags" ("productId");

-- Índice para búsqueda por tag
CREATE INDEX IF NOT EXISTS "idx_product_tags_tag" ON "productTags" ("tag");

-- ===========================================================================
-- ÍNDICES PARA USUARIOS
-- ===========================================================================

-- Índice para usuarios activos
CREATE INDEX IF NOT EXISTS "idx_users_active" ON "users" ("isActive") WHERE "isActive" = true;

-- Índice para búsqueda por rol
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");

-- ===========================================================================
-- ÍNDICES PARA DIRECCIONES
-- ===========================================================================

-- Índice para direcciones por cliente
CREATE INDEX IF NOT EXISTS "idx_addresses_customer_id" ON "addresses" ("customerId");

-- Índice para direcciones por defecto
CREATE INDEX IF NOT EXISTS "idx_addresses_default" ON "addresses" ("customerId", "isDefault") WHERE "isDefault" = true;

-- ===========================================================================
-- ÍNDICES PARA SEO
-- ===========================================================================

-- Índice para páginas SEO por URL (ya existe por unique constraint)
-- CREATE UNIQUE INDEX IF NOT EXISTS "idx_seo_pages_url" ON "sEOPages" ("url");

-- Índice para páginas por estatus
CREATE INDEX IF NOT EXISTS "idx_seo_pages_status" ON "sEOPages" ("status");

-- Índice para páginas con bajo score
CREATE INDEX IF NOT EXISTS "idx_seo_pages_low_score" ON "sEOPages" ("score") WHERE "score" < 80;

-- ===========================================================================
-- ÍNDICES PARA AUDITORÍA
-- ===========================================================================

-- Índice para logs de auditoría por usuario
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "auditLogs" ("userId");

-- Índice para logs por acción
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "auditLogs" ("action");

-- Índice para logs por fecha (más recientes)
CREATE INDEX IF NOT EXISTS "idx_audit_logs_timestamp" ON "auditLogs" ("timestamp" DESC);

-- Índice compuesto para reportes de auditoría
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_date" ON "auditLogs" ("userId", "timestamp" DESC);

-- ===========================================================================
-- COMENTARIOS Y NOTAS
-- ===========================================================================

-- Notas sobre los índices:
-- 1. Los índices compuestos deben tener el campo más selectivo primero
-- 2. Los índices condicionales (WHERE) son más eficientes para datos dispersos
-- 3. Los índices GIN son ideales para búsqueda de texto completo en PostgreSQL
-- 4. Monitorear el uso de índices con pg_stat_user_indexes
-- 5. Eliminar índices no utilizados para reducir overhead en writes

-- Para verificar el uso de índices:
-- SELECT * FROM pg_stat_user_indexes WHERE relname = 'products';

-- Para ver el tamaño de los índices:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
-- FROM pg_stat_user_indexes ORDER BY pg_relation_size(indexrelid) DESC;