--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS joyeria_elegante;
--
-- Name: joyeria_elegante; Type: DATABASE; Schema: -; Owner: yeiconcr
--

CREATE DATABASE joyeria_elegante WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C';


ALTER DATABASE joyeria_elegante OWNER TO yeiconcr;

\connect joyeria_elegante

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CouponStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."CouponStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXPIRED'
);


ALTER TYPE public."CouponStatus" OWNER TO yeiconcr;

--
-- Name: CouponType; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."CouponType" AS ENUM (
    'PERCENTAGE',
    'FIXED',
    'FREE_SHIPPING'
);


ALTER TYPE public."CouponType" OWNER TO yeiconcr;

--
-- Name: CustomerStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."CustomerStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'VIP'
);


ALTER TYPE public."CustomerStatus" OWNER TO yeiconcr;

--
-- Name: InventoryMovementType; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."InventoryMovementType" AS ENUM (
    'IN',
    'OUT',
    'ADJUSTMENT',
    'RESERVED',
    'RELEASED'
);


ALTER TYPE public."InventoryMovementType" OWNER TO yeiconcr;

--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'EMAIL',
    'SMS',
    'PUSH',
    'IN_APP'
);


ALTER TYPE public."NotificationChannel" OWNER TO yeiconcr;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'READ'
);


ALTER TYPE public."NotificationStatus" OWNER TO yeiconcr;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."NotificationType" AS ENUM (
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED'
);


ALTER TYPE public."NotificationType" OWNER TO yeiconcr;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'PAID',
    'PREPARING',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'PARTIALLY_DELIVERED',
    'RETURNED',
    'REFUNDED'
);


ALTER TYPE public."OrderStatus" OWNER TO yeiconcr;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PROCESSING',
    'PARTIAL_REFUND',
    'CHARGEBACK'
);


ALTER TYPE public."PaymentStatus" OWNER TO yeiconcr;

--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ReviewStatus" OWNER TO yeiconcr;

--
-- Name: SEOStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."SEOStatus" AS ENUM (
    'OPTIMIZED',
    'NEEDS_WORK',
    'POOR'
);


ALTER TYPE public."SEOStatus" OWNER TO yeiconcr;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'MANAGER',
    'CUSTOMER'
);


ALTER TYPE public."UserRole" OWNER TO yeiconcr;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: EmailVerificationToken; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public."EmailVerificationToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EmailVerificationToken" OWNER TO yeiconcr;

--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetToken" OWNER TO yeiconcr;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO yeiconcr;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    "tableName" text NOT NULL,
    "recordId" text NOT NULL,
    "oldValues" jsonb,
    "newValues" jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO yeiconcr;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    customization jsonb,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cart_items OWNER TO yeiconcr;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.carts (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    "guestEmail" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "couponCode" text,
    "couponId" text
);


