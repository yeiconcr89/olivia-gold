--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

-- Started on 2025-08-03 11:13:24 -05

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
-- TOC entry 4142 (class 1262 OID 16384)
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
-- TOC entry 932 (class 1247 OID 29788)
-- Name: CouponStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."CouponStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXPIRED'
);


ALTER TYPE public."CouponStatus" OWNER TO yeiconcr;

--
-- TOC entry 929 (class 1247 OID 29781)
-- Name: CouponType; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."CouponType" AS ENUM (
    'PERCENTAGE',
    'FIXED',
    'FREE_SHIPPING'
);


ALTER TYPE public."CouponType" OWNER TO yeiconcr;

--
-- TOC entry 854 (class 1247 OID 29414)
-- Name: CustomerStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."CustomerStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'VIP'
);


ALTER TYPE public."CustomerStatus" OWNER TO yeiconcr;

--
-- TOC entry 863 (class 1247 OID 29446)
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
-- TOC entry 941 (class 1247 OID 29822)
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
-- TOC entry 944 (class 1247 OID 29832)
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
-- TOC entry 938 (class 1247 OID 29807)
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
-- TOC entry 857 (class 1247 OID 29422)
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
-- TOC entry 860 (class 1247 OID 29436)
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
-- TOC entry 866 (class 1247 OID 29458)
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ReviewStatus" OWNER TO yeiconcr;

--
-- TOC entry 869 (class 1247 OID 29466)
-- Name: SEOStatus; Type: TYPE; Schema: public; Owner: yeiconcr
--

CREATE TYPE public."SEOStatus" AS ENUM (
    'OPTIMIZED',
    'NEEDS_WORK',
    'POOR'
);


ALTER TYPE public."SEOStatus" OWNER TO yeiconcr;

--
-- TOC entry 851 (class 1247 OID 29407)
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
-- TOC entry 227 (class 1259 OID 29718)
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
-- TOC entry 226 (class 1259 OID 29704)
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
-- TOC entry 209 (class 1259 OID 29397)
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
-- TOC entry 225 (class 1259 OID 29614)
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
-- TOC entry 233 (class 1259 OID 29882)
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
-- TOC entry 232 (class 1259 OID 29872)
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
-- TOC entry 229 (class 1259 OID 29795)
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
-- TOC entry 216 (class 1259 OID 29532)
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
-- TOC entry 215 (class 1259 OID 29519)
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
-- TOC entry 234 (class 1259 OID 31048)
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
-- TOC entry 220 (class 1259 OID 29567)
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
-- TOC entry 221 (class 1259 OID 29576)
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
-- TOC entry 230 (class 1259 OID 29843)
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
-- TOC entry 218 (class 1259 OID 29552)
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
-- TOC entry 228 (class 1259 OID 29771)
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
-- TOC entry 217 (class 1259 OID 29541)
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
-- TOC entry 213 (class 1259 OID 29503)
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
-- TOC entry 214 (class 1259 OID 29512)
-- Name: product_tags; Type: TABLE; Schema: public; Owner: yeiconcr
--

CREATE TABLE public.product_tags (
    id text NOT NULL,
    "productId" text NOT NULL,
    tag text NOT NULL
);


ALTER TABLE public.product_tags OWNER TO yeiconcr;

