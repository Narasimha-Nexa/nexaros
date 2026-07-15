--
-- PostgreSQL database cluster dump
--

\restrict MdXO2fzpzf3TlNK99UGnEngFy086gnAaQ9ffC9weQNUfUXO1MJBEnbl3H04ojPN

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE nexaros;
ALTER ROLE nexaros WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:922RpErWmWbVvPJdgKIW0g==$pqVSeCSsHSTc29re5f4JxG3w0vX3hP3rT8upz9JtX5M=:I6lQtODze/+OW2+NF04vjzdra+SMaGyQ/HghXPEQKVs=';

--
-- User Configurations
--








\unrestrict MdXO2fzpzf3TlNK99UGnEngFy086gnAaQ9ffC9weQNUfUXO1MJBEnbl3H04ojPN

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict Unm6hOHf6VlFyoxdWQhDWiGb529LN36Hjal03ReExgjf7XaA1HcoaP0ipW7HOXk

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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
-- PostgreSQL database dump complete
--

\unrestrict Unm6hOHf6VlFyoxdWQhDWiGb529LN36Hjal03ReExgjf7XaA1HcoaP0ipW7HOXk

--
-- Database "nexaros" dump
--

--
-- PostgreSQL database dump
--

\restrict VCQIs2lHE0BYTFqLczMlP5hqMZ9XdiGUH7owVrD8FRCY2el6IdK53Ucb0IclahT

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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
-- Name: nexaros; Type: DATABASE; Schema: -; Owner: nexaros
--

CREATE DATABASE nexaros WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE nexaros OWNER TO nexaros;

\unrestrict VCQIs2lHE0BYTFqLczMlP5hqMZ9XdiGUH7owVrD8FRCY2el6IdK53Ucb0IclahT
\connect nexaros
\restrict VCQIs2lHE0BYTFqLczMlP5hqMZ9XdiGUH7owVrD8FRCY2el6IdK53Ucb0IclahT

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: nexaros
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO nexaros;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: nexaros
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AdminRole; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."AdminRole" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'VIEWER'
);


ALTER TYPE public."AdminRole" OWNER TO nexaros;

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'HALF_DAY',
    'LEAVE'
);


ALTER TYPE public."AttendanceStatus" OWNER TO nexaros;

--
-- Name: BillingCycle; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."BillingCycle" AS ENUM (
    'MONTHLY',
    'YEARLY',
    'LIFETIME'
);


ALTER TYPE public."BillingCycle" OWNER TO nexaros;

--
-- Name: CouponType; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."CouponType" AS ENUM (
    'FIXED_AMOUNT',
    'PERCENTAGE'
);


ALTER TYPE public."CouponType" OWNER TO nexaros;

--
-- Name: DemoRequestStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."DemoRequestStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'SCHEDULED',
    'CONVERTED',
    'LOST'
);


ALTER TYPE public."DemoRequestStatus" OWNER TO nexaros;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO nexaros;

--
-- Name: OrderItemStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."OrderItemStatus" AS ENUM (
    'PENDING',
    'PREPARING',
    'READY',
    'SERVED',
    'CANCELLED'
);


ALTER TYPE public."OrderItemStatus" OWNER TO nexaros;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'SERVED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO nexaros;

--
-- Name: OrderType; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."OrderType" AS ENUM (
    'DINE_IN',
    'TAKEAWAY',
    'DELIVERY',
    'QR_ORDER'
);


ALTER TYPE public."OrderType" OWNER TO nexaros;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'UPI',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'NET_BANKING',
    'WALLET',
    'ONLINE'
);


ALTER TYPE public."PaymentMethod" OWNER TO nexaros;

--
-- Name: PaymentPromiseStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."PaymentPromiseStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'EXPIRED'
);


ALTER TYPE public."PaymentPromiseStatus" OWNER TO nexaros;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO nexaros;

--
-- Name: PurchaseStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."PurchaseStatus" AS ENUM (
    'PENDING',
    'RECEIVED',
    'CANCELLED'
);


ALTER TYPE public."PurchaseStatus" OWNER TO nexaros;