ALTER TABLE public.carts OWNER TO yeiconcr;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.coupons (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    type public."CouponType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "minimumAmount" numeric(10,2),
    "maximumDiscount" numeric(10,2),
    "usageLimit" integer,
    "usageCount" integer DEFAULT 0 NOT NULL,
    status public."CouponStatus" DEFAULT 'ACTIVE'::public."CouponStatus" NOT NULL,
    "validFrom" timestamp(3) without time zone NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL,
    "applicableCategories" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.coupons OWNER TO yeiconcr;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.customer_addresses (
    id text NOT NULL,
    "customerId" text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "zipCode" text NOT NULL,
    country text DEFAULT 'Colombia'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.customer_addresses OWNER TO yeiconcr;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    status public."CustomerStatus" DEFAULT 'ACTIVE'::public."CustomerStatus" NOT NULL,
    "registrationDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastPurchase" timestamp(3) without time zone,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "totalSpent" numeric(10,2) DEFAULT 0 NOT NULL,
    "wishlistItems" integer DEFAULT 0 NOT NULL,
    notes text,
    "birthDate" timestamp(3) without time zone,
    preferences text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO yeiconcr;

--
-- Name: hero_slides; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.hero_slides (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    description text NOT NULL,
    "imageUrl" text NOT NULL,
    "ctaText" text,
    "ctaLink" text,
    "offerText" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "orderIndex" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hero_slides OWNER TO yeiconcr;

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.inventory (
    id text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    "reservedQuantity" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastChecked" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    location text,
    "maxQuantity" integer,
    "minQuantity" integer DEFAULT 5 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inventory OWNER TO yeiconcr;

--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.inventory_movements (
    id text NOT NULL,
    "productId" text NOT NULL,
    type public."InventoryMovementType" NOT NULL,
    quantity integer NOT NULL,
    reason text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "newQuantity" integer NOT NULL,
    "previousQuantity" integer NOT NULL
);


ALTER TABLE public.inventory_movements OWNER TO yeiconcr;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text,
    "orderId" text,
    type public."NotificationType" NOT NULL,
    channel public."NotificationChannel" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    "scheduledFor" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "readAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO yeiconcr;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    size text
);


ALTER TABLE public.order_items OWNER TO yeiconcr;

--
-- Name: order_tracking; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.order_tracking (
    id text NOT NULL,
    "orderId" text NOT NULL,
    status public."OrderStatus" NOT NULL,
    location text,
    description text NOT NULL,
    "estimatedArrival" timestamp(3) without time zone,
    "actualArrival" timestamp(3) without time zone,
    carrier text,
    "trackingUrl" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_tracking OWNER TO yeiconcr;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "customerId" text,
    "userId" text,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerPhone" text NOT NULL,
    total numeric(10,2) NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paymentMethod" text NOT NULL,
    "orderDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "estimatedDelivery" timestamp(3) without time zone,
    "trackingNumber" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "couponId" text,
    "couponCode" text,
    "discountAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "shippingAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    subtotal numeric(10,2),
    currency text DEFAULT 'COP'::text NOT NULL,
    "exchangeRate" numeric(10,4) DEFAULT 1.0000 NOT NULL,
    priority text DEFAULT 'STANDARD'::text NOT NULL,
    source text DEFAULT 'WEB'::text NOT NULL,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    "shippingMethodId" text
);


ALTER TABLE public.orders OWNER TO yeiconcr;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.product_images (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    "altText" text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.product_images OWNER TO yeiconcr;

--
-- Name: product_tags; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.product_tags (
    id text NOT NULL,
    "productId" text NOT NULL,
    tag text NOT NULL
);


ALTER TABLE public.product_tags OWNER TO yeiconcr;

--
-- Name: products; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    "originalPrice" numeric(10,2),
    category text NOT NULL,
    subcategory text NOT NULL,
    description text NOT NULL,
    materials text NOT NULL,
    dimensions text NOT NULL,
    care text NOT NULL,
    "inStock" boolean DEFAULT false NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    rating numeric(3,2) DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO yeiconcr;

--
-- Name: review_responses; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.review_responses (
    id text NOT NULL,
    "reviewId" text NOT NULL,
    text text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    author text NOT NULL
);


ALTER TABLE public.review_responses OWNER TO yeiconcr;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "productId" text NOT NULL,
    "customerId" text,
    "userId" text,
    rating integer NOT NULL,
    title text NOT NULL,
    comment text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    helpful integer DEFAULT 0 NOT NULL,
    "notHelpful" integer DEFAULT 0 NOT NULL,
    status public."ReviewStatus" DEFAULT 'PENDING'::public."ReviewStatus" NOT NULL
);


ALTER TABLE public.reviews OWNER TO yeiconcr;

--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.security_logs (
    id text NOT NULL,
    "eventType" text NOT NULL,
    "userId" text,
    email text,
    ip text NOT NULL,
    "userAgent" text NOT NULL,
    path text NOT NULL,
    method text NOT NULL,
    severity text NOT NULL,
    details jsonb,
    location jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.security_logs OWNER TO yeiconcr;

--
-- Name: seo_pages; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.seo_pages (
    id text NOT NULL,
    url text NOT NULL,
    title text NOT NULL,
    "metaDescription" text NOT NULL,
    keywords text[],
    h1 text NOT NULL,
    "canonicalUrl" text,
    "ogTitle" text,
    "ogDescription" text,
    "ogImage" text,
    status public."SEOStatus" DEFAULT 'NEEDS_WORK'::public."SEOStatus" NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    issues text[],
    "lastUpdated" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.seo_pages OWNER TO yeiconcr;

--
-- Name: shipping_addresses; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.shipping_addresses (
    id text NOT NULL,
    "orderId" text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "zipCode" text NOT NULL,
    country text DEFAULT 'Colombia'::text NOT NULL
);


ALTER TABLE public.shipping_addresses OWNER TO yeiconcr;

--
-- Name: shipping_methods; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.shipping_methods (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    carrier text NOT NULL,
    "estimatedDays" integer NOT NULL,
    "minDays" integer NOT NULL,
    "maxDays" integer NOT NULL,
    "basePrice" numeric(10,2) NOT NULL,
    "pricePerKg" numeric(10,2) DEFAULT 0 NOT NULL,
    "freeShippingMinimum" numeric(10,2),
    "maxWeight" numeric(10,2),
    "availableZones" text[],
    "trackingAvailable" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.shipping_methods OWNER TO yeiconcr;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.user_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    phone text,
    avatar text,
    "birthDate" timestamp(3) without time zone,
    preferences text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO yeiconcr;

--
-- Name: users; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    role public."UserRole" DEFAULT 'CUSTOMER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "googleId" text
);


ALTER TABLE public.users OWNER TO yeiconcr;

--
-- Name: EmailVerificationToken EmailVerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: hero_slides hero_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.hero_slides
    ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_tags product_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: review_responses review_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- Name: seo_pages seo_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.seo_pages
    ADD CONSTRAINT seo_pages_pkey PRIMARY KEY (id);


--
-- Name: shipping_addresses shipping_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id);


--
-- Name: shipping_methods shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: EmailVerificationToken_token_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON public."EmailVerificationToken" USING btree (token);


--
-- Name: PasswordResetToken_token_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON public."PasswordResetToken" USING btree (token);


--
-- Name: cart_items_cartId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "cart_items_cartId_idx" ON public.cart_items USING btree ("cartId");


--
-- Name: cart_items_productId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "cart_items_productId_idx" ON public.cart_items USING btree ("productId");


--
-- Name: carts_couponId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_couponId_idx" ON public.carts USING btree ("couponId");


--
-- Name: carts_expiresAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_expiresAt_idx" ON public.carts USING btree ("expiresAt");


--
-- Name: carts_guestEmail_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_guestEmail_idx" ON public.carts USING btree ("guestEmail");


--
-- Name: carts_sessionId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_sessionId_idx" ON public.carts USING btree ("sessionId");


--
-- Name: carts_userId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_userId_idx" ON public.carts USING btree ("userId");


--
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- Name: coupons_status_validFrom_validUntil_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "coupons_status_validFrom_validUntil_idx" ON public.coupons USING btree (status, "validFrom", "validUntil");


--
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- Name: customers_name_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX customers_name_idx ON public.customers USING btree (name);


--
-- Name: customers_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX customers_status_idx ON public.customers USING btree (status);


--
-- Name: hero_slides_isActive_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "hero_slides_isActive_idx" ON public.hero_slides USING btree ("isActive");


--
-- Name: hero_slides_orderIndex_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "hero_slides_orderIndex_idx" ON public.hero_slides USING btree ("orderIndex");


--
-- Name: inventory_productId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "inventory_productId_key" ON public.inventory USING btree ("productId");


--
-- Name: notifications_orderId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "notifications_orderId_idx" ON public.notifications USING btree ("orderId");


--
-- Name: notifications_scheduledFor_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "notifications_scheduledFor_idx" ON public.notifications USING btree ("scheduledFor");


--
-- Name: notifications_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX notifications_status_idx ON public.notifications USING btree (status);


--
-- Name: notifications_type_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX notifications_type_idx ON public.notifications USING btree (type);


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: order_tracking_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "order_tracking_createdAt_idx" ON public.order_tracking USING btree ("createdAt");


--
-- Name: order_tracking_orderId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "order_tracking_orderId_idx" ON public.order_tracking USING btree ("orderId");


--
-- Name: order_tracking_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX order_tracking_status_idx ON public.order_tracking USING btree (status);


--
-- Name: orders_couponId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_couponId_idx" ON public.orders USING btree ("couponId");


--
-- Name: orders_orderDate_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_orderDate_idx" ON public.orders USING btree ("orderDate");


--
-- Name: orders_paymentStatus_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_paymentStatus_idx" ON public.orders USING btree ("paymentStatus");


--
-- Name: orders_priority_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX orders_priority_status_idx ON public.orders USING btree (priority, status);


--
-- Name: orders_shippingMethodId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_shippingMethodId_idx" ON public.orders USING btree ("shippingMethodId");


--
-- Name: orders_source_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX orders_source_idx ON public.orders USING btree (source);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: products_category_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX products_category_idx ON public.products USING btree (category);


--
-- Name: products_featured_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX products_featured_idx ON public.products USING btree (featured);


--
-- Name: products_name_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX products_name_idx ON public.products USING btree (name);


--
-- Name: review_responses_reviewId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "review_responses_reviewId_key" ON public.review_responses USING btree ("reviewId");


--
-- Name: reviews_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX reviews_status_idx ON public.reviews USING btree (status);


--
-- Name: security_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_createdAt_idx" ON public.security_logs USING btree ("createdAt");


--
-- Name: security_logs_eventType_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_eventType_createdAt_idx" ON public.security_logs USING btree ("eventType", "createdAt");


--
-- Name: security_logs_eventType_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_eventType_idx" ON public.security_logs USING btree ("eventType");


--
-- Name: security_logs_ip_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_ip_createdAt_idx" ON public.security_logs USING btree (ip, "createdAt");


--
-- Name: security_logs_ip_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX security_logs_ip_idx ON public.security_logs USING btree (ip);


--
-- Name: security_logs_severity_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX security_logs_severity_idx ON public.security_logs USING btree (severity);


--
-- Name: security_logs_userId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_userId_idx" ON public.security_logs USING btree ("userId");


--
-- Name: seo_pages_url_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX seo_pages_url_key ON public.seo_pages USING btree (url);


--
-- Name: shipping_addresses_orderId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "shipping_addresses_orderId_key" ON public.shipping_addresses USING btree ("orderId");


--
-- Name: user_profiles_userId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "user_profiles_userId_key" ON public.user_profiles USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_googleId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "users_googleId_key" ON public.users USING btree ("googleId");


--
-- Name: EmailVerificationToken EmailVerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_items cart_items_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: carts carts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_addresses customer_addresses_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory inventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_tracking order_tracking_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT "order_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_shippingMethodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES public.shipping_methods(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_images product_images_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tags product_tags_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT "product_tags_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: review_responses review_responses_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT "review_responses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: shipping_addresses shipping_addresses_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT "shipping_addresses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