--
-- TOC entry 212 (class 1259 OID 29491)
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
-- TOC entry 223 (class 1259 OID 29596)
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
-- TOC entry 222 (class 1259 OID 29584)
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
-- TOC entry 235 (class 1259 OID 34001)
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
-- TOC entry 224 (class 1259 OID 29604)
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
-- TOC entry 219 (class 1259 OID 29559)
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
-- TOC entry 231 (class 1259 OID 29860)
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
-- TOC entry 211 (class 1259 OID 29483)
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
-- TOC entry 210 (class 1259 OID 29473)
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
-- TOC entry 4128 (class 0 OID 29718)
-- Dependencies: 227
-- Data for Name: EmailVerificationToken; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public."EmailVerificationToken" (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
\.


--
-- TOC entry 4127 (class 0 OID 29704)
-- Dependencies: 226
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public."PasswordResetToken" (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
\.


--
-- TOC entry 4110 (class 0 OID 29397)
-- Dependencies: 209
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
588ae8c4-2e3b-4a9f-9c4a-d57eb3ef5020	122ff284a628f6e3f140faa33b0c0d0d9d3ace22f61d5ef80306eb5682b87f86	2025-08-03 00:49:42.193684-05	20250704042354_create_all_tables	\N	\N	2025-08-03 00:49:42.128537-05	1
46d7290d-b833-4822-98da-31cf7ff9db33	9c85defa1f6f97c37f2bfe87f5140743824441810ce28e494cbf27457e9fd2b7	2025-08-03 00:49:42.200403-05	20250707174306_add_password_reset_token	\N	\N	2025-08-03 00:49:42.194233-05	1
0ad32ba3-2235-49d5-89ac-eccb526ba1fc	78f88b8780bca6e310fefe63adba0dd51efb5d602e3ee72d497da18c0fac3546	2025-08-03 00:49:42.206169-05	20250707182747_add_email_verification_token	\N	\N	2025-08-03 00:49:42.20086-05	1
1ff6cd3b-7c06-4062-97ab-fd8739d3684e	1e4bc7d17bab7fd5af6e02ab09ff050ace5e4c4fa5bf81ac1f0e1318d6518853	2025-08-03 00:49:42.214517-05	20250717174415_add_performance_indexes	\N	\N	2025-08-03 00:49:42.206618-05	1
487199ad-fd6b-4547-a5be-294bc52e6e77	0e30bad59502c00fffc814ccb9c369d8a4b02a4b626df8da3188fcaaaed2a59f	2025-08-03 00:49:42.222043-05	20250722044524_inventory	\N	\N	2025-08-03 00:49:42.215221-05	1
f1fe9893-0d4e-4aaa-85f0-29553fe447d9	0c2bb8af2f4c669855f541de3c6c8ecdd996d14565d5bcac0789039928e9b98d	2025-08-03 00:49:42.268439-05	20250722_advanced_orders	\N	\N	2025-08-03 00:49:42.222547-05	1
2f948695-ac7f-4771-bdf8-65c333d83653	74ed6544f2fccdf6062f2fa9f482b2d1956a5aaa71cfaf108e3918dcacf87d33	2025-08-03 00:49:43.203077-05	20250803054943_make_cta_text_optional	\N	\N	2025-08-03 00:49:43.196037-05	1
\.


--
-- TOC entry 4126 (class 0 OID 29614)
-- Dependencies: 225
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.audit_logs (id, "userId", action, "tableName", "recordId", "oldValues", "newValues", "timestamp") FROM stdin;
cmdvc466k000510myuf9b7poy	cmdvc3u6z000012c6ubre7wvw	LOGIN	User	cmdvc3u6z000012c6ubre7wvw	\N	{"email": "admin@joyceriaelegante.com"}	2025-08-03 07:03:01.965
cmdvcwl330001jjit483rec2c	cmdvc3u6z000012c6ubre7wvw	LOGIN	User	cmdvc3u6z000012c6ubre7wvw	\N	{"email": "admin@joyceriaelegante.com"}	2025-08-03 07:25:07.647
cmdvvnkdn0001ak5q350uolj7	cmdvc3u6z000012c6ubre7wvw	LOGIN	User	cmdvc3u6z000012c6ubre7wvw	\N	{"email": "admin@joyceriaelegante.com"}	2025-08-03 16:09:59.532
cmdvvo1110004ak5qyqxulob8	cmdvc3u6z000012c6ubre7wvw	LOGIN	User	cmdvc3u6z000012c6ubre7wvw	\N	{"email": "admin@joyceriaelegante.com"}	2025-08-03 16:10:21.109
\.


--
-- TOC entry 4134 (class 0 OID 29882)
-- Dependencies: 233
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.cart_items (id, "cartId", "productId", quantity, size, customization, "addedAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4133 (class 0 OID 29872)
-- Dependencies: 232
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.carts (id, "userId", "sessionId", "guestEmail", "expiresAt", "createdAt", "updatedAt", "couponCode", "couponId") FROM stdin;
cmdv9i7vy0000erdqatm2bjzv	\N	7r4og3crugn	\N	2025-08-10 05:49:58.509	2025-08-03 05:49:58.51	2025-08-03 05:49:58.51	\N	\N
cmdv9iaxi0001erdqfvkefrma	\N	oktzt7zwe6i	\N	2025-08-10 05:50:02.454	2025-08-03 05:50:02.455	2025-08-03 05:50:02.455	\N	\N
cmdvvno2p0002ak5q1r3w84zr	\N	p4n8oqa1kg9	\N	2025-08-10 16:10:04.32	2025-08-03 16:10:04.321	2025-08-03 16:10:04.321	\N	\N
\.


--
-- TOC entry 4130 (class 0 OID 29795)
-- Dependencies: 229
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.coupons (id, code, name, description, type, value, "minimumAmount", "maximumDiscount", "usageLimit", "usageCount", status, "validFrom", "validUntil", "applicableCategories", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4117 (class 0 OID 29532)
-- Dependencies: 216
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.customer_addresses (id, "customerId", street, city, state, "zipCode", country, "isDefault") FROM stdin;
cmdvc3u7n001512c6ypev13ex	cmdvc3u7n001412c6atbpkq8l	Calle 123 #45-67	Bogotá	Cundinamarca	110111	Colombia	t
cmdvc3u7q001712c690q4nzj6	cmdvc3u7q001612c63r32uqgg	Carrera 45 #67-89	Medellín	Antioquia	050001	Colombia	t
\.


--
-- TOC entry 4116 (class 0 OID 29519)
-- Dependencies: 215
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.customers (id, name, email, phone, status, "registrationDate", "lastPurchase", "totalOrders", "totalSpent", "wishlistItems", notes, "birthDate", preferences, "createdAt", "updatedAt") FROM stdin;
cmdvc3u7n001412c6atbpkq8l	María González	maria@email.com	+57 300 123 4567	VIP	2025-08-03 07:02:46.451	\N	5	450000.00	3	\N	\N	{collares,anillos}	2025-08-03 07:02:46.451	2025-08-03 07:02:46.451
cmdvc3u7q001612c63r32uqgg	Carlos Rodríguez	carlos@email.com	+57 301 234 5678	ACTIVE	2025-08-03 07:02:46.454	\N	2	299800.00	1	\N	\N	{anillos}	2025-08-03 07:02:46.454	2025-08-03 07:02:46.454
\.


--
-- TOC entry 4135 (class 0 OID 31048)
-- Dependencies: 234
-- Data for Name: hero_slides; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.hero_slides (id, title, subtitle, description, "imageUrl", "ctaText", "ctaLink", "offerText", "isActive", "orderIndex", "createdAt", "updatedAt") FROM stdin;
cmdvcbbi70000seil09xbhnlc	Nueva Colección Primavera	Descubre nuestra exclusiva línea de joyería	Piezas únicas en oro laminado 18k que destacan tu elegancia natural. Diseños contemporáneos con la calidad de siempre.	https://images.pexels.com/photos/1639729/pexels-photo-1639729.jpeg?auto=compress&cs=tinysrgb&w=1920	Ver Colección	/?category=collares	Hasta 30% OFF	t	1	2025-08-03 07:08:35.455	2025-08-03 07:15:42.363
cmdvcbbi80001seil5fd2hlyo	Envío Gratis en Colombia	En compras superiores a $200.000	Recibe tus joyas favoritas sin costo adicional. Envío seguro y con seguimiento a todo el país.	https://images.pexels.com/photos/1458691/pexels-photo-1458691.jpeg?auto=compress&cs=tinysrgb&w=1920	Comprar Ahora	/?category=collares	Envío Gratis	t	2	2025-08-03 07:08:35.456	2025-08-03 07:16:28.98
cmdvcbbi80002seilrsbhb992	Anillos de Compromiso	Momentos únicos merecen joyas especiales	Encuentra el anillo perfecto para esa propuesta inolvidable. Diseños clásicos y modernos en oro laminado de alta calidad.	https://images.pexels.com/photos/1346086/pexels-photo-1346086.jpeg?auto=compress&cs=tinysrgb&w=1920	Ver Anillos	/?category=anillos	Diseños Únicos	t	3	2025-08-03 07:08:35.457	2025-08-03 07:16:28.98
cmdvcmner000910my7jgxefa5	Pruebas slide	Descubre nuestra exclusiva línea de joyería	Lorem ipsum	https://res.cloudinary.com/dflhmlbrz/image/upload/v1752999725/products/pulsera_sofisticada_02-1752999721407-fh07i07n3js.png		/productos	\N	t	4	2025-08-03 07:17:24.1	2025-08-03 07:18:26.082
\.


--
-- TOC entry 4121 (class 0 OID 29567)
-- Dependencies: 220
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.inventory (id, "productId", quantity, "reservedQuantity", "createdAt", "lastChecked", location, "maxQuantity", "minQuantity", "updatedAt") FROM stdin;
cmdvc3u75000812c68teb5gs3	cmdvc3u75000212c6w7ftz0xj	39	0	2025-08-03 07:02:46.434	2025-08-03 07:02:46.434	\N	\N	5	2025-08-03 07:02:46.434
cmdvc3u79000f12c66d7kb5ja	cmdvc3u79000912c6uj1kfpht	24	0	2025-08-03 07:02:46.438	2025-08-03 07:02:46.438	\N	\N	5	2025-08-03 07:02:46.438
cmdvc3u7e000l12c680uewa1j	cmdvc3u7e000g12c62pfujp5x	26	0	2025-08-03 07:02:46.442	2025-08-03 07:02:46.442	\N	\N	5	2025-08-03 07:02:46.442
cmdvc3u7h000r12c6grq3lhvz	cmdvc3u7h000m12c60p3z4bma	56	0	2025-08-03 07:02:46.445	2025-08-03 07:02:46.445	\N	\N	5	2025-08-03 07:02:46.445
cmdvc3u7j000x12c65ai58bra	cmdvc3u7j000s12c61xp5s82q	40	0	2025-08-03 07:02:46.448	2025-08-03 07:02:46.448	\N	\N	5	2025-08-03 07:02:46.448
cmdvc3u7l001312c6m71n0dxe	cmdvc3u7l000y12c6sj47gyam	1	0	2025-08-03 07:02:46.45	2025-08-03 07:02:46.45	\N	\N	5	2025-08-03 07:19:24.502
\.


--
-- TOC entry 4122 (class 0 OID 29576)
-- Dependencies: 221
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.inventory_movements (id, "productId", type, quantity, reason, "createdAt", "createdBy", "newQuantity", "previousQuantity") FROM stdin;
cmdvc54tw000810myu7pqt7j5	cmdvc3u7l000y12c6sj47gyam	ADJUSTMENT	33	Ajuste manual desde el panel	2025-08-03 07:03:46.868	cmdvc3u6z000012c6ubre7wvw	0	33
cmdvcp8bb000c10myc6ihql7q	cmdvc3u7l000y12c6sj47gyam	ADJUSTMENT	1	Ajuste manual desde el panel	2025-08-03 07:19:24.504	cmdvc3u6z000012c6ubre7wvw	1	0
\.


--
-- TOC entry 4131 (class 0 OID 29843)
-- Dependencies: 230
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.notifications (id, "userId", "orderId", type, channel, title, message, status, "scheduledFor", "sentAt", "readAt", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4119 (class 0 OID 29552)
-- Dependencies: 218
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.order_items (id, "orderId", "productId", quantity, price, size) FROM stdin;
cmdvculyd00098g8fmoj19r1l	PED-250704-001	cmdvc3u75000212c6w7ftz0xj	1	89900.00	\N
cmdvculyn000b8g8fv5enbqhj	PED-250727-001	cmdvc3u79000912c6uj1kfpht	1	149900.00	\N
cmdvvmxr00009m814bsxea80m	PED-250704-002	cmdvc3u75000212c6w7ftz0xj	1	89900.00	\N
cmdvvmxr5000bm814bz3e5h5l	PED-250727-002	cmdvc3u79000912c6uj1kfpht	1	149900.00	\N
\.


--
-- TOC entry 4129 (class 0 OID 29771)
-- Dependencies: 228
-- Data for Name: order_tracking; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.order_tracking (id, "orderId", status, location, description, "estimatedArrival", "actualArrival", carrier, "trackingUrl", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4118 (class 0 OID 29541)
-- Dependencies: 217
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.orders (id, "customerId", "userId", "customerName", "customerEmail", "customerPhone", total, status, "paymentStatus", "paymentMethod", "orderDate", "estimatedDelivery", "trackingNumber", notes, "createdAt", "updatedAt", "couponId", "couponCode", "discountAmount", "taxAmount", "shippingAmount", subtotal, currency, "exchangeRate", priority, source, referrer, utm_source, utm_medium, utm_campaign, "shippingMethodId") FROM stdin;
PED-250704-001	cmdvc3u7n001412c6atbpkq8l	\N	María González	maria@email.com	+57 300 123 4567	179900.00	DELIVERED	PAID	Tarjeta de Crédito	2025-07-04 07:23:35.449	\N	\N	\N	2025-08-03 07:23:35.456	2025-08-03 07:23:35.456	\N	\N	0.00	0.00	0.00	179900.00	COP	1.0000	STANDARD	WEB	\N	\N	\N	\N	\N
PED-250727-001	cmdvc3u7q001612c63r32uqgg	\N	Carlos Rodríguez	carlos@email.com	+57 301 234 5678	149900.00	PROCESSING	PAID	PSE	2025-07-27 07:23:35.449	\N	\N	\N	2025-08-03 07:23:35.466	2025-08-03 07:23:35.466	\N	\N	0.00	0.00	0.00	149900.00	COP	1.0000	STANDARD	WEB	\N	\N	\N	\N	\N
PED-250704-002	cmdvc3u7n001412c6atbpkq8l	\N	María González	maria@email.com	+57 300 123 4567	179900.00	DELIVERED	PAID	Tarjeta de Crédito	2025-07-04 16:09:30.19	\N	\N	\N	2025-08-03 16:09:30.201	2025-08-03 16:09:30.201	\N	\N	0.00	0.00	0.00	179900.00	COP	1.0000	STANDARD	WEB	\N	\N	\N	\N	\N
PED-250727-002	cmdvc3u7q001612c63r32uqgg	\N	Carlos Rodríguez	carlos@email.com	+57 301 234 5678	149900.00	PROCESSING	PAID	PSE	2025-07-27 16:09:30.19	\N	\N	\N	2025-08-03 16:09:30.208	2025-08-03 16:09:30.208	\N	\N	0.00	0.00	0.00	149900.00	COP	1.0000	STANDARD	WEB	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4114 (class 0 OID 29503)
-- Dependencies: 213
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.product_images (id, "productId", url, "altText", "isPrimary", "order") FROM stdin;
cmdvc3u75000312c6r4q50a3o	cmdvc3u75000212c6w7ftz0xj	https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=800	\N	t	0
cmdvc3u75000412c6nwvoy8mt	cmdvc3u75000212c6w7ftz0xj	https://images.pexels.com/photos/1458691/pexels-photo-1458691.jpeg?auto=compress&cs=tinysrgb&w=800	\N	f	1
cmdvc3u79000a12c6fj190x70	cmdvc3u79000912c6uj1kfpht	https://images.pexels.com/photos/1346086/pexels-photo-1346086.jpeg?auto=compress&cs=tinysrgb&w=800	\N	t	0
cmdvc3u79000b12c6h67k8m4f	cmdvc3u79000912c6uj1kfpht	https://images.pexels.com/photos/1346092/pexels-photo-1346092.jpeg?auto=compress&cs=tinysrgb&w=800	\N	f	1
cmdvc3u7e000h12c656faa0oh	cmdvc3u7e000g12c62pfujp5x	https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800	\N	t	0
cmdvc3u7h000n12c6na9vf644	cmdvc3u7h000m12c60p3z4bma	https://images.pexels.com/photos/1456713/pexels-photo-1456713.jpeg?auto=compress&cs=tinysrgb&w=800	\N	t	0
cmdvc3u7j000t12c6046eyip1	cmdvc3u7j000s12c61xp5s82q	https://images.pexels.com/photos/1458691/pexels-photo-1458691.jpeg?auto=compress&cs=tinysrgb&w=800	\N	t	0
cmdvc3u7l000z12c617tddmik	cmdvc3u7l000y12c6sj47gyam	https://images.pexels.com/photos/47856/rolex-watch-time-timepiece-47856.jpeg?auto=compress&cs=tinysrgb&w=800	\N	t	0
\.


--
-- TOC entry 4115 (class 0 OID 29512)
-- Dependencies: 214
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.product_tags (id, "productId", tag) FROM stdin;
cmdvc3u75000512c6uc31ovyj	cmdvc3u75000212c6w7ftz0xj	elegante
cmdvc3u75000612c6wuv65ikj	cmdvc3u75000212c6w7ftz0xj	clasico
cmdvc3u75000712c6f6u1t8ag	cmdvc3u75000212c6w7ftz0xj	premium
cmdvc3u79000c12c6lpho1tuv	cmdvc3u79000912c6uj1kfpht	romantico
cmdvc3u79000d12c6dedcmz7w	cmdvc3u79000912c6uj1kfpht	compromiso
cmdvc3u79000e12c6a0eou95b	cmdvc3u79000912c6uj1kfpht	lujo
cmdvc3u7e000i12c68d905e2q	cmdvc3u7e000g12c62pfujp5x	brillante
cmdvc3u7e000j12c62vdowbim	cmdvc3u7e000g12c62pfujp5x	elegante
cmdvc3u7e000k12c6z0sa6jaq	cmdvc3u7e000g12c62pfujp5x	ajustable
cmdvc3u7h000o12c6ptlrwcea	cmdvc3u7h000m12c60p3z4bma	clasico
cmdvc3u7h000p12c6yj4uh5hj	cmdvc3u7h000m12c60p3z4bma	perlas
cmdvc3u7h000q12c6y3xd2760	cmdvc3u7h000m12c60p3z4bma	sofisticado
cmdvc3u7j000u12c63jzqzfqv	cmdvc3u7j000s12c61xp5s82q	romantico
cmdvc3u7j000v12c6z8u8jqsi	cmdvc3u7j000s12c61xp5s82q	conjunto
cmdvc3u7j000w12c6txyk9yjn	cmdvc3u7j000s12c61xp5s82q	regalo
cmdvc3u7l001012c6okfxdjrs	cmdvc3u7l000y12c6sj47gyam	reloj
cmdvc3u7l001112c68qw54ca8	cmdvc3u7l000y12c6sj47gyam	precision
cmdvc3u7l001212c65d384ai6	cmdvc3u7l000y12c6sj47gyam	elegante
\.


--
-- TOC entry 4113 (class 0 OID 29491)
-- Dependencies: 212
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.products (id, name, price, "originalPrice", category, subcategory, description, materials, dimensions, care, "inStock", featured, rating, "reviewCount", "createdAt", "updatedAt") FROM stdin;
cmdvc3u75000212c6w7ftz0xj	Collar Veneciano Premium	89900.00	129900.00	collares	cadenas	Elegante collar veneciano en oro laminado 18k. Diseño atemporal que combina con cualquier ocasión.	Oro laminado 18k sobre base de acero inoxidable	Largo: 45cm, Ancho: 3mm	Evitar contacto con perfumes y agua. Limpiar con paño suave.	t	t	4.80	156	2025-08-03 07:02:46.434	2025-08-03 07:02:46.434
cmdvc3u79000912c6uj1kfpht	Anillo Solitario Diamante	149900.00	199900.00	anillos	compromiso	Anillo solitario con cristal de zirconia cúbica en oro laminado. Perfecto para momentos especiales.	Oro laminado 18k, zirconia cúbica premium	Tallas disponibles: 6-20	Evitar exposición prolongada al agua y químicos.	t	t	4.90	89	2025-08-03 07:02:46.438	2025-08-03 07:02:46.438
cmdvc3u7e000g12c62pfujp5x	Pulsera Tenis Brillante	119900.00	\N	pulseras	elegantes	Pulsera tipo tenis con cristales brillantes. Elegancia que destaca en cada movimiento.	Oro laminado 18k, cristales Swarovski	Largo: 18cm ajustable	Guardar en estuche original. Limpiar regularmente.	t	f	4.70	134	2025-08-03 07:02:46.442	2025-08-03 07:02:46.442
cmdvc3u7h000m12c60p3z4bma	Aretes Perla Clásicos	69900.00	89900.00	aretes	perlas	Aretes con perlas cultivadas y baño en oro. Sofisticación atemporal.	Oro laminado 14k, perlas cultivadas	Diámetro perla: 8mm	Las perlas requieren cuidado especial. Evitar químicos.	t	t	4.60	203	2025-08-03 07:02:46.445	2025-08-03 07:02:46.445
cmdvc3u7j000s12c61xp5s82q	Conjunto Romántico Corazón	179900.00	249900.00	conjuntos	romanticos	Conjunto de collar y aretes con motivo de corazón. Regalo perfecto para ocasiones especiales.	Oro laminado 18k, zirconia cúbica	Collar: 40cm, Aretes: 1.5cm	Almacenar por separado. Evitar humedad.	t	t	4.80	97	2025-08-03 07:02:46.448	2025-08-03 07:02:46.448
cmdvc3u7l000y12c6sj47gyam	Reloj Elegante Dorado	199900.00	\N	relojes	elegantes	Reloj con movimiento de cuarzo y acabado en oro laminado. Precisión y estilo unidos.	Oro laminado 18k, movimiento suizo	Caja: 36mm, Pulsera ajustable	Resistente al agua hasta 30m. Servicio anual recomendado.	t	f	4.50	67	2025-08-03 07:02:46.45	2025-08-03 07:19:24.502
\.


--
-- TOC entry 4124 (class 0 OID 29596)
-- Dependencies: 223
-- Data for Name: review_responses; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.review_responses (id, "reviewId", text, date, author) FROM stdin;
\.


--
-- TOC entry 4123 (class 0 OID 29584)
-- Dependencies: 222
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.reviews (id, "productId", "customerId", "userId", rating, title, comment, date, verified, helpful, "notHelpful", status) FROM stdin;
cmdvc3u80001d12c6rezsavzx	cmdvc3u75000212c6w7ftz0xj	\N	\N	5	Excelente calidad	Superó mis expectativas. El collar es hermoso y la calidad del oro laminado es excepcional. Lo recomiendo 100%.	2025-08-03 07:02:46.464	t	0	0	APPROVED
cmdvc3u83001f12c6rb3t798v	cmdvc3u79000912c6uj1kfpht	\N	\N	5	Perfecto para mi propuesta	Compré este anillo para mi propuesta de matrimonio y fue perfecto. Mi novia quedó encantada con el diseño y la calidad.	2025-08-03 07:02:46.468	t	0	0	APPROVED
cmdvc3u85001h12c6ilgh7sji	cmdvc3u7h000m12c60p3z4bma	\N	\N	4	Muy elegantes	Los aretes son muy elegantes y van perfecto con cualquier outfit. Las perlas se ven de muy buena calidad.	2025-08-03 07:02:46.469	t	0	0	APPROVED
\.


--
-- TOC entry 4136 (class 0 OID 34001)
-- Dependencies: 235
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.security_logs (id, "eventType", "userId", email, ip, "userAgent", path, method, severity, details, location, "createdAt") FROM stdin;
\.


--
-- TOC entry 4125 (class 0 OID 29604)
-- Dependencies: 224
-- Data for Name: seo_pages; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.seo_pages (id, url, title, "metaDescription", keywords, h1, "canonicalUrl", "ogTitle", "ogDescription", "ogImage", status, score, issues, "lastUpdated", "createdAt") FROM stdin;
cmdvc3u7r001812c67e4j2srw	/	Joyería Elegante - Oro Laminado de Alta Calidad | Brilla con Elegancia	Descubre nuestra exclusiva colección de joyería en oro laminado 18k. Collares, anillos, pulseras y aretes de alta calidad. Envío gratis en Colombia.	{"joyería oro laminado","collares elegantes","anillos compromiso","pulseras premium"}	Joyería Elegante - Brilla con Elegancia	https://joyceriaelegante.com/	Joyería Elegante - Oro Laminado Premium	Colección exclusiva de joyería en oro laminado 18k. Calidad premium, diseños únicos.	\N	OPTIMIZED	92	{}	2025-08-03 07:02:46.456	2025-08-03 07:02:46.456
cmdvc3u7u001912c6vwj904ks	/productos/collares	Collares de Oro Laminado - Joyería Elegante	Hermosos collares en oro laminado 18k. Diseños únicos y elegantes para toda ocasión.	{"collares oro laminado","collares elegantes","joyería premium"}	Collares de Oro Laminado	\N	\N	\N	\N	NEEDS_WORK	76	{"Meta descripción muy corta","Faltan palabras clave en el contenido"}	2025-08-03 07:02:46.458	2025-08-03 07:02:46.458
\.


--
-- TOC entry 4120 (class 0 OID 29559)
-- Dependencies: 219
-- Data for Name: shipping_addresses; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.shipping_addresses (id, "orderId", street, city, state, "zipCode", country) FROM stdin;
\.


--
-- TOC entry 4132 (class 0 OID 29860)
-- Dependencies: 231
-- Data for Name: shipping_methods; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.shipping_methods (id, name, description, carrier, "estimatedDays", "minDays", "maxDays", "basePrice", "pricePerKg", "freeShippingMinimum", "maxWeight", "availableZones", "trackingAvailable", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4112 (class 0 OID 29483)
-- Dependencies: 211
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.user_profiles (id, "userId", name, phone, avatar, "birthDate", preferences, "createdAt", "updatedAt") FROM stdin;
cmdvc3u6z000112c6qdigtnde	cmdvc3u6z000012c6ubre7wvw	Administrador	+57 300 123 4567	\N	\N	\N	2025-08-03 07:02:46.427	2025-08-03 07:02:46.427
\.


--
-- TOC entry 4111 (class 0 OID 29473)
-- Dependencies: 210
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: yeiconcr
--

COPY public.users (id, email, password, role, "isActive", "createdAt", "updatedAt", "googleId") FROM stdin;
cmdvc3u6z000012c6ubre7wvw	admin@joyceriaelegante.com	$2a$12$Rqajq5L37ieqSlNBEqs/9.HsJBD6TF1MkZqwoB6/8M3JxB7PBPAcS	ADMIN	t	2025-08-03 07:02:46.427	2025-08-03 16:09:30.143	\N
\.


--
-- TOC entry 3901 (class 2606 OID 29725)
-- Name: EmailVerificationToken EmailVerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY (id);


--
-- TOC entry 3898 (class 2606 OID 29711)
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- TOC entry 3843 (class 2606 OID 29405)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3896 (class 2606 OID 29621)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3930 (class 2606 OID 29891)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3925 (class 2606 OID 29881)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- TOC entry 3910 (class 2606 OID 29805)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 3866 (class 2606 OID 29540)
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 3863 (class 2606 OID 29531)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 3935 (class 2606 OID 31057)
-- Name: hero_slides hero_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.hero_slides
    ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);


--
-- TOC entry 3885 (class 2606 OID 29583)
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 3882 (class 2606 OID 29575)
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3914 (class 2606 OID 29852)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3877 (class 2606 OID 29558)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3906 (class 2606 OID 29779)
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (id);


--
-- TOC entry 3871 (class 2606 OID 29551)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3857 (class 2606 OID 29511)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- TOC entry 3859 (class 2606 OID 29518)
-- Name: product_tags product_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (id);


--
-- TOC entry 3855 (class 2606 OID 29502)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3890 (class 2606 OID 29603)
-- Name: review_responses review_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 3887 (class 2606 OID 29595)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3942 (class 2606 OID 34008)
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3893 (class 2606 OID 29613)
-- Name: seo_pages seo_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.seo_pages
    ADD CONSTRAINT seo_pages_pkey PRIMARY KEY (id);


--
-- TOC entry 3880 (class 2606 OID 29566)
-- Name: shipping_addresses shipping_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 3920 (class 2606 OID 29871)
-- Name: shipping_methods shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 3849 (class 2606 OID 29490)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3847 (class 2606 OID 29482)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3902 (class 1259 OID 29726)
-- Name: EmailVerificationToken_token_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON public."EmailVerificationToken" USING btree (token);


--
-- TOC entry 3899 (class 1259 OID 29712)
-- Name: PasswordResetToken_token_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON public."PasswordResetToken" USING btree (token);


--
-- TOC entry 3928 (class 1259 OID 29906)
-- Name: cart_items_cartId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "cart_items_cartId_idx" ON public.cart_items USING btree ("cartId");


--
-- TOC entry 3931 (class 1259 OID 29907)
-- Name: cart_items_productId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "cart_items_productId_idx" ON public.cart_items USING btree ("productId");


--
-- TOC entry 3921 (class 1259 OID 31060)
-- Name: carts_couponId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_couponId_idx" ON public.carts USING btree ("couponId");


--
-- TOC entry 3922 (class 1259 OID 29905)
-- Name: carts_expiresAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_expiresAt_idx" ON public.carts USING btree ("expiresAt");


--
-- TOC entry 3923 (class 1259 OID 29904)
-- Name: carts_guestEmail_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_guestEmail_idx" ON public.carts USING btree ("guestEmail");


--
-- TOC entry 3926 (class 1259 OID 29903)
-- Name: carts_sessionId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_sessionId_idx" ON public.carts USING btree ("sessionId");


--
-- TOC entry 3927 (class 1259 OID 29902)
-- Name: carts_userId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "carts_userId_idx" ON public.carts USING btree ("userId");


--
-- TOC entry 3908 (class 1259 OID 29895)
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- TOC entry 3911 (class 1259 OID 29896)
-- Name: coupons_status_validFrom_validUntil_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "coupons_status_validFrom_validUntil_idx" ON public.coupons USING btree (status, "validFrom", "validUntil");


--
-- TOC entry 3860 (class 1259 OID 29624)
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- TOC entry 3861 (class 1259 OID 29732)
-- Name: customers_name_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX customers_name_idx ON public.customers USING btree (name);


--
-- TOC entry 3864 (class 1259 OID 29733)
-- Name: customers_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX customers_status_idx ON public.customers USING btree (status);


--
-- TOC entry 3932 (class 1259 OID 31059)
-- Name: hero_slides_isActive_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "hero_slides_isActive_idx" ON public.hero_slides USING btree ("isActive");


--
-- TOC entry 3933 (class 1259 OID 31058)
-- Name: hero_slides_orderIndex_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "hero_slides_orderIndex_idx" ON public.hero_slides USING btree ("orderIndex");


--
-- TOC entry 3883 (class 1259 OID 29626)
-- Name: inventory_productId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "inventory_productId_key" ON public.inventory USING btree ("productId");


--
-- TOC entry 3912 (class 1259 OID 29898)
-- Name: notifications_orderId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "notifications_orderId_idx" ON public.notifications USING btree ("orderId");


--
-- TOC entry 3915 (class 1259 OID 29901)
-- Name: notifications_scheduledFor_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "notifications_scheduledFor_idx" ON public.notifications USING btree ("scheduledFor");


--
-- TOC entry 3916 (class 1259 OID 29900)
-- Name: notifications_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX notifications_status_idx ON public.notifications USING btree (status);


--
-- TOC entry 3917 (class 1259 OID 29899)
-- Name: notifications_type_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX notifications_type_idx ON public.notifications USING btree (type);


--
-- TOC entry 3918 (class 1259 OID 29897)
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- TOC entry 3903 (class 1259 OID 29894)
-- Name: order_tracking_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "order_tracking_createdAt_idx" ON public.order_tracking USING btree ("createdAt");


--
-- TOC entry 3904 (class 1259 OID 29892)
-- Name: order_tracking_orderId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "order_tracking_orderId_idx" ON public.order_tracking USING btree ("orderId");


--
-- TOC entry 3907 (class 1259 OID 29893)
-- Name: order_tracking_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX order_tracking_status_idx ON public.order_tracking USING btree (status);


--
-- TOC entry 3867 (class 1259 OID 29908)
-- Name: orders_couponId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_couponId_idx" ON public.orders USING btree ("couponId");


--
-- TOC entry 3868 (class 1259 OID 29736)
-- Name: orders_orderDate_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_orderDate_idx" ON public.orders USING btree ("orderDate");


--
-- TOC entry 3869 (class 1259 OID 29735)
-- Name: orders_paymentStatus_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_paymentStatus_idx" ON public.orders USING btree ("paymentStatus");


--
-- TOC entry 3872 (class 1259 OID 29910)
-- Name: orders_priority_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX orders_priority_status_idx ON public.orders USING btree (priority, status);


--
-- TOC entry 3873 (class 1259 OID 29909)
-- Name: orders_shippingMethodId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "orders_shippingMethodId_idx" ON public.orders USING btree ("shippingMethodId");


--
-- TOC entry 3874 (class 1259 OID 29911)
-- Name: orders_source_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX orders_source_idx ON public.orders USING btree (source);


--
-- TOC entry 3875 (class 1259 OID 29734)
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- TOC entry 3851 (class 1259 OID 29738)
-- Name: products_category_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX products_category_idx ON public.products USING btree (category);


--
-- TOC entry 3852 (class 1259 OID 29739)
-- Name: products_featured_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX products_featured_idx ON public.products USING btree (featured);


--
-- TOC entry 3853 (class 1259 OID 29737)
-- Name: products_name_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX products_name_idx ON public.products USING btree (name);


--
-- TOC entry 3891 (class 1259 OID 29627)
-- Name: review_responses_reviewId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "review_responses_reviewId_key" ON public.review_responses USING btree ("reviewId");


--
-- TOC entry 3888 (class 1259 OID 29740)
-- Name: reviews_status_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX reviews_status_idx ON public.reviews USING btree (status);


--
-- TOC entry 3936 (class 1259 OID 34013)
-- Name: security_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_createdAt_idx" ON public.security_logs USING btree ("createdAt");


--
-- TOC entry 3937 (class 1259 OID 34014)
-- Name: security_logs_eventType_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_eventType_createdAt_idx" ON public.security_logs USING btree ("eventType", "createdAt");


--
-- TOC entry 3938 (class 1259 OID 34009)
-- Name: security_logs_eventType_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_eventType_idx" ON public.security_logs USING btree ("eventType");


--
-- TOC entry 3939 (class 1259 OID 34015)
-- Name: security_logs_ip_createdAt_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_ip_createdAt_idx" ON public.security_logs USING btree (ip, "createdAt");


--
-- TOC entry 3940 (class 1259 OID 34011)
-- Name: security_logs_ip_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX security_logs_ip_idx ON public.security_logs USING btree (ip);


--
-- TOC entry 3943 (class 1259 OID 34012)
-- Name: security_logs_severity_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX security_logs_severity_idx ON public.security_logs USING btree (severity);


--
-- TOC entry 3944 (class 1259 OID 34010)
-- Name: security_logs_userId_idx; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE INDEX "security_logs_userId_idx" ON public.security_logs USING btree ("userId");


--
-- TOC entry 3894 (class 1259 OID 29628)
-- Name: seo_pages_url_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX seo_pages_url_key ON public.seo_pages USING btree (url);


--
-- TOC entry 3878 (class 1259 OID 29625)
-- Name: shipping_addresses_orderId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "shipping_addresses_orderId_key" ON public.shipping_addresses USING btree ("orderId");


--
-- TOC entry 3850 (class 1259 OID 29623)
-- Name: user_profiles_userId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "user_profiles_userId_key" ON public.user_profiles USING btree ("userId");


--
-- TOC entry 3844 (class 1259 OID 29622)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 3845 (class 1259 OID 29745)
-- Name: users_googleId_key; Type: INDEX; Schema: public; Owner: yeiconcr
--

CREATE UNIQUE INDEX "users_googleId_key" ON public.users USING btree ("googleId");


--
-- TOC entry 3963 (class 2606 OID 29727)
-- Name: EmailVerificationToken EmailVerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3962 (class 2606 OID 29713)
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3961 (class 2606 OID 29699)
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3969 (class 2606 OID 29942)
-- Name: cart_items cart_items_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3970 (class 2606 OID 29947)
-- Name: cart_items cart_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3968 (class 2606 OID 31061)
-- Name: carts carts_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3967 (class 2606 OID 29937)
-- Name: carts carts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3948 (class 2606 OID 29644)
-- Name: customer_addresses customer_addresses_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3957 (class 2606 OID 29746)
-- Name: inventory_movements inventory_movements_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3956 (class 2606 OID 29674)
-- Name: inventory inventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3966 (class 2606 OID 29922)
-- Name: notifications notifications_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3965 (class 2606 OID 29917)
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3953 (class 2606 OID 29659)
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3954 (class 2606 OID 29664)
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3964 (class 2606 OID 29912)
-- Name: order_tracking order_tracking_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT "order_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3951 (class 2606 OID 29927)
-- Name: orders orders_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3949 (class 2606 OID 29649)
-- Name: orders orders_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3952 (class 2606 OID 29932)
-- Name: orders orders_shippingMethodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES public.shipping_methods(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3950 (class 2606 OID 29654)
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3946 (class 2606 OID 29634)
-- Name: product_images product_images_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3947 (class 2606 OID 29639)
-- Name: product_tags product_tags_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT "product_tags_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3960 (class 2606 OID 29694)
-- Name: review_responses review_responses_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT "review_responses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3958 (class 2606 OID 29684)
-- Name: reviews reviews_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3959 (class 2606 OID 29689)
-- Name: reviews reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3955 (class 2606 OID 29669)
-- Name: shipping_addresses shipping_addresses_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT "shipping_addresses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3945 (class 2606 OID 29629)
-- Name: user_profiles user_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yeiconcr
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2025-08-03 11:13:24 -05

--
-- PostgreSQL database dump complete
--