--
-- Name: ReservationStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."ReservationStatus" AS ENUM (
    'CONFIRMED',
    'ARRIVED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."ReservationStatus" OWNER TO nexaros;

--
-- Name: SenderType; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."SenderType" AS ENUM (
    'CUSTOMER',
    'SUPPORT',
    'SYSTEM'
);


ALTER TYPE public."SenderType" OWNER TO nexaros;

--
-- Name: ShiftStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."ShiftStatus" AS ENUM (
    'ASSIGNED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'ABSENT'
);


ALTER TYPE public."ShiftStatus" OWNER TO nexaros;

--
-- Name: StockMovementType; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."StockMovementType" AS ENUM (
    'PURCHASE',
    'SALE',
    'WASTE',
    'ADJUSTMENT',
    'TRANSFER'
);


ALTER TYPE public."StockMovementType" OWNER TO nexaros;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'TRIAL',
    'PAYMENT_PENDING',
    'GRACE_PERIOD',
    'RESTRICTED',
    'SUSPENDED',
    'ARCHIVED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO nexaros;

--
-- Name: TableStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."TableStatus" AS ENUM (
    'FREE',
    'OCCUPIED',
    'RESERVED',
    'CLEANING',
    'ORDER_READY',
    'BILLING'
);


ALTER TYPE public."TableStatus" OWNER TO nexaros;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."TicketPriority" OWNER TO nexaros;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'WAITING_CUSTOMER',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."TicketStatus" OWNER TO nexaros;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: nexaros
--

CREATE TYPE public."UserRole" AS ENUM (
    'OWNER',
    'MANAGER',
    'STAFF'
);


ALTER TYPE public."UserRole" OWNER TO nexaros;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _InventoryItemToMenuItem; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public."_InventoryItemToMenuItem" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_InventoryItemToMenuItem" OWNER TO nexaros;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: nexaros
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


ALTER TABLE public._prisma_migrations OWNER TO nexaros;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.admin_audit_logs (
    id text NOT NULL,
    "adminUserId" text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    "oldData" jsonb,
    "newData" jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone
);


ALTER TABLE public.admin_audit_logs OWNER TO nexaros;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.admin_sessions (
    id text NOT NULL,
    "adminUserId" text NOT NULL,
    token text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "mfaVerified" boolean DEFAULT false NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_sessions OWNER TO nexaros;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.admin_users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    role public."AdminRole" DEFAULT 'ADMIN'::public."AdminRole" NOT NULL,
    "mfaEnabled" boolean DEFAULT false NOT NULL,
    "mfaSecret" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.admin_users OWNER TO nexaros;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.attendance (
    id text NOT NULL,
    "staffId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "checkIn" timestamp(3) without time zone,
    "checkOut" timestamp(3) without time zone,
    status public."AttendanceStatus" DEFAULT 'PRESENT'::public."AttendanceStatus" NOT NULL,
    notes text,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.attendance OWNER TO nexaros;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    "oldData" jsonb,
    "newData" jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO nexaros;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.branches (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.branches OWNER TO nexaros;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.categories (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.categories OWNER TO nexaros;

--
-- Name: coupon_usages; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.coupon_usages (
    id text NOT NULL,
    "couponId" text NOT NULL,
    "tenantId" text NOT NULL,
    "subscriptionId" text,
    amount numeric(10,2) NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.coupon_usages OWNER TO nexaros;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.coupons (
    id text NOT NULL,
    code text NOT NULL,
    description text,
    type public."CouponType" DEFAULT 'FIXED_AMOUNT'::public."CouponType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "maxDiscount" numeric(10,2),
    "minPlanPrice" numeric(10,2),
    expiry timestamp(3) without time zone NOT NULL,
    "maxTotalUses" integer,
    "maxUsesPerUser" integer DEFAULT 1 NOT NULL,
    "applicablePlans" text[] NOT NULL,
    "festivalTag" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.coupons OWNER TO nexaros;

--
-- Name: demo_requests; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.demo_requests (
    id text NOT NULL,
    "restaurantName" text NOT NULL,
    "contactName" text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    city text,
    state text,
    "currentPos" text,
    message text,
    status public."DemoRequestStatus" DEFAULT 'NEW'::public."DemoRequestStatus" NOT NULL,
    "assignedTo" text,
    notes text,
    source text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.demo_requests OWNER TO nexaros;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.feature_flags (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.feature_flags OWNER TO nexaros;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.inventory_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    "currentStock" numeric(10,2) DEFAULT 0 NOT NULL,
    "minimumStock" numeric(10,2) DEFAULT 0 NOT NULL,
    "costPrice" numeric(10,2) NOT NULL,
    "reorderQuantity" numeric(10,2),
    barcode text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public.inventory_items OWNER TO nexaros;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "paymentId" text NOT NULL,
    number text NOT NULL,
    "gstAmount" numeric(10,2) NOT NULL,
    cgst numeric(10,2) NOT NULL,
    sgst numeric(10,2) NOT NULL,
    igst numeric(10,2) NOT NULL,
    "pdfUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.invoices OWNER TO nexaros;

--
-- Name: menu_item_add_ons; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.menu_item_add_ons (
    id text NOT NULL,
    "menuItemId" text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.menu_item_add_ons OWNER TO nexaros;

--
-- Name: menu_item_images; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.menu_item_images (
    id text NOT NULL,
    "menuItemId" text NOT NULL,
    url text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.menu_item_images OWNER TO nexaros;

--
-- Name: menu_item_variants; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.menu_item_variants (
    id text NOT NULL,
    "menuItemId" text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.menu_item_variants OWNER TO nexaros;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.menu_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    "costPrice" numeric(10,2),
    sku text,
    barcode text,
    image text,
    "isVeg" boolean DEFAULT false NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "prepTimeMin" integer,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.menu_items OWNER TO nexaros;

--
-- Name: order_item_add_ons; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.order_item_add_ons (
    id text NOT NULL,
    "orderItemId" text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL
);


ALTER TABLE public.order_item_add_ons OWNER TO nexaros;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "menuItemId" text NOT NULL,
    "variantId" text,
    name text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    notes text,
    status public."OrderItemStatus" DEFAULT 'PENDING'::public."OrderItemStatus" NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_items OWNER TO nexaros;

--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.order_status_history (
    id text NOT NULL,
    "orderId" text NOT NULL,
    status public."OrderStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text
);


ALTER TABLE public.order_status_history OWNER TO nexaros;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "branchId" text NOT NULL,
    "tableId" text,
    "staffId" text,
    "orderNumber" integer NOT NULL,
    type public."OrderType" NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "customerName" text,
    "customerPhone" text,
    "guestCount" integer,
    subtotal numeric(10,2) NOT NULL,
    "taxAmount" numeric(10,2) NOT NULL,
    "discountAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    notes text,
    "kotPrinted" boolean DEFAULT false NOT NULL,
    synced boolean DEFAULT false NOT NULL,
    "localId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "tenantId" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.orders OWNER TO nexaros;

--
-- Name: payment_promises; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.payment_promises (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "subscriptionId" text NOT NULL,
    reason text NOT NULL,
    "expectedDate" timestamp(3) without time zone NOT NULL,
    status public."PaymentPromiseStatus" DEFAULT 'PENDING'::public."PaymentPromiseStatus" NOT NULL,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.payment_promises OWNER TO nexaros;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "branchId" text NOT NULL,
    method public."PaymentMethod" NOT NULL,
    amount numeric(10,2) NOT NULL,
    reference text,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "receivedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.payments OWNER TO nexaros;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO nexaros;

--
-- Name: plan_entitlements; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.plan_entitlements (
    id text NOT NULL,
    "planId" text NOT NULL,
    "moduleKey" text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.plan_entitlements OWNER TO nexaros;

--
-- Name: platform_plans; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.platform_plans (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    "billingCycle" public."BillingCycle" DEFAULT 'MONTHLY'::public."BillingCycle" NOT NULL,
    "trialDays" integer DEFAULT 14 NOT NULL,
    "maxBranches" integer DEFAULT 1 NOT NULL,
    "maxStaff" integer DEFAULT 10 NOT NULL,
    "isCustom" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public.platform_plans OWNER TO nexaros;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.platform_settings (
    id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.platform_settings OWNER TO nexaros;

--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.purchase_items (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    "inventoryItemId" text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalCost" numeric(10,2) NOT NULL
);


ALTER TABLE public.purchase_items OWNER TO nexaros;

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.purchases (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "supplierId" text NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    status public."PurchaseStatus" DEFAULT 'PENDING'::public."PurchaseStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.purchases OWNER TO nexaros;

--
-- Name: recipe_items; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.recipe_items (
    id text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit text DEFAULT 'g'::text NOT NULL,
    "inventoryItemId" text NOT NULL,
    "menuItemId" text NOT NULL
);


ALTER TABLE public.recipe_items OWNER TO nexaros;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO nexaros;

--
-- Name: reservations; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.reservations (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "tableId" text,
    "customerName" text NOT NULL,
    "customerPhone" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "time" text NOT NULL,
    "guestCount" integer NOT NULL,
    status public."ReservationStatus" DEFAULT 'CONFIRMED'::public."ReservationStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.reservations OWNER TO nexaros;

--
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.restaurant_tables (
    id text NOT NULL,
    "branchId" text NOT NULL,
    number integer NOT NULL,
    name text,
    capacity integer DEFAULT 4 NOT NULL,
    status public."TableStatus" DEFAULT 'FREE'::public."TableStatus" NOT NULL,
    "qrCode" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text
);


ALTER TABLE public.restaurant_tables OWNER TO nexaros;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO nexaros;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.roles (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.roles OWNER TO nexaros;

--
-- Name: shifts; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.shifts (
    id text NOT NULL,
    "branchId" text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.shifts OWNER TO nexaros;

--
-- Name: staff; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.staff (
    id text NOT NULL,
    "branchId" text NOT NULL,
    "userId" text,
    "roleId" text NOT NULL,
    name text NOT NULL,
    phone text,
    pin text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "tenantId" text,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.staff OWNER TO nexaros;

--
-- Name: staff_shifts; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.staff_shifts (
    id text NOT NULL,
    "shiftId" text NOT NULL,
    "staffId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    status public."ShiftStatus" DEFAULT 'ASSIGNED'::public."ShiftStatus" NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.staff_shifts OWNER TO nexaros;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.stock_movements (
    id text NOT NULL,
    "inventoryItemId" text NOT NULL,
    type public."StockMovementType" NOT NULL,
    quantity numeric(10,2) NOT NULL,
    reference text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text
);


ALTER TABLE public.stock_movements OWNER TO nexaros;

--
-- Name: subscription_invoices; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.subscription_invoices (
    id text NOT NULL,
    "subscriptionId" text NOT NULL,
    number text NOT NULL,
    amount numeric(10,2) NOT NULL,
    "taxAmount" numeric(10,2) NOT NULL,
    status public."InvoiceStatus" DEFAULT 'PENDING'::public."InvoiceStatus" NOT NULL,
    "pdfUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.subscription_invoices OWNER TO nexaros;

--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.subscription_payments (
    id text NOT NULL,
    "subscriptionId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public."PaymentMethod" NOT NULL,
    reference text,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.subscription_payments OWNER TO nexaros;

--
-- Name: subscriptions_v2; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.subscriptions_v2 (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "planId" text NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'TRIAL'::public."SubscriptionStatus" NOT NULL,
    entitlements jsonb NOT NULL,
    "customPrice" numeric(10,2),
    discount numeric(10,2),
    "trialStartedAt" timestamp(3) without time zone,
    "trialEndsAt" timestamp(3) without time zone,
    "currentPeriodStart" timestamp(3) without time zone,
    "currentPeriodEnd" timestamp(3) without time zone,
    "nextBillingDate" timestamp(3) without time zone,
    "lastPaymentAt" timestamp(3) without time zone,
    "gracePeriodDays" integer DEFAULT 7 NOT NULL,
    "graceStartedAt" timestamp(3) without time zone,
    "hasPromise" boolean DEFAULT false NOT NULL,
    "promiseUntil" timestamp(3) without time zone,
    "promiseReason" text,
    "razorpayId" text,
    "razorpayPlanId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.subscriptions_v2 OWNER TO nexaros;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    "gstNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.suppliers OWNER TO nexaros;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.support_tickets (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    priority public."TicketPriority" DEFAULT 'NORMAL'::public."TicketPriority" NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    "assignedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.support_tickets OWNER TO nexaros;

--
-- Name: tenant_feature_flags; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.tenant_feature_flags (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "featureFlagId" text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tenant_feature_flags OWNER TO nexaros;

--
-- Name: tenant_website_configs; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.tenant_website_configs (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "restaurantName" text DEFAULT ''::text NOT NULL,
    tagline text,
    logo text,
    favicon text,
    phone text,
    email text,
    address text,
    "mapUrl" text,
    "whatsappNumber" text,
    currency text DEFAULT 'INR'::text NOT NULL,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    "primaryColor" text DEFAULT '#2563eb'::text NOT NULL,
    "secondaryColor" text DEFAULT '#171717'::text NOT NULL,
    "accentColor" text DEFAULT '#f59e0b'::text NOT NULL,
    "fontHeading" text DEFAULT 'Playfair Display'::text NOT NULL,
    "fontBody" text DEFAULT 'Inter'::text NOT NULL,
    "borderRadius" text DEFAULT 'xl'::text NOT NULL,
    "containerWidth" text DEFAULT 'max-w-7xl'::text NOT NULL,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    seo jsonb DEFAULT '{}'::jsonb NOT NULL,
    "openingHours" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "socialLinks" jsonb DEFAULT '{}'::jsonb NOT NULL,
    analytics jsonb DEFAULT '{}'::jsonb NOT NULL,
    "legalPages" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "homeSections" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text
);


ALTER TABLE public.tenant_website_configs OWNER TO nexaros;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    phone text,
    email text,
    address text,
    "gstNumber" text,
    "panNumber" text,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "businessType" text,
    country text DEFAULT 'India'::text,
    state text,
    city text,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.tenants OWNER TO nexaros;

--
-- Name: ticket_messages; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.ticket_messages (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "senderType" public."SenderType" NOT NULL,
    "senderId" text NOT NULL,
    message text NOT NULL,
    "isInternal" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ticket_messages OWNER TO nexaros;

--
-- Name: users; Type: TABLE; Schema: public; Owner: nexaros
--

CREATE TABLE public.users (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    email text NOT NULL,
    phone text,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    avatar text,
    role public."UserRole" DEFAULT 'OWNER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.users OWNER TO nexaros;

--
-- Data for Name: _InventoryItemToMenuItem; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public."_InventoryItemToMenuItem" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
858d3302-3650-43c3-9a7e-085f10aadc00	3528deabbb1e1d4304dfd2111a7e92e63d7350bd11be3e7672a5aa2675fc96ee	2026-07-12 13:55:02.117109+00	20260712102113_init	\N	\N	2026-07-12 13:55:01.422686+00	1
17b9ba7c-0e51-41ed-87d4-e50da16c3dd4	4ab485d00b361cc28201247528e6d6b1a38beff8edbd580db696229eb01e0e33	2026-07-12 13:55:02.160149+00	20260712104206_add_menu_item_images	\N	\N	2026-07-12 13:55:02.12003+00	1
4c32fb80-92f1-4fd0-b394-9752a5025300	af667e00a58c300827c768cb56bbb74db0ed996ccffc7c0363d2af993d36f58d	2026-07-13 16:26:56.629251+00	20260712110000_add_recipe_item	\N	\N	2026-07-13 16:26:56.579291+00	1
10603c94-0fa5-4367-8120-2bdfb9f59ea5	97068568de473972560168b1dff85c8c440d30dd405ea73f0280eeffcf7b84d0	\N	20260713100000_add_billing_admin_platform	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260713100000_add_billing_admin_platform\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: constraint "plan_entitlements_planId_fkey" for relation "plan_entitlements" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "constraint \\"plan_entitlements_planId_fkey\\" for relation \\"plan_entitlements\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(9011), routine: Some("ATExecAddConstraint") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260713100000_add_billing_admin_platform"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260713100000_add_billing_admin_platform"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-07-14 14:26:21.759236+00	2026-07-14 14:26:07.134287+00	0
9ade1a0f-3d6e-453c-802a-ad7db74fb9eb	97068568de473972560168b1dff85c8c440d30dd405ea73f0280eeffcf7b84d0	2026-07-14 14:26:21.767045+00	20260713100000_add_billing_admin_platform		\N	2026-07-14 14:26:21.767045+00	0
\.


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.admin_audit_logs (id, "adminUserId", action, entity, "entityId", "oldData", "newData", "ipAddress", "createdAt", "readAt") FROM stdin;
cmrk6n1lt0008qpgcgnvohtyj	cmrjg85of006sqpyflzex2ewr	PROVISION	Tenant	cmrk6n1lh0002qpgc6mzlmjdp	null	{"ownerEmail": "ravi@testkitchen.com", "restaurantName": "Test Kitchen Demo"}	\N	2026-07-14 05:00:09.57	\N
cmrk6ohep000aqpvy9mn7dxhw	cmrjg85of006sqpyflzex2ewr	PROVISION	Tenant	cmrk6oheb0002qpvyjvuc7ic9	null	{"plan": "Starter Free", "ownerEmail": "priya@spicegarden.com", "restaurantName": "Spice Garden"}	\N	2026-07-14 05:01:16.706	\N
\.


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.admin_sessions (id, "adminUserId", token, "ipAddress", "userAgent", "mfaVerified", "expiresAt", "createdAt") FROM stdin;
cmrjvyxf60001qp9bwkp41kw2	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODM5ODcyODgsImV4cCI6MTc4NDU5MjA4OH0.8--cJhautokbE_5l_EkKw7IQ78xyh9W1Y6U5K5KGqUI	\N	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	f	2026-07-21 00:01:28.241	2026-07-14 00:01:28.242
cmrk5p1ln0001qpv63xskwu71	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDM2MjMsImV4cCI6MTc4NDYwODQyM30.Fwp-wIDZPvcfWcpKgcrO3qeh-c2AtJb4L1xUPCRaahc	\N	curl/8.20.0	f	2026-07-21 04:33:43.258	2026-07-14 04:33:43.259
cmrk5x70v0001qp8u0jjk81sj	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDQwMDMsImV4cCI6MTc4NDYwODgwM30.E8sVZYs6gQcMA4npZGiWRgdGnQanNXRfoDEjqa3dI7E	\N	curl/8.20.0	f	2026-07-21 04:40:03.535	2026-07-14 04:40:03.536
cmrk6n1hl0001qpgcylx6sedg	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDUyMDksImV4cCI6MTc4NDYxMDAwOX0.G5safYx0yV6seFbaZXT6vIqr4heS3v7PRjMRxrFp86c	\N	curl/8.20.0	f	2026-07-21 05:00:09.416	2026-07-14 05:00:09.418
cmrk6n7sk000aqpgcyohyi9rb	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDUyMTcsImV4cCI6MTc4NDYxMDAxN30.5hDTpry_ACF4bgFnX_2U_8UCgLiWinD3P408Bv01o7o	\N	curl/8.20.0	f	2026-07-21 05:00:17.587	2026-07-14 05:00:17.588
cmrk6oh910001qpvyiiwmo9dv	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDUyNzYsImV4cCI6MTc4NDYxMDA3Nn0.RsHOnC0inYNTLs5QAbLX2Efaz6kUaY2IUICOUJ4QAfY	\N	curl/8.20.0	f	2026-07-21 05:01:16.5	2026-07-14 05:01:16.502
cmrk782bb000eqpvy8lm4q1xy	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDYxOTAsImV4cCI6MTc4NDYxMDk5MH0.qiykrzCm0r0WrzdG6WJ9p_v6AUdVO4ppDPuHoo1MH_E	\N	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	f	2026-07-21 05:16:30.263	2026-07-14 05:16:30.263
cmrk8mh9v000gqpvynbayw8i5	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDg1NDIsImV4cCI6MTc4NDYxMzM0Mn0.LHicUu8nif8qhJu9gvDF-lElOhCy__Ne-vw26teo_OI	\N	curl/8.20.0	f	2026-07-21 05:55:42.45	2026-07-14 05:55:42.451
cmrk8ykgw000iqpvyh9hqi31r	cmrjg85of006sqpyflzex2ewr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21yamc4NW9mMDA2c3FweWZsemV4MmV3ciIsImVtYWlsIjoiYWRtaW5AbmV4YXJvcy5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODQwMDkxMDYsImV4cCI6MTc4NDYxMzkwNn0.9qN1xcsSDeA_FAkC11qveIQjnC6X9uhgqBdATo9-UOQ	\N	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	f	2026-07-21 06:05:06.463	2026-07-14 06:05:06.464
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.admin_users (id, email, name, password, role, "mfaEnabled", "mfaSecret", "isActive", "lastLoginAt", "createdAt", "updatedAt", "deletedAt", version) FROM stdin;
cmrjg85of006sqpyflzex2ewr	admin@nexaros.com	Platform Admin	$2a$12$CXGW08i5PCEMQQwBaK4RdO1glZB/GI7iSePwqBRxxovhBJRG5DebS	SUPER_ADMIN	f	\N	t	2026-07-14 06:05:06.48	2026-07-13 16:40:44.992	2026-07-14 06:05:06.481	\N	1
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.attendance (id, "staffId", date, "checkIn", "checkOut", status, notes, "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.audit_logs (id, "tenantId", "userId", action, entity, "entityId", "oldData", "newData", "ipAddress", "createdAt") FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.branches (id, "tenantId", name, address, phone, "isPrimary", "isActive", "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
existing-branch	cmrhuv97r001kqp8xz7rdz80e	Main Branch - Koramangala	45 Koramangala, Bangalore 560034	+919876543210	t	t	2026-07-12 13:55:05.291	2026-07-12 13:55:05.291	\N	\N	\N	1
cmrhv62r3003bqpl3eia2draj	cmrhv62px0000qpl3104ncofy	Test Restaurant - Main	\N	\N	t	t	2026-07-12 14:03:29.775	2026-07-12 14:03:29.775	\N	\N	\N	1
cmrhvqgey006vqpl3n68vshbo	cmrhvqgdt003kqpl3w8aqtsxk	API Test Restaurant - Main	\N	\N	t	t	2026-07-12 14:19:20.603	2026-07-12 14:19:20.603	\N	\N	\N	1
cmrhw1fjl003bqpoyp06d0xn0	cmrhw1fif0000qpoy6wies2i3	API Test - Main	\N	\N	t	t	2026-07-12 14:27:52.689	2026-07-12 14:27:52.689	\N	\N	\N	1
cmrhwrlbb003bqpp7smblfrbf	cmrhwrl970000qpp7z2y9szdq	E2E Restaurant - Main	\N	\N	t	t	2026-07-12 14:48:13.223	2026-07-12 14:48:13.223	\N	\N	\N	1
cmrhwrygp006pqpp70j2glcyw	cmrhwryff003eqpp7qeoh6lxi	VVV Restaurant - Main	\N	\N	t	t	2026-07-12 14:48:30.265	2026-07-12 14:48:30.265	\N	\N	\N	1
cmrhwsdao00a5qpp7hp1dlzxv	cmrhwsd94006uqpp7yuh5iryl	VVV2 Restaurant - Main	\N	\N	t	t	2026-07-12 14:48:49.488	2026-07-12 14:48:49.488	\N	\N	\N	1
cmrhwvvu8003bqplf5xrr1ltv	cmrhwvvt00000qplflw37hz8q	Final Test - Main	\N	\N	t	t	2026-07-12 14:51:33.488	2026-07-12 14:51:33.488	\N	\N	\N	1
cmrhxfuxl003bqp3une44xh9a	cmrhxfuvh0000qp3u3pix6l5u	Browser Test Restaurant - Main	\N	\N	t	t	2026-07-12 15:07:05.433	2026-07-12 15:07:05.433	\N	\N	\N	1
cmrhxn4e6006rqp3utvx89531	cmrhxn4cx003gqp3u5qvkc9i2	Menu Test - Main	\N	\N	t	t	2026-07-12 15:12:44.286	2026-07-12 15:12:44.286	\N	\N	\N	1
cmrhxx2i9003bqpewmbn10lat	cmrhxx2f90000qpewqu3qsi52	Phase 5 Demo - Main	\N	\N	t	t	2026-07-12 15:20:28.402	2026-07-12 15:20:28.402	\N	\N	\N	1
cmrk6n1lj0004qpgch01eke63	cmrk6n1lh0002qpgc6mzlmjdp	Main Branch	123 MG Road	9876543210	t	t	2026-07-14 05:00:09.559	2026-07-14 05:00:09.559	\N	\N	\N	1
cmrk6ohee0004qpvynzmo0nuo	cmrk6oheb0002qpvyjvuc7ic9	Main Branch	456 Brigade Road	9876543211	t	t	2026-07-14 05:01:16.695	2026-07-14 05:01:16.695	\N	\N	\N	1
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.categories (id, "tenantId", name, description, "sortOrder", "isActive", image, "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
cmrhuv9hy004dqp8xdacowup0	cmrhuv97r001kqp8xz7rdz80e	SOUPS	\N	1	t	\N	2026-07-12 13:55:05.302	2026-07-12 13:55:05.302	\N	\N	\N	1
cmrhuv9i2004fqp8x6npu4w7b	cmrhuv97r001kqp8xz7rdz80e	VEG STARTERS	\N	2	t	\N	2026-07-12 13:55:05.306	2026-07-12 13:55:05.306	\N	\N	\N	1
cmrhuv9i6004hqp8xgg5a1bh2	cmrhuv97r001kqp8xz7rdz80e	NON-VEG STARTERS	\N	3	t	\N	2026-07-12 13:55:05.31	2026-07-12 13:55:05.31	\N	\N	\N	1
cmrhuv9ia004jqp8xjm424e0s	cmrhuv97r001kqp8xz7rdz80e	SEAFOOD STARTERS	\N	4	t	\N	2026-07-12 13:55:05.314	2026-07-12 13:55:05.314	\N	\N	\N	1
cmrhuv9ie004lqp8xpkgnjpjt	cmrhuv97r001kqp8xz7rdz80e	VEG CURRIES	\N	5	t	\N	2026-07-12 13:55:05.318	2026-07-12 13:55:05.318	\N	\N	\N	1
cmrhuv9ii004nqp8xxyibqb2p	cmrhuv97r001kqp8xz7rdz80e	NON-VEG CURRIES	\N	6	t	\N	2026-07-12 13:55:05.322	2026-07-12 13:55:05.322	\N	\N	\N	1
cmrhuv9im004pqp8xbh4koedq	cmrhuv97r001kqp8xz7rdz80e	TANDOORI	\N	7	t	\N	2026-07-12 13:55:05.326	2026-07-12 13:55:05.326	\N	\N	\N	1
cmrhuv9iq004rqp8xea0mmzjo	cmrhuv97r001kqp8xz7rdz80e	FRIED RICE & NOODLES	\N	8	t	\N	2026-07-12 13:55:05.33	2026-07-12 13:55:05.33	\N	\N	\N	1
cmrhuv9iu004tqp8xdtl8ytxe	cmrhuv97r001kqp8xz7rdz80e	ROTIS & NAANS	\N	9	t	\N	2026-07-12 13:55:05.334	2026-07-12 13:55:05.334	\N	\N	\N	1
cmrhuv9iy004vqp8x795pk88z	cmrhuv97r001kqp8xz7rdz80e	VEG BIRYANI	\N	10	t	\N	2026-07-12 13:55:05.338	2026-07-12 13:55:05.338	\N	\N	\N	1
cmrhuv9j2004xqp8xne8cvt1j	cmrhuv97r001kqp8xz7rdz80e	NON-VEG BIRYANI	\N	11	t	\N	2026-07-12 13:55:05.342	2026-07-12 13:55:05.342	\N	\N	\N	1
cmrhuv9j6004zqp8xiimy3gxy	cmrhuv97r001kqp8xz7rdz80e	SPECIAL BIRYANIS	\N	12	t	\N	2026-07-12 13:55:05.346	2026-07-12 13:55:05.346	\N	\N	\N	1
cmrhuv9ja0051qp8xv1btpm9e	cmrhuv97r001kqp8xz7rdz80e	FAMILY PACKS	\N	13	t	\N	2026-07-12 13:55:05.35	2026-07-12 13:55:05.35	\N	\N	\N	1
cmrhuv9je0053qp8xqdi6axgn	cmrhuv97r001kqp8xz7rdz80e	SHAWARMA	\N	14	t	\N	2026-07-12 13:55:05.354	2026-07-12 13:55:05.354	\N	\N	\N	1
cmrhuv9jj0055qp8xygu6fokc	cmrhuv97r001kqp8xz7rdz80e	MANDI	\N	15	t	\N	2026-07-12 13:55:05.359	2026-07-12 13:55:05.359	\N	\N	\N	1
cmrhuv9jp0057qp8xkusb4s87	cmrhuv97r001kqp8xz7rdz80e	MOCKTAILS & DRINKS	\N	16	t	\N	2026-07-12 13:55:05.366	2026-07-12 13:55:05.366	\N	\N	\N	1
cmrhuv9jv0059qp8xdtcck2gk	cmrhuv97r001kqp8xz7rdz80e	ICE CREAMS	\N	17	t	\N	2026-07-12 13:55:05.371	2026-07-12 13:55:05.371	\N	\N	\N	1
cmrhuv9k1005bqp8x4c12zerj	cmrhuv97r001kqp8xz7rdz80e	SOFT DRINKS	\N	18	t	\N	2026-07-12 13:55:05.377	2026-07-12 13:55:05.377	\N	\N	\N	1
cmrhxfuzy003fqp3u4wnr03rx	cmrhxfuvh0000qp3u3pix6l5u	Popular Items	Most ordered dishes	0	t	\N	2026-07-12 15:07:05.519	2026-07-12 15:07:05.519	\N	\N	\N	1
cmrhxn4fh006vqp3uj6oam1yd	cmrhxn4cx003gqp3u5qvkc9i2	Test Category	Test	0	t	\N	2026-07-12 15:12:44.334	2026-07-12 15:12:44.334	\N	\N	\N	1
cmrhxx2ji003fqpewahs3aoz4	cmrhxx2f90000qpewqu3qsi52	Popular Items	\N	0	t	\N	2026-07-12 15:20:28.447	2026-07-12 15:20:28.447	\N	\N	\N	1
\.


--
-- Data for Name: coupon_usages; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.coupon_usages (id, "couponId", "tenantId", "subscriptionId", amount, "usedAt") FROM stdin;
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.coupons (id, code, description, type, value, "maxDiscount", "minPlanPrice", expiry, "maxTotalUses", "maxUsesPerUser", "applicablePlans", "festivalTag", "isActive", "createdBy", "createdAt", "updatedAt", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: demo_requests; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.demo_requests (id, "restaurantName", "contactName", email, phone, city, state, "currentPos", message, status, "assignedTo", notes, source, "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.feature_flags (id, key, name, description, enabled, "createdAt") FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.inventory_items (id, "tenantId", name, unit, "currentStock", "minimumStock", "costPrice", "reorderQuantity", barcode, "createdAt", "updatedAt", "deletedAt", version, "createdBy", "updatedBy") FROM stdin;
cmrhuvaz300hyqp8xgxs3pyxb	cmrhuv97r001kqp8xz7rdz80e	Basmati Rice	kg	50.00	10.00	80.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300hzqp8xyq6da8ek	cmrhuv97r001kqp8xz7rdz80e	Toor Dal	kg	20.00	5.00	120.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i0qp8xrr8rgms0	cmrhuv97r001kqp8xz7rdz80e	Sunflower Oil	litre	30.00	10.00	150.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i1qp8xz18ta7nh	cmrhuv97r001kqp8xz7rdz80e	Onion	kg	25.00	5.00	40.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i2qp8x1e7dt8ww	cmrhuv97r001kqp8xz7rdz80e	Tomato	kg	20.00	5.00	50.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i3qp8xfijp3ef3	cmrhuv97r001kqp8xz7rdz80e	Potato	kg	15.00	5.00	35.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i4qp8xs3os379d	cmrhuv97r001kqp8xz7rdz80e	Paneer	kg	8.00	3.00	350.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i5qp8xl1h9x8ut	cmrhuv97r001kqp8xz7rdz80e	Chicken (Whole)	kg	15.00	5.00	200.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i6qp8xz41mamtj	cmrhuv97r001kqp8xz7rdz80e	Mutton	kg	8.00	3.00	600.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i7qp8xjcqtg50b	cmrhuv97r001kqp8xz7rdz80e	Eggs	piece	100.00	30.00	6.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i8qp8xan85qw08	cmrhuv97r001kqp8xz7rdz80e	Garam Masala	kg	2.00	0.50	500.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300i9qp8x034h5my8	cmrhuv97r001kqp8xz7rdz80e	Turmeric Powder	kg	1.00	0.30	200.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300iaqp8xnn04wh46	cmrhuv97r001kqp8xz7rdz80e	Red Chilli Powder	kg	2.00	0.50	300.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300ibqp8x87sxf9ct	cmrhuv97r001kqp8xz7rdz80e	Coriander Leaves	kg	3.00	1.00	80.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300icqp8x6mtri1g3	cmrhuv97r001kqp8xz7rdz80e	Mint Leaves	kg	2.00	0.50	60.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300idqp8xqo23y8gc	cmrhuv97r001kqp8xz7rdz80e	Ginger	kg	3.00	1.00	100.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300ieqp8xnd9vv4dv	cmrhuv97r001kqp8xz7rdz80e	Garlic	kg	3.00	1.00	80.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300ifqp8x1z3s9gkk	cmrhuv97r001kqp8xz7rdz80e	Curd	kg	10.00	3.00	60.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300igqp8x5c2p6tig	cmrhuv97r001kqp8xz7rdz80e	Butter	kg	5.00	2.00	400.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhuvaz300ihqp8xpgoj85bg	cmrhuv97r001kqp8xz7rdz80e	Naan Flour	kg	15.00	5.00	45.00	\N	\N	2026-07-12 13:55:07.215	2026-07-12 13:55:07.215	\N	1	\N	\N
cmrhw1fop003hqpoygj8ww5t1	cmrhw1fif0000qpoy6wies2i3	Tomato	kg	50.00	10.00	80.00	\N	\N	2026-07-12 14:27:52.873	2026-07-12 14:27:52.873	\N	1	\N	\N
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.invoices (id, "paymentId", number, "gstAmount", cgst, sgst, igst, "pdfUrl", "createdAt", "createdBy", "deletedAt", "updatedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: menu_item_add_ons; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.menu_item_add_ons (id, "menuItemId", name, price, "isActive") FROM stdin;
\.


--
-- Data for Name: menu_item_images; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.menu_item_images (id, "menuItemId", url, "sortOrder", "isPrimary", "createdAt") FROM stdin;
\.


--
-- Data for Name: menu_item_variants; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.menu_item_variants (id, "menuItemId", name, price, "isActive") FROM stdin;
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.menu_items (id, "tenantId", "categoryId", name, description, price, "costPrice", sku, barcode, image, "isVeg", "isAvailable", "prepTimeMin", "sortOrder", "taxRate", tags, "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
cmrhuv9k9005dqp8x0l3bl9gb	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Veg Hot N Sour	\N	99.00	\N	\N	\N	\N	t	t	\N	0	0.00	\N	2026-07-12 13:55:05.385	2026-07-12 13:55:05.385	\N	\N	\N	1
cmrhuv9ki005fqp8xxqmjeppk	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Veg Corn Soup	\N	119.00	\N	\N	\N	\N	t	t	\N	1	0.00	\N	2026-07-12 13:55:05.394	2026-07-12 13:55:05.394	\N	\N	\N	1
cmrhuv9ks005hqp8xp2unmq1q	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Veg Manchow Soup	\N	119.00	\N	\N	\N	\N	t	t	\N	2	0.00	\N	2026-07-12 13:55:05.404	2026-07-12 13:55:05.404	\N	\N	\N	1
cmrhuv9l0005jqp8xycvleny8	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Veg Clear Soup	\N	129.00	\N	\N	\N	\N	t	t	\N	3	0.00	\N	2026-07-12 13:55:05.413	2026-07-12 13:55:05.413	\N	\N	\N	1
cmrhuv9lb005lqp8xmv3wsokn	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Chicken Hot N Sour	\N	129.00	\N	\N	\N	\N	f	t	\N	4	0.00	\N	2026-07-12 13:55:05.424	2026-07-12 13:55:05.424	\N	\N	\N	1
cmrhuv9ll005nqp8x08nzlpyq	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Chicken Corn Soup	\N	129.00	\N	\N	\N	\N	f	t	\N	5	0.00	\N	2026-07-12 13:55:05.433	2026-07-12 13:55:05.433	\N	\N	\N	1
cmrhuv9lv005pqp8xh9yme25t	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Chicken Manchow	\N	139.00	\N	\N	\N	\N	f	t	\N	6	0.00	\N	2026-07-12 13:55:05.443	2026-07-12 13:55:05.443	\N	\N	\N	1
cmrhuv9m3005rqp8xc8n0pxm6	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Chicken Clear Soup	\N	139.00	\N	\N	\N	\N	f	t	\N	7	0.00	\N	2026-07-12 13:55:05.451	2026-07-12 13:55:05.451	\N	\N	\N	1
cmrhuv9md005tqp8x5r9pmhdf	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Mutton Bone Soup	\N	160.00	\N	\N	\N	\N	f	t	\N	8	0.00	\N	2026-07-12 13:55:05.461	2026-07-12 13:55:05.461	\N	\N	\N	1
cmrhuv9ml005vqp8x0w0emnfd	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9hy004dqp8xdacowup0	Mutton Boneless Soup	\N	180.00	\N	\N	\N	\N	f	t	\N	9	0.00	\N	2026-07-12 13:55:05.47	2026-07-12 13:55:05.47	\N	\N	\N	1
cmrhuv9mv005xqp8xujxzilkn	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Veg Manchuria	\N	130.00	\N	\N	\N	\N	t	t	\N	10	0.00	\N	2026-07-12 13:55:05.479	2026-07-12 13:55:05.479	\N	\N	\N	1
cmrhuv9n4005zqp8x4q5lqtsr	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Gobi Manchuria	\N	130.00	\N	\N	\N	\N	t	t	\N	11	0.00	\N	2026-07-12 13:55:05.488	2026-07-12 13:55:05.488	\N	\N	\N	1
cmrhuv9ne0061qp8xw80akaip	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Special Veg Manchuria	\N	150.00	\N	\N	\N	\N	t	t	\N	12	0.00	\N	2026-07-12 13:55:05.498	2026-07-12 13:55:05.498	\N	\N	\N	1
cmrhuv9no0063qp8x1m81wp6c	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Mushroom 65	\N	180.00	\N	\N	\N	\N	t	t	\N	13	0.00	\N	2026-07-12 13:55:05.508	2026-07-12 13:55:05.508	\N	\N	\N	1
cmrhuv9nw0065qp8xbhtav5a9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Chilli Mushroom	\N	180.00	\N	\N	\N	\N	t	t	\N	14	0.00	\N	2026-07-12 13:55:05.517	2026-07-12 13:55:05.517	\N	\N	\N	1
cmrhuv9o50067qp8xb7us32a3	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Mushroom Manchuria	\N	180.00	\N	\N	\N	\N	t	t	\N	15	0.00	\N	2026-07-12 13:55:05.526	2026-07-12 13:55:05.526	\N	\N	\N	1
cmrhuv9of0069qp8xi914i8ey	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Paneer Manchuria	\N	210.00	\N	\N	\N	\N	t	t	\N	16	0.00	\N	2026-07-12 13:55:05.535	2026-07-12 13:55:05.535	\N	\N	\N	1
cmrhuv9oo006bqp8xrawt6v05	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Baby Corn Majestic	\N	220.00	\N	\N	\N	\N	t	t	\N	17	0.00	\N	2026-07-12 13:55:05.544	2026-07-12 13:55:05.544	\N	\N	\N	1
cmrhuv9oy006dqp8x4yaxco65	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Baby Corn 65	\N	220.00	\N	\N	\N	\N	t	t	\N	18	0.00	\N	2026-07-12 13:55:05.554	2026-07-12 13:55:05.554	\N	\N	\N	1
cmrhuv9p7006fqp8xxhxe25ca	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i2004fqp8x6npu4w7b	Paneer Majestic	\N	260.00	\N	\N	\N	\N	t	t	\N	19	0.00	\N	2026-07-12 13:55:05.563	2026-07-12 13:55:05.563	\N	\N	\N	1
cmrhuv9pg006hqp8x6szivdm0	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Egg Burji	\N	130.00	\N	\N	\N	\N	f	t	\N	20	0.00	\N	2026-07-12 13:55:05.572	2026-07-12 13:55:05.572	\N	\N	\N	1
cmrhuv9pq006jqp8xpevyx5ho	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Egg Manchuria	\N	190.00	\N	\N	\N	\N	f	t	\N	21	0.00	\N	2026-07-12 13:55:05.582	2026-07-12 13:55:05.582	\N	\N	\N	1
cmrhuv9q0006lqp8xrayk8xae	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken Manchuria	\N	219.00	\N	\N	\N	\N	f	t	\N	22	0.00	\N	2026-07-12 13:55:05.592	2026-07-12 13:55:05.592	\N	\N	\N	1
cmrhuv9q9006nqp8xcy39ay0a	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken Roast	\N	240.00	\N	\N	\N	\N	f	t	\N	23	0.00	\N	2026-07-12 13:55:05.602	2026-07-12 13:55:05.602	\N	\N	\N	1
cmrhuv9qi006pqp8xjubtv741	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chilli Chicken	\N	249.00	\N	\N	\N	\N	f	t	\N	24	0.00	\N	2026-07-12 13:55:05.61	2026-07-12 13:55:05.61	\N	\N	\N	1
cmrhuv9qs006rqp8xcpz6s9gy	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken 65	\N	280.00	\N	\N	\N	\N	f	t	\N	25	0.00	\N	2026-07-12 13:55:05.62	2026-07-12 13:55:05.62	\N	\N	\N	1
cmrhuv9r2006tqp8xc6d64ptp	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken 555	\N	280.00	\N	\N	\N	\N	f	t	\N	26	0.00	\N	2026-07-12 13:55:05.631	2026-07-12 13:55:05.631	\N	\N	\N	1
cmrhuv9rc006vqp8xtf54ce2y	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Dragon Chicken	\N	280.00	\N	\N	\N	\N	f	t	\N	27	0.00	\N	2026-07-12 13:55:05.64	2026-07-12 13:55:05.64	\N	\N	\N	1
cmrhuv9rl006xqp8xbti2gj4t	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Hawai Chicken	\N	290.00	\N	\N	\N	\N	f	t	\N	28	0.00	\N	2026-07-12 13:55:05.649	2026-07-12 13:55:05.649	\N	\N	\N	1
cmrhuv9rt006zqp8xbjx54bwi	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken Majestic	\N	290.00	\N	\N	\N	\N	f	t	\N	29	0.00	\N	2026-07-12 13:55:05.658	2026-07-12 13:55:05.658	\N	\N	\N	1
cmrhuv9s20071qp8x0psz28xx	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Lemon Chicken	\N	290.00	\N	\N	\N	\N	f	t	\N	30	0.00	\N	2026-07-12 13:55:05.666	2026-07-12 13:55:05.666	\N	\N	\N	1
cmrhuv9sc0073qp8xpkkuozd5	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Honey Chicken	\N	320.00	\N	\N	\N	\N	f	t	\N	31	0.00	\N	2026-07-12 13:55:05.676	2026-07-12 13:55:05.676	\N	\N	\N	1
cmrhuv9sl0075qp8xsw7femxm	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken Lollipop (5 pcs)	\N	320.00	\N	\N	\N	\N	f	t	\N	32	0.00	\N	2026-07-12 13:55:05.686	2026-07-12 13:55:05.686	\N	\N	\N	1
cmrhuv9sw0077qp8xlc89bhan	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Special Baby Wings (12 pcs)	\N	320.00	\N	\N	\N	\N	f	t	\N	33	0.00	\N	2026-07-12 13:55:05.696	2026-07-12 13:55:05.696	\N	\N	\N	1
cmrhuv9t60079qp8xdknsawdg	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Red Bull Chicken	\N	340.00	\N	\N	\N	\N	f	t	\N	34	0.00	\N	2026-07-12 13:55:05.706	2026-07-12 13:55:05.706	\N	\N	\N	1
cmrhuv9tg007bqp8x6yqqktbe	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken Mangolia	\N	340.00	\N	\N	\N	\N	f	t	\N	35	0.00	\N	2026-07-12 13:55:05.717	2026-07-12 13:55:05.717	\N	\N	\N	1
cmrhuv9tq007dqp8xhqi6z5ec	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Mutton 85	\N	340.00	\N	\N	\N	\N	f	t	\N	36	0.00	\N	2026-07-12 13:55:05.726	2026-07-12 13:55:05.726	\N	\N	\N	1
cmrhuv9u0007fqp8x4sb6917x	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Chicken Gurjala	\N	349.00	\N	\N	\N	\N	f	t	\N	37	0.00	\N	2026-07-12 13:55:05.737	2026-07-12 13:55:05.737	\N	\N	\N	1
cmrhuv9u9007hqp8xa5znicw4	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Karivepaku Kodi	\N	350.00	\N	\N	\N	\N	f	t	\N	38	0.00	\N	2026-07-12 13:55:05.745	2026-07-12 13:55:05.745	\N	\N	\N	1
cmrhuv9uj007jqp8x01iudj7q	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	Pepper Chicken	\N	359.00	\N	\N	\N	\N	f	t	\N	39	0.00	\N	2026-07-12 13:55:05.755	2026-07-12 13:55:05.755	\N	\N	\N	1
cmrhuv9us007lqp8xpv9z7d08	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9i6004hqp8xgg5a1bh2	RR Chicken	\N	360.00	\N	\N	\N	\N	f	t	\N	40	0.00	\N	2026-07-12 13:55:05.764	2026-07-12 13:55:05.764	\N	\N	\N	1
cmrhuv9v0007nqp8xhk6951kn	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Apollo Fish	\N	299.00	\N	\N	\N	\N	f	t	\N	41	0.00	\N	2026-07-12 13:55:05.773	2026-07-12 13:55:05.773	\N	\N	\N	1
cmrhuv9vc007pqp8xcpixbyya	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Fish 65	\N	299.00	\N	\N	\N	\N	f	t	\N	42	0.00	\N	2026-07-12 13:55:05.784	2026-07-12 13:55:05.784	\N	\N	\N	1
cmrhuv9vn007rqp8xomhxfuv5	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Chilli Fish	\N	310.00	\N	\N	\N	\N	f	t	\N	43	0.00	\N	2026-07-12 13:55:05.795	2026-07-12 13:55:05.795	\N	\N	\N	1
cmrhuv9vy007tqp8x1xv5eyzs	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Fish Roast	\N	310.00	\N	\N	\N	\N	f	t	\N	44	0.00	\N	2026-07-12 13:55:05.806	2026-07-12 13:55:05.806	\N	\N	\N	1
cmrhuv9w9007vqp8xtrczdple	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Pepper Fish	\N	320.00	\N	\N	\N	\N	f	t	\N	45	0.00	\N	2026-07-12 13:55:05.817	2026-07-12 13:55:05.817	\N	\N	\N	1
cmrhuv9wk007xqp8xomak9bmh	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Fried Fish	\N	330.00	\N	\N	\N	\N	f	t	\N	46	0.00	\N	2026-07-12 13:55:05.828	2026-07-12 13:55:05.828	\N	\N	\N	1
cmrhuv9wt007zqp8xm2wkytie	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Pepper Prawns	\N	310.00	\N	\N	\N	\N	f	t	\N	47	0.00	\N	2026-07-12 13:55:05.837	2026-07-12 13:55:05.837	\N	\N	\N	1
cmrhuv9x40081qp8x5egnjxj9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Dragon Prawns	\N	310.00	\N	\N	\N	\N	f	t	\N	48	0.00	\N	2026-07-12 13:55:05.848	2026-07-12 13:55:05.848	\N	\N	\N	1
cmrhuv9xf0083qp8x8g01ipc5	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Loose Prawns	\N	320.00	\N	\N	\N	\N	f	t	\N	49	0.00	\N	2026-07-12 13:55:05.859	2026-07-12 13:55:05.859	\N	\N	\N	1
cmrhuv9xn0085qp8xlhjeito0	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Chilli Prawns	\N	320.00	\N	\N	\N	\N	f	t	\N	50	0.00	\N	2026-07-12 13:55:05.867	2026-07-12 13:55:05.867	\N	\N	\N	1
cmrhuv9xs0087qp8xud2ybf59	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ia004jqp8xjm424e0s	Golden Fried Prawns	\N	330.00	\N	\N	\N	\N	f	t	\N	51	0.00	\N	2026-07-12 13:55:05.872	2026-07-12 13:55:05.872	\N	\N	\N	1
cmrhuv9xy0089qp8x6xquqund	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Veg Mixed Curry	\N	120.00	\N	\N	\N	\N	t	t	\N	52	0.00	\N	2026-07-12 13:55:05.878	2026-07-12 13:55:05.878	\N	\N	\N	1
cmrhuv9y5008bqp8xjahofyf9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Paneer Butter Masala	\N	200.00	\N	\N	\N	\N	t	t	\N	53	0.00	\N	2026-07-12 13:55:05.885	2026-07-12 13:55:05.885	\N	\N	\N	1
cmrhuv9y9008dqp8xb2vqh9lp	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Mushroom Curry	\N	200.00	\N	\N	\N	\N	t	t	\N	54	0.00	\N	2026-07-12 13:55:05.89	2026-07-12 13:55:05.89	\N	\N	\N	1
cmrhuv9yg008fqp8x426v7ofq	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Kaju Curry	\N	240.00	\N	\N	\N	\N	t	t	\N	55	0.00	\N	2026-07-12 13:55:05.897	2026-07-12 13:55:05.897	\N	\N	\N	1
cmrhuv9yl008hqp8xzfs1o62d	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Methi Chaman Curry	\N	200.00	\N	\N	\N	\N	t	t	\N	56	0.00	\N	2026-07-12 13:55:05.902	2026-07-12 13:55:05.902	\N	\N	\N	1
cmrhuv9yq008jqp8x95i3nubh	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Palak Chaman Paneer	\N	200.00	\N	\N	\N	\N	t	t	\N	57	0.00	\N	2026-07-12 13:55:05.906	2026-07-12 13:55:05.906	\N	\N	\N	1
cmrhuv9yy008lqp8xt44cqc02	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Kaju Tomato Curry	\N	260.00	\N	\N	\N	\N	t	t	\N	58	0.00	\N	2026-07-12 13:55:05.914	2026-07-12 13:55:05.914	\N	\N	\N	1
cmrhuv9z2008nqp8xgawv5mdg	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ie004lqp8xpkgnjpjt	Kaju Paneer Curry	\N	270.00	\N	\N	\N	\N	t	t	\N	59	0.00	\N	2026-07-12 13:55:05.919	2026-07-12 13:55:05.919	\N	\N	\N	1
cmrhuv9z7008pqp8x4dvkk9pc	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Egg Curry	\N	160.00	\N	\N	\N	\N	f	t	\N	60	0.00	\N	2026-07-12 13:55:05.923	2026-07-12 13:55:05.923	\N	\N	\N	1
cmrhuv9zb008rqp8xb4dv5pfv	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Chicken Bone Curry	\N	200.00	\N	\N	\N	\N	f	t	\N	61	0.00	\N	2026-07-12 13:55:05.927	2026-07-12 13:55:05.927	\N	\N	\N	1
cmrhuv9zf008tqp8x8sqpx8px	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Chicken Boneless Curry	\N	220.00	\N	\N	\N	\N	f	t	\N	62	0.00	\N	2026-07-12 13:55:05.931	2026-07-12 13:55:05.931	\N	\N	\N	1
cmrhuv9zj008vqp8xchp8wu50	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Butter Chicken	\N	250.00	\N	\N	\N	\N	f	t	\N	63	0.00	\N	2026-07-12 13:55:05.936	2026-07-12 13:55:05.936	\N	\N	\N	1
cmrhuv9zo008xqp8xnw4uf7g9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Andhra Chicken	\N	250.00	\N	\N	\N	\N	f	t	\N	64	0.00	\N	2026-07-12 13:55:05.941	2026-07-12 13:55:05.941	\N	\N	\N	1
cmrhuv9zt008zqp8x8qb57yna	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Kadai Chicken	\N	260.00	\N	\N	\N	\N	f	t	\N	65	0.00	\N	2026-07-12 13:55:05.946	2026-07-12 13:55:05.946	\N	\N	\N	1
cmrhuva030091qp8xbx1i19fk	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Mogalai Chicken	\N	260.00	\N	\N	\N	\N	f	t	\N	66	0.00	\N	2026-07-12 13:55:05.956	2026-07-12 13:55:05.956	\N	\N	\N	1
cmrhuva0f0093qp8x5y9p04jn	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Mutton Curry	\N	330.00	\N	\N	\N	\N	f	t	\N	67	0.00	\N	2026-07-12 13:55:05.967	2026-07-12 13:55:05.967	\N	\N	\N	1
cmrhuva0o0095qp8xcodw1hkp	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Mutton Fry	\N	310.00	\N	\N	\N	\N	f	t	\N	68	0.00	\N	2026-07-12 13:55:05.976	2026-07-12 13:55:05.976	\N	\N	\N	1
cmrhuva110097qp8xaz2v6ls1	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Prawns Curry	\N	290.00	\N	\N	\N	\N	f	t	\N	69	0.00	\N	2026-07-12 13:55:05.989	2026-07-12 13:55:05.989	\N	\N	\N	1
cmrhuva1d0099qp8xwhszbbno	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Andhra Mutton	\N	330.00	\N	\N	\N	\N	f	t	\N	70	0.00	\N	2026-07-12 13:55:06.001	2026-07-12 13:55:06.001	\N	\N	\N	1
cmrhuva1o009bqp8xwd4wnuxc	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Gongura Mutton	\N	330.00	\N	\N	\N	\N	f	t	\N	71	0.00	\N	2026-07-12 13:55:06.012	2026-07-12 13:55:06.012	\N	\N	\N	1
cmrhuva20009dqp8xyu3siz5f	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Chicken Maharani	\N	310.00	\N	\N	\N	\N	f	t	\N	72	0.00	\N	2026-07-12 13:55:06.024	2026-07-12 13:55:06.024	\N	\N	\N	1
cmrhuva2c009fqp8xmr6luyji	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Mutton Maharani	\N	390.00	\N	\N	\N	\N	f	t	\N	73	0.00	\N	2026-07-12 13:55:06.036	2026-07-12 13:55:06.036	\N	\N	\N	1
cmrhuva2m009hqp8xfw0lp4y3	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Gongura Prawns	\N	310.00	\N	\N	\N	\N	f	t	\N	74	0.00	\N	2026-07-12 13:55:06.046	2026-07-12 13:55:06.046	\N	\N	\N	1
cmrhuva2x009jqp8xvv3do3zk	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ii004nqp8xxyibqb2p	Kadai Mutton	\N	340.00	\N	\N	\N	\N	f	t	\N	75	0.00	\N	2026-07-12 13:55:06.057	2026-07-12 13:55:06.057	\N	\N	\N	1
cmrhuva38009lqp8xzw66ptrq	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Tandoori Full (8 pcs)	\N	550.00	\N	\N	\N	\N	f	t	\N	76	0.00	\N	2026-07-12 13:55:06.068	2026-07-12 13:55:06.068	\N	\N	\N	1
cmrhuva3j009nqp8xh6y867jx	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Tandoori Half (4 pcs)	\N	280.00	\N	\N	\N	\N	f	t	\N	77	0.00	\N	2026-07-12 13:55:06.079	2026-07-12 13:55:06.079	\N	\N	\N	1
cmrhuva3s009pqp8xpsyn5jj8	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Chicken Tikka (8 pcs)	\N	300.00	\N	\N	\N	\N	f	t	\N	78	0.00	\N	2026-07-12 13:55:06.088	2026-07-12 13:55:06.088	\N	\N	\N	1
cmrhuva3y009rqp8xjanziuyf	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Tangdi Kebab Full (4 pcs)	\N	360.00	\N	\N	\N	\N	f	t	\N	79	0.00	\N	2026-07-12 13:55:06.094	2026-07-12 13:55:06.094	\N	\N	\N	1
cmrhuva49009tqp8xy42t3gpx	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Tangdi Kebab Half (2 pcs)	\N	180.00	\N	\N	\N	\N	f	t	\N	80	0.00	\N	2026-07-12 13:55:06.105	2026-07-12 13:55:06.105	\N	\N	\N	1
cmrhuva4k009vqp8xdpzsd7ax	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Hariyali Kebab	\N	280.00	\N	\N	\N	\N	f	t	\N	81	0.00	\N	2026-07-12 13:55:06.116	2026-07-12 13:55:06.116	\N	\N	\N	1
cmrhuva4v009xqp8xhvclsbh0	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Paneer Tikka	\N	280.00	\N	\N	\N	\N	t	t	\N	82	0.00	\N	2026-07-12 13:55:06.127	2026-07-12 13:55:06.127	\N	\N	\N	1
cmrhuva55009zqp8xsnkek2x9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Grill Chicken Full	\N	490.00	\N	\N	\N	\N	f	t	\N	83	0.00	\N	2026-07-12 13:55:06.137	2026-07-12 13:55:06.137	\N	\N	\N	1
cmrhuva5c00a1qp8x0tgtein0	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9im004pqp8xbh4koedq	Grill Chicken Half	\N	280.00	\N	\N	\N	\N	f	t	\N	84	0.00	\N	2026-07-12 13:55:06.145	2026-07-12 13:55:06.145	\N	\N	\N	1
cmrhuva5k00a3qp8xgqs7z0i1	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Jeera Rice	\N	160.00	\N	\N	\N	\N	t	t	\N	85	0.00	\N	2026-07-12 13:55:06.153	2026-07-12 13:55:06.153	\N	\N	\N	1
cmrhuva5u00a5qp8xe1f4ywqc	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Veg Fried Rice	\N	160.00	\N	\N	\N	\N	t	t	\N	86	0.00	\N	2026-07-12 13:55:06.162	2026-07-12 13:55:06.162	\N	\N	\N	1
cmrhuva6500a7qp8x3n01l9dr	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Egg Fried Rice	\N	170.00	\N	\N	\N	\N	f	t	\N	87	0.00	\N	2026-07-12 13:55:06.173	2026-07-12 13:55:06.173	\N	\N	\N	1
cmrhuva6g00a9qp8x46ibyva8	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Ghee Fried Rice	\N	190.00	\N	\N	\N	\N	t	t	\N	88	0.00	\N	2026-07-12 13:55:06.184	2026-07-12 13:55:06.184	\N	\N	\N	1
cmrhuva6r00abqp8x38h8xm8h	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Chicken Fried Rice	\N	220.00	\N	\N	\N	\N	f	t	\N	89	0.00	\N	2026-07-12 13:55:06.195	2026-07-12 13:55:06.195	\N	\N	\N	1
cmrhuva6y00adqp8x5rojg615	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Paneer Fried Rice	\N	220.00	\N	\N	\N	\N	t	t	\N	90	0.00	\N	2026-07-12 13:55:06.202	2026-07-12 13:55:06.202	\N	\N	\N	1
cmrhuva7300afqp8xq1vsgup5	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Paneer Special Fried Rice	\N	270.00	\N	\N	\N	\N	t	t	\N	91	0.00	\N	2026-07-12 13:55:06.207	2026-07-12 13:55:06.207	\N	\N	\N	1
cmrhuva7900ahqp8x11e0h7ra	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Mushroom Fried Rice	\N	230.00	\N	\N	\N	\N	t	t	\N	92	0.00	\N	2026-07-12 13:55:06.214	2026-07-12 13:55:06.214	\N	\N	\N	1
cmrhuva7f00ajqp8x7a45p1w7	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Chicken Noodles	\N	220.00	\N	\N	\N	\N	f	t	\N	93	0.00	\N	2026-07-12 13:55:06.219	2026-07-12 13:55:06.219	\N	\N	\N	1
cmrhuva7k00alqp8xres2w8vy	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Egg Noodles	\N	180.00	\N	\N	\N	\N	f	t	\N	94	0.00	\N	2026-07-12 13:55:06.224	2026-07-12 13:55:06.224	\N	\N	\N	1
cmrhuva7q00anqp8xwjecp32l	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Veg Noodles	\N	150.00	\N	\N	\N	\N	t	t	\N	95	0.00	\N	2026-07-12 13:55:06.23	2026-07-12 13:55:06.23	\N	\N	\N	1
cmrhuva7v00apqp8x6d6z7zue	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Kaju Fried Rice	\N	230.00	\N	\N	\N	\N	t	t	\N	96	0.00	\N	2026-07-12 13:55:06.235	2026-07-12 13:55:06.235	\N	\N	\N	1
cmrhuva8100arqp8xaepybt92	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Kaju Special Fried Rice	\N	260.00	\N	\N	\N	\N	t	t	\N	97	0.00	\N	2026-07-12 13:55:06.241	2026-07-12 13:55:06.241	\N	\N	\N	1
cmrhuva8700atqp8x9ofpiwy4	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Special Chicken Fried Rice	\N	270.00	\N	\N	\N	\N	f	t	\N	98	0.00	\N	2026-07-12 13:55:06.248	2026-07-12 13:55:06.248	\N	\N	\N	1
cmrhuva8d00avqp8xj1u8tofz	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Mixed Non-Veg Fried Rice	\N	350.00	\N	\N	\N	\N	t	t	\N	99	0.00	\N	2026-07-12 13:55:06.253	2026-07-12 13:55:06.253	\N	\N	\N	1
cmrhuva8i00axqp8xoqe8cf5l	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Mutton Fried Rice	\N	370.00	\N	\N	\N	\N	f	t	\N	100	0.00	\N	2026-07-12 13:55:06.258	2026-07-12 13:55:06.258	\N	\N	\N	1
cmrhuva8o00azqp8x01aeivda	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Prawns Fried Rice	\N	360.00	\N	\N	\N	\N	f	t	\N	101	0.00	\N	2026-07-12 13:55:06.265	2026-07-12 13:55:06.265	\N	\N	\N	1
cmrhuva8u00b1qp8xx0u4ycxb	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Curd Rice	\N	90.00	\N	\N	\N	\N	t	t	\N	102	0.00	\N	2026-07-12 13:55:06.27	2026-07-12 13:55:06.27	\N	\N	\N	1
cmrhuva9000b3qp8xhst0f72w	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Special Curd Rice	\N	120.00	\N	\N	\N	\N	t	t	\N	103	0.00	\N	2026-07-12 13:55:06.277	2026-07-12 13:55:06.277	\N	\N	\N	1
cmrhuva9600b5qp8xc5kge04b	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iq004rqp8xea0mmzjo	Steam Rice	\N	140.00	\N	\N	\N	\N	t	t	\N	104	0.00	\N	2026-07-12 13:55:06.283	2026-07-12 13:55:06.283	\N	\N	\N	1
cmrhuva9d00b7qp8xzmvz9xbf	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Pulka	\N	15.00	\N	\N	\N	\N	t	t	\N	105	0.00	\N	2026-07-12 13:55:06.289	2026-07-12 13:55:06.289	\N	\N	\N	1
cmrhuva9i00b9qp8xq5rs9f6m	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Tandoori Roti	\N	35.00	\N	\N	\N	\N	t	t	\N	106	0.00	\N	2026-07-12 13:55:06.294	2026-07-12 13:55:06.294	\N	\N	\N	1
cmrhuva9o00bbqp8x7cr8k96a	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Butter Roti	\N	40.00	\N	\N	\N	\N	t	t	\N	107	0.00	\N	2026-07-12 13:55:06.3	2026-07-12 13:55:06.3	\N	\N	\N	1
cmrhuva9t00bdqp8x3uvbr0fj	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Garlic Roti	\N	45.00	\N	\N	\N	\N	t	t	\N	108	0.00	\N	2026-07-12 13:55:06.306	2026-07-12 13:55:06.306	\N	\N	\N	1
cmrhuvaa000bfqp8xw04t95i1	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Butter Naan	\N	45.00	\N	\N	\N	\N	t	t	\N	109	0.00	\N	2026-07-12 13:55:06.312	2026-07-12 13:55:06.312	\N	\N	\N	1
cmrhuvaa500bhqp8xmppz6i0u	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Garlic Naan	\N	50.00	\N	\N	\N	\N	t	t	\N	110	0.00	\N	2026-07-12 13:55:06.318	2026-07-12 13:55:06.318	\N	\N	\N	1
cmrhuvaad00bjqp8xnjjf0ogq	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Aloo Kulcha	\N	80.00	\N	\N	\N	\N	t	t	\N	111	0.00	\N	2026-07-12 13:55:06.325	2026-07-12 13:55:06.325	\N	\N	\N	1
cmrhuvaaj00blqp8xngtk0nov	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Paneer Kulcha	\N	100.00	\N	\N	\N	\N	t	t	\N	112	0.00	\N	2026-07-12 13:55:06.332	2026-07-12 13:55:06.332	\N	\N	\N	1
cmrhuvaaq00bnqp8xyk8qrrml	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Masala Kulcha	\N	100.00	\N	\N	\N	\N	t	t	\N	113	0.00	\N	2026-07-12 13:55:06.339	2026-07-12 13:55:06.339	\N	\N	\N	1
cmrhuvaax00bpqp8x3edf3s3j	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iu004tqp8xdtl8ytxe	Chicken Kulcha	\N	120.00	\N	\N	\N	\N	t	t	\N	114	0.00	\N	2026-07-12 13:55:06.345	2026-07-12 13:55:06.345	\N	\N	\N	1
cmrhuvab700brqp8xvl00ws76	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Veg Biryani	\N	189.00	\N	\N	\N	\N	t	t	\N	115	0.00	\N	2026-07-12 13:55:06.355	2026-07-12 13:55:06.355	\N	\N	\N	1
cmrhuvabi00btqp8x3du33fjg	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Gongura Biryani	\N	189.00	\N	\N	\N	\N	t	t	\N	116	0.00	\N	2026-07-12 13:55:06.366	2026-07-12 13:55:06.366	\N	\N	\N	1
cmrhuvabs00bvqp8xks1ts3g5	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Egg Biryani	\N	240.00	\N	\N	\N	\N	t	t	\N	117	0.00	\N	2026-07-12 13:55:06.376	2026-07-12 13:55:06.376	\N	\N	\N	1
cmrhuvac200bxqp8xbydyt045	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Paneer Biryani	\N	270.00	\N	\N	\N	\N	t	t	\N	118	0.00	\N	2026-07-12 13:55:06.386	2026-07-12 13:55:06.386	\N	\N	\N	1
cmrhuvacd00bzqp8x5v1n7b5m	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Mushroom Biryani	\N	270.00	\N	\N	\N	\N	t	t	\N	119	0.00	\N	2026-07-12 13:55:06.397	2026-07-12 13:55:06.397	\N	\N	\N	1
cmrhuvacn00c1qp8x4ieiq452	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Kaju Biryani	\N	270.00	\N	\N	\N	\N	t	t	\N	120	0.00	\N	2026-07-12 13:55:06.407	2026-07-12 13:55:06.407	\N	\N	\N	1
cmrhuvacy00c3qp8xgsnjkddz	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Kaju Special Biryani	\N	299.00	\N	\N	\N	\N	t	t	\N	121	0.00	\N	2026-07-12 13:55:06.418	2026-07-12 13:55:06.418	\N	\N	\N	1
cmrhuvad600c5qp8x43ftv9km	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9iy004vqp8x795pk88z	Paneer Kaju Biryani	\N	320.00	\N	\N	\N	\N	t	t	\N	122	0.00	\N	2026-07-12 13:55:06.427	2026-07-12 13:55:06.427	\N	\N	\N	1
cmrhuvade00c7qp8xcieq0m4e	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Mini Dum Biryani	\N	160.00	\N	\N	\N	\N	f	t	\N	123	0.00	\N	2026-07-12 13:55:06.434	2026-07-12 13:55:06.434	\N	\N	\N	1
cmrhuvadm00c9qp8xondvi3rs	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Dum Biryani	\N	260.00	\N	\N	\N	\N	f	t	\N	124	0.00	\N	2026-07-12 13:55:06.442	2026-07-12 13:55:06.442	\N	\N	\N	1
cmrhuvadt00cbqp8x3sjlzcpd	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Mini Fry Piece Biryani	\N	170.00	\N	\N	\N	\N	f	t	\N	125	0.00	\N	2026-07-12 13:55:06.449	2026-07-12 13:55:06.449	\N	\N	\N	1
cmrhuvae000cdqp8xa1uptsse	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Fry Piece Biryani	\N	270.00	\N	\N	\N	\N	f	t	\N	126	0.00	\N	2026-07-12 13:55:06.456	2026-07-12 13:55:06.456	\N	\N	\N	1
cmrhuvae800cfqp8xtgceqmb2	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Hungry Island Special Biryani (Bone)	\N	280.00	\N	\N	\N	\N	f	t	\N	127	0.00	\N	2026-07-12 13:55:06.464	2026-07-12 13:55:06.464	\N	\N	\N	1
cmrhuvaeg00chqp8xccjffpx5	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Hungry Island Special Biryani (Boneless)	\N	300.00	\N	\N	\N	\N	f	t	\N	128	0.00	\N	2026-07-12 13:55:06.472	2026-07-12 13:55:06.472	\N	\N	\N	1
cmrhuvaen00cjqp8xbbdtrowg	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Joint Biryani	\N	269.00	\N	\N	\N	\N	f	t	\N	129	0.00	\N	2026-07-12 13:55:06.48	2026-07-12 13:55:06.48	\N	\N	\N	1
cmrhuvaew00clqp8xtfjfnx0z	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Kothimeera Biryani	\N	269.00	\N	\N	\N	\N	f	t	\N	130	0.00	\N	2026-07-12 13:55:06.488	2026-07-12 13:55:06.488	\N	\N	\N	1
cmrhuvaf300cnqp8xk6o6tk3y	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Mogalai Biryani	\N	289.00	\N	\N	\N	\N	f	t	\N	131	0.00	\N	2026-07-12 13:55:06.495	2026-07-12 13:55:06.495	\N	\N	\N	1
cmrhuvafc00cpqp8xdhj84vsq	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Gongura Biryani	\N	290.00	\N	\N	\N	\N	f	t	\N	132	0.00	\N	2026-07-12 13:55:06.504	2026-07-12 13:55:06.504	\N	\N	\N	1
cmrhuvafk00crqp8x42av17t0	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Lollipop Biryani	\N	300.00	\N	\N	\N	\N	f	t	\N	133	0.00	\N	2026-07-12 13:55:06.513	2026-07-12 13:55:06.513	\N	\N	\N	1
cmrhuvafs00ctqp8xhi2ummbe	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Wings Biryani	\N	300.00	\N	\N	\N	\N	f	t	\N	134	0.00	\N	2026-07-12 13:55:06.52	2026-07-12 13:55:06.52	\N	\N	\N	1
cmrhuvag000cvqp8xi4swisod	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Tikka Biryani	\N	320.00	\N	\N	\N	\N	f	t	\N	135	0.00	\N	2026-07-12 13:55:06.528	2026-07-12 13:55:06.528	\N	\N	\N	1
cmrhuvag700cxqp8x8906ivmo	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Kings Biryani	\N	339.00	\N	\N	\N	\N	f	t	\N	136	0.00	\N	2026-07-12 13:55:06.535	2026-07-12 13:55:06.535	\N	\N	\N	1
cmrhuvagf00czqp8xtx17umww	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Fish Juicy Biryani	\N	340.00	\N	\N	\N	\N	f	t	\N	137	0.00	\N	2026-07-12 13:55:06.543	2026-07-12 13:55:06.543	\N	\N	\N	1
cmrhuvagm00d1qp8xkiw3sz6v	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Prawns Biryani	\N	349.00	\N	\N	\N	\N	f	t	\N	138	0.00	\N	2026-07-12 13:55:06.55	2026-07-12 13:55:06.55	\N	\N	\N	1
cmrhuvagu00d3qp8xtve0gzem	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Gongura Prawns Biryani	\N	349.00	\N	\N	\N	\N	f	t	\N	139	0.00	\N	2026-07-12 13:55:06.558	2026-07-12 13:55:06.558	\N	\N	\N	1
cmrhuvah200d5qp8x2wltva43	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Gongura Mutton Biryani	\N	369.00	\N	\N	\N	\N	f	t	\N	140	0.00	\N	2026-07-12 13:55:06.566	2026-07-12 13:55:06.566	\N	\N	\N	1
cmrhuvaha00d7qp8xqp5vdzsl	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Mutton Biryani	\N	379.00	\N	\N	\N	\N	f	t	\N	141	0.00	\N	2026-07-12 13:55:06.575	2026-07-12 13:55:06.575	\N	\N	\N	1
cmrhuvahi00d9qp8xbibh4a79	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j2004xqp8xne8cvt1j	Rambo Biryani	\N	389.00	\N	\N	\N	\N	f	t	\N	142	0.00	\N	2026-07-12 13:55:06.582	2026-07-12 13:55:06.582	\N	\N	\N	1
cmrhuvahq00dbqp8xhjp0se7l	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Afgani Biryani	\N	310.00	\N	\N	\N	\N	f	t	\N	143	0.00	\N	2026-07-12 13:55:06.59	2026-07-12 13:55:06.59	\N	\N	\N	1
cmrhuvahz00ddqp8xe4ijr03z	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Dilkush Biryani	\N	320.00	\N	\N	\N	\N	t	t	\N	144	0.00	\N	2026-07-12 13:55:06.599	2026-07-12 13:55:06.599	\N	\N	\N	1
cmrhuvai800dfqp8xw4qvf6qd	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Tangdi Biryani	\N	320.00	\N	\N	\N	\N	f	t	\N	145	0.00	\N	2026-07-12 13:55:06.608	2026-07-12 13:55:06.608	\N	\N	\N	1
cmrhuvaif00dhqp8xvr8nvut4	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Chicken Maharaja Biryani	\N	340.00	\N	\N	\N	\N	f	t	\N	146	0.00	\N	2026-07-12 13:55:06.616	2026-07-12 13:55:06.616	\N	\N	\N	1
cmrhuvain00djqp8xxi1zfqdx	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Punjabi Chicken Biryani	\N	350.00	\N	\N	\N	\N	f	t	\N	147	0.00	\N	2026-07-12 13:55:06.623	2026-07-12 13:55:06.623	\N	\N	\N	1
cmrhuvaiv00dlqp8xz7auivx9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Andhra Mutton Biryani	\N	390.00	\N	\N	\N	\N	f	t	\N	148	0.00	\N	2026-07-12 13:55:06.631	2026-07-12 13:55:06.631	\N	\N	\N	1
cmrhuvaj300dnqp8x51dfpq1h	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Mutton Kheema Biryani	\N	399.00	\N	\N	\N	\N	f	t	\N	149	0.00	\N	2026-07-12 13:55:06.64	2026-07-12 13:55:06.64	\N	\N	\N	1
cmrhuvajc00dpqp8x0j9biz6g	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Mixed Non-Veg Biryani	\N	399.00	\N	\N	\N	\N	t	t	\N	150	0.00	\N	2026-07-12 13:55:06.648	2026-07-12 13:55:06.648	\N	\N	\N	1
cmrhuvajk00drqp8xzucll240	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9j6004zqp8xiimy3gxy	Mutton Maharaja Biryani	\N	420.00	\N	\N	\N	\N	f	t	\N	151	0.00	\N	2026-07-12 13:55:06.656	2026-07-12 13:55:06.656	\N	\N	\N	1
cmrhuvajr00dtqp8xqxqalwso	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Veg Family Pack	\N	549.00	\N	\N	\N	\N	t	t	\N	152	0.00	\N	2026-07-12 13:55:06.664	2026-07-12 13:55:06.664	\N	\N	\N	1
cmrhuvak000dvqp8xxtjs0m84	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Paneer Family Pack	\N	549.00	\N	\N	\N	\N	t	t	\N	153	0.00	\N	2026-07-12 13:55:06.672	2026-07-12 13:55:06.672	\N	\N	\N	1
cmrhuvak900dxqp8xf1d96dpx	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Mushroom Family Pack	\N	549.00	\N	\N	\N	\N	t	t	\N	154	0.00	\N	2026-07-12 13:55:06.681	2026-07-12 13:55:06.681	\N	\N	\N	1
cmrhuvakk00dzqp8xaaupxt1b	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Chicken Dum Family Pack	\N	650.00	\N	\N	\N	\N	f	t	\N	155	0.00	\N	2026-07-12 13:55:06.693	2026-07-12 13:55:06.693	\N	\N	\N	1
cmrhuvakv00e1qp8xmb6bawoe	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Chicken Fry Family Pack	\N	650.00	\N	\N	\N	\N	f	t	\N	156	0.00	\N	2026-07-12 13:55:06.703	2026-07-12 13:55:06.703	\N	\N	\N	1
cmrhuval500e3qp8xx11asxjl	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Chicken Wing Family Pack	\N	650.00	\N	\N	\N	\N	f	t	\N	157	0.00	\N	2026-07-12 13:55:06.714	2026-07-12 13:55:06.714	\N	\N	\N	1
cmrhuvalg00e5qp8xqsfabnky	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Chicken Lollipop Family Pack	\N	650.00	\N	\N	\N	\N	f	t	\N	158	0.00	\N	2026-07-12 13:55:06.724	2026-07-12 13:55:06.724	\N	\N	\N	1
cmrhuvalr00e7qp8xi23o77s2	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Mutton Fry Family Pack	\N	900.00	\N	\N	\N	\N	f	t	\N	159	0.00	\N	2026-07-12 13:55:06.735	2026-07-12 13:55:06.735	\N	\N	\N	1
cmrhuvam000e9qp8xwh8ts517	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9ja0051qp8xv1btpm9e	Kumbakarna Family Pack	\N	890.00	\N	\N	\N	\N	f	t	\N	160	0.00	\N	2026-07-12 13:55:06.744	2026-07-12 13:55:06.744	\N	\N	\N	1
cmrhuvam900ebqp8x4i8oynxb	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Regular Shawarma	\N	120.00	\N	\N	\N	\N	f	t	\N	161	0.00	\N	2026-07-12 13:55:06.753	2026-07-12 13:55:06.753	\N	\N	\N	1
cmrhuvami00edqp8xucau09pc	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Special Shawarma	\N	140.00	\N	\N	\N	\N	f	t	\N	162	0.00	\N	2026-07-12 13:55:06.762	2026-07-12 13:55:06.762	\N	\N	\N	1
cmrhuvamq00efqp8x27ri7yic	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Spicy Chicken Shawarma	\N	140.00	\N	\N	\N	\N	f	t	\N	163	0.00	\N	2026-07-12 13:55:06.77	2026-07-12 13:55:06.77	\N	\N	\N	1
cmrhuvamx00ehqp8x6in0deje	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Schezwan Shawarma	\N	140.00	\N	\N	\N	\N	f	t	\N	164	0.00	\N	2026-07-12 13:55:06.777	2026-07-12 13:55:06.777	\N	\N	\N	1
cmrhuvan400ejqp8xmhiot66e	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Mint Mayo Shawarma	\N	140.00	\N	\N	\N	\N	f	t	\N	165	0.00	\N	2026-07-12 13:55:06.784	2026-07-12 13:55:06.784	\N	\N	\N	1
cmrhuvanb00elqp8xvi3e56l3	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Sweet Chilli Shawarma	\N	140.00	\N	\N	\N	\N	f	t	\N	166	0.00	\N	2026-07-12 13:55:06.791	2026-07-12 13:55:06.791	\N	\N	\N	1
cmrhuvank00enqp8xw3glu1pw	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Chicken Peri Peri Shawarma	\N	140.00	\N	\N	\N	\N	f	t	\N	167	0.00	\N	2026-07-12 13:55:06.8	2026-07-12 13:55:06.8	\N	\N	\N	1
cmrhuvanr00epqp8xzacdextd	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Cheese & Spice Shawarma	\N	160.00	\N	\N	\N	\N	f	t	\N	168	0.00	\N	2026-07-12 13:55:06.807	2026-07-12 13:55:06.807	\N	\N	\N	1
cmrhuvanz00erqp8xfhkypkru	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Special Chicken Plate Shawarma	\N	169.00	\N	\N	\N	\N	f	t	\N	169	0.00	\N	2026-07-12 13:55:06.815	2026-07-12 13:55:06.815	\N	\N	\N	1
cmrhuvao700etqp8xiurcu5yt	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Fully Loaded Chicken Shawarma	\N	180.00	\N	\N	\N	\N	f	t	\N	170	0.00	\N	2026-07-12 13:55:06.823	2026-07-12 13:55:06.823	\N	\N	\N	1
cmrhuvaog00evqp8xcu44lpp1	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Special Kaju Shawarma	\N	180.00	\N	\N	\N	\N	f	t	\N	171	0.00	\N	2026-07-12 13:55:06.832	2026-07-12 13:55:06.832	\N	\N	\N	1
cmrhuvaon00exqp8xzvzlf4cy	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9je0053qp8xqdi6axgn	Chilli Chicken Shawarma	\N	220.00	\N	\N	\N	\N	f	t	\N	172	0.00	\N	2026-07-12 13:55:06.839	2026-07-12 13:55:06.839	\N	\N	\N	1
cmrhuvaou00ezqp8xgtj9ohd9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Tandoori Mandi Full	\N	880.00	\N	\N	\N	\N	f	t	\N	173	0.00	\N	2026-07-12 13:55:06.847	2026-07-12 13:55:06.847	\N	\N	\N	1
cmrhuvap200f1qp8xqttqy9gb	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Tandoori Mandi Half	\N	490.00	\N	\N	\N	\N	f	t	\N	174	0.00	\N	2026-07-12 13:55:06.854	2026-07-12 13:55:06.854	\N	\N	\N	1
cmrhuvapa00f3qp8x978qx5u6	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Juicy Mandi Full	\N	880.00	\N	\N	\N	\N	f	t	\N	175	0.00	\N	2026-07-12 13:55:06.863	2026-07-12 13:55:06.863	\N	\N	\N	1
cmrhuvapj00f5qp8x7v1v3sai	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Juicy Mandi Half	\N	490.00	\N	\N	\N	\N	f	t	\N	176	0.00	\N	2026-07-12 13:55:06.871	2026-07-12 13:55:06.871	\N	\N	\N	1
cmrhuvapp00f7qp8x8uvv5m0t	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Afgani Mandi Full	\N	999.00	\N	\N	\N	\N	f	t	\N	177	0.00	\N	2026-07-12 13:55:06.877	2026-07-12 13:55:06.877	\N	\N	\N	1
cmrhuvapv00f9qp8xidpxnemx	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Afgani Mandi Half	\N	560.00	\N	\N	\N	\N	f	t	\N	178	0.00	\N	2026-07-12 13:55:06.883	2026-07-12 13:55:06.883	\N	\N	\N	1
cmrhuvaq000fbqp8xav6yi9k9	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Lollipop Mandi Full	\N	1120.00	\N	\N	\N	\N	f	t	\N	179	0.00	\N	2026-07-12 13:55:06.889	2026-07-12 13:55:06.889	\N	\N	\N	1
cmrhuvaq500fdqp8x8adwlbvl	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Lollipop Mandi Half	\N	600.00	\N	\N	\N	\N	f	t	\N	180	0.00	\N	2026-07-12 13:55:06.893	2026-07-12 13:55:06.893	\N	\N	\N	1
cmrhuvaq900ffqp8xnqlu7w2g	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Prawns Juicy Mandi Full	\N	1200.00	\N	\N	\N	\N	f	t	\N	181	0.00	\N	2026-07-12 13:55:06.898	2026-07-12 13:55:06.898	\N	\N	\N	1
cmrhuvaqe00fhqp8xshcbjfae	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Prawns Juicy Mandi Half	\N	650.00	\N	\N	\N	\N	f	t	\N	182	0.00	\N	2026-07-12 13:55:06.903	2026-07-12 13:55:06.903	\N	\N	\N	1
cmrhuvaqj00fjqp8xftcxt94l	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Mutton Juicy Mandi Full	\N	1300.00	\N	\N	\N	\N	f	t	\N	183	0.00	\N	2026-07-12 13:55:06.907	2026-07-12 13:55:06.907	\N	\N	\N	1
cmrhuvaqo00flqp8xwillsact	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Mutton Juicy Mandi Half	\N	700.00	\N	\N	\N	\N	f	t	\N	184	0.00	\N	2026-07-12 13:55:06.912	2026-07-12 13:55:06.912	\N	\N	\N	1
cmrhuvaqt00fnqp8x0pf6bnet	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Fish Juicy Mandi Full	\N	1200.00	\N	\N	\N	\N	f	t	\N	185	0.00	\N	2026-07-12 13:55:06.917	2026-07-12 13:55:06.917	\N	\N	\N	1
cmrhuvaqy00fpqp8xugo12zc2	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Fish Juicy Mandi Half	\N	650.00	\N	\N	\N	\N	f	t	\N	186	0.00	\N	2026-07-12 13:55:06.922	2026-07-12 13:55:06.922	\N	\N	\N	1
cmrhuvar300frqp8x0p3tzq7e	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Mixed Non-Veg Mandi Full	\N	1200.00	\N	\N	\N	\N	t	t	\N	187	0.00	\N	2026-07-12 13:55:06.927	2026-07-12 13:55:06.927	\N	\N	\N	1
cmrhuvar800ftqp8xmqcyqc41	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Mixed Non-Veg Mandi Half	\N	700.00	\N	\N	\N	\N	t	t	\N	188	0.00	\N	2026-07-12 13:55:06.932	2026-07-12 13:55:06.932	\N	\N	\N	1
cmrhuvard00fvqp8xpaie0ajw	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Special Ghatotkacha Mandi	\N	1500.00	\N	\N	\N	\N	f	t	\N	189	0.00	\N	2026-07-12 13:55:06.937	2026-07-12 13:55:06.937	\N	\N	\N	1
cmrhuvari00fxqp8xzledqv5v	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Paneer Mandi Full	\N	1000.00	\N	\N	\N	\N	t	t	\N	190	0.00	\N	2026-07-12 13:55:06.942	2026-07-12 13:55:06.942	\N	\N	\N	1
cmrhuvarp00fzqp8xpwou1jym	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jj0055qp8xygu6fokc	Paneer Mandi Half	\N	550.00	\N	\N	\N	\N	t	t	\N	191	0.00	\N	2026-07-12 13:55:06.949	2026-07-12 13:55:06.949	\N	\N	\N	1
cmrhuvarv00g1qp8xgocztchv	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Topical Fizz	\N	120.00	\N	\N	\N	\N	t	t	\N	192	0.00	\N	2026-07-12 13:55:06.955	2026-07-12 13:55:06.955	\N	\N	\N	1
cmrhuvas300g3qp8x2vai38sj	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Guava Salsa	\N	120.00	\N	\N	\N	\N	t	t	\N	193	0.00	\N	2026-07-12 13:55:06.963	2026-07-12 13:55:06.963	\N	\N	\N	1
cmrhuvasb00g5qp8x7e29m938	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Virgin Mojito	\N	90.00	\N	\N	\N	\N	t	t	\N	194	0.00	\N	2026-07-12 13:55:06.971	2026-07-12 13:55:06.971	\N	\N	\N	1
cmrhuvasm00g7qp8xrtyiva1w	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Blue Lagoon	\N	90.00	\N	\N	\N	\N	t	t	\N	195	0.00	\N	2026-07-12 13:55:06.982	2026-07-12 13:55:06.982	\N	\N	\N	1
cmrhuvasw00g9qp8x9m53o2tz	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Lemon Ginger	\N	90.00	\N	\N	\N	\N	t	t	\N	196	0.00	\N	2026-07-12 13:55:06.993	2026-07-12 13:55:06.993	\N	\N	\N	1
cmrhuvat900gbqp8xeo66g0y0	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Orange Blast	\N	90.00	\N	\N	\N	\N	t	t	\N	197	0.00	\N	2026-07-12 13:55:07.005	2026-07-12 13:55:07.005	\N	\N	\N	1
cmrhuvatl00gdqp8x9m52w9rv	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Honey Lemon	\N	90.00	\N	\N	\N	\N	t	t	\N	198	0.00	\N	2026-07-12 13:55:07.017	2026-07-12 13:55:07.017	\N	\N	\N	1
cmrhuvatv00gfqp8xcupa420p	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Mango Crush	\N	90.00	\N	\N	\N	\N	t	t	\N	199	0.00	\N	2026-07-12 13:55:07.027	2026-07-12 13:55:07.027	\N	\N	\N	1
cmrhuvau700ghqp8xhvbmf68p	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Strawberry Crush	\N	90.00	\N	\N	\N	\N	t	t	\N	200	0.00	\N	2026-07-12 13:55:07.039	2026-07-12 13:55:07.039	\N	\N	\N	1
cmrhuvauh00gjqp8xexyuzymx	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Mango Lassi	\N	100.00	\N	\N	\N	\N	t	t	\N	201	0.00	\N	2026-07-12 13:55:07.049	2026-07-12 13:55:07.049	\N	\N	\N	1
cmrhuvaut00glqp8xd39c726a	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Rose Lassi	\N	100.00	\N	\N	\N	\N	t	t	\N	202	0.00	\N	2026-07-12 13:55:07.061	2026-07-12 13:55:07.061	\N	\N	\N	1
cmrhuvav400gnqp8xdj3oklpw	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Buttermilk	\N	40.00	\N	\N	\N	\N	t	t	\N	203	0.00	\N	2026-07-12 13:55:07.072	2026-07-12 13:55:07.072	\N	\N	\N	1
cmrhuvava00gpqp8xja1momu0	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Sweet Soda	\N	40.00	\N	\N	\N	\N	t	t	\N	204	0.00	\N	2026-07-12 13:55:07.078	2026-07-12 13:55:07.078	\N	\N	\N	1
cmrhuvavg00grqp8x1igui680	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Salt Soda	\N	40.00	\N	\N	\N	\N	t	t	\N	205	0.00	\N	2026-07-12 13:55:07.084	2026-07-12 13:55:07.084	\N	\N	\N	1
cmrhuvavm00gtqp8xdqvpjuwg	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Chocolate Milk Shake	\N	120.00	\N	\N	\N	\N	t	t	\N	206	0.00	\N	2026-07-12 13:55:07.09	2026-07-12 13:55:07.09	\N	\N	\N	1
cmrhuvavs00gvqp8x5usmhans	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Strawberry Shake	\N	120.00	\N	\N	\N	\N	t	t	\N	207	0.00	\N	2026-07-12 13:55:07.096	2026-07-12 13:55:07.096	\N	\N	\N	1
cmrhuvavx00gxqp8xzson3crt	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Rose Milk Shake	\N	120.00	\N	\N	\N	\N	t	t	\N	208	0.00	\N	2026-07-12 13:55:07.102	2026-07-12 13:55:07.102	\N	\N	\N	1
cmrhuvaw300gzqp8xy3nnxsmg	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jp0057qp8xkusb4s87	Lassi	\N	60.00	\N	\N	\N	\N	t	t	\N	209	0.00	\N	2026-07-12 13:55:07.108	2026-07-12 13:55:07.108	\N	\N	\N	1
cmrhuvawa00h1qp8xm2lst607	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jv0059qp8xdtcck2gk	Vanilla	\N	75.00	\N	\N	\N	\N	t	t	\N	210	0.00	\N	2026-07-12 13:55:07.114	2026-07-12 13:55:07.114	\N	\N	\N	1
cmrhuvawg00h3qp8x1cwpdwoz	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jv0059qp8xdtcck2gk	Strawberry	\N	75.00	\N	\N	\N	\N	t	t	\N	211	0.00	\N	2026-07-12 13:55:07.12	2026-07-12 13:55:07.12	\N	\N	\N	1
cmrhuvawl00h5qp8x8px5m623	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jv0059qp8xdtcck2gk	Pista	\N	85.00	\N	\N	\N	\N	t	t	\N	212	0.00	\N	2026-07-12 13:55:07.126	2026-07-12 13:55:07.126	\N	\N	\N	1
cmrhuvawr00h7qp8xnnikjbtp	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jv0059qp8xdtcck2gk	Butter Scotch	\N	95.00	\N	\N	\N	\N	t	t	\N	213	0.00	\N	2026-07-12 13:55:07.131	2026-07-12 13:55:07.131	\N	\N	\N	1
cmrhuvaww00h9qp8xn9g79o8w	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jv0059qp8xdtcck2gk	Chocolate	\N	95.00	\N	\N	\N	\N	t	t	\N	214	0.00	\N	2026-07-12 13:55:07.137	2026-07-12 13:55:07.137	\N	\N	\N	1
cmrhuvax100hbqp8xlintq6wc	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9jv0059qp8xdtcck2gk	Ultimate Sundae	\N	130.00	\N	\N	\N	\N	t	t	\N	215	0.00	\N	2026-07-12 13:55:07.142	2026-07-12 13:55:07.142	\N	\N	\N	1
cmrhuvax700hdqp8xkutk95wi	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9k1005bqp8x4c12zerj	Thums Up 250ml (MRP)	\N	20.00	\N	\N	\N	\N	t	t	\N	216	0.00	\N	2026-07-12 13:55:07.147	2026-07-12 13:55:07.147	\N	\N	\N	1
cmrhuvaxe00hfqp8x69e3fw50	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9k1005bqp8x4c12zerj	Sprite 250ml (MRP)	\N	20.00	\N	\N	\N	\N	t	t	\N	217	0.00	\N	2026-07-12 13:55:07.155	2026-07-12 13:55:07.155	\N	\N	\N	1
cmrhuvaxn00hhqp8x6byk6fer	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9k1005bqp8x4c12zerj	Coca-Cola 250ml (MRP)	\N	20.00	\N	\N	\N	\N	t	t	\N	218	0.00	\N	2026-07-12 13:55:07.163	2026-07-12 13:55:07.163	\N	\N	\N	1
cmrhuvaxx00hjqp8xdb6woumk	cmrhuv97r001kqp8xz7rdz80e	cmrhuv9k1005bqp8x4c12zerj	Water Bottle 500ml (MRP)	\N	20.00	\N	\N	\N	\N	t	t	\N	219	0.00	\N	2026-07-12 13:55:07.173	2026-07-12 13:55:07.173	\N	\N	\N	1
cmrhxn4fv006xqp3ugypqy8r5	cmrhxn4cx003gqp3u5qvkc9i2	cmrhxn4fh006vqp3uj6oam1yd	Test Pizza	Test description	299.00	\N	\N	\N	\N	t	t	\N	0	0.00	\N	2026-07-12 15:12:44.347	2026-07-12 15:12:44.347	\N	\N	\N	1
cmrhxx2k7003hqpew39holakb	cmrhxx2f90000qpewqu3qsi52	cmrhxx2ji003fqpewahs3aoz4	Margherita Pizza	Classic cheese pizza with basil	299.00	\N	\N	\N	\N	t	t	15	0	0.00	\N	2026-07-12 15:20:28.471	2026-07-12 15:20:28.471	\N	\N	\N	1
cmrhxx2kz003jqpewlx43g9ol	cmrhxx2f90000qpewqu3qsi52	cmrhxx2ji003fqpewahs3aoz4	Pepperoni Pizza	Loaded with pepperoni	399.00	\N	\N	\N	\N	f	t	20	0	0.00	\N	2026-07-12 15:20:28.499	2026-07-12 15:20:28.499	\N	\N	\N	1
cmrhxx2lj003lqpew8o2qebvj	cmrhxx2f90000qpewqu3qsi52	cmrhxx2ji003fqpewahs3aoz4	Caesar Salad	Fresh romaine with parmesan	199.00	\N	\N	\N	\N	t	t	10	0	0.00	\N	2026-07-12 15:20:28.519	2026-07-12 15:20:28.519	\N	\N	\N	1
\.


--
-- Data for Name: order_item_add_ons; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.order_item_add_ons (id, "orderItemId", name, price) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.order_items (id, "orderId", "menuItemId", "variantId", name, quantity, "unitPrice", "totalPrice", notes, status, "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.order_status_history (id, "orderId", status, notes, "createdAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.orders (id, "branchId", "tableId", "staffId", "orderNumber", type, status, "customerName", "customerPhone", "guestCount", subtotal, "taxAmount", "discountAmount", "totalAmount", notes, "kotPrinted", synced, "localId", "createdAt", "updatedAt", "createdBy", "deletedAt", "tenantId", version) FROM stdin;
\.


--
-- Data for Name: payment_promises; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.payment_promises (id, "tenantId", "subscriptionId", reason, "expectedDate", status, "approvedBy", "approvedAt", notes, "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.payments (id, "orderId", "branchId", method, amount, reference, status, "receivedAt", "createdAt", "createdBy", "deletedAt", "updatedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.permissions (id, module, action, description) FROM stdin;
cmrhuv8wl0000qp8xukg1gxvz	dashboard	create	create dashboard
cmrhuv8wv0001qp8xd6v38fr5	dashboard	read	read dashboard
cmrhuv8x30002qp8x63mor7np	dashboard	update	update dashboard
cmrhuv8xd0003qp8xar4cz465	dashboard	delete	delete dashboard
cmrhuv8xm0004qp8xu1tfphaz	orders	create	create orders
cmrhuv8xv0005qp8xvl6qzs6u	orders	read	read orders
cmrhuv8y40006qp8xtdth2c0k	orders	update	update orders
cmrhuv8yc0007qp8x3p912eha	orders	delete	delete orders
cmrhuv8yk0008qp8xy5tzfke8	menu	create	create menu
cmrhuv8yt0009qp8x986wo2s2	menu	read	read menu
cmrhuv8z2000aqp8xa5yhldo0	menu	update	update menu
cmrhuv8za000bqp8xgqjufrt0	menu	delete	delete menu
cmrhuv8zj000cqp8xfk554q31	tables	create	create tables
cmrhuv8zs000dqp8xmacewbat	tables	read	read tables
cmrhuv8zz000eqp8xycxacj4m	tables	update	update tables
cmrhuv909000fqp8xjx3wuedx	tables	delete	delete tables
cmrhuv90i000gqp8xscw12weh	inventory	create	create inventory
cmrhuv90q000hqp8xe0urpwi3	inventory	read	read inventory
cmrhuv90z000iqp8xnfd76cm3	inventory	update	update inventory
cmrhuv918000jqp8xfati2kdp	inventory	delete	delete inventory
cmrhuv91h000kqp8x8kwa11ht	payments	create	create payments
cmrhuv91p000lqp8xa5e83v0w	payments	read	read payments
cmrhuv920000mqp8xhf6dmaei	payments	update	update payments
cmrhuv929000nqp8xeesxkdmv	payments	delete	delete payments
cmrhuv92i000oqp8xkk8afbjt	invoices	create	create invoices
cmrhuv92q000pqp8xtv63d0tn	invoices	read	read invoices
cmrhuv92z000qqp8xreeubpkw	invoices	update	update invoices
cmrhuv938000rqp8x0k2jiz5y	invoices	delete	delete invoices
cmrhuv93i000sqp8xuulot58t	staff	create	create staff
cmrhuv93r000tqp8xoz9340sy	staff	read	read staff
cmrhuv940000uqp8xrbew2jtm	staff	update	update staff
cmrhuv94a000vqp8xl5r1wv0j	staff	delete	delete staff
cmrhuv94h000wqp8xbaswjabx	reservations	create	create reservations
cmrhuv94o000xqp8xt5f9idxh	reservations	read	read reservations
cmrhuv94v000yqp8xdioaxk85	reservations	update	update reservations
cmrhuv952000zqp8xvtudjpwy	reservations	delete	delete reservations
cmrhuv9590010qp8x958rhz6m	reports	create	create reports
cmrhuv95g0011qp8xrhhxa4nr	reports	read	read reports
cmrhuv95n0012qp8xhe75fqyi	reports	update	update reports
cmrhuv95t0013qp8xhsi7gejw	reports	delete	delete reports
cmrhuv95y0014qp8xmkeeapyj	settings	create	create settings
cmrhuv9620015qp8xiyd41or1	settings	read	read settings
cmrhuv9660016qp8x4b096p4p	settings	update	update settings
cmrhuv96a0017qp8xzhirjbo7	settings	delete	delete settings
cmrhuv96e0018qp8xk8z62z7h	branches	create	create branches
cmrhuv96i0019qp8xy4jtsg8w	branches	read	read branches
cmrhuv96m001aqp8xrbr9jwn9	branches	update	update branches
cmrhuv96q001bqp8xptuli3tx	branches	delete	delete branches
cmrhuv96u001cqp8xjds6m0j1	suppliers	create	create suppliers
cmrhuv96z001dqp8xbcfd2gv5	suppliers	read	read suppliers
cmrhuv972001eqp8xeaixry18	suppliers	update	update suppliers
cmrhuv976001fqp8xuvmvee3h	suppliers	delete	delete suppliers
cmrhuv97b001gqp8xkffyng0q	purchases	create	create purchases
cmrhuv97f001hqp8x1ruuba9t	purchases	read	read purchases
cmrhuv97i001iqp8x8smizzij	purchases	update	update purchases
cmrhuv97m001jqp8x1zvfmt0l	purchases	delete	delete purchases
\.


--
-- Data for Name: plan_entitlements; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.plan_entitlements (id, "planId", "moduleKey", enabled, "createdAt") FROM stdin;
cmrjg85g5004dqpyf183p8sia	cmrjg85g5004cqpyf5hvspk4m	pos	t	2026-07-15 09:07:08.101
cmrjg85g5004eqpyfqqkalfi4	cmrjg85g5004cqpyf5hvspk4m	kitchen	t	2026-07-15 09:07:08.101
cmrjg85g5004fqpyfjfl1xrfh	cmrjg85g5004cqpyf5hvspk4m	orders	t	2026-07-15 09:07:08.101
cmrjg85g5004gqpyfp0l6yu62	cmrjg85g5004cqpyf5hvspk4m	tables	t	2026-07-15 09:07:08.101
cmrjg85g5004hqpyfy1sktvcr	cmrjg85g5004cqpyf5hvspk4m	payments	t	2026-07-15 09:07:08.101
cmrjg85g5004iqpyf0tdzvz33	cmrjg85g5004cqpyf5hvspk4m	invoices	f	2026-07-15 09:07:08.101
cmrjg85g5004jqpyfdsjatbck	cmrjg85g5004cqpyf5hvspk4m	inventory	f	2026-07-15 09:07:08.101
cmrjg85g5004kqpyfn1x725s3	cmrjg85g5004cqpyf5hvspk4m	staff	f	2026-07-15 09:07:08.101
cmrjg85g5004lqpyfta7u7dsc	cmrjg85g5004cqpyf5hvspk4m	shifts	f	2026-07-15 09:07:08.101
cmrjg85g5004mqpyfw8rokvyh	cmrjg85g5004cqpyf5hvspk4m	attendance	f	2026-07-15 09:07:08.101
cmrjg85g5004nqpyfzr3b73dn	cmrjg85g5004cqpyf5hvspk4m	reports	f	2026-07-15 09:07:08.101
cmrjg85g5004oqpyf8hu7g2fx	cmrjg85g5004cqpyf5hvspk4m	ai_analytics	f	2026-07-15 09:07:08.101
cmrjg85g5004pqpyfyj8ecaa7	cmrjg85g5004cqpyf5hvspk4m	crm	f	2026-07-15 09:07:08.101
cmrjg85g5004qqpyfv8mkx64g	cmrjg85g5004cqpyf5hvspk4m	loyalty	f	2026-07-15 09:07:08.101
cmrjg85g5004rqpyfrio0s5f7	cmrjg85g5004cqpyf5hvspk4m	qr_ordering	f	2026-07-15 09:07:08.101
cmrjg85g5004sqpyfqxo7p3of	cmrjg85g5004cqpyf5hvspk4m	customer_website	f	2026-07-15 09:07:08.101
cmrjg85g5004tqpyftspt02lf	cmrjg85g5004cqpyf5hvspk4m	reservations	f	2026-07-15 09:07:08.101
cmrjg85g5004uqpyfp0wb0mbr	cmrjg85g5004cqpyf5hvspk4m	multi_branch	f	2026-07-15 09:07:08.101
cmrjg85g5004vqpyf4hsefdwx	cmrjg85g5004cqpyf5hvspk4m	api_access	f	2026-07-15 09:07:08.101
cmrjg85g5004wqpyfanydxk8t	cmrjg85g5004cqpyf5hvspk4m	white_label	f	2026-07-15 09:07:08.101
cmrjg85g5004xqpyfm2ppwu9o	cmrjg85g5004cqpyf5hvspk4m	priority_support	f	2026-07-15 09:07:08.101
cmrjg85gb004zqpyfbr9oc2uz	cmrjg85gb004yqpyfuvf7s0rd	pos	t	2026-07-15 09:07:08.101
cmrjg85gb0050qpyflyvyo9ky	cmrjg85gb004yqpyfuvf7s0rd	kitchen	t	2026-07-15 09:07:08.101
cmrjg85gb0051qpyfs1eptryu	cmrjg85gb004yqpyfuvf7s0rd	orders	t	2026-07-15 09:07:08.101
cmrjg85gb0052qpyf0ek9m8q7	cmrjg85gb004yqpyfuvf7s0rd	tables	t	2026-07-15 09:07:08.101
cmrjg85gb0053qpyfon75nxm0	cmrjg85gb004yqpyfuvf7s0rd	payments	t	2026-07-15 09:07:08.101
cmrjg85gb0054qpyf0rsv388y	cmrjg85gb004yqpyfuvf7s0rd	invoices	t	2026-07-15 09:07:08.101
cmrjg85gb0055qpyf3mtzd66t	cmrjg85gb004yqpyfuvf7s0rd	inventory	t	2026-07-15 09:07:08.101
cmrjg85gb0056qpyf01sxdz45	cmrjg85gb004yqpyfuvf7s0rd	staff	t	2026-07-15 09:07:08.101
cmrjg85gb0057qpyfl6gl6cdk	cmrjg85gb004yqpyfuvf7s0rd	shifts	t	2026-07-15 09:07:08.101
cmrjg85gb0058qpyfjrgecey3	cmrjg85gb004yqpyfuvf7s0rd	attendance	t	2026-07-15 09:07:08.101
cmrjg85gb0059qpyfo7la4im7	cmrjg85gb004yqpyfuvf7s0rd	reports	t	2026-07-15 09:07:08.101
cmrjg85gb005aqpyfamq7sy0y	cmrjg85gb004yqpyfuvf7s0rd	ai_analytics	f	2026-07-15 09:07:08.101
cmrjg85gb005bqpyf6vjdgmq5	cmrjg85gb004yqpyfuvf7s0rd	crm	t	2026-07-15 09:07:08.101
cmrjg85gb005cqpyf7wzn5qaa	cmrjg85gb004yqpyfuvf7s0rd	loyalty	f	2026-07-15 09:07:08.101
cmrjg85gb005dqpyffpcv65dy	cmrjg85gb004yqpyfuvf7s0rd	qr_ordering	t	2026-07-15 09:07:08.101
cmrjg85gb005eqpyf92n8pgrk	cmrjg85gb004yqpyfuvf7s0rd	customer_website	f	2026-07-15 09:07:08.101
cmrjg85gb005fqpyfexo3otbb	cmrjg85gb004yqpyfuvf7s0rd	reservations	t	2026-07-15 09:07:08.101
cmrjg85gb005gqpyfqq6i13nj	cmrjg85gb004yqpyfuvf7s0rd	multi_branch	f	2026-07-15 09:07:08.101
cmrjg85gb005hqpyfu4mud15h	cmrjg85gb004yqpyfuvf7s0rd	api_access	f	2026-07-15 09:07:08.101
cmrjg85gb005iqpyfp8r7vcns	cmrjg85gb004yqpyfuvf7s0rd	white_label	f	2026-07-15 09:07:08.101
cmrjg85gb005jqpyf599svjje	cmrjg85gb004yqpyfuvf7s0rd	priority_support	f	2026-07-15 09:07:08.101
cmrjg85ge005lqpyfhzr6ahau	cmrjg85ge005kqpyfxbvkwdzj	pos	t	2026-07-15 09:07:08.101
cmrjg85ge005mqpyfvzv4v1a3	cmrjg85ge005kqpyfxbvkwdzj	kitchen	t	2026-07-15 09:07:08.101
cmrjg85ge005nqpyf8w8cnkcf	cmrjg85ge005kqpyfxbvkwdzj	orders	t	2026-07-15 09:07:08.101
cmrjg85ge005oqpyffsmti8sy	cmrjg85ge005kqpyfxbvkwdzj	tables	t	2026-07-15 09:07:08.101
cmrjg85ge005pqpyfi7ixnhkj	cmrjg85ge005kqpyfxbvkwdzj	payments	t	2026-07-15 09:07:08.101
cmrjg85ge005qqpyfdsmb75pz	cmrjg85ge005kqpyfxbvkwdzj	invoices	t	2026-07-15 09:07:08.101
cmrjg85ge005rqpyf8ymioq75	cmrjg85ge005kqpyfxbvkwdzj	inventory	t	2026-07-15 09:07:08.101
cmrjg85ge005sqpyfwn70ncsh	cmrjg85ge005kqpyfxbvkwdzj	staff	t	2026-07-15 09:07:08.101
cmrjg85ge005tqpyfnwihi04m	cmrjg85ge005kqpyfxbvkwdzj	shifts	t	2026-07-15 09:07:08.101
cmrjg85ge005uqpyfer50ujp2	cmrjg85ge005kqpyfxbvkwdzj	attendance	t	2026-07-15 09:07:08.101
cmrjg85ge005vqpyfmeakqji2	cmrjg85ge005kqpyfxbvkwdzj	reports	t	2026-07-15 09:07:08.101
cmrjg85ge005wqpyfttwtn659	cmrjg85ge005kqpyfxbvkwdzj	ai_analytics	t	2026-07-15 09:07:08.101
cmrjg85ge005xqpyfkiqo3zog	cmrjg85ge005kqpyfxbvkwdzj	crm	t	2026-07-15 09:07:08.101
cmrjg85ge005yqpyfzxqkvssi	cmrjg85ge005kqpyfxbvkwdzj	loyalty	t	2026-07-15 09:07:08.101
cmrjg85ge005zqpyf6eyldra6	cmrjg85ge005kqpyfxbvkwdzj	qr_ordering	t	2026-07-15 09:07:08.101
cmrjg85ge0060qpyfwisx79li	cmrjg85ge005kqpyfxbvkwdzj	customer_website	t	2026-07-15 09:07:08.101
cmrjg85ge0061qpyfy9b4rckr	cmrjg85ge005kqpyfxbvkwdzj	reservations	t	2026-07-15 09:07:08.101
cmrjg85ge0062qpyfixdi00sg	cmrjg85ge005kqpyfxbvkwdzj	multi_branch	t	2026-07-15 09:07:08.101
cmrjg85ge0063qpyfjdsmwzlz	cmrjg85ge005kqpyfxbvkwdzj	api_access	t	2026-07-15 09:07:08.101
cmrjg85ge0064qpyfliaicjto	cmrjg85ge005kqpyfxbvkwdzj	white_label	f	2026-07-15 09:07:08.101
cmrjg85ge0065qpyfxj5jnqgh	cmrjg85ge005kqpyfxbvkwdzj	priority_support	t	2026-07-15 09:07:08.101
cmrjg85gi0067qpyfevxt9ssj	cmrjg85gi0066qpyf9dbb4gy7	pos	t	2026-07-15 09:07:08.101
cmrjg85gi0068qpyfcueihqty	cmrjg85gi0066qpyf9dbb4gy7	kitchen	t	2026-07-15 09:07:08.101
cmrjg85gi0069qpyfsht41r72	cmrjg85gi0066qpyf9dbb4gy7	orders	t	2026-07-15 09:07:08.101
cmrjg85gi006aqpyfyn7b4zcs	cmrjg85gi0066qpyf9dbb4gy7	tables	t	2026-07-15 09:07:08.101
cmrjg85gi006bqpyfapbtggcr	cmrjg85gi0066qpyf9dbb4gy7	payments	t	2026-07-15 09:07:08.101
cmrjg85gi006cqpyfqavunaeb	cmrjg85gi0066qpyf9dbb4gy7	invoices	t	2026-07-15 09:07:08.101
cmrjg85gi006dqpyff3ub2twp	cmrjg85gi0066qpyf9dbb4gy7	inventory	t	2026-07-15 09:07:08.101
cmrjg85gi006eqpyfvg6k9pzv	cmrjg85gi0066qpyf9dbb4gy7	staff	t	2026-07-15 09:07:08.101
cmrjg85gi006fqpyf5xl43k1e	cmrjg85gi0066qpyf9dbb4gy7	shifts	t	2026-07-15 09:07:08.101
cmrjg85gi006gqpyf00fl9s4v	cmrjg85gi0066qpyf9dbb4gy7	attendance	t	2026-07-15 09:07:08.101
cmrjg85gi006hqpyfdy2umygi	cmrjg85gi0066qpyf9dbb4gy7	reports	t	2026-07-15 09:07:08.101
cmrjg85gi006iqpyf5si965a1	cmrjg85gi0066qpyf9dbb4gy7	ai_analytics	t	2026-07-15 09:07:08.101
cmrjg85gi006jqpyfgdl7hz9u	cmrjg85gi0066qpyf9dbb4gy7	crm	t	2026-07-15 09:07:08.101
cmrjg85gi006kqpyfwcxa8ll0	cmrjg85gi0066qpyf9dbb4gy7	loyalty	t	2026-07-15 09:07:08.101
cmrjg85gi006lqpyfhmkq2kej	cmrjg85gi0066qpyf9dbb4gy7	qr_ordering	t	2026-07-15 09:07:08.101
cmrjg85gi006mqpyfz6iiotoj	cmrjg85gi0066qpyf9dbb4gy7	customer_website	t	2026-07-15 09:07:08.101
cmrjg85gi006nqpyfvhcie4ta	cmrjg85gi0066qpyf9dbb4gy7	reservations	t	2026-07-15 09:07:08.101
cmrjg85gi006oqpyfq7qqoh7e	cmrjg85gi0066qpyf9dbb4gy7	multi_branch	t	2026-07-15 09:07:08.101
cmrjg85gi006pqpyf3bgcwi6t	cmrjg85gi0066qpyf9dbb4gy7	api_access	t	2026-07-15 09:07:08.101
cmrjg85gi006qqpyfvq79w0y3	cmrjg85gi0066qpyf9dbb4gy7	white_label	t	2026-07-15 09:07:08.101
cmrjg85gi006rqpyfjouzyew0	cmrjg85gi0066qpyf9dbb4gy7	priority_support	t	2026-07-15 09:07:08.101
\.


--
-- Data for Name: platform_plans; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.platform_plans (id, name, slug, description, price, "billingCycle", "trialDays", "maxBranches", "maxStaff", "isCustom", "isActive", "sortOrder", "createdAt", "updatedAt", "deletedAt", version, "createdBy", "updatedBy") FROM stdin;
cmrjg85g5004cqpyf5hvspk4m	Starter Free	starter-free	Perfect for small restaurants just getting started	0.00	MONTHLY	14	1	5	f	t	1	2026-07-13 16:40:44.694	2026-07-13 16:40:44.694	\N	1	\N	\N
cmrjg85gb004yqpyfuvf7s0rd	Professional	professional	For growing restaurants that need full operations	2999.00	MONTHLY	14	2	25	f	t	2	2026-07-13 16:40:44.699	2026-07-13 16:40:44.699	\N	1	\N	\N
cmrjg85ge005kqpyfxbvkwdzj	Business	business	For restaurant chains and large operations	7999.00	MONTHLY	14	10	100	f	t	3	2026-07-13 16:40:44.703	2026-07-13 16:40:44.703	\N	1	\N	\N
cmrjg85gi0066qpyf9dbb4gy7	Enterprise	enterprise	Custom plan for large chains and franchises	19999.00	MONTHLY	30	100	500	t	t	4	2026-07-13 16:40:44.707	2026-07-13 16:40:44.707	\N	1	\N	\N
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.platform_settings (id, key, value, description, "updatedAt") FROM stdin;
\.


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.purchase_items (id, "purchaseId", "inventoryItemId", quantity, "unitPrice", "totalCost") FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.purchases (id, "tenantId", "supplierId", "totalAmount", status, notes, "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: recipe_items; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.recipe_items (id, quantity, unit, "inventoryItemId", "menuItemId") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.refresh_tokens (id, "userId", token, "userAgent", "ipAddress", "expiresAt", "createdAt") FROM stdin;
cmrhv62ra003dqpl3ebnr4r8b	cmrhv62pz0002qpl3csd5f0wi	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJodjYycHowMDAycXBsM2NzZDVmMHdpIiwidGVuYW50SWQiOiJjbXJodjYycHgwMDAwcXBsMzEwNG5jb2Z5IiwiaWF0IjoxNzgzODY1MDA5LCJleHAiOjE3ODQ0Njk4MDl9.a2e51EGikfFsP1SJTRECJsLO-B0vD14e5yXnhqVnZlg	\N	\N	2026-07-19 14:03:29.782	2026-07-12 14:03:29.783
cmrhv62z4003fqpl3vh6sue7t	cmrhv62pz0002qpl3csd5f0wi	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJodjYycHowMDAycXBsM2NzZDVmMHdpIiwidGVuYW50SWQiOiJjbXJodjYycHgwMDAwcXBsMzEwNG5jb2Z5IiwiaWF0IjoxNzgzODY1MDEwLCJleHAiOjE3ODQ0Njk4MTB9._KHfLG_o9OoAogeOt3tO-kZyvw16WilOk-g5Do-ytg4	\N	\N	2026-07-19 14:03:30.064	2026-07-12 14:03:30.064
cmrhv6i1k003hqpl3cohcpp5p	cmrhv62pz0002qpl3csd5f0wi	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJodjYycHowMDAycXBsM2NzZDVmMHdpIiwidGVuYW50SWQiOiJjbXJodjYycHgwMDAwcXBsMzEwNG5jb2Z5IiwiaWF0IjoxNzgzODY1MDI5LCJleHAiOjE3ODQ0Njk4Mjl9.E1T0tVtOMTre_ssiV00iSju-yz10zYSruyh_2wKGNhQ	\N	\N	2026-07-19 14:03:49.592	2026-07-12 14:03:49.592
cmrhvqgf3006xqpl3josoz4hq	cmrhvqgdu003mqpl3qn3orla2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJodnFnZHUwMDNtcXBsM3FuM29ybGEyIiwidGVuYW50SWQiOiJjbXJodnFnZHQwMDNrcXBsM3c4YXF0c3hrIiwiaWF0IjoxNzgzODY1OTYwLCJleHAiOjE3ODQ0NzA3NjB9.zOWLMu_kChoTiL8nmmeuJoohE8c8hy8o8IOhnlKeUFw	\N	\N	2026-07-19 14:19:20.607	2026-07-12 14:19:20.608
cmrhw1fjt003dqpoyz6uashnt	cmrhw1fii0002qpoycuzlvbnv	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJodzFmaWkwMDAycXBveWN1emx2Ym52IiwidGVuYW50SWQiOiJjbXJodzFmaWYwMDAwcXBveTZ3aWVzMmkzIiwiaWF0IjoxNzgzODY2NDcyLCJleHAiOjE3ODQ0NzEyNzJ9.YwznURuXy6WZAEDgP9f-Fh0GqDpuK5abg3HllQRVBVk	\N	\N	2026-07-19 14:27:52.697	2026-07-12 14:27:52.697
cmrhwrlbo003dqpp77osihizv	cmrhwrl990002qpp7ergu2sdp	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJod3JsOTkwMDAycXBwN2VyZ3Uyc2RwIiwidGVuYW50SWQiOiJjbXJod3JsOTcwMDAwcXBwN3oyeTlzemRxIiwiaWF0IjoxNzgzODY3NjkzLCJleHAiOjE3ODQ0NzI0OTN9.caz7AsBBJUJ14M9JeFQnv7NUbaAzLeUuTS0sLSzQqGE	\N	\N	2026-07-19 14:48:13.234	2026-07-12 14:48:13.237
cmrhwrygu006rqpp7fe951a52	cmrhwryfh003gqpp77bg8dd12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJod3J5ZmgwMDNncXBwNzdiZzhkZDEyIiwidGVuYW50SWQiOiJjbXJod3J5ZmYwMDNlcXBwN3Flb2g2bHhpIiwiaWF0IjoxNzgzODY3NzEwLCJleHAiOjE3ODQ0NzI1MTB9.Xc4l5fw2cH5YUH2uHBmXRxA_Pw7fi87lbiEGFfEynAE	\N	\N	2026-07-19 14:48:30.269	2026-07-12 14:48:30.27
cmrhwsdas00a7qpp72gvqtjo5	cmrhwsd96006wqpp7f5s38zyr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJod3NkOTYwMDZ3cXBwN2Y1czM4enlyIiwidGVuYW50SWQiOiJjbXJod3NkOTQwMDZ1cXBwN3l1aDVpcnlsIiwiaWF0IjoxNzgzODY3NzI5LCJleHAiOjE3ODQ0NzI1Mjl9.R4952bRVcB9ZM9YLt5AgTVKMSP9EcX2vBKYS5-EeIoE	\N	\N	2026-07-19 14:48:49.492	2026-07-12 14:48:49.493
cmrhwvvuf003dqplflyci308i	cmrhwvvt20002qplfhq7l7287	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJod3Z2dDIwMDAycXBsZmhxN2w3Mjg3IiwidGVuYW50SWQiOiJjbXJod3Z2dDAwMDAwcXBsZmx3MzdoejhxIiwiaWF0IjoxNzgzODY3ODkzLCJleHAiOjE3ODQ0NzI2OTN9.WmEypyATqBkdZXvLWDB849gBb7uXxKl4MWJmF5x07Is	\N	\N	2026-07-19 14:51:33.495	2026-07-12 14:51:33.495
cmrhxfuxw003dqp3ukdskw7qm	cmrhxfuvk0002qp3usj2p75nr	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJoeGZ1dmswMDAycXAzdXNqMnA3NW5yIiwidGVuYW50SWQiOiJjbXJoeGZ1dmgwMDAwcXAzdTNwaXg2bDV1IiwiaWF0IjoxNzgzODY4ODI1LCJleHAiOjE3ODQ0NzM2MjV9.0EoYQNcEPrxjgUT6JonJZLsrWw71epgX13vtFOScSE0	\N	\N	2026-07-19 15:07:05.443	2026-07-12 15:07:05.444
cmrhxn4ea006tqp3uti6k3g0z	cmrhxn4cy003iqp3u38vvwwkl	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJoeG40Y3kwMDNpcXAzdTM4dnZ3d2tsIiwidGVuYW50SWQiOiJjbXJoeG40Y3gwMDNncXAzdTVxdmtjOWkyIiwiaWF0IjoxNzgzODY5MTY0LCJleHAiOjE3ODQ0NzM5NjR9.sJrMbbNvZGC9LsROi8ZkKBfssD9L5hay1A-4k1gX4Pk	\N	\N	2026-07-19 15:12:44.29	2026-07-12 15:12:44.291
cmrhxx2im003dqpewv71kwa2h	cmrhxx2fe0002qpew5yauf9zm	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJoeHgyZmUwMDAycXBldzV5YXVmOXptIiwidGVuYW50SWQiOiJjbXJoeHgyZjkwMDAwcXBld3F1M3FzaTUyIiwiaWF0IjoxNzgzODY5NjI4LCJleHAiOjE3ODQ0NzQ0Mjh9.RWKV6AVDog6_CBecB3YFFoXktTW6mASiONzCJI02eEc	\N	\N	2026-07-19 15:20:28.413	2026-07-12 15:20:28.414
cmrk6ooic000cqpvyp9kxm61i	cmrk6oheh0006qpvyya4pj5w6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJrNm9oZWgwMDA2cXB2eXlhNHBqNXc2IiwidGVuYW50SWQiOiJjbXJrNm9oZWIwMDAycXB2eWp2dWM3aWM5IiwiaWF0IjoxNzg0MDA1Mjg1LCJleHAiOjE3ODQ2MTAwODV9.Ahwg4x73l2INFPLYGbrsZmNMcNbaTbN2ytD1_s5Wdv8	\N	\N	2026-07-21 05:01:25.907	2026-07-14 05:01:25.908
cmrlq0tyd0001qpceowroegcc	cmrhuv9fk001mqp8xnr9dn2w4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJodXY5ZmswMDFtcXA4eG5yOWRuMnc0IiwidGVuYW50SWQiOiJjbXJodXY5N3IwMDFrcXA4eHo3cmR6ODBlIiwiaWF0IjoxNzg0MDk4MjMxLCJleHAiOjE3ODQ3MDMwMzF9.zdz4CRsVgbxLG7LVR0MVSK8kcDB4WswLmFtWDq7AisE	\N	\N	2026-07-22 06:50:31.717	2026-07-15 06:50:31.718
cmrlq14nj0003qpce965grrpu	cmrhuv9fk001mqp8xnr9dn2w4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJodXY5ZmswMDFtcXA4eG5yOWRuMnc0IiwidGVuYW50SWQiOiJjbXJodXY5N3IwMDFrcXA4eHo3cmR6ODBlIiwiaWF0IjoxNzg0MDk4MjQ1LCJleHAiOjE3ODQ3MDMwNDV9.YdHawwrMcn8ZeeseMJ06SZ5Y0212naK9EPeoXhn4Chg	\N	\N	2026-07-22 06:50:45.583	2026-07-15 06:50:45.584
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.reservations (id, "tenantId", "tableId", "customerName", "customerPhone", date, "time", "guestCount", status, notes, "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
cmrhv6i6t003jqpl3zqvbv4hf	cmrhv62px0000qpl3104ncofy	\N	John Doe	9876543210	2026-07-13 00:00:00	19:30	4	CONFIRMED	\N	2026-07-12 14:03:49.782	2026-07-12 14:03:49.782	\N	\N	\N	1
cmrhw1fnm003fqpoyc2gvmctv	cmrhw1fif0000qpoy6wies2i3	\N	Jane	7777	2026-07-14 00:00:00	20:00	4	CONFIRMED	\N	2026-07-12 14:27:52.835	2026-07-12 14:27:52.835	\N	\N	\N	1
\.


--
-- Data for Name: restaurant_tables; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.restaurant_tables (id, "branchId", number, name, capacity, status, "qrCode", "isActive", "createdAt", "updatedAt", version, "createdBy", "deletedAt", "updatedBy") FROM stdin;
cmrhuvayh00hkqp8x8rbv63gq	existing-branch	1	VIP 1	8	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayh00hlqp8xhgvossg0	existing-branch	2	VIP 2	8	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayh00hmqp8xhg001wru	existing-branch	3	\N	4	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayi00hnqp8xmrf67yz6	existing-branch	4	\N	4	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayi00hoqp8xfn2yft4y	existing-branch	5	\N	4	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayi00hpqp8x94r0kx6p	existing-branch	6	\N	4	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayi00hqqp8xn242ugil	existing-branch	7	\N	2	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayi00hrqp8xm058kldr	existing-branch	8	\N	2	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayi00hsqp8xwqjumge0	existing-branch	9	\N	2	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
cmrhuvayi00htqp8x88vcuuzd	existing-branch	10	\N	2	FREE	\N	t	2026-07-12 13:55:07.194	2026-07-12 13:55:07.194	1	\N	\N	\N
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.role_permissions (id, "roleId", "permissionId") FROM stdin;
cmrhuv9fx001qqp8xscdvsfd2	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8wl0000qp8xukg1gxvz
cmrhuv9fx001rqp8xgez91kuq	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8wv0001qp8xd6v38fr5
cmrhuv9fx001sqp8x0tljfsig	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8x30002qp8x63mor7np
cmrhuv9fx001tqp8xaodvtlcf	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8xd0003qp8xar4cz465
cmrhuv9fx001uqp8xi7f1eofp	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8xm0004qp8xu1tfphaz
cmrhuv9fx001vqp8xw055x4hi	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8xv0005qp8xvl6qzs6u
cmrhuv9fx001wqp8xuks6ym5o	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8y40006qp8xtdth2c0k
cmrhuv9fx001xqp8x6pqx915e	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8yc0007qp8x3p912eha
cmrhuv9fx001yqp8xhohpaeub	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8yk0008qp8xy5tzfke8
cmrhuv9fx001zqp8xsfnmkpsb	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8yt0009qp8x986wo2s2
cmrhuv9fx0020qp8xca06xzk7	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8z2000aqp8xa5yhldo0
cmrhuv9fx0021qp8xvj4ossxn	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8za000bqp8xgqjufrt0
cmrhuv9fx0022qp8x2efk30hd	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8zj000cqp8xfk554q31
cmrhuv9fx0023qp8xfbgmg35p	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8zs000dqp8xmacewbat
cmrhuv9fx0024qp8x6iea9z2w	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv8zz000eqp8xycxacj4m
cmrhuv9fx0025qp8x7ipo9syf	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv909000fqp8xjx3wuedx
cmrhuv9fx0026qp8xm9a72ktp	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv90i000gqp8xscw12weh
cmrhuv9fx0027qp8xxop8epb3	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv90q000hqp8xe0urpwi3
cmrhuv9fx0028qp8x8owtxn85	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv90z000iqp8xnfd76cm3
cmrhuv9fx0029qp8x77ee2wik	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv918000jqp8xfati2kdp
cmrhuv9fx002aqp8xsuynch02	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv91h000kqp8x8kwa11ht
cmrhuv9fx002bqp8x5dehm4qc	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv91p000lqp8xa5e83v0w
cmrhuv9fx002cqp8x5unvsird	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv920000mqp8xhf6dmaei
cmrhuv9fx002dqp8xelg8kcpw	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv929000nqp8xeesxkdmv
cmrhuv9fx002eqp8xv66s4i9f	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv92i000oqp8xkk8afbjt
cmrhuv9fx002fqp8x4nvkk14x	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv92q000pqp8xtv63d0tn
cmrhuv9fx002gqp8xeq1i2211	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv92z000qqp8xreeubpkw
cmrhuv9fx002hqp8xx941k8zp	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv938000rqp8x0k2jiz5y
cmrhuv9fx002iqp8xg4vdyrhq	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv93i000sqp8xuulot58t
cmrhuv9fx002jqp8xcdfok9xg	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv93r000tqp8xoz9340sy
cmrhuv9fx002kqp8xpkiko7t5	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv940000uqp8xrbew2jtm
cmrhuv9fx002lqp8x8vi21mfc	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv94a000vqp8xl5r1wv0j
cmrhuv9fx002mqp8xh8fngnhd	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv94h000wqp8xbaswjabx
cmrhuv9fx002nqp8xadygd33c	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv94o000xqp8xt5f9idxh
cmrhuv9fx002oqp8xklf2kjt9	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv94v000yqp8xdioaxk85
cmrhuv9fx002pqp8xv1o76ijn	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv952000zqp8xvtudjpwy
cmrhuv9fx002qqp8xfp1au9ac	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv9590010qp8x958rhz6m
cmrhuv9fx002rqp8xxi7b1lqc	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv95g0011qp8xrhhxa4nr
cmrhuv9fx002sqp8xmsf9eadq	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv95n0012qp8xhe75fqyi
cmrhuv9fx002tqp8xj1gz0m30	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv95t0013qp8xhsi7gejw
cmrhuv9fx002uqp8xqy1yaaje	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv95y0014qp8xmkeeapyj
cmrhuv9fx002vqp8x0q0uritq	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv9620015qp8xiyd41or1
cmrhuv9fx002wqp8xcbgcivy0	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv9660016qp8x4b096p4p
cmrhuv9fx002xqp8xvq7exz46	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv96a0017qp8xzhirjbo7
cmrhuv9fx002yqp8xje3kdicm	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv96e0018qp8xk8z62z7h
cmrhuv9fx002zqp8xf3fos4ol	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv96i0019qp8xy4jtsg8w
cmrhuv9fx0030qp8xgglijmd6	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv96m001aqp8xrbr9jwn9
cmrhuv9fx0031qp8xoqnscjdr	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv96q001bqp8xptuli3tx
cmrhuv9fx0032qp8xybm0cvf9	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv96u001cqp8xjds6m0j1
cmrhuv9fx0033qp8xhxny4w3x	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv96z001dqp8xbcfd2gv5
cmrhuv9fx0034qp8xfwwd4pjz	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv972001eqp8xeaixry18
cmrhuv9fx0035qp8xykljthth	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv976001fqp8xuvmvee3h
cmrhuv9fx0036qp8xyt4dzd9b	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv97b001gqp8xkffyng0q
cmrhuv9fx0037qp8x8ycu1p4z	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv97f001hqp8x1ruuba9t
cmrhuv9fx0038qp8xp05qqbb9	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv97i001iqp8x8smizzij
cmrhuv9fx0039qp8x16c9a7b3	cmrhuv9fw001oqp8xujzk4vpe	cmrhuv97m001jqp8x1zvfmt0l
cmrhuv9gi003dqp8xw3m9ox0n	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8xm0004qp8xu1tfphaz
cmrhuv9gi003eqp8xpo2yftet	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8xv0005qp8xvl6qzs6u
cmrhuv9gi003fqp8xw1yh6i50	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8y40006qp8xtdth2c0k
cmrhuv9gi003gqp8xxv39aqnm	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8yk0008qp8xy5tzfke8
cmrhuv9gi003hqp8xkqrixrv9	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8yt0009qp8x986wo2s2
cmrhuv9gi003iqp8xgx9gtdh7	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8z2000aqp8xa5yhldo0
cmrhuv9gi003jqp8xuboo3zyw	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8zj000cqp8xfk554q31
cmrhuv9gi003kqp8xiojsdah1	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8zs000dqp8xmacewbat
cmrhuv9gi003lqp8xrg75imqf	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv8zz000eqp8xycxacj4m
cmrhuv9gi003mqp8x0m0ho1d1	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv90i000gqp8xscw12weh
cmrhuv9gi003nqp8xpdkr3nf4	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv90q000hqp8xe0urpwi3
cmrhuv9gi003oqp8xjmhxfs9i	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv90z000iqp8xnfd76cm3
cmrhuv9gi003pqp8xdjfmu71q	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv91h000kqp8x8kwa11ht
cmrhuv9gi003qqp8xeq04q182	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv91p000lqp8xa5e83v0w
cmrhuv9gi003rqp8xdnrclkm3	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv920000mqp8xhf6dmaei
cmrhuv9gi003sqp8xj3scrsaf	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv93i000sqp8xuulot58t
cmrhuv9gi003tqp8xaglwu1d9	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv93r000tqp8xoz9340sy
cmrhuv9gi003uqp8x3149titz	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv940000uqp8xrbew2jtm
cmrhuv9gi003vqp8x2cdsawdw	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv9590010qp8x958rhz6m
cmrhuv9gi003wqp8xltpc35k7	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv95g0011qp8xrhhxa4nr
cmrhuv9gi003xqp8x7vzwpokf	cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv95n0012qp8xhe75fqyi
cmrhuv9h00041qp8xoza19ctz	cmrhuv9h0003zqp8xmrjhaoj8	cmrhuv8xv0005qp8xvl6qzs6u
cmrhuv9h00042qp8xuvpo3u2l	cmrhuv9h0003zqp8xmrjhaoj8	cmrhuv8y40006qp8xtdth2c0k
cmrhuv9h00043qp8xqgu35561	cmrhuv9h0003zqp8xmrjhaoj8	cmrhuv8yt0009qp8x986wo2s2
cmrhuv9h00044qp8xc7q4l1fm	cmrhuv9h0003zqp8xmrjhaoj8	cmrhuv8z2000aqp8xa5yhldo0
cmrhuv9h00045qp8xl145fcmt	cmrhuv9h0003zqp8xmrjhaoj8	cmrhuv8zs000dqp8xmacewbat
cmrhuv9h00046qp8xtaoh0u0c	cmrhuv9h0003zqp8xmrjhaoj8	cmrhuv8zz000eqp8xycxacj4m
cmrhuv9he004aqp8xlocwfxy4	cmrhuv9he0048qp8xb9np6669	cmrhuv8xv0005qp8xvl6qzs6u
cmrhuv9he004bqp8xoyjaxl6x	cmrhuv9he0048qp8xb9np6669	cmrhuv8yt0009qp8x986wo2s2
cmrhv62qx001qqpl35xsemexs	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8wl0000qp8xukg1gxvz
cmrhv62qx001rqpl34y4iqboj	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8wv0001qp8xd6v38fr5
cmrhv62qx001sqpl3m5mkc854	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8x30002qp8x63mor7np
cmrhv62qx001tqpl3dmry7rgg	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8xd0003qp8xar4cz465
cmrhv62qx001uqpl3csldqg35	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8xm0004qp8xu1tfphaz
cmrhv62qx001vqpl3k67rwolm	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8xv0005qp8xvl6qzs6u
cmrhv62qx001wqpl3nbpluceq	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8y40006qp8xtdth2c0k
cmrhv62qx001xqpl3v4c2qaa4	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8yc0007qp8x3p912eha
cmrhv62qx001yqpl35oga5hsf	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8yk0008qp8xy5tzfke8
cmrhv62qx001zqpl3dx4hl2d1	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8yt0009qp8x986wo2s2
cmrhv62qx0020qpl3lfdwy6f2	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8z2000aqp8xa5yhldo0
cmrhv62qx0021qpl3jjazfuha	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8za000bqp8xgqjufrt0
cmrhv62qx0022qpl3cgcif5f3	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8zj000cqp8xfk554q31
cmrhv62qx0023qpl3mcaz76zy	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8zs000dqp8xmacewbat
cmrhv62qx0024qpl3mdjnpnp0	cmrhv62qx001oqpl3fkh08h0y	cmrhuv8zz000eqp8xycxacj4m
cmrhv62qx0025qpl3jm0rw5vu	cmrhv62qx001oqpl3fkh08h0y	cmrhuv909000fqp8xjx3wuedx
cmrhv62qx0026qpl3uucwekmx	cmrhv62qx001oqpl3fkh08h0y	cmrhuv90i000gqp8xscw12weh
cmrhv62qx0027qpl3kqd335va	cmrhv62qx001oqpl3fkh08h0y	cmrhuv90q000hqp8xe0urpwi3
cmrhv62qx0028qpl3ovzlawr1	cmrhv62qx001oqpl3fkh08h0y	cmrhuv90z000iqp8xnfd76cm3
cmrhv62qx0029qpl3o9jly3q0	cmrhv62qx001oqpl3fkh08h0y	cmrhuv918000jqp8xfati2kdp
cmrhv62qx002aqpl3hj9t30hu	cmrhv62qx001oqpl3fkh08h0y	cmrhuv91h000kqp8x8kwa11ht
cmrhv62qx002bqpl39dzxq1o9	cmrhv62qx001oqpl3fkh08h0y	cmrhuv91p000lqp8xa5e83v0w
cmrhv62qx002cqpl3gs6awhwa	cmrhv62qx001oqpl3fkh08h0y	cmrhuv920000mqp8xhf6dmaei
cmrhv62qx002dqpl3r4ulrrk8	cmrhv62qx001oqpl3fkh08h0y	cmrhuv929000nqp8xeesxkdmv
cmrhv62qx002eqpl39e7qfw3z	cmrhv62qx001oqpl3fkh08h0y	cmrhuv92i000oqp8xkk8afbjt
cmrhv62qx002fqpl32uizfc1j	cmrhv62qx001oqpl3fkh08h0y	cmrhuv92q000pqp8xtv63d0tn
cmrhv62qx002gqpl3k9o40rfb	cmrhv62qx001oqpl3fkh08h0y	cmrhuv92z000qqp8xreeubpkw
cmrhv62qx002hqpl3qpo5qrml	cmrhv62qx001oqpl3fkh08h0y	cmrhuv938000rqp8x0k2jiz5y
cmrhv62qx002iqpl3aa81iwdk	cmrhv62qx001oqpl3fkh08h0y	cmrhuv93i000sqp8xuulot58t
cmrhv62qx002jqpl3qcie0vdp	cmrhv62qx001oqpl3fkh08h0y	cmrhuv93r000tqp8xoz9340sy
cmrhv62qx002kqpl3m29pnot5	cmrhv62qx001oqpl3fkh08h0y	cmrhuv940000uqp8xrbew2jtm
cmrhv62qx002lqpl300o04kq1	cmrhv62qx001oqpl3fkh08h0y	cmrhuv94a000vqp8xl5r1wv0j
cmrhv62qx002mqpl3g0afckfu	cmrhv62qx001oqpl3fkh08h0y	cmrhuv94h000wqp8xbaswjabx
cmrhv62qx002nqpl3abud92b7	cmrhv62qx001oqpl3fkh08h0y	cmrhuv94o000xqp8xt5f9idxh
cmrhv62qx002oqpl3f2kt7goi	cmrhv62qx001oqpl3fkh08h0y	cmrhuv94v000yqp8xdioaxk85
cmrhv62qx002pqpl30lwfx5or	cmrhv62qx001oqpl3fkh08h0y	cmrhuv952000zqp8xvtudjpwy
cmrhv62qx002qqpl3k630jj2x	cmrhv62qx001oqpl3fkh08h0y	cmrhuv9590010qp8x958rhz6m
cmrhv62qx002rqpl3bcle36xi	cmrhv62qx001oqpl3fkh08h0y	cmrhuv95g0011qp8xrhhxa4nr
cmrhv62qx002sqpl3qscr905o	cmrhv62qx001oqpl3fkh08h0y	cmrhuv95n0012qp8xhe75fqyi
cmrhv62qx002tqpl3qry4gro3	cmrhv62qx001oqpl3fkh08h0y	cmrhuv95t0013qp8xhsi7gejw
cmrhv62qx002uqpl360idlmr9	cmrhv62qx001oqpl3fkh08h0y	cmrhuv95y0014qp8xmkeeapyj
cmrhv62qx002vqpl3a0dxktk0	cmrhv62qx001oqpl3fkh08h0y	cmrhuv9620015qp8xiyd41or1
cmrhv62qx002wqpl33areickw	cmrhv62qx001oqpl3fkh08h0y	cmrhuv9660016qp8x4b096p4p
cmrhv62qx002xqpl3o0759fhw	cmrhv62qx001oqpl3fkh08h0y	cmrhuv96a0017qp8xzhirjbo7
cmrhv62qx002yqpl30v6alw7g	cmrhv62qx001oqpl3fkh08h0y	cmrhuv96e0018qp8xk8z62z7h
cmrhv62qx002zqpl34nz8djjp	cmrhv62qx001oqpl3fkh08h0y	cmrhuv96i0019qp8xy4jtsg8w
cmrhv62qx0030qpl3lkvvidbj	cmrhv62qx001oqpl3fkh08h0y	cmrhuv96m001aqp8xrbr9jwn9
cmrhv62qx0031qpl3abk2duyw	cmrhv62qx001oqpl3fkh08h0y	cmrhuv96q001bqp8xptuli3tx
cmrhv62qx0032qpl3v5iwijkv	cmrhv62qx001oqpl3fkh08h0y	cmrhuv96u001cqp8xjds6m0j1
cmrhv62qx0033qpl3s4wd54h5	cmrhv62qx001oqpl3fkh08h0y	cmrhuv96z001dqp8xbcfd2gv5
cmrhv62qx0034qpl393ld5m18	cmrhv62qx001oqpl3fkh08h0y	cmrhuv972001eqp8xeaixry18
cmrhv62qx0035qpl30sskx52e	cmrhv62qx001oqpl3fkh08h0y	cmrhuv976001fqp8xuvmvee3h
cmrhv62qx0036qpl3bzqsa8o0	cmrhv62qx001oqpl3fkh08h0y	cmrhuv97b001gqp8xkffyng0q
cmrhv62qx0037qpl3nikmvmwh	cmrhv62qx001oqpl3fkh08h0y	cmrhuv97f001hqp8x1ruuba9t
cmrhv62qx0038qpl3cyiie20l	cmrhv62qx001oqpl3fkh08h0y	cmrhuv97i001iqp8x8smizzij
cmrhv62qx0039qpl3kfwxn4i6	cmrhv62qx001oqpl3fkh08h0y	cmrhuv97m001jqp8x1zvfmt0l
cmrhvqget005aqpl3dpohdt7m	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8wl0000qp8xukg1gxvz
cmrhvqget005bqpl35gr4e3tp	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8wv0001qp8xd6v38fr5
cmrhvqget005cqpl34salsana	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8x30002qp8x63mor7np
cmrhvqget005dqpl3j0vmd5bj	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8xd0003qp8xar4cz465
cmrhvqget005eqpl3n6otwkoz	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8xm0004qp8xu1tfphaz
cmrhvqget005fqpl39nkx96sx	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8xv0005qp8xvl6qzs6u
cmrhvqget005gqpl3ktlgtdfx	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8y40006qp8xtdth2c0k
cmrhvqget005hqpl3j04eoyyp	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8yc0007qp8x3p912eha
cmrhvqget005iqpl3kt6nmiqd	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8yk0008qp8xy5tzfke8
cmrhvqget005jqpl3hzzdfidq	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8yt0009qp8x986wo2s2
cmrhvqget005kqpl3cuojz1kd	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8z2000aqp8xa5yhldo0
cmrhvqget005lqpl3mu7bu6gf	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8za000bqp8xgqjufrt0
cmrhvqget005mqpl3w72psnuy	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8zj000cqp8xfk554q31
cmrhvqget005nqpl3d26cukqz	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8zs000dqp8xmacewbat
cmrhvqget005oqpl3xfl5ncfw	cmrhvqget0058qpl3xs1sfaaj	cmrhuv8zz000eqp8xycxacj4m
cmrhvqget005pqpl3l8z3vu9v	cmrhvqget0058qpl3xs1sfaaj	cmrhuv909000fqp8xjx3wuedx
cmrhvqget005qqpl3sknj7nxk	cmrhvqget0058qpl3xs1sfaaj	cmrhuv90i000gqp8xscw12weh
cmrhvqget005rqpl320zspzll	cmrhvqget0058qpl3xs1sfaaj	cmrhuv90q000hqp8xe0urpwi3
cmrhvqget005sqpl30k7m25mz	cmrhvqget0058qpl3xs1sfaaj	cmrhuv90z000iqp8xnfd76cm3
cmrhvqget005tqpl34c7h843n	cmrhvqget0058qpl3xs1sfaaj	cmrhuv918000jqp8xfati2kdp
cmrhvqget005uqpl3kjq9um9c	cmrhvqget0058qpl3xs1sfaaj	cmrhuv91h000kqp8x8kwa11ht
cmrhvqget005vqpl3l13j36h4	cmrhvqget0058qpl3xs1sfaaj	cmrhuv91p000lqp8xa5e83v0w
cmrhvqget005wqpl3ajidfhrp	cmrhvqget0058qpl3xs1sfaaj	cmrhuv920000mqp8xhf6dmaei
cmrhvqget005xqpl3auz2b9j0	cmrhvqget0058qpl3xs1sfaaj	cmrhuv929000nqp8xeesxkdmv
cmrhvqget005yqpl3ak0u7xac	cmrhvqget0058qpl3xs1sfaaj	cmrhuv92i000oqp8xkk8afbjt
cmrhvqget005zqpl3794djtsr	cmrhvqget0058qpl3xs1sfaaj	cmrhuv92q000pqp8xtv63d0tn
cmrhvqget0060qpl38cj4nz7r	cmrhvqget0058qpl3xs1sfaaj	cmrhuv92z000qqp8xreeubpkw
cmrhvqget0061qpl32li954j2	cmrhvqget0058qpl3xs1sfaaj	cmrhuv938000rqp8x0k2jiz5y
cmrhvqget0062qpl3czmrjsjo	cmrhvqget0058qpl3xs1sfaaj	cmrhuv93i000sqp8xuulot58t
cmrhvqget0063qpl32wb4rwuy	cmrhvqget0058qpl3xs1sfaaj	cmrhuv93r000tqp8xoz9340sy
cmrhvqget0064qpl3i1tlcgej	cmrhvqget0058qpl3xs1sfaaj	cmrhuv940000uqp8xrbew2jtm
cmrhvqget0065qpl3owan5iiu	cmrhvqget0058qpl3xs1sfaaj	cmrhuv94a000vqp8xl5r1wv0j
cmrhvqget0066qpl39luve17l	cmrhvqget0058qpl3xs1sfaaj	cmrhuv94h000wqp8xbaswjabx
cmrhvqget0067qpl3zkvapvzw	cmrhvqget0058qpl3xs1sfaaj	cmrhuv94o000xqp8xt5f9idxh
cmrhvqget0068qpl3a95i6phb	cmrhvqget0058qpl3xs1sfaaj	cmrhuv94v000yqp8xdioaxk85
cmrhvqget0069qpl30pcx8sqr	cmrhvqget0058qpl3xs1sfaaj	cmrhuv952000zqp8xvtudjpwy
cmrhvqget006aqpl37tbq62nk	cmrhvqget0058qpl3xs1sfaaj	cmrhuv9590010qp8x958rhz6m
cmrhvqget006bqpl3yro2nf7r	cmrhvqget0058qpl3xs1sfaaj	cmrhuv95g0011qp8xrhhxa4nr
cmrhvqget006cqpl3yji2l0hw	cmrhvqget0058qpl3xs1sfaaj	cmrhuv95n0012qp8xhe75fqyi
cmrhvqget006dqpl3vv0lo7x4	cmrhvqget0058qpl3xs1sfaaj	cmrhuv95t0013qp8xhsi7gejw
cmrhvqget006eqpl3ew71f6l7	cmrhvqget0058qpl3xs1sfaaj	cmrhuv95y0014qp8xmkeeapyj
cmrhvqget006fqpl30cf2qggf	cmrhvqget0058qpl3xs1sfaaj	cmrhuv9620015qp8xiyd41or1
cmrhvqget006gqpl3nd7nubvu	cmrhvqget0058qpl3xs1sfaaj	cmrhuv9660016qp8x4b096p4p
cmrhvqget006hqpl3ly3vdnqz	cmrhvqget0058qpl3xs1sfaaj	cmrhuv96a0017qp8xzhirjbo7
cmrhvqget006iqpl3g0nuntx5	cmrhvqget0058qpl3xs1sfaaj	cmrhuv96e0018qp8xk8z62z7h
cmrhvqget006jqpl3txeucpmy	cmrhvqget0058qpl3xs1sfaaj	cmrhuv96i0019qp8xy4jtsg8w
cmrhvqget006kqpl3ntbwzynf	cmrhvqget0058qpl3xs1sfaaj	cmrhuv96m001aqp8xrbr9jwn9
cmrhvqget006lqpl3lmo6muxd	cmrhvqget0058qpl3xs1sfaaj	cmrhuv96q001bqp8xptuli3tx
cmrhvqget006mqpl3hkcx4rgs	cmrhvqget0058qpl3xs1sfaaj	cmrhuv96u001cqp8xjds6m0j1
cmrhvqget006nqpl3zrzdnlpd	cmrhvqget0058qpl3xs1sfaaj	cmrhuv96z001dqp8xbcfd2gv5
cmrhvqget006oqpl3irjli2i2	cmrhvqget0058qpl3xs1sfaaj	cmrhuv972001eqp8xeaixry18
cmrhvqget006pqpl3hdsvvsrx	cmrhvqget0058qpl3xs1sfaaj	cmrhuv976001fqp8xuvmvee3h
cmrhvqget006qqpl3qy1b10uo	cmrhvqget0058qpl3xs1sfaaj	cmrhuv97b001gqp8xkffyng0q
cmrhvqget006rqpl3zquyncrr	cmrhvqget0058qpl3xs1sfaaj	cmrhuv97f001hqp8x1ruuba9t
cmrhvqget006sqpl3rw19m2jb	cmrhvqget0058qpl3xs1sfaaj	cmrhuv97i001iqp8x8smizzij
cmrhvqget006tqpl34hxsmp6s	cmrhvqget0058qpl3xs1sfaaj	cmrhuv97m001jqp8x1zvfmt0l
cmrhw1fjg001qqpoygn7smcx4	cmrhw1fjg001oqpoykpw66klz	cmrhuv8wl0000qp8xukg1gxvz
cmrhw1fjg001rqpoyeohnmyf4	cmrhw1fjg001oqpoykpw66klz	cmrhuv8wv0001qp8xd6v38fr5
cmrhw1fjg001sqpoyg0supwgi	cmrhw1fjg001oqpoykpw66klz	cmrhuv8x30002qp8x63mor7np
cmrhw1fjg001tqpoy2vw8p2og	cmrhw1fjg001oqpoykpw66klz	cmrhuv8xd0003qp8xar4cz465
cmrhw1fjg001uqpoykg3nsx71	cmrhw1fjg001oqpoykpw66klz	cmrhuv8xm0004qp8xu1tfphaz
cmrhw1fjg001vqpoyrdmg57fg	cmrhw1fjg001oqpoykpw66klz	cmrhuv8xv0005qp8xvl6qzs6u
cmrhw1fjg001wqpoyc5oyamio	cmrhw1fjg001oqpoykpw66klz	cmrhuv8y40006qp8xtdth2c0k
cmrhw1fjg001xqpoyw0ckoyti	cmrhw1fjg001oqpoykpw66klz	cmrhuv8yc0007qp8x3p912eha
cmrhw1fjg001yqpoywh6x3ebn	cmrhw1fjg001oqpoykpw66klz	cmrhuv8yk0008qp8xy5tzfke8
cmrhw1fjg001zqpoyk859wi90	cmrhw1fjg001oqpoykpw66klz	cmrhuv8yt0009qp8x986wo2s2
cmrhw1fjg0020qpoytjapjm57	cmrhw1fjg001oqpoykpw66klz	cmrhuv8z2000aqp8xa5yhldo0
cmrhw1fjg0021qpoy9mznj8m6	cmrhw1fjg001oqpoykpw66klz	cmrhuv8za000bqp8xgqjufrt0
cmrhw1fjg0022qpoyn91pybrz	cmrhw1fjg001oqpoykpw66klz	cmrhuv8zj000cqp8xfk554q31
cmrhw1fjg0023qpoykqxq0yv0	cmrhw1fjg001oqpoykpw66klz	cmrhuv8zs000dqp8xmacewbat
cmrhw1fjg0024qpoydklb1jrn	cmrhw1fjg001oqpoykpw66klz	cmrhuv8zz000eqp8xycxacj4m
cmrhw1fjg0025qpoykoennu58	cmrhw1fjg001oqpoykpw66klz	cmrhuv909000fqp8xjx3wuedx
cmrhw1fjg0026qpoywcv3m5yg	cmrhw1fjg001oqpoykpw66klz	cmrhuv90i000gqp8xscw12weh
cmrhw1fjg0027qpoykn8e5cmr	cmrhw1fjg001oqpoykpw66klz	cmrhuv90q000hqp8xe0urpwi3
cmrhw1fjg0028qpoydmbi05fa	cmrhw1fjg001oqpoykpw66klz	cmrhuv90z000iqp8xnfd76cm3
cmrhw1fjg0029qpoyxjudoil8	cmrhw1fjg001oqpoykpw66klz	cmrhuv918000jqp8xfati2kdp
cmrhw1fjg002aqpoyf9ac4pqq	cmrhw1fjg001oqpoykpw66klz	cmrhuv91h000kqp8x8kwa11ht
cmrhw1fjg002bqpoyt780bwbs	cmrhw1fjg001oqpoykpw66klz	cmrhuv91p000lqp8xa5e83v0w
cmrhw1fjg002cqpoyfnk590ag	cmrhw1fjg001oqpoykpw66klz	cmrhuv920000mqp8xhf6dmaei
cmrhw1fjg002dqpoydz3922td	cmrhw1fjg001oqpoykpw66klz	cmrhuv929000nqp8xeesxkdmv
cmrhw1fjg002eqpoyton4z4qi	cmrhw1fjg001oqpoykpw66klz	cmrhuv92i000oqp8xkk8afbjt
cmrhw1fjg002fqpoy2hcsxexo	cmrhw1fjg001oqpoykpw66klz	cmrhuv92q000pqp8xtv63d0tn
cmrhw1fjg002gqpoyit26yrhf	cmrhw1fjg001oqpoykpw66klz	cmrhuv92z000qqp8xreeubpkw
cmrhw1fjg002hqpoydbsaaddv	cmrhw1fjg001oqpoykpw66klz	cmrhuv938000rqp8x0k2jiz5y
cmrhw1fjg002iqpoy6jv0fj83	cmrhw1fjg001oqpoykpw66klz	cmrhuv93i000sqp8xuulot58t
cmrhw1fjg002jqpoygoxg3y86	cmrhw1fjg001oqpoykpw66klz	cmrhuv93r000tqp8xoz9340sy
cmrhw1fjg002kqpoycbacn6q0	cmrhw1fjg001oqpoykpw66klz	cmrhuv940000uqp8xrbew2jtm
cmrhw1fjg002lqpoy09zio9uz	cmrhw1fjg001oqpoykpw66klz	cmrhuv94a000vqp8xl5r1wv0j
cmrhw1fjg002mqpoy3nmp5up0	cmrhw1fjg001oqpoykpw66klz	cmrhuv94h000wqp8xbaswjabx
cmrhw1fjg002nqpoyi0kzznug	cmrhw1fjg001oqpoykpw66klz	cmrhuv94o000xqp8xt5f9idxh
cmrhw1fjg002oqpoy2k4y4jdj	cmrhw1fjg001oqpoykpw66klz	cmrhuv94v000yqp8xdioaxk85
cmrhw1fjg002pqpoya6haxmhc	cmrhw1fjg001oqpoykpw66klz	cmrhuv952000zqp8xvtudjpwy
cmrhw1fjg002qqpoymrecr6d5	cmrhw1fjg001oqpoykpw66klz	cmrhuv9590010qp8x958rhz6m
cmrhw1fjg002rqpoy1t9qn4nl	cmrhw1fjg001oqpoykpw66klz	cmrhuv95g0011qp8xrhhxa4nr
cmrhw1fjg002sqpoyurk70wuc	cmrhw1fjg001oqpoykpw66klz	cmrhuv95n0012qp8xhe75fqyi
cmrhw1fjg002tqpoyn42fi3wp	cmrhw1fjg001oqpoykpw66klz	cmrhuv95t0013qp8xhsi7gejw
cmrhw1fjg002uqpoy2u6o28ot	cmrhw1fjg001oqpoykpw66klz	cmrhuv95y0014qp8xmkeeapyj
cmrhw1fjg002vqpoyw2ui1llx	cmrhw1fjg001oqpoykpw66klz	cmrhuv9620015qp8xiyd41or1
cmrhw1fjg002wqpoysrw96o63	cmrhw1fjg001oqpoykpw66klz	cmrhuv9660016qp8x4b096p4p
cmrhw1fjg002xqpoy5g1sqo7x	cmrhw1fjg001oqpoykpw66klz	cmrhuv96a0017qp8xzhirjbo7
cmrhw1fjg002yqpoyii857vw8	cmrhw1fjg001oqpoykpw66klz	cmrhuv96e0018qp8xk8z62z7h
cmrhw1fjg002zqpoyl1jpls66	cmrhw1fjg001oqpoykpw66klz	cmrhuv96i0019qp8xy4jtsg8w
cmrhw1fjg0030qpoyfzxjuo52	cmrhw1fjg001oqpoykpw66klz	cmrhuv96m001aqp8xrbr9jwn9
cmrhw1fjg0031qpoyj08ermid	cmrhw1fjg001oqpoykpw66klz	cmrhuv96q001bqp8xptuli3tx
cmrhw1fjg0032qpoyc9hi1iq0	cmrhw1fjg001oqpoykpw66klz	cmrhuv96u001cqp8xjds6m0j1
cmrhw1fjg0033qpoyxny0ipiq	cmrhw1fjg001oqpoykpw66klz	cmrhuv96z001dqp8xbcfd2gv5
cmrhw1fjg0034qpoyamgjtqpw	cmrhw1fjg001oqpoykpw66klz	cmrhuv972001eqp8xeaixry18
cmrhw1fjg0035qpoyqa5tb4n4	cmrhw1fjg001oqpoykpw66klz	cmrhuv976001fqp8xuvmvee3h
cmrhw1fjg0036qpoyzq37tw0e	cmrhw1fjg001oqpoykpw66klz	cmrhuv97b001gqp8xkffyng0q
cmrhw1fjg0037qpoy1xlt0z5i	cmrhw1fjg001oqpoykpw66klz	cmrhuv97f001hqp8x1ruuba9t
cmrhw1fjg0038qpoyhi7xjgnu	cmrhw1fjg001oqpoykpw66klz	cmrhuv97i001iqp8x8smizzij
cmrhw1fjg0039qpoy1ynlvsbe	cmrhw1fjg001oqpoykpw66klz	cmrhuv97m001jqp8x1zvfmt0l
cmrhwrlay001qqpp7umj0b03x	cmrhwrlay001oqpp7s98t71cs	cmrhuv8wl0000qp8xukg1gxvz
cmrhwrlay001rqpp7r0pnp8sw	cmrhwrlay001oqpp7s98t71cs	cmrhuv8wv0001qp8xd6v38fr5
cmrhwrlay001sqpp7rbl45hx9	cmrhwrlay001oqpp7s98t71cs	cmrhuv8x30002qp8x63mor7np
cmrhwrlay001tqpp7fhlk8id7	cmrhwrlay001oqpp7s98t71cs	cmrhuv8xd0003qp8xar4cz465
cmrhwrlay001uqpp7mn0nhutg	cmrhwrlay001oqpp7s98t71cs	cmrhuv8xm0004qp8xu1tfphaz
cmrhwrlay001vqpp7es4omcuy	cmrhwrlay001oqpp7s98t71cs	cmrhuv8xv0005qp8xvl6qzs6u
cmrhwrlay001wqpp752z9wg6e	cmrhwrlay001oqpp7s98t71cs	cmrhuv8y40006qp8xtdth2c0k
cmrhwrlay001xqpp7k5hekmo2	cmrhwrlay001oqpp7s98t71cs	cmrhuv8yc0007qp8x3p912eha
cmrhwrlay001yqpp71kdghb5h	cmrhwrlay001oqpp7s98t71cs	cmrhuv8yk0008qp8xy5tzfke8
cmrhwrlay001zqpp7oz88lmku	cmrhwrlay001oqpp7s98t71cs	cmrhuv8yt0009qp8x986wo2s2
cmrhwrlay0020qpp7jwfxkbh6	cmrhwrlay001oqpp7s98t71cs	cmrhuv8z2000aqp8xa5yhldo0
cmrhwrlay0021qpp79ypfh8j0	cmrhwrlay001oqpp7s98t71cs	cmrhuv8za000bqp8xgqjufrt0
cmrhwrlay0022qpp7isyk3v4r	cmrhwrlay001oqpp7s98t71cs	cmrhuv8zj000cqp8xfk554q31
cmrhwrlay0023qpp78i4yt5l1	cmrhwrlay001oqpp7s98t71cs	cmrhuv8zs000dqp8xmacewbat
cmrhwrlay0024qpp7nxen7ebx	cmrhwrlay001oqpp7s98t71cs	cmrhuv8zz000eqp8xycxacj4m
cmrhwrlay0025qpp7mlk37n1r	cmrhwrlay001oqpp7s98t71cs	cmrhuv909000fqp8xjx3wuedx
cmrhwrlay0026qpp7znn10eqb	cmrhwrlay001oqpp7s98t71cs	cmrhuv90i000gqp8xscw12weh
cmrhwrlay0027qpp71ivi6mdr	cmrhwrlay001oqpp7s98t71cs	cmrhuv90q000hqp8xe0urpwi3
cmrhwrlay0028qpp72fqi2fjc	cmrhwrlay001oqpp7s98t71cs	cmrhuv90z000iqp8xnfd76cm3
cmrhwrlay0029qpp71w6phit5	cmrhwrlay001oqpp7s98t71cs	cmrhuv918000jqp8xfati2kdp
cmrhwrlay002aqpp7r3hrgb8f	cmrhwrlay001oqpp7s98t71cs	cmrhuv91h000kqp8x8kwa11ht
cmrhwrlay002bqpp7e7yqvigd	cmrhwrlay001oqpp7s98t71cs	cmrhuv91p000lqp8xa5e83v0w
cmrhwrlay002cqpp7sffum424	cmrhwrlay001oqpp7s98t71cs	cmrhuv920000mqp8xhf6dmaei
cmrhwrlay002dqpp796s8jikx	cmrhwrlay001oqpp7s98t71cs	cmrhuv929000nqp8xeesxkdmv
cmrhwrlay002eqpp7bkdty078	cmrhwrlay001oqpp7s98t71cs	cmrhuv92i000oqp8xkk8afbjt
cmrhwrlay002fqpp70o3p44ye	cmrhwrlay001oqpp7s98t71cs	cmrhuv92q000pqp8xtv63d0tn
cmrhwrlay002gqpp7tjpnnxus	cmrhwrlay001oqpp7s98t71cs	cmrhuv92z000qqp8xreeubpkw
cmrhwrlay002hqpp70ezmgkly	cmrhwrlay001oqpp7s98t71cs	cmrhuv938000rqp8x0k2jiz5y
cmrhwrlay002iqpp72f70kxip	cmrhwrlay001oqpp7s98t71cs	cmrhuv93i000sqp8xuulot58t
cmrhwrlay002jqpp7loi7zsgq	cmrhwrlay001oqpp7s98t71cs	cmrhuv93r000tqp8xoz9340sy
cmrhwrlay002kqpp7k736ztm7	cmrhwrlay001oqpp7s98t71cs	cmrhuv940000uqp8xrbew2jtm
cmrhwrlay002lqpp7xaygprks	cmrhwrlay001oqpp7s98t71cs	cmrhuv94a000vqp8xl5r1wv0j
cmrhwrlay002mqpp7h5uemi8b	cmrhwrlay001oqpp7s98t71cs	cmrhuv94h000wqp8xbaswjabx
cmrhwrlay002nqpp70y5zcy98	cmrhwrlay001oqpp7s98t71cs	cmrhuv94o000xqp8xt5f9idxh
cmrhwrlay002oqpp7wzl9xi3d	cmrhwrlay001oqpp7s98t71cs	cmrhuv94v000yqp8xdioaxk85
cmrhwrlay002pqpp7lan5y1co	cmrhwrlay001oqpp7s98t71cs	cmrhuv952000zqp8xvtudjpwy
cmrhwrlay002qqpp75f3xwszv	cmrhwrlay001oqpp7s98t71cs	cmrhuv9590010qp8x958rhz6m
cmrhwrlay002rqpp7c0creil8	cmrhwrlay001oqpp7s98t71cs	cmrhuv95g0011qp8xrhhxa4nr
cmrhwrlay002sqpp7nu0mv14o	cmrhwrlay001oqpp7s98t71cs	cmrhuv95n0012qp8xhe75fqyi
cmrhwrlay002tqpp7qfgmkm52	cmrhwrlay001oqpp7s98t71cs	cmrhuv95t0013qp8xhsi7gejw
cmrhwrlay002uqpp7le8pl7i9	cmrhwrlay001oqpp7s98t71cs	cmrhuv95y0014qp8xmkeeapyj
cmrhwrlay002vqpp7tj8ktx7z	cmrhwrlay001oqpp7s98t71cs	cmrhuv9620015qp8xiyd41or1
cmrhwrlay002wqpp7ejppgse4	cmrhwrlay001oqpp7s98t71cs	cmrhuv9660016qp8x4b096p4p
cmrhwrlay002xqpp7um7oi5pp	cmrhwrlay001oqpp7s98t71cs	cmrhuv96a0017qp8xzhirjbo7
cmrhwrlay002yqpp75vr92ui3	cmrhwrlay001oqpp7s98t71cs	cmrhuv96e0018qp8xk8z62z7h
cmrhwrlay002zqpp7ovd57moj	cmrhwrlay001oqpp7s98t71cs	cmrhuv96i0019qp8xy4jtsg8w
cmrhwrlay0030qpp7r3af4ssn	cmrhwrlay001oqpp7s98t71cs	cmrhuv96m001aqp8xrbr9jwn9
cmrhwrlay0031qpp7xoyw08as	cmrhwrlay001oqpp7s98t71cs	cmrhuv96q001bqp8xptuli3tx
cmrhwrlay0032qpp7eh14gogx	cmrhwrlay001oqpp7s98t71cs	cmrhuv96u001cqp8xjds6m0j1
cmrhwrlay0033qpp78mrlz2ai	cmrhwrlay001oqpp7s98t71cs	cmrhuv96z001dqp8xbcfd2gv5
cmrhwrlay0034qpp7gjlyqn3l	cmrhwrlay001oqpp7s98t71cs	cmrhuv972001eqp8xeaixry18
cmrhwrlay0035qpp7cc381y0i	cmrhwrlay001oqpp7s98t71cs	cmrhuv976001fqp8xuvmvee3h
cmrhwrlay0036qpp7wxhwi315	cmrhwrlay001oqpp7s98t71cs	cmrhuv97b001gqp8xkffyng0q
cmrhwrlay0037qpp7f5rdoxme	cmrhwrlay001oqpp7s98t71cs	cmrhuv97f001hqp8x1ruuba9t
cmrhwrlay0038qpp7kdv1qjxz	cmrhwrlay001oqpp7s98t71cs	cmrhuv97i001iqp8x8smizzij
cmrhwrlay0039qpp78haqspno	cmrhwrlay001oqpp7s98t71cs	cmrhuv97m001jqp8x1zvfmt0l
cmrhwrygj0054qpp75i991170	cmrhwrygj0052qpp77chsox4o	cmrhuv8wl0000qp8xukg1gxvz
cmrhwrygj0055qpp7hbixa7o6	cmrhwrygj0052qpp77chsox4o	cmrhuv8wv0001qp8xd6v38fr5
cmrhwrygj0056qpp72mf2lqca	cmrhwrygj0052qpp77chsox4o	cmrhuv8x30002qp8x63mor7np
cmrhwrygj0057qpp75uh4qrxc	cmrhwrygj0052qpp77chsox4o	cmrhuv8xd0003qp8xar4cz465
cmrhwrygj0058qpp71ifvykpk	cmrhwrygj0052qpp77chsox4o	cmrhuv8xm0004qp8xu1tfphaz
cmrhwrygj0059qpp739sjuadw	cmrhwrygj0052qpp77chsox4o	cmrhuv8xv0005qp8xvl6qzs6u
cmrhwrygj005aqpp7mlvibm8x	cmrhwrygj0052qpp77chsox4o	cmrhuv8y40006qp8xtdth2c0k
cmrhwrygj005bqpp7hzzua3qg	cmrhwrygj0052qpp77chsox4o	cmrhuv8yc0007qp8x3p912eha
cmrhwrygj005cqpp778xkeqb9	cmrhwrygj0052qpp77chsox4o	cmrhuv8yk0008qp8xy5tzfke8
cmrhwrygj005dqpp7maorgtws	cmrhwrygj0052qpp77chsox4o	cmrhuv8yt0009qp8x986wo2s2
cmrhwrygj005eqpp7zef8lmkp	cmrhwrygj0052qpp77chsox4o	cmrhuv8z2000aqp8xa5yhldo0
cmrhwrygj005fqpp7hq9biw7l	cmrhwrygj0052qpp77chsox4o	cmrhuv8za000bqp8xgqjufrt0
cmrhwrygj005gqpp7jjzr8jh6	cmrhwrygj0052qpp77chsox4o	cmrhuv8zj000cqp8xfk554q31
cmrhwrygj005hqpp75qjsmgo3	cmrhwrygj0052qpp77chsox4o	cmrhuv8zs000dqp8xmacewbat
cmrhwrygj005iqpp75rtof6hk	cmrhwrygj0052qpp77chsox4o	cmrhuv8zz000eqp8xycxacj4m
cmrhwrygj005jqpp7t38ozkn6	cmrhwrygj0052qpp77chsox4o	cmrhuv909000fqp8xjx3wuedx
cmrhwrygj005kqpp7bejq0hp2	cmrhwrygj0052qpp77chsox4o	cmrhuv90i000gqp8xscw12weh
cmrhwrygj005lqpp761y670ay	cmrhwrygj0052qpp77chsox4o	cmrhuv90q000hqp8xe0urpwi3
cmrhwrygj005mqpp7su5hfql9	cmrhwrygj0052qpp77chsox4o	cmrhuv90z000iqp8xnfd76cm3
cmrhwrygj005nqpp76i2io48v	cmrhwrygj0052qpp77chsox4o	cmrhuv918000jqp8xfati2kdp
cmrhwrygj005oqpp7dg1dufh1	cmrhwrygj0052qpp77chsox4o	cmrhuv91h000kqp8x8kwa11ht
cmrhwrygj005pqpp7dnt5wwxd	cmrhwrygj0052qpp77chsox4o	cmrhuv91p000lqp8xa5e83v0w
cmrhwrygj005qqpp79xfl5kia	cmrhwrygj0052qpp77chsox4o	cmrhuv920000mqp8xhf6dmaei
cmrhwrygj005rqpp746o1ioei	cmrhwrygj0052qpp77chsox4o	cmrhuv929000nqp8xeesxkdmv
cmrhwrygj005sqpp71uk647ne	cmrhwrygj0052qpp77chsox4o	cmrhuv92i000oqp8xkk8afbjt
cmrhwrygj005tqpp70ecfnkx5	cmrhwrygj0052qpp77chsox4o	cmrhuv92q000pqp8xtv63d0tn
cmrhwrygj005uqpp7glm1z3ag	cmrhwrygj0052qpp77chsox4o	cmrhuv92z000qqp8xreeubpkw
cmrhwrygj005vqpp7dmd8mknp	cmrhwrygj0052qpp77chsox4o	cmrhuv938000rqp8x0k2jiz5y
cmrhwrygj005wqpp7o498re10	cmrhwrygj0052qpp77chsox4o	cmrhuv93i000sqp8xuulot58t
cmrhwrygj005xqpp7leqkyxg0	cmrhwrygj0052qpp77chsox4o	cmrhuv93r000tqp8xoz9340sy
cmrhwrygj005yqpp7qz2nd2aa	cmrhwrygj0052qpp77chsox4o	cmrhuv940000uqp8xrbew2jtm
cmrhwrygj005zqpp7pso41x0t	cmrhwrygj0052qpp77chsox4o	cmrhuv94a000vqp8xl5r1wv0j
cmrhwrygj0060qpp70nmgqdp4	cmrhwrygj0052qpp77chsox4o	cmrhuv94h000wqp8xbaswjabx
cmrhwrygj0061qpp7458ftrvk	cmrhwrygj0052qpp77chsox4o	cmrhuv94o000xqp8xt5f9idxh
cmrhwrygj0062qpp71k1r1q8k	cmrhwrygj0052qpp77chsox4o	cmrhuv94v000yqp8xdioaxk85
cmrhwrygj0063qpp75thj6byv	cmrhwrygj0052qpp77chsox4o	cmrhuv952000zqp8xvtudjpwy
cmrhwrygj0064qpp7lmua65jn	cmrhwrygj0052qpp77chsox4o	cmrhuv9590010qp8x958rhz6m
cmrhwrygj0065qpp7i446435o	cmrhwrygj0052qpp77chsox4o	cmrhuv95g0011qp8xrhhxa4nr
cmrhwrygj0066qpp7qcl53v6a	cmrhwrygj0052qpp77chsox4o	cmrhuv95n0012qp8xhe75fqyi
cmrhwrygj0067qpp72a2ezivk	cmrhwrygj0052qpp77chsox4o	cmrhuv95t0013qp8xhsi7gejw
cmrhwrygj0068qpp7pdwes95j	cmrhwrygj0052qpp77chsox4o	cmrhuv95y0014qp8xmkeeapyj
cmrhwrygj0069qpp7fv1jkiq2	cmrhwrygj0052qpp77chsox4o	cmrhuv9620015qp8xiyd41or1
cmrhwrygj006aqpp7mrxisvyn	cmrhwrygj0052qpp77chsox4o	cmrhuv9660016qp8x4b096p4p
cmrhwrygj006bqpp7o6v3ozxh	cmrhwrygj0052qpp77chsox4o	cmrhuv96a0017qp8xzhirjbo7
cmrhwrygj006cqpp7v8vyyof2	cmrhwrygj0052qpp77chsox4o	cmrhuv96e0018qp8xk8z62z7h
cmrhwrygj006dqpp7zeqcwmca	cmrhwrygj0052qpp77chsox4o	cmrhuv96i0019qp8xy4jtsg8w
cmrhwrygj006eqpp7t3q0qi82	cmrhwrygj0052qpp77chsox4o	cmrhuv96m001aqp8xrbr9jwn9
cmrhwrygj006fqpp7ap2meeed	cmrhwrygj0052qpp77chsox4o	cmrhuv96q001bqp8xptuli3tx
cmrhwrygj006gqpp7rb8vay9u	cmrhwrygj0052qpp77chsox4o	cmrhuv96u001cqp8xjds6m0j1
cmrhwrygj006hqpp7akji7w0u	cmrhwrygj0052qpp77chsox4o	cmrhuv96z001dqp8xbcfd2gv5
cmrhwrygj006iqpp764ab26cm	cmrhwrygj0052qpp77chsox4o	cmrhuv972001eqp8xeaixry18
cmrhwrygj006jqpp79f3xf8qq	cmrhwrygj0052qpp77chsox4o	cmrhuv976001fqp8xuvmvee3h
cmrhwrygj006kqpp71y4gj0j9	cmrhwrygj0052qpp77chsox4o	cmrhuv97b001gqp8xkffyng0q
cmrhwrygj006lqpp795e1y63s	cmrhwrygj0052qpp77chsox4o	cmrhuv97f001hqp8x1ruuba9t
cmrhwrygj006mqpp71uw03g1z	cmrhwrygj0052qpp77chsox4o	cmrhuv97i001iqp8x8smizzij
cmrhwrygj006nqpp7gzamplq7	cmrhwrygj0052qpp77chsox4o	cmrhuv97m001jqp8x1zvfmt0l
cmrhwsdaj008kqpp79byqw5ga	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8wl0000qp8xukg1gxvz
cmrhwsdaj008lqpp73nn1n7tb	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8wv0001qp8xd6v38fr5
cmrhwsdaj008mqpp7nnlsi122	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8x30002qp8x63mor7np
cmrhwsdaj008nqpp7hgkz18h9	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8xd0003qp8xar4cz465
cmrhwsdaj008oqpp7xdpnqjzt	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8xm0004qp8xu1tfphaz
cmrhwsdaj008pqpp79f0i7cqw	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8xv0005qp8xvl6qzs6u
cmrhwsdaj008qqpp75ny2cv66	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8y40006qp8xtdth2c0k
cmrhwsdaj008rqpp7gh085aa4	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8yc0007qp8x3p912eha
cmrhwsdaj008sqpp755n5fxad	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8yk0008qp8xy5tzfke8
cmrhwsdaj008tqpp700v3f7wb	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8yt0009qp8x986wo2s2
cmrhwsdaj008uqpp72ogpi8xf	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8z2000aqp8xa5yhldo0
cmrhwsdaj008vqpp7q34smky6	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8za000bqp8xgqjufrt0
cmrhwsdaj008wqpp7yzj9xy7z	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8zj000cqp8xfk554q31
cmrhwsdaj008xqpp70rk430t9	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8zs000dqp8xmacewbat
cmrhwsdaj008yqpp75tln9ivs	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv8zz000eqp8xycxacj4m
cmrhwsdaj008zqpp7z0m35opp	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv909000fqp8xjx3wuedx
cmrhwsdaj0090qpp7m7coc0ll	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv90i000gqp8xscw12weh
cmrhwsdaj0091qpp7l8xyc0hh	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv90q000hqp8xe0urpwi3
cmrhwsdaj0092qpp7wtjxskr4	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv90z000iqp8xnfd76cm3
cmrhwsdaj0093qpp7zdeoxqux	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv918000jqp8xfati2kdp
cmrhwsdaj0094qpp72ywmyfj6	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv91h000kqp8x8kwa11ht
cmrhwsdaj0095qpp7del50ab2	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv91p000lqp8xa5e83v0w
cmrhwsdaj0096qpp7psrxnpss	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv920000mqp8xhf6dmaei
cmrhwsdaj0097qpp7dw9f5zac	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv929000nqp8xeesxkdmv
cmrhwsdaj0098qpp7nqyssqyz	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv92i000oqp8xkk8afbjt
cmrhwsdaj0099qpp7438x3m13	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv92q000pqp8xtv63d0tn
cmrhwsdaj009aqpp7tmvkvzmz	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv92z000qqp8xreeubpkw
cmrhwsdaj009bqpp77entt8as	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv938000rqp8x0k2jiz5y
cmrhwsdaj009cqpp754s5lq4q	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv93i000sqp8xuulot58t
cmrhwsdaj009dqpp778bw9zv1	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv93r000tqp8xoz9340sy
cmrhwsdaj009eqpp734thj3ys	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv940000uqp8xrbew2jtm
cmrhwsdaj009fqpp76vacl6r5	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv94a000vqp8xl5r1wv0j
cmrhwsdaj009gqpp7oxl4imw6	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv94h000wqp8xbaswjabx
cmrhwsdaj009hqpp72mr61u7w	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv94o000xqp8xt5f9idxh
cmrhwsdaj009iqpp78d58bh5r	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv94v000yqp8xdioaxk85
cmrhwsdaj009jqpp77nfygjzp	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv952000zqp8xvtudjpwy
cmrhwsdaj009kqpp7hlplubah	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv9590010qp8x958rhz6m
cmrhwsdaj009lqpp7oimw2h34	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv95g0011qp8xrhhxa4nr
cmrhwsdaj009mqpp7xaa1jym9	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv95n0012qp8xhe75fqyi
cmrhwsdaj009nqpp7fgpj36mb	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv95t0013qp8xhsi7gejw
cmrhwsdaj009oqpp7oz0hj5do	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv95y0014qp8xmkeeapyj
cmrhwsdaj009pqpp7m7e8j5l4	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv9620015qp8xiyd41or1
cmrhwsdaj009qqpp7lljocwpu	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv9660016qp8x4b096p4p
cmrhwsdaj009rqpp78cm8mi6l	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv96a0017qp8xzhirjbo7
cmrhwsdaj009sqpp7mujh1byg	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv96e0018qp8xk8z62z7h
cmrhwsdaj009tqpp7bjhizo5r	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv96i0019qp8xy4jtsg8w
cmrhwsdaj009uqpp72s36mnzg	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv96m001aqp8xrbr9jwn9
cmrhwsdaj009vqpp7lg8xc4x8	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv96q001bqp8xptuli3tx
cmrhwsdaj009wqpp73mocqakk	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv96u001cqp8xjds6m0j1
cmrhwsdaj009xqpp7fk5sy5ar	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv96z001dqp8xbcfd2gv5
cmrhwsdaj009yqpp79zs6fze9	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv972001eqp8xeaixry18
cmrhwsdaj009zqpp73vqfhpxu	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv976001fqp8xuvmvee3h
cmrhwsdaj00a0qpp764myxmc8	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv97b001gqp8xkffyng0q
cmrhwsdaj00a1qpp7y7ych31e	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv97f001hqp8x1ruuba9t
cmrhwsdaj00a2qpp7eixswrlx	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv97i001iqp8x8smizzij
cmrhwsdaj00a3qpp75tyvw6je	cmrhwsdaj008iqpp7tmd0srqp	cmrhuv97m001jqp8x1zvfmt0l
cmrhwvvu3001qqplfx8y39e5k	cmrhwvvu3001oqplfbnx3492q	cmrhuv8wl0000qp8xukg1gxvz
cmrhwvvu3001rqplfpx552h8f	cmrhwvvu3001oqplfbnx3492q	cmrhuv8wv0001qp8xd6v38fr5
cmrhwvvu3001sqplftfzmn0tg	cmrhwvvu3001oqplfbnx3492q	cmrhuv8x30002qp8x63mor7np
cmrhwvvu3001tqplf7r62tlxl	cmrhwvvu3001oqplfbnx3492q	cmrhuv8xd0003qp8xar4cz465
cmrhwvvu3001uqplf008szbmk	cmrhwvvu3001oqplfbnx3492q	cmrhuv8xm0004qp8xu1tfphaz
cmrhwvvu3001vqplf7frct5yo	cmrhwvvu3001oqplfbnx3492q	cmrhuv8xv0005qp8xvl6qzs6u
cmrhwvvu3001wqplf7wzuzh5y	cmrhwvvu3001oqplfbnx3492q	cmrhuv8y40006qp8xtdth2c0k
cmrhwvvu3001xqplfynxv1vv6	cmrhwvvu3001oqplfbnx3492q	cmrhuv8yc0007qp8x3p912eha
cmrhwvvu3001yqplftcnp266a	cmrhwvvu3001oqplfbnx3492q	cmrhuv8yk0008qp8xy5tzfke8
cmrhwvvu3001zqplf0rhqxg2z	cmrhwvvu3001oqplfbnx3492q	cmrhuv8yt0009qp8x986wo2s2
cmrhwvvu30020qplffqhc5f3e	cmrhwvvu3001oqplfbnx3492q	cmrhuv8z2000aqp8xa5yhldo0
cmrhwvvu30021qplfmh9o0q7y	cmrhwvvu3001oqplfbnx3492q	cmrhuv8za000bqp8xgqjufrt0
cmrhwvvu30022qplfjfu5ndam	cmrhwvvu3001oqplfbnx3492q	cmrhuv8zj000cqp8xfk554q31
cmrhwvvu30023qplf4hrvv2pp	cmrhwvvu3001oqplfbnx3492q	cmrhuv8zs000dqp8xmacewbat
cmrhwvvu30024qplfcr4nm8t1	cmrhwvvu3001oqplfbnx3492q	cmrhuv8zz000eqp8xycxacj4m
cmrhwvvu30025qplfo3nieuh9	cmrhwvvu3001oqplfbnx3492q	cmrhuv909000fqp8xjx3wuedx
cmrhwvvu30026qplf85u3z80t	cmrhwvvu3001oqplfbnx3492q	cmrhuv90i000gqp8xscw12weh
cmrhwvvu30027qplf68nfexvl	cmrhwvvu3001oqplfbnx3492q	cmrhuv90q000hqp8xe0urpwi3
cmrhwvvu30028qplfdhlcy1g3	cmrhwvvu3001oqplfbnx3492q	cmrhuv90z000iqp8xnfd76cm3
cmrhwvvu30029qplfdwmktt30	cmrhwvvu3001oqplfbnx3492q	cmrhuv918000jqp8xfati2kdp
cmrhwvvu3002aqplfcn7gpko6	cmrhwvvu3001oqplfbnx3492q	cmrhuv91h000kqp8x8kwa11ht
cmrhwvvu3002bqplfww81awzp	cmrhwvvu3001oqplfbnx3492q	cmrhuv91p000lqp8xa5e83v0w
cmrhwvvu3002cqplfw3vtai2k	cmrhwvvu3001oqplfbnx3492q	cmrhuv920000mqp8xhf6dmaei
cmrhwvvu3002dqplfphic3k9p	cmrhwvvu3001oqplfbnx3492q	cmrhuv929000nqp8xeesxkdmv
cmrhwvvu3002eqplfvj1wl547	cmrhwvvu3001oqplfbnx3492q	cmrhuv92i000oqp8xkk8afbjt
cmrhwvvu3002fqplf7pteqxnh	cmrhwvvu3001oqplfbnx3492q	cmrhuv92q000pqp8xtv63d0tn
cmrhwvvu3002gqplf2aucvk0y	cmrhwvvu3001oqplfbnx3492q	cmrhuv92z000qqp8xreeubpkw
cmrhwvvu3002hqplffj47m58z	cmrhwvvu3001oqplfbnx3492q	cmrhuv938000rqp8x0k2jiz5y
cmrhwvvu3002iqplfhlx9yo65	cmrhwvvu3001oqplfbnx3492q	cmrhuv93i000sqp8xuulot58t
cmrhwvvu3002jqplfid8tsemi	cmrhwvvu3001oqplfbnx3492q	cmrhuv93r000tqp8xoz9340sy
cmrhwvvu3002kqplfy6fsfsjz	cmrhwvvu3001oqplfbnx3492q	cmrhuv940000uqp8xrbew2jtm
cmrhwvvu3002lqplfjcspltso	cmrhwvvu3001oqplfbnx3492q	cmrhuv94a000vqp8xl5r1wv0j
cmrhwvvu3002mqplf2d51j1e7	cmrhwvvu3001oqplfbnx3492q	cmrhuv94h000wqp8xbaswjabx
cmrhwvvu3002nqplfwvtgtklc	cmrhwvvu3001oqplfbnx3492q	cmrhuv94o000xqp8xt5f9idxh
cmrhwvvu3002oqplf8nvmyff1	cmrhwvvu3001oqplfbnx3492q	cmrhuv94v000yqp8xdioaxk85
cmrhwvvu3002pqplfayc37mvm	cmrhwvvu3001oqplfbnx3492q	cmrhuv952000zqp8xvtudjpwy
cmrhwvvu3002qqplfj670q5yz	cmrhwvvu3001oqplfbnx3492q	cmrhuv9590010qp8x958rhz6m
cmrhwvvu3002rqplfymn5oech	cmrhwvvu3001oqplfbnx3492q	cmrhuv95g0011qp8xrhhxa4nr
cmrhwvvu3002sqplfgdi727ho	cmrhwvvu3001oqplfbnx3492q	cmrhuv95n0012qp8xhe75fqyi
cmrhwvvu3002tqplfdcsck5mn	cmrhwvvu3001oqplfbnx3492q	cmrhuv95t0013qp8xhsi7gejw
cmrhwvvu3002uqplf78xh5lk4	cmrhwvvu3001oqplfbnx3492q	cmrhuv95y0014qp8xmkeeapyj
cmrhwvvu3002vqplfaph8rnn8	cmrhwvvu3001oqplfbnx3492q	cmrhuv9620015qp8xiyd41or1
cmrhwvvu3002wqplfzlq0b6n3	cmrhwvvu3001oqplfbnx3492q	cmrhuv9660016qp8x4b096p4p
cmrhwvvu3002xqplfpbkbgnxn	cmrhwvvu3001oqplfbnx3492q	cmrhuv96a0017qp8xzhirjbo7
cmrhwvvu3002yqplfitvtwdh0	cmrhwvvu3001oqplfbnx3492q	cmrhuv96e0018qp8xk8z62z7h
cmrhwvvu3002zqplficsfi1wc	cmrhwvvu3001oqplfbnx3492q	cmrhuv96i0019qp8xy4jtsg8w
cmrhwvvu30030qplfa6r6izmw	cmrhwvvu3001oqplfbnx3492q	cmrhuv96m001aqp8xrbr9jwn9
cmrhwvvu30031qplfhvac09kv	cmrhwvvu3001oqplfbnx3492q	cmrhuv96q001bqp8xptuli3tx
cmrhwvvu30032qplfp2ajrs3r	cmrhwvvu3001oqplfbnx3492q	cmrhuv96u001cqp8xjds6m0j1
cmrhwvvu30033qplf9pj5d2f6	cmrhwvvu3001oqplfbnx3492q	cmrhuv96z001dqp8xbcfd2gv5
cmrhwvvu30034qplfip4lp0pr	cmrhwvvu3001oqplfbnx3492q	cmrhuv972001eqp8xeaixry18
cmrhwvvu30035qplfswqohvu2	cmrhwvvu3001oqplfbnx3492q	cmrhuv976001fqp8xuvmvee3h
cmrhwvvu30036qplf8wj61n1w	cmrhwvvu3001oqplfbnx3492q	cmrhuv97b001gqp8xkffyng0q
cmrhwvvu30037qplfdghozzg9	cmrhwvvu3001oqplfbnx3492q	cmrhuv97f001hqp8x1ruuba9t
cmrhwvvu30038qplfy7a9nv91	cmrhwvvu3001oqplfbnx3492q	cmrhuv97i001iqp8x8smizzij
cmrhwvvu30039qplfj8t99s0a	cmrhwvvu3001oqplfbnx3492q	cmrhuv97m001jqp8x1zvfmt0l
cmrhxfuxa001qqp3uuo5qfsi8	cmrhxfux9001oqp3udmbrtij9	cmrhuv8wl0000qp8xukg1gxvz
cmrhxfuxa001rqp3u2ke52fua	cmrhxfux9001oqp3udmbrtij9	cmrhuv8wv0001qp8xd6v38fr5
cmrhxfuxa001sqp3uknlnn4ot	cmrhxfux9001oqp3udmbrtij9	cmrhuv8x30002qp8x63mor7np
cmrhxfuxa001tqp3uigfe5ftn	cmrhxfux9001oqp3udmbrtij9	cmrhuv8xd0003qp8xar4cz465
cmrhxfuxa001uqp3ugftoxs36	cmrhxfux9001oqp3udmbrtij9	cmrhuv8xm0004qp8xu1tfphaz
cmrhxfuxa001vqp3uij6cb7lg	cmrhxfux9001oqp3udmbrtij9	cmrhuv8xv0005qp8xvl6qzs6u
cmrhxfuxa001wqp3ur5dcz79f	cmrhxfux9001oqp3udmbrtij9	cmrhuv8y40006qp8xtdth2c0k
cmrhxfuxa001xqp3u2spox1wr	cmrhxfux9001oqp3udmbrtij9	cmrhuv8yc0007qp8x3p912eha
cmrhxfuxa001yqp3u876z48g5	cmrhxfux9001oqp3udmbrtij9	cmrhuv8yk0008qp8xy5tzfke8
cmrhxfuxa001zqp3ugdh57xm0	cmrhxfux9001oqp3udmbrtij9	cmrhuv8yt0009qp8x986wo2s2
cmrhxfuxa0020qp3u4znyo7dd	cmrhxfux9001oqp3udmbrtij9	cmrhuv8z2000aqp8xa5yhldo0
cmrhxfuxa0021qp3uqbavftlj	cmrhxfux9001oqp3udmbrtij9	cmrhuv8za000bqp8xgqjufrt0
cmrhxfuxa0022qp3upecbev1t	cmrhxfux9001oqp3udmbrtij9	cmrhuv8zj000cqp8xfk554q31
cmrhxfuxa0023qp3ukyaknf38	cmrhxfux9001oqp3udmbrtij9	cmrhuv8zs000dqp8xmacewbat
cmrhxfuxa0024qp3uaop6c8af	cmrhxfux9001oqp3udmbrtij9	cmrhuv8zz000eqp8xycxacj4m
cmrhxfuxa0025qp3untq5n1wv	cmrhxfux9001oqp3udmbrtij9	cmrhuv909000fqp8xjx3wuedx
cmrhxfuxa0026qp3ui7erlyls	cmrhxfux9001oqp3udmbrtij9	cmrhuv90i000gqp8xscw12weh
cmrhxfuxa0027qp3uduh8cxd5	cmrhxfux9001oqp3udmbrtij9	cmrhuv90q000hqp8xe0urpwi3
cmrhxfuxa0028qp3uugghabwz	cmrhxfux9001oqp3udmbrtij9	cmrhuv90z000iqp8xnfd76cm3
cmrhxfuxa0029qp3u8al997nv	cmrhxfux9001oqp3udmbrtij9	cmrhuv918000jqp8xfati2kdp
cmrhxfuxa002aqp3uj4s80ugw	cmrhxfux9001oqp3udmbrtij9	cmrhuv91h000kqp8x8kwa11ht
cmrhxfuxa002bqp3un7510v8x	cmrhxfux9001oqp3udmbrtij9	cmrhuv91p000lqp8xa5e83v0w
cmrhxfuxa002cqp3ucij00ooa	cmrhxfux9001oqp3udmbrtij9	cmrhuv920000mqp8xhf6dmaei
cmrhxfuxa002dqp3uf3epfcl4	cmrhxfux9001oqp3udmbrtij9	cmrhuv929000nqp8xeesxkdmv
cmrhxfuxa002eqp3u6ecmfivx	cmrhxfux9001oqp3udmbrtij9	cmrhuv92i000oqp8xkk8afbjt
cmrhxfuxa002fqp3us8v38kst	cmrhxfux9001oqp3udmbrtij9	cmrhuv92q000pqp8xtv63d0tn
cmrhxfuxa002gqp3utdscy37z	cmrhxfux9001oqp3udmbrtij9	cmrhuv92z000qqp8xreeubpkw
cmrhxfuxa002hqp3u0z91uvfn	cmrhxfux9001oqp3udmbrtij9	cmrhuv938000rqp8x0k2jiz5y
cmrhxfuxa002iqp3uc1r6u2mo	cmrhxfux9001oqp3udmbrtij9	cmrhuv93i000sqp8xuulot58t
cmrhxfuxa002jqp3u9t1usdd0	cmrhxfux9001oqp3udmbrtij9	cmrhuv93r000tqp8xoz9340sy
cmrhxfuxa002kqp3uivwjvczi	cmrhxfux9001oqp3udmbrtij9	cmrhuv940000uqp8xrbew2jtm
cmrhxfuxa002lqp3u1zadv1b3	cmrhxfux9001oqp3udmbrtij9	cmrhuv94a000vqp8xl5r1wv0j
cmrhxfuxa002mqp3uv1bpgx15	cmrhxfux9001oqp3udmbrtij9	cmrhuv94h000wqp8xbaswjabx
cmrhxfuxa002nqp3u3ss9uzo0	cmrhxfux9001oqp3udmbrtij9	cmrhuv94o000xqp8xt5f9idxh
cmrhxfuxa002oqp3ulhlid0m1	cmrhxfux9001oqp3udmbrtij9	cmrhuv94v000yqp8xdioaxk85
cmrhxfuxa002pqp3ubdh2xc30	cmrhxfux9001oqp3udmbrtij9	cmrhuv952000zqp8xvtudjpwy
cmrhxfuxa002qqp3uuq1up1uc	cmrhxfux9001oqp3udmbrtij9	cmrhuv9590010qp8x958rhz6m
cmrhxfuxa002rqp3uxagp3vb7	cmrhxfux9001oqp3udmbrtij9	cmrhuv95g0011qp8xrhhxa4nr
cmrhxfuxa002sqp3ukrxclepo	cmrhxfux9001oqp3udmbrtij9	cmrhuv95n0012qp8xhe75fqyi
cmrhxfuxa002tqp3ul4aigs9v	cmrhxfux9001oqp3udmbrtij9	cmrhuv95t0013qp8xhsi7gejw
cmrhxfuxa002uqp3u5jf4l7o4	cmrhxfux9001oqp3udmbrtij9	cmrhuv95y0014qp8xmkeeapyj
cmrhxfuxa002vqp3u8gos2eea	cmrhxfux9001oqp3udmbrtij9	cmrhuv9620015qp8xiyd41or1
cmrhxfuxa002wqp3uvnpfshbd	cmrhxfux9001oqp3udmbrtij9	cmrhuv9660016qp8x4b096p4p
cmrhxfuxa002xqp3uth8q05il	cmrhxfux9001oqp3udmbrtij9	cmrhuv96a0017qp8xzhirjbo7
cmrhxfuxa002yqp3u4mvke5r8	cmrhxfux9001oqp3udmbrtij9	cmrhuv96e0018qp8xk8z62z7h
cmrhxfuxa002zqp3ulr44glmw	cmrhxfux9001oqp3udmbrtij9	cmrhuv96i0019qp8xy4jtsg8w
cmrhxfuxa0030qp3ut5bu5blc	cmrhxfux9001oqp3udmbrtij9	cmrhuv96m001aqp8xrbr9jwn9
cmrhxfuxa0031qp3uppnlers4	cmrhxfux9001oqp3udmbrtij9	cmrhuv96q001bqp8xptuli3tx
cmrhxfuxa0032qp3u4qjvhih4	cmrhxfux9001oqp3udmbrtij9	cmrhuv96u001cqp8xjds6m0j1
cmrhxfuxa0033qp3unh3lwuwp	cmrhxfux9001oqp3udmbrtij9	cmrhuv96z001dqp8xbcfd2gv5
cmrhxfuxa0034qp3uiabgvogy	cmrhxfux9001oqp3udmbrtij9	cmrhuv972001eqp8xeaixry18
cmrhxfuxa0035qp3u2n6ve372	cmrhxfux9001oqp3udmbrtij9	cmrhuv976001fqp8xuvmvee3h
cmrhxfuxa0036qp3uw48osn95	cmrhxfux9001oqp3udmbrtij9	cmrhuv97b001gqp8xkffyng0q
cmrhxfuxa0037qp3u9wh0i0e8	cmrhxfux9001oqp3udmbrtij9	cmrhuv97f001hqp8x1ruuba9t
cmrhxfuxa0038qp3u0cwyhhil	cmrhxfux9001oqp3udmbrtij9	cmrhuv97i001iqp8x8smizzij
cmrhxfuxa0039qp3ul764e3hw	cmrhxfux9001oqp3udmbrtij9	cmrhuv97m001jqp8x1zvfmt0l
cmrhxn4dy0056qp3uekf4eoh0	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8wl0000qp8xukg1gxvz
cmrhxn4dy0057qp3ug2f22pci	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8wv0001qp8xd6v38fr5
cmrhxn4dy0058qp3u26u79fa3	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8x30002qp8x63mor7np
cmrhxn4dy0059qp3uqk7twkyx	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8xd0003qp8xar4cz465
cmrhxn4dy005aqp3u1d8xuxzs	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8xm0004qp8xu1tfphaz
cmrhxn4dy005bqp3urnxcwpyy	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8xv0005qp8xvl6qzs6u
cmrhxn4dy005cqp3ub37bef5m	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8y40006qp8xtdth2c0k
cmrhxn4dy005dqp3untb16m1j	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8yc0007qp8x3p912eha
cmrhxn4dy005eqp3ubtk3n0sy	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8yk0008qp8xy5tzfke8
cmrhxn4dy005fqp3uwlkr83ca	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8yt0009qp8x986wo2s2
cmrhxn4dy005gqp3udvgcz276	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8z2000aqp8xa5yhldo0
cmrhxn4dy005hqp3umn5bu90v	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8za000bqp8xgqjufrt0
cmrhxn4dy005iqp3umn2d9a79	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8zj000cqp8xfk554q31
cmrhxn4dy005jqp3umkcbfpyw	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8zs000dqp8xmacewbat
cmrhxn4dy005kqp3u63ontkjj	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv8zz000eqp8xycxacj4m
cmrhxn4dy005lqp3uap7l6jmj	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv909000fqp8xjx3wuedx
cmrhxn4dy005mqp3u4l3pp7zp	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv90i000gqp8xscw12weh
cmrhxn4dy005nqp3ut4ka2qen	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv90q000hqp8xe0urpwi3
cmrhxn4dy005oqp3urcmpd7e7	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv90z000iqp8xnfd76cm3
cmrhxn4dy005pqp3uio3lodlo	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv918000jqp8xfati2kdp
cmrhxn4dy005qqp3uw3xko1mf	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv91h000kqp8x8kwa11ht
cmrhxn4dy005rqp3u5ntfq5sh	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv91p000lqp8xa5e83v0w
cmrhxn4dy005sqp3ul3xx3x0k	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv920000mqp8xhf6dmaei
cmrhxn4dy005tqp3ut80twt84	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv929000nqp8xeesxkdmv
cmrhxn4dy005uqp3upff3m8hx	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv92i000oqp8xkk8afbjt
cmrhxn4dy005vqp3uz3ffkgif	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv92q000pqp8xtv63d0tn
cmrhxn4dy005wqp3ugyhhxee8	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv92z000qqp8xreeubpkw
cmrhxn4dy005xqp3uufm8p9j0	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv938000rqp8x0k2jiz5y
cmrhxn4dy005yqp3u54on4nkm	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv93i000sqp8xuulot58t
cmrhxn4dy005zqp3uo2bnhzq5	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv93r000tqp8xoz9340sy
cmrhxn4dy0060qp3u478ejf5i	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv940000uqp8xrbew2jtm
cmrhxn4dy0061qp3uxxouct1x	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv94a000vqp8xl5r1wv0j
cmrhxn4dy0062qp3u8njoar61	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv94h000wqp8xbaswjabx
cmrhxn4dy0063qp3uqtn7exvi	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv94o000xqp8xt5f9idxh
cmrhxn4dy0064qp3u3p1s2nrv	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv94v000yqp8xdioaxk85
cmrhxn4dy0065qp3u54gvp72k	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv952000zqp8xvtudjpwy
cmrhxn4dy0066qp3u5u3ql28n	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv9590010qp8x958rhz6m
cmrhxn4dy0067qp3ukd1wczja	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv95g0011qp8xrhhxa4nr
cmrhxn4dy0068qp3u4vwuc0co	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv95n0012qp8xhe75fqyi
cmrhxn4dy0069qp3uy19wowjg	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv95t0013qp8xhsi7gejw
cmrhxn4dy006aqp3ug2m9a34e	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv95y0014qp8xmkeeapyj
cmrhxn4dy006bqp3uk5ac8r5y	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv9620015qp8xiyd41or1
cmrhxn4dy006cqp3uwnofk1cs	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv9660016qp8x4b096p4p
cmrhxn4dy006dqp3u0f812iy2	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv96a0017qp8xzhirjbo7
cmrhxn4dy006eqp3uifesi8kw	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv96e0018qp8xk8z62z7h
cmrhxn4dy006fqp3u5ew1t4jf	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv96i0019qp8xy4jtsg8w
cmrhxn4dy006gqp3uajgb7w7h	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv96m001aqp8xrbr9jwn9
cmrhxn4dy006hqp3uizf7l009	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv96q001bqp8xptuli3tx
cmrhxn4dy006iqp3u0a8djqsh	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv96u001cqp8xjds6m0j1
cmrhxn4dy006jqp3uloro3i19	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv96z001dqp8xbcfd2gv5
cmrhxn4dy006kqp3uiwm163z4	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv972001eqp8xeaixry18
cmrhxn4dy006lqp3uyd3gupbm	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv976001fqp8xuvmvee3h
cmrhxn4dy006mqp3uzhlms4f6	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv97b001gqp8xkffyng0q
cmrhxn4dy006nqp3utk0v7qko	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv97f001hqp8x1ruuba9t
cmrhxn4dy006oqp3un49dhh9t	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv97i001iqp8x8smizzij
cmrhxn4dy006pqp3uydtxbfd4	cmrhxn4dy0054qp3uen3i0ug1	cmrhuv97m001jqp8x1zvfmt0l
cmrhxx2hw001qqpewlweoal0g	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8wl0000qp8xukg1gxvz
cmrhxx2hw001rqpewigumi0f1	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8wv0001qp8xd6v38fr5
cmrhxx2hw001sqpewbsdpcs0t	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8x30002qp8x63mor7np
cmrhxx2hw001tqpewighy2fic	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8xd0003qp8xar4cz465
cmrhxx2hw001uqpew8uz6x02x	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8xm0004qp8xu1tfphaz
cmrhxx2hw001vqpewmtvaulzk	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8xv0005qp8xvl6qzs6u
cmrhxx2hw001wqpewm5eh8gq1	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8y40006qp8xtdth2c0k
cmrhxx2hw001xqpew4kwvkfp8	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8yc0007qp8x3p912eha
cmrhxx2hw001yqpew7qesl6vv	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8yk0008qp8xy5tzfke8
cmrhxx2hw001zqpewppe07mfx	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8yt0009qp8x986wo2s2
cmrhxx2hw0020qpewrqfjvk0s	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8z2000aqp8xa5yhldo0
cmrhxx2hw0021qpewq71rb3qu	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8za000bqp8xgqjufrt0
cmrhxx2hw0022qpewuw05yper	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8zj000cqp8xfk554q31
cmrhxx2hw0023qpewq2rsr89q	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8zs000dqp8xmacewbat
cmrhxx2hw0024qpew8rhp5jdi	cmrhxx2hw001oqpew5u7f83zv	cmrhuv8zz000eqp8xycxacj4m
cmrhxx2hw0025qpewwpyxj7jr	cmrhxx2hw001oqpew5u7f83zv	cmrhuv909000fqp8xjx3wuedx
cmrhxx2hw0026qpewxo48gcs7	cmrhxx2hw001oqpew5u7f83zv	cmrhuv90i000gqp8xscw12weh
cmrhxx2hw0027qpew9u6h2we1	cmrhxx2hw001oqpew5u7f83zv	cmrhuv90q000hqp8xe0urpwi3
cmrhxx2hw0028qpewcipkgh8a	cmrhxx2hw001oqpew5u7f83zv	cmrhuv90z000iqp8xnfd76cm3
cmrhxx2hw0029qpeweqli9z7j	cmrhxx2hw001oqpew5u7f83zv	cmrhuv918000jqp8xfati2kdp
cmrhxx2hw002aqpewm8d80pbw	cmrhxx2hw001oqpew5u7f83zv	cmrhuv91h000kqp8x8kwa11ht
cmrhxx2hw002bqpew8nfaezxv	cmrhxx2hw001oqpew5u7f83zv	cmrhuv91p000lqp8xa5e83v0w
cmrhxx2hw002cqpewnm5sz3xm	cmrhxx2hw001oqpew5u7f83zv	cmrhuv920000mqp8xhf6dmaei
cmrhxx2hw002dqpewx5sjlbi8	cmrhxx2hw001oqpew5u7f83zv	cmrhuv929000nqp8xeesxkdmv
cmrhxx2hw002eqpewyv1rtskt	cmrhxx2hw001oqpew5u7f83zv	cmrhuv92i000oqp8xkk8afbjt
cmrhxx2hw002fqpew6y7120at	cmrhxx2hw001oqpew5u7f83zv	cmrhuv92q000pqp8xtv63d0tn
cmrhxx2hw002gqpewv2sg73n4	cmrhxx2hw001oqpew5u7f83zv	cmrhuv92z000qqp8xreeubpkw
cmrhxx2hw002hqpews1549i3t	cmrhxx2hw001oqpew5u7f83zv	cmrhuv938000rqp8x0k2jiz5y
cmrhxx2hw002iqpewqc9hidce	cmrhxx2hw001oqpew5u7f83zv	cmrhuv93i000sqp8xuulot58t
cmrhxx2hw002jqpew4gpf8fo5	cmrhxx2hw001oqpew5u7f83zv	cmrhuv93r000tqp8xoz9340sy
cmrhxx2hw002kqpewvj6o4237	cmrhxx2hw001oqpew5u7f83zv	cmrhuv940000uqp8xrbew2jtm
cmrhxx2hw002lqpewqkuttyna	cmrhxx2hw001oqpew5u7f83zv	cmrhuv94a000vqp8xl5r1wv0j
cmrhxx2hw002mqpewh8zmg2yi	cmrhxx2hw001oqpew5u7f83zv	cmrhuv94h000wqp8xbaswjabx
cmrhxx2hw002nqpewa7m5nz4u	cmrhxx2hw001oqpew5u7f83zv	cmrhuv94o000xqp8xt5f9idxh
cmrhxx2hw002oqpewdlf5tg8d	cmrhxx2hw001oqpew5u7f83zv	cmrhuv94v000yqp8xdioaxk85
cmrhxx2hw002pqpewa014a7fy	cmrhxx2hw001oqpew5u7f83zv	cmrhuv952000zqp8xvtudjpwy
cmrhxx2hw002qqpewvqc1e6zg	cmrhxx2hw001oqpew5u7f83zv	cmrhuv9590010qp8x958rhz6m
cmrhxx2hw002rqpewxdcektsu	cmrhxx2hw001oqpew5u7f83zv	cmrhuv95g0011qp8xrhhxa4nr
cmrhxx2hw002sqpewys9i2c7o	cmrhxx2hw001oqpew5u7f83zv	cmrhuv95n0012qp8xhe75fqyi
cmrhxx2hw002tqpewd6gz1um2	cmrhxx2hw001oqpew5u7f83zv	cmrhuv95t0013qp8xhsi7gejw
cmrhxx2hw002uqpewx9y8co9v	cmrhxx2hw001oqpew5u7f83zv	cmrhuv95y0014qp8xmkeeapyj
cmrhxx2hw002vqpewvxsbk409	cmrhxx2hw001oqpew5u7f83zv	cmrhuv9620015qp8xiyd41or1
cmrhxx2hw002wqpewqjgdcpkn	cmrhxx2hw001oqpew5u7f83zv	cmrhuv9660016qp8x4b096p4p
cmrhxx2hw002xqpew4rk70fat	cmrhxx2hw001oqpew5u7f83zv	cmrhuv96a0017qp8xzhirjbo7
cmrhxx2hw002yqpewdhf16jp2	cmrhxx2hw001oqpew5u7f83zv	cmrhuv96e0018qp8xk8z62z7h
cmrhxx2hw002zqpewo6x349ra	cmrhxx2hw001oqpew5u7f83zv	cmrhuv96i0019qp8xy4jtsg8w
cmrhxx2hw0030qpew4dmkziw1	cmrhxx2hw001oqpew5u7f83zv	cmrhuv96m001aqp8xrbr9jwn9
cmrhxx2hw0031qpewa60jmoyb	cmrhxx2hw001oqpew5u7f83zv	cmrhuv96q001bqp8xptuli3tx
cmrhxx2hw0032qpew3cekxq2h	cmrhxx2hw001oqpew5u7f83zv	cmrhuv96u001cqp8xjds6m0j1
cmrhxx2hw0033qpew2dh96bjv	cmrhxx2hw001oqpew5u7f83zv	cmrhuv96z001dqp8xbcfd2gv5
cmrhxx2hw0034qpewyf75jwbp	cmrhxx2hw001oqpew5u7f83zv	cmrhuv972001eqp8xeaixry18
cmrhxx2hw0035qpew6ql4ksyv	cmrhxx2hw001oqpew5u7f83zv	cmrhuv976001fqp8xuvmvee3h
cmrhxx2hw0036qpew509y39yv	cmrhxx2hw001oqpew5u7f83zv	cmrhuv97b001gqp8xkffyng0q
cmrhxx2hw0037qpewf6i5xm0o	cmrhxx2hw001oqpew5u7f83zv	cmrhuv97f001hqp8x1ruuba9t
cmrhxx2hw0038qpewm2kgtzdh	cmrhxx2hw001oqpew5u7f83zv	cmrhuv97i001iqp8x8smizzij
cmrhxx2hw0039qpew2aw04kpt	cmrhxx2hw001oqpew5u7f83zv	cmrhuv97m001jqp8x1zvfmt0l
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.roles (id, "tenantId", name, description, "isSystem", "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
cmrhuv9fw001oqp8xujzk4vpe	cmrhuv97r001kqp8xz7rdz80e	Owner	Full access to all features	t	2026-07-12 13:55:05.228	2026-07-12 13:55:05.228	\N	\N	\N	1
cmrhuv9gi003bqp8x5hg9bv4e	cmrhuv97r001kqp8xz7rdz80e	Manager	Manages daily operations	f	2026-07-12 13:55:05.25	2026-07-12 13:55:05.25	\N	\N	\N	1
cmrhuv9h0003zqp8xmrjhaoj8	cmrhuv97r001kqp8xz7rdz80e	Waiter	Takes orders and serves customers	f	2026-07-12 13:55:05.268	2026-07-12 13:55:05.268	\N	\N	\N	1
cmrhuv9he0048qp8xb9np6669	cmrhuv97r001kqp8xz7rdz80e	Kitchen Staff	Kitchen operations	f	2026-07-12 13:55:05.282	2026-07-12 13:55:05.282	\N	\N	\N	1
cmrhv62qx001oqpl3fkh08h0y	cmrhv62px0000qpl3104ncofy	Owner	Full access to all features	t	2026-07-12 14:03:29.769	2026-07-12 14:03:29.769	\N	\N	\N	1
cmrhvqget0058qpl3xs1sfaaj	cmrhvqgdt003kqpl3w8aqtsxk	Owner	Full access to all features	t	2026-07-12 14:19:20.597	2026-07-12 14:19:20.597	\N	\N	\N	1
cmrhw1fjg001oqpoykpw66klz	cmrhw1fif0000qpoy6wies2i3	Owner	Full access to all features	t	2026-07-12 14:27:52.684	2026-07-12 14:27:52.684	\N	\N	\N	1
cmrhwrlay001oqpp7s98t71cs	cmrhwrl970000qpp7z2y9szdq	Owner	Full access to all features	t	2026-07-12 14:48:13.21	2026-07-12 14:48:13.21	\N	\N	\N	1
cmrhwrygj0052qpp77chsox4o	cmrhwryff003eqpp7qeoh6lxi	Owner	Full access to all features	t	2026-07-12 14:48:30.259	2026-07-12 14:48:30.259	\N	\N	\N	1
cmrhwsdaj008iqpp7tmd0srqp	cmrhwsd94006uqpp7yuh5iryl	Owner	Full access to all features	t	2026-07-12 14:48:49.483	2026-07-12 14:48:49.483	\N	\N	\N	1
cmrhwvvu3001oqplfbnx3492q	cmrhwvvt00000qplflw37hz8q	Owner	Full access to all features	t	2026-07-12 14:51:33.483	2026-07-12 14:51:33.483	\N	\N	\N	1
cmrhxfux9001oqp3udmbrtij9	cmrhxfuvh0000qp3u3pix6l5u	Owner	Full access to all features	t	2026-07-12 15:07:05.421	2026-07-12 15:07:05.421	\N	\N	\N	1
cmrhxn4dy0054qp3uen3i0ug1	cmrhxn4cx003gqp3u5qvkc9i2	Owner	Full access to all features	t	2026-07-12 15:12:44.278	2026-07-12 15:12:44.278	\N	\N	\N	1
cmrhxx2hw001oqpew5u7f83zv	cmrhxx2f90000qpewqu3qsi52	Owner	Full access to all features	t	2026-07-12 15:20:28.388	2026-07-12 15:20:28.388	\N	\N	\N	1
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.shifts (id, "branchId", name, "startTime", "endTime", "createdAt", "createdBy", "deletedAt", "updatedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.staff (id, "branchId", "userId", "roleId", name, phone, pin, "isActive", "createdAt", "updatedAt", "createdBy", "deletedAt", "tenantId", "updatedBy", version) FROM stdin;
cmrhuvayu00huqp8xdp42jnis	existing-branch	\N	cmrhuv9gi003bqp8x5hg9bv4e	Amit Sharma	+919876543211	1234	t	2026-07-12 13:55:07.206	2026-07-12 13:55:07.206	\N	\N	\N	\N	1
cmrhuvayu00hvqp8xlnlzque6	existing-branch	\N	cmrhuv9h0003zqp8xmrjhaoj8	Rahul Singh	+919876543212	5678	t	2026-07-12 13:55:07.206	2026-07-12 13:55:07.206	\N	\N	\N	\N	1
cmrhuvayu00hwqp8xa79gmz9f	existing-branch	\N	cmrhuv9h0003zqp8xmrjhaoj8	Priya Patel	+919876543213	9012	t	2026-07-12 13:55:07.206	2026-07-12 13:55:07.206	\N	\N	\N	\N	1
cmrhuvayu00hxqp8xtuqq5u8s	existing-branch	\N	cmrhuv9he0048qp8xb9np6669	Suresh Reddy	+919876543214	3456	t	2026-07-12 13:55:07.206	2026-07-12 13:55:07.206	\N	\N	\N	\N	1
\.


--
-- Data for Name: staff_shifts; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.staff_shifts (id, "shiftId", "staffId", date, status, "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.stock_movements (id, "inventoryItemId", type, quantity, reference, notes, "createdAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: subscription_invoices; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.subscription_invoices (id, "subscriptionId", number, amount, "taxAmount", status, "pdfUrl", "createdAt", "createdBy", "deletedAt", "updatedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: subscription_payments; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.subscription_payments (id, "subscriptionId", amount, method, reference, status, "createdAt", "createdBy", "deletedAt", "updatedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: subscriptions_v2; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.subscriptions_v2 (id, "tenantId", "planId", status, entitlements, "customPrice", discount, "trialStartedAt", "trialEndsAt", "currentPeriodStart", "currentPeriodEnd", "nextBillingDate", "lastPaymentAt", "gracePeriodDays", "graceStartedAt", "hasPromise", "promiseUntil", "promiseReason", "razorpayId", "razorpayPlanId", "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
cmrk6ohek0008qpvyx5i9561c	cmrk6oheb0002qpvyjvuc7ic9	cmrjg85g5004cqpyf5hvspk4m	TRIAL	{"crm": false, "pos": true, "staff": false, "orders": true, "shifts": false, "tables": true, "kitchen": true, "loyalty": false, "reports": false, "invoices": false, "payments": true, "inventory": false, "api_access": false, "attendance": false, "qr_ordering": false, "white_label": false, "ai_analytics": false, "multi_branch": false, "reservations": false, "customer_website": false, "priority_support": false}	\N	\N	2026-07-14 05:01:16.689	2026-07-28 05:01:16.689	2026-07-14 05:01:16.689	2026-07-28 05:01:16.689	2026-07-28 05:01:16.689	\N	7	\N	f	\N	\N	\N	\N	2026-07-14 05:01:16.7	2026-07-14 05:01:16.7	\N	\N	\N	1
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.suppliers (id, "tenantId", name, phone, email, address, "gstNumber", "isActive", "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
cmrhw1fph003jqpoy80847qzw	cmrhw1fif0000qpoy6wies2i3	Fresh Foods	9876543210	\N	\N	\N	t	2026-07-12 14:27:52.901	2026-07-12 14:27:52.901	\N	\N	\N	1
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.support_tickets (id, "tenantId", subject, description, priority, status, "assignedTo", "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
\.


--
-- Data for Name: tenant_feature_flags; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.tenant_feature_flags (id, "tenantId", "featureFlagId", enabled, "createdAt") FROM stdin;
\.


--
-- Data for Name: tenant_website_configs; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.tenant_website_configs (id, "tenantId", "restaurantName", tagline, logo, favicon, phone, email, address, "mapUrl", "whatsappNumber", currency, timezone, "primaryColor", "secondaryColor", "accentColor", "fontHeading", "fontBody", "borderRadius", "containerWidth", features, seo, "openingHours", "socialLinks", analytics, "legalPages", "homeSections", "createdAt", "updatedAt", "deletedAt", version, "createdBy") FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.tenants (id, name, slug, logo, phone, email, address, "gstNumber", "panNumber", timezone, currency, "isActive", "createdAt", "updatedAt", "businessType", country, state, city, "createdBy", "deletedAt", version) FROM stdin;
cmrhuv97r001kqp8xz7rdz80e	Hungry Island	demo-restaurant	\N	+919876543210	admin@demo.com	123 MG Road, Bangalore, Karnataka 560001	29AADCB2230M1ZP	\N	Asia/Kolkata	INR	t	2026-07-12 13:55:04.935	2026-07-12 13:55:04.935	\N	India	\N	\N	\N	\N	1
cmrhv62px0000qpl3104ncofy	Test Restaurant	test-restaurant	\N	9999999999	owner@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 14:03:29.733	2026-07-12 14:03:29.733	\N	India	\N	\N	\N	\N	1
cmrhvqgdt003kqpl3w8aqtsxk	API Test Restaurant	api-test-restaurant	\N	8888888888	apitest@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 14:19:20.561	2026-07-12 14:19:20.561	\N	India	\N	\N	\N	\N	1
cmrhw1fif0000qpoy6wies2i3	API Test	api-test	\N	8888888811	api-1783866472@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 14:27:52.647	2026-07-12 14:27:52.647	\N	India	\N	\N	\N	\N	1
cmrhwrl970000qpp7z2y9szdq	E2E Restaurant	e2e-restaurant	\N	5555555511	e2e-1783867692@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 14:48:13.148	2026-07-12 14:48:13.148	\N	India	\N	\N	\N	\N	1
cmrhwryff003eqpp7qeoh6lxi	VVV Restaurant	vvv-restaurant	\N	4444444411	vvv-test@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 14:48:30.22	2026-07-12 14:48:30.22	\N	India	\N	\N	\N	\N	1
cmrhwsd94006uqpp7yuh5iryl	VVV2 Restaurant	vvv2-restaurant	\N	3333333311	vvv-test2@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 14:48:49.433	2026-07-12 14:48:49.433	\N	India	\N	\N	\N	\N	1
cmrhwvvt00000qplflw37hz8q	Final Test	final-test	\N	2222222211	final-1783867893@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 14:51:33.445	2026-07-12 14:51:33.445	\N	India	\N	\N	\N	\N	1
cmrhxfuvh0000qp3u3pix6l5u	Browser Test Restaurant	browser-test-restaurant	\N	1111112211	e2e-browser-1783868824@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 15:07:05.358	2026-07-12 15:07:05.358	\N	India	\N	\N	\N	\N	1
cmrhxn4cx003gqp3u5qvkc9i2	Menu Test	menu-test	\N	9999999911	menu-test-1783869163@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 15:12:44.241	2026-07-12 15:12:44.241	\N	India	\N	\N	\N	\N	1
cmrhxx2f90000qpewqu3qsi52	Phase 5 Demo	phase-5-demo	\N	8888888800	phase5-1783869627@test.com	\N	\N	\N	Asia/Kolkata	INR	t	2026-07-12 15:20:28.293	2026-07-12 15:20:28.293	\N	India	\N	\N	\N	\N	1
cmrk6n1lh0002qpgc6mzlmjdp	Test Kitchen Demo	test-kitchen-demo	\N	9876543210	ravi@testkitchen.com	123 MG Road	\N	\N	Asia/Kolkata	INR	t	2026-07-14 05:00:09.557	2026-07-14 05:00:09.557	South Indian	India	Karnataka	Bangalore	\N	\N	1
cmrk6oheb0002qpvyjvuc7ic9	Spice Garden	spice-garden	\N	9876543211	priya@spicegarden.com	456 Brigade Road	\N	\N	Asia/Kolkata	INR	t	2026-07-14 05:01:16.692	2026-07-14 05:01:16.692	South Indian	India	Karnataka	Bangalore	\N	\N	1
\.


--
-- Data for Name: ticket_messages; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.ticket_messages (id, "ticketId", "senderType", "senderId", message, "isInternal", "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: nexaros
--

COPY public.users (id, "tenantId", email, phone, password, "firstName", "lastName", avatar, role, "isActive", "lastLoginAt", "createdAt", "updatedAt", "createdBy", "deletedAt", "updatedBy", version) FROM stdin;
cmrhv62pz0002qpl3csd5f0wi	cmrhv62px0000qpl3104ncofy	owner@test.com	9999999999	$2a$12$jW.7vmiLmb.4vhywiQlAX.sEcfbNMfwR7BaLHrHq0rPn8laPLiUvK	Test	Owner	\N	OWNER	t	2026-07-12 14:03:49.582	2026-07-12 14:03:29.735	2026-07-12 14:03:49.583	\N	\N	\N	1
cmrhvqgdu003mqpl3qn3orla2	cmrhvqgdt003kqpl3w8aqtsxk	apitest@test.com	8888888888	$2a$12$jwvMpJzgUy3JHIg2gsw6euEDmuLRpESDSHoDfqvEdKPJkEq0qR9Ne	API	Tester	\N	OWNER	t	2026-07-12 14:19:20.894	2026-07-12 14:19:20.563	2026-07-12 14:19:20.895	\N	\N	\N	1
cmrhw1fii0002qpoycuzlvbnv	cmrhw1fif0000qpoy6wies2i3	api-1783866472@test.com	8888888811	$2a$12$3v6ddzS.vwJtMlbPT8G0suM/8sBja/Vap0kGYjxnXTGCGJd0hyPBS	API	Tester	\N	OWNER	t	\N	2026-07-12 14:27:52.65	2026-07-12 14:27:52.65	\N	\N	\N	1
cmrhwrl990002qpp7ergu2sdp	cmrhwrl970000qpp7z2y9szdq	e2e-1783867692@test.com	5555555511	$2a$12$a1mMufnuW/H2t8itg3uKV.ExFH8XuXUbPk4t.GF174PfqLABcJEJm	E2E	Test	\N	OWNER	t	\N	2026-07-12 14:48:13.15	2026-07-12 14:48:13.15	\N	\N	\N	1
cmrhwryfh003gqpp77bg8dd12	cmrhwryff003eqpp7qeoh6lxi	vvv-test@test.com	4444444411	$2a$12$YTSVejNVR.ELXI705ea3Y.TlLKhyi3uwsi1PI1FIMYp6cXnVX/41G	VVV	Test	\N	OWNER	t	2026-07-12 14:48:30.577	2026-07-12 14:48:30.221	2026-07-12 14:48:30.578	\N	\N	\N	1
cmrhwsd96006wqpp7f5s38zyr	cmrhwsd94006uqpp7yuh5iryl	vvv-test2@test.com	3333333311	$2a$12$p2tvXzDWbnPgJqg/R5k3..7XhSUgF9DudT./5S1Hw9s1nNzHaAX96	VVV2	Test	\N	OWNER	t	\N	2026-07-12 14:48:49.434	2026-07-12 14:48:49.434	\N	\N	\N	1
cmrhwvvt20002qplfhq7l7287	cmrhwvvt00000qplflw37hz8q	final-1783867893@test.com	2222222211	$2a$12$60U.w/.M1RK4py2FK1nPz.anM0mKvneFj3DqZffr4URNkuAIBFZPK	Final	Test	\N	OWNER	t	\N	2026-07-12 14:51:33.447	2026-07-12 14:51:33.447	\N	\N	\N	1
cmrhxfuvk0002qp3usj2p75nr	cmrhxfuvh0000qp3u3pix6l5u	e2e-browser-1783868824@test.com	1111112211	$2a$12$MeuaExfIR32pN1HKlkvir.PQZzT8zl.uh/I3B9NTtfMgu1Ankwh56	Browser	Test	\N	OWNER	t	\N	2026-07-12 15:07:05.36	2026-07-12 15:07:05.36	\N	\N	\N	1
cmrhxn4cy003iqp3u38vvwwkl	cmrhxn4cx003gqp3u5qvkc9i2	menu-test-1783869163@test.com	9999999911	$2a$12$/aDZKcXLhTSjmpSUtBAJ2.FfQLEh9aSNc7QQklcyHm6.nwXnkmdIu	Menu	Test	\N	OWNER	t	\N	2026-07-12 15:12:44.243	2026-07-12 15:12:44.243	\N	\N	\N	1
cmrhxx2fe0002qpew5yauf9zm	cmrhxx2f90000qpewqu3qsi52	phase5-1783869627@test.com	8888888800	$2a$12$nleYeQimrQeH6c6wHEH4QO4RFH/7HxsyaJ9c7LJ0KeiVaTOMK3KXy	Phase5	Demo	\N	OWNER	t	\N	2026-07-12 15:20:28.298	2026-07-12 15:20:28.298	\N	\N	\N	1
cmrk6n1lm0006qpgcct7lhr0o	cmrk6n1lh0002qpgc6mzlmjdp	ravi@testkitchen.com	9876543210	$2a$10$le9GfBBWhZFcl2ktRi5.E..sWMa.OuCFGgRduzjZEdwO/SuLbOqV2	Ravi Kumar		\N	OWNER	t	\N	2026-07-14 05:00:09.563	2026-07-14 05:00:09.563	\N	\N	\N	1
cmrk6oheh0006qpvyya4pj5w6	cmrk6oheb0002qpvyjvuc7ic9	priya@spicegarden.com	9876543211	$2a$10$NriX6.W076V2IKpJO.O7I.L5zrJ9YTrEwUXEClhmrMEHvAd5VPBse	Priya Sharma		\N	OWNER	t	2026-07-14 05:01:25.898	2026-07-14 05:01:16.698	2026-07-14 05:01:25.899	\N	\N	\N	1
cmrhuv9fk001mqp8xnr9dn2w4	cmrhuv97r001kqp8xz7rdz80e	admin@demo.com	+919876543210	$2a$12$dpfLaM8zlufasPN3eeI/auqtkB85bNh06UZhf5wOA9q/kwg4eNFNC	Rajesh	Kumar	\N	OWNER	t	2026-07-15 06:50:45.578	2026-07-12 13:55:05.216	2026-07-15 06:50:45.579	\N	\N	\N	1
\.


--
-- Name: _InventoryItemToMenuItem _InventoryItemToMenuItem_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public."_InventoryItemToMenuItem"
    ADD CONSTRAINT "_InventoryItemToMenuItem_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coupon_usages coupon_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: demo_requests demo_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.demo_requests
    ADD CONSTRAINT demo_requests_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: menu_item_add_ons menu_item_add_ons_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_item_add_ons
    ADD CONSTRAINT menu_item_add_ons_pkey PRIMARY KEY (id);


--
-- Name: menu_item_images menu_item_images_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_item_images
    ADD CONSTRAINT menu_item_images_pkey PRIMARY KEY (id);


--
-- Name: menu_item_variants menu_item_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_item_variants
    ADD CONSTRAINT menu_item_variants_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: order_item_add_ons order_item_add_ons_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.order_item_add_ons
    ADD CONSTRAINT order_item_add_ons_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_promises payment_promises_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.payment_promises
    ADD CONSTRAINT payment_promises_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: plan_entitlements plan_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.plan_entitlements
    ADD CONSTRAINT plan_entitlements_pkey PRIMARY KEY (id);


--
-- Name: platform_plans platform_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.platform_plans
    ADD CONSTRAINT platform_plans_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: recipe_items recipe_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.recipe_items
    ADD CONSTRAINT recipe_items_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: staff_shifts staff_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT staff_shifts_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: subscription_invoices subscription_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscriptions_v2 subscriptions_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.subscriptions_v2
    ADD CONSTRAINT subscriptions_v2_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: tenant_feature_flags tenant_feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT tenant_feature_flags_pkey PRIMARY KEY (id);


--
-- Name: tenant_website_configs tenant_website_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.tenant_website_configs
    ADD CONSTRAINT tenant_website_configs_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: _InventoryItemToMenuItem_B_index; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "_InventoryItemToMenuItem_B_index" ON public."_InventoryItemToMenuItem" USING btree ("B");


--
-- Name: admin_audit_logs_adminUserId_createdAt_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "admin_audit_logs_adminUserId_createdAt_idx" ON public.admin_audit_logs USING btree ("adminUserId", "createdAt");


--
-- Name: admin_sessions_token_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX admin_sessions_token_key ON public.admin_sessions USING btree (token);


--
-- Name: admin_users_email_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX admin_users_email_key ON public.admin_users USING btree (email);


--
-- Name: attendance_staffId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "attendance_staffId_idx" ON public.attendance USING btree ("staffId");


--
-- Name: audit_logs_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON public.audit_logs USING btree ("tenantId", "createdAt");


--
-- Name: branches_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "branches_tenantId_idx" ON public.branches USING btree ("tenantId");


--
-- Name: categories_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "categories_tenantId_idx" ON public.categories USING btree ("tenantId");


--
-- Name: coupon_usages_couponId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "coupon_usages_couponId_idx" ON public.coupon_usages USING btree ("couponId");


--
-- Name: coupon_usages_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "coupon_usages_tenantId_idx" ON public.coupon_usages USING btree ("tenantId");


--
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- Name: demo_requests_status_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX demo_requests_status_idx ON public.demo_requests USING btree (status);


--
-- Name: feature_flags_key_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX feature_flags_key_key ON public.feature_flags USING btree (key);


--
-- Name: inventory_items_barcode_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX inventory_items_barcode_idx ON public.inventory_items USING btree (barcode);


--
-- Name: inventory_items_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "inventory_items_tenantId_idx" ON public.inventory_items USING btree ("tenantId");


--
-- Name: invoices_paymentId_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "invoices_paymentId_key" ON public.invoices USING btree ("paymentId");


--
-- Name: menu_item_add_ons_menuItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "menu_item_add_ons_menuItemId_idx" ON public.menu_item_add_ons USING btree ("menuItemId");


--
-- Name: menu_item_images_menuItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "menu_item_images_menuItemId_idx" ON public.menu_item_images USING btree ("menuItemId");


--
-- Name: menu_item_variants_menuItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "menu_item_variants_menuItemId_idx" ON public.menu_item_variants USING btree ("menuItemId");


--
-- Name: menu_items_barcode_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX menu_items_barcode_idx ON public.menu_items USING btree (barcode);


--
-- Name: menu_items_categoryId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "menu_items_categoryId_idx" ON public.menu_items USING btree ("categoryId");


--
-- Name: menu_items_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "menu_items_tenantId_idx" ON public.menu_items USING btree ("tenantId");


--
-- Name: order_item_add_ons_orderItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "order_item_add_ons_orderItemId_idx" ON public.order_item_add_ons USING btree ("orderItemId");


--
-- Name: order_items_orderId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "order_items_orderId_idx" ON public.order_items USING btree ("orderId");


--
-- Name: order_status_history_orderId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "order_status_history_orderId_idx" ON public.order_status_history USING btree ("orderId");


--
-- Name: orders_branchId_status_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "orders_branchId_status_idx" ON public.orders USING btree ("branchId", status);


--
-- Name: orders_createdAt_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "orders_createdAt_idx" ON public.orders USING btree ("createdAt");


--
-- Name: orders_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "orders_tenantId_idx" ON public.orders USING btree ("tenantId");


--
-- Name: payment_promises_subscriptionId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "payment_promises_subscriptionId_idx" ON public.payment_promises USING btree ("subscriptionId");


--
-- Name: payment_promises_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "payment_promises_tenantId_idx" ON public.payment_promises USING btree ("tenantId");


--
-- Name: payments_branchId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "payments_branchId_idx" ON public.payments USING btree ("branchId");


--
-- Name: payments_orderId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "payments_orderId_idx" ON public.payments USING btree ("orderId");


--
-- Name: permissions_module_action_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX permissions_module_action_key ON public.permissions USING btree (module, action);


--
-- Name: plan_entitlements_planId_moduleKey_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "plan_entitlements_planId_moduleKey_key" ON public.plan_entitlements USING btree ("planId", "moduleKey");


--
-- Name: platform_plans_slug_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX platform_plans_slug_key ON public.platform_plans USING btree (slug);


--
-- Name: platform_settings_key_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX platform_settings_key_key ON public.platform_settings USING btree (key);


--
-- Name: purchase_items_inventoryItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "purchase_items_inventoryItemId_idx" ON public.purchase_items USING btree ("inventoryItemId");


--
-- Name: purchase_items_purchaseId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "purchase_items_purchaseId_idx" ON public.purchase_items USING btree ("purchaseId");


--
-- Name: purchases_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "purchases_tenantId_idx" ON public.purchases USING btree ("tenantId");


--
-- Name: recipe_items_inventoryItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "recipe_items_inventoryItemId_idx" ON public.recipe_items USING btree ("inventoryItemId");


--
-- Name: recipe_items_menuItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "recipe_items_menuItemId_idx" ON public.recipe_items USING btree ("menuItemId");


--
-- Name: recipe_items_menuItemId_inventoryItemId_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "recipe_items_menuItemId_inventoryItemId_key" ON public.recipe_items USING btree ("menuItemId", "inventoryItemId");


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_userId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "refresh_tokens_userId_idx" ON public.refresh_tokens USING btree ("userId");


--
-- Name: reservations_tenantId_date_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "reservations_tenantId_date_idx" ON public.reservations USING btree ("tenantId", date);


--
-- Name: restaurant_tables_branchId_number_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "restaurant_tables_branchId_number_key" ON public.restaurant_tables USING btree ("branchId", number);


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: roles_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "roles_tenantId_idx" ON public.roles USING btree ("tenantId");


--
-- Name: roles_tenantId_name_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "roles_tenantId_name_key" ON public.roles USING btree ("tenantId", name);


--
-- Name: staff_branchId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "staff_branchId_idx" ON public.staff USING btree ("branchId");


--
-- Name: staff_shifts_shiftId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "staff_shifts_shiftId_idx" ON public.staff_shifts USING btree ("shiftId");


--
-- Name: staff_shifts_staffId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "staff_shifts_staffId_idx" ON public.staff_shifts USING btree ("staffId");


--
-- Name: staff_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "staff_tenantId_idx" ON public.staff USING btree ("tenantId");


--
-- Name: stock_movements_createdAt_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "stock_movements_createdAt_idx" ON public.stock_movements USING btree ("createdAt");


--
-- Name: stock_movements_inventoryItemId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "stock_movements_inventoryItemId_idx" ON public.stock_movements USING btree ("inventoryItemId");


--
-- Name: subscription_invoices_number_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX subscription_invoices_number_key ON public.subscription_invoices USING btree (number);


--
-- Name: subscription_invoices_subscriptionId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "subscription_invoices_subscriptionId_idx" ON public.subscription_invoices USING btree ("subscriptionId");


--
-- Name: subscription_payments_subscriptionId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "subscription_payments_subscriptionId_idx" ON public.subscription_payments USING btree ("subscriptionId");


--
-- Name: subscriptions_v2_status_nextBillingDate_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "subscriptions_v2_status_nextBillingDate_idx" ON public.subscriptions_v2 USING btree (status, "nextBillingDate");


--
-- Name: subscriptions_v2_tenantId_status_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "subscriptions_v2_tenantId_status_idx" ON public.subscriptions_v2 USING btree ("tenantId", status);


--
-- Name: suppliers_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "suppliers_tenantId_idx" ON public.suppliers USING btree ("tenantId");


--
-- Name: support_tickets_status_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX support_tickets_status_idx ON public.support_tickets USING btree (status);


--
-- Name: support_tickets_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "support_tickets_tenantId_idx" ON public.support_tickets USING btree ("tenantId");


--
-- Name: tenant_feature_flags_tenantId_featureFlagId_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "tenant_feature_flags_tenantId_featureFlagId_key" ON public.tenant_feature_flags USING btree ("tenantId", "featureFlagId");


--
-- Name: tenant_feature_flags_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "tenant_feature_flags_tenantId_idx" ON public.tenant_feature_flags USING btree ("tenantId");


--
-- Name: tenant_website_configs_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "tenant_website_configs_tenantId_idx" ON public.tenant_website_configs USING btree ("tenantId");


--
-- Name: tenant_website_configs_tenantId_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX "tenant_website_configs_tenantId_key" ON public.tenant_website_configs USING btree ("tenantId");


--
-- Name: tenants_slug_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);


--
-- Name: ticket_messages_senderId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "ticket_messages_senderId_idx" ON public.ticket_messages USING btree ("senderId");


--
-- Name: ticket_messages_ticketId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "ticket_messages_ticketId_idx" ON public.ticket_messages USING btree ("ticketId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: users_tenantId_idx; Type: INDEX; Schema: public; Owner: nexaros
--

CREATE INDEX "users_tenantId_idx" ON public.users USING btree ("tenantId");


--
-- Name: _InventoryItemToMenuItem _InventoryItemToMenuItem_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public."_InventoryItemToMenuItem"
    ADD CONSTRAINT "_InventoryItemToMenuItem_A_fkey" FOREIGN KEY ("A") REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _InventoryItemToMenuItem _InventoryItemToMenuItem_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public."_InventoryItemToMenuItem"
    ADD CONSTRAINT "_InventoryItemToMenuItem_B_fkey" FOREIGN KEY ("B") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_audit_logs admin_audit_logs_adminUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT "admin_audit_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_sessions admin_sessions_adminUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT "admin_sessions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendance attendance_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT "attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: branches branches_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "branches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_usages coupon_usages_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_usages coupon_usages_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT "coupon_usages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_items inventory_items_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "inventory_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_item_add_ons menu_item_add_ons_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_item_add_ons
    ADD CONSTRAINT "menu_item_add_ons_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_item_images menu_item_images_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_item_images
    ADD CONSTRAINT "menu_item_images_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_item_variants menu_item_variants_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_item_variants
    ADD CONSTRAINT "menu_item_variants_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_items menu_items_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_items menu_items_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "menu_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_item_add_ons order_item_add_ons_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.order_item_add_ons
    ADD CONSTRAINT "order_item_add_ons_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public.order_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public.restaurant_tables(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_promises payment_promises_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.payment_promises
    ADD CONSTRAINT "payment_promises_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plan_entitlements plan_entitlements_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.plan_entitlements
    ADD CONSTRAINT "plan_entitlements_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.platform_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_items purchase_items_inventoryItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "purchase_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_items purchase_items_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public.purchases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchases purchases_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchases purchases_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recipe_items recipe_items_inventoryItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.recipe_items
    ADD CONSTRAINT "recipe_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recipe_items recipe_items_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.recipe_items
    ADD CONSTRAINT "recipe_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservations reservations_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public.restaurant_tables(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reservations reservations_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: restaurant_tables restaurant_tables_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT "restaurant_tables_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles roles_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shifts shifts_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "shifts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff staff_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "staff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff staff_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_shifts staff_shifts_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT "staff_shifts_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public.shifts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_shifts staff_shifts_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT "staff_shifts_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff staff_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_inventoryItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT "stock_movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscription_invoices subscription_invoices_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT "subscription_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public.subscriptions_v2(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT "subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public.subscriptions_v2(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions_v2 subscriptions_v2_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.subscriptions_v2
    ADD CONSTRAINT "subscriptions_v2_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.platform_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions_v2 subscriptions_v2_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.subscriptions_v2
    ADD CONSTRAINT "subscriptions_v2_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: suppliers suppliers_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_feature_flags tenant_feature_flags_featureFlagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT "tenant_feature_flags_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES public.feature_flags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_website_configs tenant_website_configs_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.tenant_website_configs
    ADD CONSTRAINT "tenant_website_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_messages ticket_messages_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nexaros
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: nexaros
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict VCQIs2lHE0BYTFqLczMlP5hqMZ9XdiGUH7owVrD8FRCY2el6IdK53Ucb0IclahT

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict 6MqzDCGltgkQiwq7dR20QIvlPCGZTVvQ8mkyOkuq0HEyfoVcr04W7ZeklhAA56b

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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
-- PostgreSQL database dump complete
--

\unrestrict 6MqzDCGltgkQiwq7dR20QIvlPCGZTVvQ8mkyOkuq0HEyfoVcr04W7ZeklhAA56b

--
-- PostgreSQL database cluster dump complete
--

