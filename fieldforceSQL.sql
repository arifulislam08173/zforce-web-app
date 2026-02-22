--
-- PostgreSQL database dump
--

\restrict jXXVnOre8GqInbDwqpwcsaxnaC1Uxba1EAcON5ahUykpqwPUtPbRsCevZdkTxfm

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-29 16:18:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 19372)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 6307 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 941 (class 1247 OID 16556)
-- Name: enum_Collections_paymentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Collections_paymentType" AS ENUM (
    'CASH',
    'UPI',
    'CHEQUE'
);


ALTER TYPE public."enum_Collections_paymentType" OWNER TO postgres;

--
-- TOC entry 944 (class 1247 OID 16564)
-- Name: enum_Collections_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Collections_status" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."enum_Collections_status" OWNER TO postgres;

--
-- TOC entry 917 (class 1247 OID 16463)
-- Name: enum_Customers_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Customers_status" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."enum_Customers_status" OWNER TO postgres;

--
-- TOC entry 935 (class 1247 OID 16532)
-- Name: enum_Expenses_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Expenses_status" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."enum_Expenses_status" OWNER TO postgres;

--
-- TOC entry 899 (class 1247 OID 16390)
-- Name: enum_Users_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Users_role" AS ENUM (
    'ADMIN',
    'MANAGER',
    'FIELD'
);


ALTER TYPE public."enum_Users_role" OWNER TO postgres;

--
-- TOC entry 923 (class 1247 OID 16485)
-- Name: enum_Visits_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Visits_status" AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'MISSED'
);


ALTER TYPE public."enum_Visits_status" OWNER TO postgres;

--
-- TOC entry 908 (class 1247 OID 16423)
-- Name: enum_orders_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_orders_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.enum_orders_status OWNER TO postgres;

--
-- TOC entry 929 (class 1247 OID 16511)
-- Name: enum_products_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_products_status AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public.enum_products_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 16411)
-- Name: Attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendances" (
    id uuid NOT NULL,
    "userId" uuid,
    date date,
    "punchIn" timestamp with time zone,
    "punchOut" timestamp with time zone,
    lat numeric,
    lng numeric,
    status character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "outLat" numeric,
    "outLng" numeric
);


ALTER TABLE public."Attendances" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16571)
-- Name: Collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Collections" (
    id uuid NOT NULL,
    "userId" uuid,
    "orderId" uuid,
    amount numeric,
    "paymentType" public."enum_Collections_paymentType",
    "receiptUrl" character varying(255),
    "collectedAt" timestamp with time zone,
    status public."enum_Collections_status" DEFAULT 'PENDING'::public."enum_Collections_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Collections" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16467)
-- Name: Customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customers" (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(255) NOT NULL,
    address text,
    city character varying(255),
    state character varying(255),
    zip character varying(255),
    "assignedTo" uuid,
    status public."enum_Customers_status" DEFAULT 'ACTIVE'::public."enum_Customers_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Customers" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16539)
-- Name: Expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expenses" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    category character varying(255) NOT NULL,
    description text,
    "receiptUrl" character varying(255),
    status public."enum_Expenses_status" DEFAULT 'PENDING'::public."enum_Expenses_status",
    "incurredAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Expenses" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16397)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id uuid NOT NULL,
    name character varying(255),
    email character varying(255),
    password character varying(255) NOT NULL,
    role public."enum_Users_role",
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16493)
-- Name: Visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Visits" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "plannedAt" timestamp with time zone NOT NULL,
    "checkInAt" timestamp with time zone,
    "checkInLat" numeric(10,7),
    "checkInLng" numeric(10,7),
    "checkOutAt" timestamp with time zone,
    "checkOutLat" numeric(10,7),
    "checkOutLng" numeric(10,7),
    status public."enum_Visits_status" DEFAULT 'PLANNED'::public."enum_Visits_status",
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Visits" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16444)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    "orderId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    total double precision NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16429)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    date date NOT NULL,
    "totalAmount" double precision DEFAULT '0'::double precision,
    status public.enum_orders_status DEFAULT 'PENDING'::public.enum_orders_status,
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16515)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(255),
    description text,
    price double precision NOT NULL,
    stock integer DEFAULT 0,
    status public.enum_products_status DEFAULT 'ACTIVE'::public.enum_products_status,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16583)
-- Name: routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.routes (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    date date NOT NULL,
    notes character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.routes OWNER TO postgres;

--
-- TOC entry 6293 (class 0 OID 16411)
-- Dependencies: 221
-- Data for Name: Attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendances" (id, "userId", date, "punchIn", "punchOut", lat, lng, status, "createdAt", "updatedAt", "outLat", "outLng") FROM stdin;
d0d40474-84f3-4482-bdd6-f03c7f9becd0	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	2026-01-22	2026-01-22 11:41:03.545+06	\N	\N	\N	PRESENT	2026-01-22 11:41:03.547+06	2026-01-22 11:41:03.547+06	\N	\N
6a7ead89-9b65-4c02-9c61-27071555a78a	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	2026-01-27	2026-01-27 11:57:08.244+06	2026-01-27 11:57:18.658+06	\N	\N	PRESENT	2026-01-27 11:57:08.248+06	2026-01-27 11:57:18.658+06	\N	\N
afab3dfb-449a-4e63-b3d1-0848faa8f464	33333333-3333-3333-3333-333333333333	2026-01-28	2026-01-28 16:00:13.947+06	2026-01-28 16:54:11.973+06	\N	\N	PRESENT	2026-01-28 16:00:13.947+06	2026-01-28 16:54:11.973+06	\N	\N
00f66a86-73ef-489f-9610-664c3ce791ff	55555555-5555-5555-5555-555555555555	2026-01-28	2026-01-28 17:37:11.638+06	2026-01-28 17:39:01.331+06	23.791083898824922	90.40408046354158	PRESENT	2026-01-28 17:37:11.639+06	2026-01-28 17:39:01.332+06	23.791133767376255	90.40410252475748
6ce1c18e-a0ff-4d07-b184-eed404c1f6fc	33333333-3333-3333-3333-333333333333	2026-01-29	2026-01-29 15:07:34.782+06	2026-01-29 15:58:00.135+06	23.791043813551592	90.40407787098468	PRESENT	2026-01-29 15:07:34.783+06	2026-01-29 15:58:00.136+06	23.791080238122653	90.40408964210727
\.


--
-- TOC entry 6300 (class 0 OID 16571)
-- Dependencies: 228
-- Data for Name: Collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Collections" (id, "userId", "orderId", amount, "paymentType", "receiptUrl", "collectedAt", status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
acd92a2b-2dd6-4004-a99e-3b8473e1e6bf	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	f9a1c89a-c1bb-4389-84a9-3f961258db66	8600	CASH	https://tinypng.com/	2026-01-22 10:48:52.234+06	PENDING	2026-01-22 10:48:52.235+06	2026-01-22 10:48:52.235+06	\N
5e84000d-0349-449c-9c02-47dfc40507b3	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	ec1534fc-0b77-4e93-ae6c-6e2961daa30b	1000	CASH	\N	2026-01-22 10:51:47.174+06	PENDING	2026-01-22 10:51:47.174+06	2026-01-22 10:51:47.174+06	\N
3cf91574-a459-45bf-98a1-4c5dc9d81acf	44444444-4444-4444-4444-444444444444	c9b6b36c-f463-47cc-a1f6-57b365a838f0	5280	CASH	\N	2026-01-22 16:32:13.141+06	PENDING	2026-01-22 16:32:13.141+06	2026-01-22 16:32:13.141+06	\N
2c05d95e-3318-4ccf-a410-605fef038f11	33333333-3333-3333-3333-333333333333	97691550-1918-4ecb-a396-a4fcf760ff8e	3500	CASH	\N	2026-01-28 15:33:49.567+06	APPROVED	2026-01-28 15:33:49.567+06	2026-01-28 15:34:41.292+06	\N
\.


--
-- TOC entry 6296 (class 0 OID 16467)
-- Dependencies: 224
-- Data for Name: Customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customers" (id, name, email, phone, address, city, state, zip, "assignedTo", status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	ABC Store	abc@store.com	01700000001	Mirpur, Dhaka	Dhaka	Dhaka	1216	\N	ACTIVE	2026-01-21 12:00:18.419033+06	2026-01-21 12:00:18.419033+06	\N
66e59587-4292-4187-9fc4-e666c8c8fbcc	XYZ Enterprise	\N	01700000002	Agrabad	Chattogram	Chattogram	4000	\N	ACTIVE	2026-01-21 12:00:18.419033+06	2026-01-21 12:00:18.419033+06	\N
\.


--
-- TOC entry 6299 (class 0 OID 16539)
-- Dependencies: 227
-- Data for Name: Expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expenses" (id, "userId", amount, category, description, "receiptUrl", status, "incurredAt", "createdAt", "updatedAt", "deletedAt") FROM stdin;
92c44e95-bc04-4efb-8ff5-ca9884de31f2	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	250.00	Transport		\N	APPROVED	2026-01-21 06:00:00+06	2026-01-21 18:04:39.002+06	2026-01-22 15:31:02.718+06	\N
0da117a2-296a-49ce-b821-12d2b107a306	44444444-4444-4444-4444-444444444444	120.00	Bus		\N	APPROVED	2026-01-22 06:00:00+06	2026-01-22 15:07:10.36+06	2026-01-22 15:31:16.795+06	\N
d093d1eb-4cea-49b8-9827-3dfdcae1d590	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	150.00	Bike	For going to gulshan-1 to Banani for delivery product	https://tinypng.com/	APPROVED	2026-01-22 06:00:00+06	2026-01-22 09:21:14.549+06	2026-01-22 15:31:22.53+06	\N
9412cd86-3a6d-49ca-b764-b9ec23be764d	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	100.00	Rickshaw	details.........	www.test.com	REJECTED	2026-01-22 06:00:00+06	2026-01-22 09:19:56.094+06	2026-01-22 15:31:28.264+06	\N
\.


--
-- TOC entry 6292 (class 0 OID 16397)
-- Dependencies: 220
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, name, email, password, role, "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
4907078f-ef61-4d6f-aad7-3c9f8602bc07	Admin	admin@test.com	$2b$10$H8RC6bFe.7OGX2QREXpu3ei0tbvr3oTUoKIonJAVjMxNQECs2SUDy	ADMIN	t	2026-01-21 11:57:42.118787+06	2026-01-21 11:57:42.118787+06	\N
ecd2327c-b7e2-4cdc-8d9e-866c3925c452	Field	field@test.com	$2b$10$0ywTdeXnQomP6j7B3.4YgeOKMlqBgcIttjHqm9z5I21xiDrZ.gZDu	FIELD	t	2026-01-21 17:24:50.741294+06	2026-01-21 17:24:50.741294+06	\N
06111ca1-6a02-41e5-8218-1b9abd447365	Manager	manager@test.com	$2b$10$rUykyuZGdslZIRRbA8m01eRbVjmGULkI/NkdoFGdtXI4ijKuxv2VG	FIELD	t	2026-01-21 17:25:48.595292+06	2026-01-21 17:25:48.595292+06	\N
11111111-1111-1111-1111-111111111111	Admin One	admin@zforce.com	$2b$10$rDDsQYYajEhtVO4gYpDfQutvPIFW1LGbzSsfC8RjziAdsgViPAt9O	ADMIN	t	2026-01-22 13:13:24.66822+06	2026-01-22 13:13:24.66822+06	\N
22222222-2222-2222-2222-222222222222	Manager One	manager@zforce.com	$2b$10$rDDsQYYajEhtVO4gYpDfQutvPIFW1LGbzSsfC8RjziAdsgViPAt9O	MANAGER	t	2026-01-22 13:13:24.66822+06	2026-01-22 13:13:24.66822+06	\N
33333333-3333-3333-3333-333333333333	Field One	field1@zforce.com	$2b$10$rDDsQYYajEhtVO4gYpDfQutvPIFW1LGbzSsfC8RjziAdsgViPAt9O	FIELD	t	2026-01-22 13:13:24.66822+06	2026-01-22 13:13:24.66822+06	\N
44444444-4444-4444-4444-444444444444	Field Two	field2@zforce.com	$2b$10$rDDsQYYajEhtVO4gYpDfQutvPIFW1LGbzSsfC8RjziAdsgViPAt9O	FIELD	t	2026-01-22 13:13:24.66822+06	2026-01-22 13:13:24.66822+06	\N
55555555-5555-5555-5555-555555555555	Field Three	field3@zforce.com	$2b$10$rDDsQYYajEhtVO4gYpDfQutvPIFW1LGbzSsfC8RjziAdsgViPAt9O	FIELD	t	2026-01-22 13:13:24.66822+06	2026-01-22 13:13:24.66822+06	\N
84be9480-a298-4af7-a293-f579ae00b97f	Mr. field	mr@zforce.com	$2b$10$QtyeQ77SG4YjgYvRPkCW5euw5OQz7KStAZTnLasLNv45Qmi5404G2	FIELD	t	2026-01-29 11:57:11.914+06	2026-01-29 11:57:11.914+06	\N
\.


--
-- TOC entry 6297 (class 0 OID 16493)
-- Dependencies: 225
-- Data for Name: Visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Visits" (id, "userId", "customerId", "plannedAt", "checkInAt", "checkInLat", "checkInLng", "checkOutAt", "checkOutLat", "checkOutLng", status, notes, "createdAt", "updatedAt", "deletedAt") FROM stdin;
694be746-dc81-4c66-b8bf-8d975d427c5f	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21 18:10:00+06	\N	\N	\N	\N	\N	\N	PLANNED	Banani	2026-01-21 17:10:21.167+06	2026-01-21 17:10:21.167+06	\N
f84d6bd5-993a-41f4-88f0-191858951897	4907078f-ef61-4d6f-aad7-3c9f8602bc07	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-21 18:11:00+06	\N	\N	\N	\N	\N	\N	PLANNED	\N	2026-01-21 17:12:00.115+06	2026-01-21 17:12:00.115+06	\N
81b55adc-6f6e-4ae2-b5ca-5f8b8bf2de33	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21 18:29:00+06	\N	\N	\N	\N	\N	\N	PLANNED	\N	2026-01-21 17:29:35.409+06	2026-01-21 17:29:35.409+06	\N
cb8e3aa5-5475-4cd3-81b0-6fc314d9b5fc	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-21 18:29:00+06	\N	\N	\N	\N	\N	\N	PLANNED	\N	2026-01-21 17:29:55.447+06	2026-01-21 17:29:55.447+06	\N
8d5ab5db-95c6-4825-9046-007eaaa725bf	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-22 14:05:00+06	2026-01-22 13:05:50.456+06	23.8341000	90.4125000	2026-01-22 13:07:58.773+06	23.8103000	90.4125000	COMPLETED	Customer Interested	2026-01-22 13:05:16.048+06	2026-01-22 13:07:58.773+06	\N
acac092e-0050-4476-a9e6-8b085ec0e515	44444444-4444-4444-4444-444444444444	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-27 13:14:00+06	\N	\N	\N	\N	\N	\N	PLANNED	today	2026-01-27 12:15:12.383+06	2026-01-27 12:15:12.383+06	\N
c9d7c786-8364-4498-b0b4-4de9157b5364	33333333-3333-3333-3333-333333333333	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-28 17:54:00+06	\N	\N	\N	\N	\N	\N	PLANNED	\N	2026-01-28 16:54:48.781+06	2026-01-28 16:54:48.781+06	\N
b6608784-d544-43d0-837c-49d0eedad4eb	55555555-5555-5555-5555-555555555555	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-28 18:46:00+06	2026-01-28 18:01:08.997+06	23.7910904	90.4040875	2026-01-28 18:03:41.391+06	23.7911023	90.4040991	COMPLETED	Banani	2026-01-28 17:46:53.557+06	2026-01-28 18:03:41.391+06	\N
f196e0f2-ad70-4af8-869f-c8936596b90e	33333333-3333-3333-3333-333333333333	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-29 17:14:00+06	2026-01-29 16:15:44.922+06	23.7911159	90.4040966	2026-01-29 16:16:14.228+06	23.7910983	90.4040903	COMPLETED	Gulshan-1	2026-01-29 16:15:02.407+06	2026-01-29 16:16:14.228+06	\N
\.


--
-- TOC entry 6295 (class 0 OID 16444)
-- Dependencies: 223
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, "orderId", "productId", quantity, price, total, "createdAt", "updatedAt") FROM stdin;
c9fb5d18-4365-4716-ae5a-88c455dc50fb	bd827d5c-8584-4116-817c-a2ca8915aaae	4ba902cc-822a-4d92-bf2d-394d5ac034fb	10	250	2500	2026-01-21 15:32:58.754+06	2026-01-21 15:32:58.754+06
a6254b48-5bc8-4a0a-be04-226270455a00	98afaed7-94ec-43db-bd16-6cdff5ddc132	40e664ca-6083-4a41-995d-79996b616041	45	120	5400	2026-01-21 15:38:29.663+06	2026-01-21 15:38:29.663+06
1eb2a480-6054-4049-9907-c75169bd91d5	9db4c697-61a3-479d-bfff-1baca87d0882	0a6d0706-6d52-4f12-ba85-59ade67fd63d	1	120	120	2026-01-21 15:44:42.497+06	2026-01-21 15:44:42.497+06
e3eff2ef-e222-4a9b-82aa-9a141031edea	9fcb3480-3116-47bb-b0f1-c3853922334b	40e664ca-6083-4a41-995d-79996b616041	5	120	600	2026-01-21 15:45:07.886+06	2026-01-21 15:45:07.886+06
c3fac3d2-013c-4eac-b3df-b645bdb58c15	f4233253-7eef-4e18-9f51-3c97f3fee3a7	6c5db214-cccd-4321-bc79-04f546c82089	20	120	2400	2026-01-21 15:45:57.977+06	2026-01-21 15:45:57.977+06
083b1f90-3fac-4044-8638-47c4e219e08a	f4233253-7eef-4e18-9f51-3c97f3fee3a7	ab57667b-87e3-4363-a241-24355cbcf15e	20	120	2400	2026-01-21 15:45:57.982+06	2026-01-21 15:45:57.982+06
ca346a0b-8b5c-4fa0-a778-f4e1bc2bf8d6	f4233253-7eef-4e18-9f51-3c97f3fee3a7	40e664ca-6083-4a41-995d-79996b616041	20	120	2400	2026-01-21 15:45:57.984+06	2026-01-21 15:45:57.984+06
4450ab67-3696-40d1-8a52-cc34188ce84f	4423a300-b01d-46c0-b9e2-d08d05ae7794	ab57667b-87e3-4363-a241-24355cbcf15e	1	120	120	2026-01-21 16:29:30.93+06	2026-01-21 16:29:30.93+06
8bb5b0cd-0f46-4fe2-9564-69597130635f	1a9e6cf6-7f5b-4113-9368-0af7a30de7b0	ab57667b-87e3-4363-a241-24355cbcf15e	50	120	6000	2026-01-21 16:30:02.797+06	2026-01-21 16:30:02.797+06
d74589da-85e6-49ef-a455-45db947b14ea	8faa78fd-28de-4654-a442-6b02cc42c8db	4ba902cc-822a-4d92-bf2d-394d5ac034fb	10	250	2500	2026-01-21 16:30:17.601+06	2026-01-21 16:30:17.601+06
9548c9dd-3356-46ac-a2b3-f72189c0c48f	7aeeb615-f498-4bd6-beba-181732dcc896	f505bb11-5ebd-4dcd-b352-fe792c800045	100	80	8000	2026-01-21 16:30:30.928+06	2026-01-21 16:30:30.928+06
0b70a293-1455-497a-bbbc-f1ccce63f0f5	9783e3da-01a8-44a7-bea3-09ecc860531d	6c5db214-cccd-4321-bc79-04f546c82089	50	120	6000	2026-01-21 16:30:54.166+06	2026-01-21 16:30:54.166+06
c0f1c331-2132-411d-9548-013e5f5a7410	d21407e4-7425-45a9-bc9a-0fc070cb531f	ab57667b-87e3-4363-a241-24355cbcf15e	100	120	12000	2026-01-21 16:32:45.925+06	2026-01-21 16:32:45.925+06
93af1f22-989d-4429-a064-3595e7d3435f	a8bda77e-5161-4648-9395-42d66629cf27	40e664ca-6083-4a41-995d-79996b616041	15	120	1800	2026-01-21 16:45:35.403+06	2026-01-21 16:45:35.403+06
90a9cc8a-54a2-4178-83c9-ac79fffb9f47	f9a1c89a-c1bb-4389-84a9-3f961258db66	4ba902cc-822a-4d92-bf2d-394d5ac034fb	20	250	5000	2026-01-22 10:47:26.314+06	2026-01-22 10:47:26.314+06
c6347f3e-6f61-4c96-9e0a-74aa26ab212b	f9a1c89a-c1bb-4389-84a9-3f961258db66	6c5db214-cccd-4321-bc79-04f546c82089	10	120	1200	2026-01-22 10:47:26.332+06	2026-01-22 10:47:26.332+06
f7d251f2-35dc-4eea-a252-dc6cb1119810	f9a1c89a-c1bb-4389-84a9-3f961258db66	f505bb11-5ebd-4dcd-b352-fe792c800045	30	80	2400	2026-01-22 10:47:26.339+06	2026-01-22 10:47:26.339+06
edabd793-a30b-4c5f-8cf1-97387182cc17	ec1534fc-0b77-4e93-ae6c-6e2961daa30b	0a6d0706-6d52-4f12-ba85-59ade67fd63d	25	120	3000	2026-01-22 10:51:08.567+06	2026-01-22 10:51:08.567+06
baf8bfaf-0888-4307-8b56-45d75e5cdeeb	421bbe72-9eb3-4223-b932-f20c3f82441f	40e664ca-6083-4a41-995d-79996b616041	10	120	1200	2026-01-22 10:51:28.413+06	2026-01-22 10:51:28.413+06
2cde482f-3732-4b03-81ae-58f0718fb414	c9b6b36c-f463-47cc-a1f6-57b365a838f0	0a6d0706-6d52-4f12-ba85-59ade67fd63d	44	120	5280	2026-01-22 15:06:09.333+06	2026-01-22 15:06:09.333+06
7fec3fcb-6a00-465f-8afb-86aefd8503bd	97691550-1918-4ecb-a396-a4fcf760ff8e	4ba902cc-822a-4d92-bf2d-394d5ac034fb	30	250	7500	2026-01-28 15:29:58.012+06	2026-01-28 15:29:58.012+06
\.


--
-- TOC entry 6294 (class 0 OID 16429)
-- Dependencies: 222
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "userId", "customerId", date, "totalAmount", status, notes, "createdAt", "updatedAt") FROM stdin;
bd827d5c-8584-4116-817c-a2ca8915aaae	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	2500	PENDING	Banani	2026-01-21 15:32:58.745+06	2026-01-21 15:32:58.745+06
98afaed7-94ec-43db-bd16-6cdff5ddc132	4907078f-ef61-4d6f-aad7-3c9f8602bc07	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-21	5400	COMPLETED	Hello	2026-01-21 15:34:04.428+06	2026-01-21 15:38:29.668+06
9db4c697-61a3-479d-bfff-1baca87d0882	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	120	PENDING		2026-01-21 15:44:42.487+06	2026-01-21 15:44:42.487+06
9fcb3480-3116-47bb-b0f1-c3853922334b	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	600	PENDING		2026-01-21 15:45:07.863+06	2026-01-21 15:45:07.863+06
f4233253-7eef-4e18-9f51-3c97f3fee3a7	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	7200	PENDING		2026-01-21 15:45:57.954+06	2026-01-21 15:45:57.954+06
4423a300-b01d-46c0-b9e2-d08d05ae7794	4907078f-ef61-4d6f-aad7-3c9f8602bc07	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-21	120	PENDING		2026-01-21 16:29:30.903+06	2026-01-21 16:29:30.903+06
1a9e6cf6-7f5b-4113-9368-0af7a30de7b0	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	6000	PENDING		2026-01-21 16:30:02.774+06	2026-01-21 16:30:02.774+06
8faa78fd-28de-4654-a442-6b02cc42c8db	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	2500	PENDING		2026-01-21 16:30:17.587+06	2026-01-21 16:30:17.587+06
7aeeb615-f498-4bd6-beba-181732dcc896	4907078f-ef61-4d6f-aad7-3c9f8602bc07	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-21	8000	PENDING		2026-01-21 16:30:30.906+06	2026-01-21 16:30:30.906+06
9783e3da-01a8-44a7-bea3-09ecc860531d	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	6000	COMPLETED		2026-01-21 16:30:54.144+06	2026-01-21 16:30:54.144+06
d21407e4-7425-45a9-bc9a-0fc070cb531f	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	12000	COMPLETED		2026-01-21 16:32:45.89+06	2026-01-21 16:32:45.89+06
a8bda77e-5161-4648-9395-42d66629cf27	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	1800	PENDING		2026-01-21 16:29:41.183+06	2026-01-21 16:45:35.405+06
f9a1c89a-c1bb-4389-84a9-3f961258db66	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-22	8600	PENDING		2026-01-22 10:47:26.252+06	2026-01-22 10:47:26.252+06
ec1534fc-0b77-4e93-ae6c-6e2961daa30b	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-22	3000	PENDING		2026-01-22 10:51:08.5+06	2026-01-22 10:51:08.5+06
421bbe72-9eb3-4223-b932-f20c3f82441f	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-22	1200	PENDING		2026-01-22 10:51:28.348+06	2026-01-22 10:51:28.348+06
c9b6b36c-f463-47cc-a1f6-57b365a838f0	44444444-4444-4444-4444-444444444444	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-22	5280	PENDING		2026-01-22 15:06:09.255+06	2026-01-22 15:06:09.255+06
97691550-1918-4ecb-a396-a4fcf760ff8e	33333333-3333-3333-3333-333333333333	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-28	7500	PENDING		2026-01-28 15:29:57.905+06	2026-01-28 15:29:57.905+06
\.


--
-- TOC entry 6298 (class 0 OID 16515)
-- Dependencies: 226
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, sku, description, price, stock, status, "createdAt", "updatedAt") FROM stdin;
ab57667b-87e3-4363-a241-24355cbcf15e	Cadbury Dairy Milk	CHOC-DM-001	Classic milk chocolate bar	120	29	ACTIVE	2026-01-21 14:42:04.843434+06	2026-01-21 16:32:45.929+06
6c5db214-cccd-4321-bc79-04f546c82089	KitKat Chunky	CHOC-KKC-001	Chunky wafer bar	120	100	ACTIVE	2026-01-21 14:42:04.843434+06	2026-01-22 10:47:26.337+06
f505bb11-5ebd-4dcd-b352-fe792c800045	Nestlé KitKat 4 Finger	CHOC-KK-001	Crispy wafer fingers covered in chocolate	80	170	ACTIVE	2026-01-21 14:42:04.843434+06	2026-01-22 10:47:26.342+06
40e664ca-6083-4a41-995d-79996b616041	Mars	CHOC-MRS-001	Caramel and nougat in milk chocolate	120	85	ACTIVE	2026-01-21 14:42:04.843434+06	2026-01-22 10:51:28.419+06
0a6d0706-6d52-4f12-ba85-59ade67fd63d	Snickers	CHOC-SNK-001	Peanuts, caramel, nougat in milk chocolate	120	130	ACTIVE	2026-01-21 14:42:04.843434+06	2026-01-22 15:06:09.338+06
4ba902cc-822a-4d92-bf2d-394d5ac034fb	Cadbury Dairy Milk Silk	CHOC-DMS-001	Smooth premium milk chocolate	250	50	ACTIVE	2026-01-21 14:42:04.843434+06	2026-01-28 15:29:58.015+06
\.


--
-- TOC entry 6301 (class 0 OID 16583)
-- Dependencies: 229
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.routes (id, "userId", "customerId", date, notes, "createdAt", "updatedAt") FROM stdin;
97669295-de8d-4545-9b8d-2c49766a22d1	4907078f-ef61-4d6f-aad7-3c9f8602bc07	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-21	\N	2026-01-21 12:01:51.345+06	2026-01-21 12:01:51.345+06
c3352d54-dea5-47fa-bd40-15e71e91470f	4907078f-ef61-4d6f-aad7-3c9f8602bc07	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-20	\N	2026-01-21 12:02:02.756+06	2026-01-21 12:02:02.756+06
f7299522-a18c-446f-9045-de2f6b14c729	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-22	\N	2026-01-22 12:06:41.944+06	2026-01-22 12:06:41.944+06
de97850f-84df-4cce-aa35-5aa82faa33b4	44444444-4444-4444-4444-444444444444	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-22	Urgent	2026-01-22 12:50:13.461+06	2026-01-22 15:01:35.9+06
9c76b4cf-000a-4958-82bd-94119e97bf0c	ecd2327c-b7e2-4cdc-8d9e-866c3925c452	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-27	Banani to gulshan	2026-01-27 11:58:27.442+06	2026-01-27 11:58:27.442+06
9deb2665-ee26-4a30-a3f1-b794882ef675	44444444-4444-4444-4444-444444444444	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-27	Abcd	2026-01-27 12:14:00.987+06	2026-01-27 12:14:00.987+06
a6fe69a9-e1c4-4fc9-a3a7-2a7747a52e9c	33333333-3333-3333-3333-333333333333	3e8e10c6-66f5-40bc-82a8-cdc96f2803e9	2026-01-28	\N	2026-01-28 15:27:55.999+06	2026-01-28 15:27:55.999+06
a8ef2176-882f-4ee5-b079-1b03cc4bee79	33333333-3333-3333-3333-333333333333	66e59587-4292-4187-9fc4-e666c8c8fbcc	2026-01-29	\N	2026-01-29 14:57:23.494+06	2026-01-29 14:57:23.494+06
\.


--
-- TOC entry 5361 (class 2606 OID 16420)
-- Name: Attendances Attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendances"
    ADD CONSTRAINT "Attendances_pkey" PRIMARY KEY (id);


--
-- TOC entry 6129 (class 2606 OID 16581)
-- Name: Collections Collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Collections"
    ADD CONSTRAINT "Collections_pkey" PRIMARY KEY (id);


--
-- TOC entry 5368 (class 2606 OID 146195)
-- Name: Customers Customers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key" UNIQUE (phone);


--
-- TOC entry 5370 (class 2606 OID 146197)
-- Name: Customers Customers_phone_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key1" UNIQUE (phone);


--
-- TOC entry 5372 (class 2606 OID 146175)
-- Name: Customers Customers_phone_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key10" UNIQUE (phone);


--
-- TOC entry 5374 (class 2606 OID 146255)
-- Name: Customers Customers_phone_key100; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key100" UNIQUE (phone);


--
-- TOC entry 5376 (class 2606 OID 146097)
-- Name: Customers Customers_phone_key101; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key101" UNIQUE (phone);


--
-- TOC entry 5378 (class 2606 OID 146099)
-- Name: Customers Customers_phone_key102; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key102" UNIQUE (phone);


--
-- TOC entry 5380 (class 2606 OID 146101)
-- Name: Customers Customers_phone_key103; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key103" UNIQUE (phone);


--
-- TOC entry 5382 (class 2606 OID 146103)
-- Name: Customers Customers_phone_key104; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key104" UNIQUE (phone);


--
-- TOC entry 5384 (class 2606 OID 146289)
-- Name: Customers Customers_phone_key105; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key105" UNIQUE (phone);


--
-- TOC entry 5386 (class 2606 OID 146105)
-- Name: Customers Customers_phone_key106; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key106" UNIQUE (phone);


--
-- TOC entry 5388 (class 2606 OID 146287)
-- Name: Customers Customers_phone_key107; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key107" UNIQUE (phone);


--
-- TOC entry 5390 (class 2606 OID 146107)
-- Name: Customers Customers_phone_key108; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key108" UNIQUE (phone);


--
-- TOC entry 5392 (class 2606 OID 146279)
-- Name: Customers Customers_phone_key109; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key109" UNIQUE (phone);


--
-- TOC entry 5394 (class 2606 OID 146189)
-- Name: Customers Customers_phone_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key11" UNIQUE (phone);


--
-- TOC entry 5396 (class 2606 OID 146285)
-- Name: Customers Customers_phone_key110; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key110" UNIQUE (phone);


--
-- TOC entry 5398 (class 2606 OID 146281)
-- Name: Customers Customers_phone_key111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key111" UNIQUE (phone);


--
-- TOC entry 5400 (class 2606 OID 146283)
-- Name: Customers Customers_phone_key112; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key112" UNIQUE (phone);


--
-- TOC entry 5402 (class 2606 OID 146231)
-- Name: Customers Customers_phone_key113; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key113" UNIQUE (phone);


--
-- TOC entry 5404 (class 2606 OID 145987)
-- Name: Customers Customers_phone_key114; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key114" UNIQUE (phone);


--
-- TOC entry 5406 (class 2606 OID 145989)
-- Name: Customers Customers_phone_key115; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key115" UNIQUE (phone);


--
-- TOC entry 5408 (class 2606 OID 146229)
-- Name: Customers Customers_phone_key116; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key116" UNIQUE (phone);


--
-- TOC entry 5410 (class 2606 OID 146083)
-- Name: Customers Customers_phone_key117; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key117" UNIQUE (phone);


--
-- TOC entry 5412 (class 2606 OID 146023)
-- Name: Customers Customers_phone_key118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key118" UNIQUE (phone);


--
-- TOC entry 5414 (class 2606 OID 146047)
-- Name: Customers Customers_phone_key119; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key119" UNIQUE (phone);


--
-- TOC entry 5416 (class 2606 OID 146177)
-- Name: Customers Customers_phone_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key12" UNIQUE (phone);


--
-- TOC entry 5418 (class 2606 OID 146025)
-- Name: Customers Customers_phone_key120; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key120" UNIQUE (phone);


--
-- TOC entry 5420 (class 2606 OID 146045)
-- Name: Customers Customers_phone_key121; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key121" UNIQUE (phone);


--
-- TOC entry 5422 (class 2606 OID 146027)
-- Name: Customers Customers_phone_key122; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key122" UNIQUE (phone);


--
-- TOC entry 5424 (class 2606 OID 146029)
-- Name: Customers Customers_phone_key123; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key123" UNIQUE (phone);


--
-- TOC entry 5426 (class 2606 OID 146031)
-- Name: Customers Customers_phone_key124; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key124" UNIQUE (phone);


--
-- TOC entry 5428 (class 2606 OID 146033)
-- Name: Customers Customers_phone_key125; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key125" UNIQUE (phone);


--
-- TOC entry 5430 (class 2606 OID 146035)
-- Name: Customers Customers_phone_key126; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key126" UNIQUE (phone);


--
-- TOC entry 5432 (class 2606 OID 146043)
-- Name: Customers Customers_phone_key127; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key127" UNIQUE (phone);


--
-- TOC entry 5434 (class 2606 OID 146037)
-- Name: Customers Customers_phone_key128; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key128" UNIQUE (phone);


--
-- TOC entry 5436 (class 2606 OID 146041)
-- Name: Customers Customers_phone_key129; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key129" UNIQUE (phone);


--
-- TOC entry 5438 (class 2606 OID 146179)
-- Name: Customers Customers_phone_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key13" UNIQUE (phone);


--
-- TOC entry 5440 (class 2606 OID 146039)
-- Name: Customers Customers_phone_key130; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key130" UNIQUE (phone);


--
-- TOC entry 5442 (class 2606 OID 146205)
-- Name: Customers Customers_phone_key131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key131" UNIQUE (phone);


--
-- TOC entry 5444 (class 2606 OID 146111)
-- Name: Customers Customers_phone_key132; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key132" UNIQUE (phone);


--
-- TOC entry 5446 (class 2606 OID 146151)
-- Name: Customers Customers_phone_key133; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key133" UNIQUE (phone);


--
-- TOC entry 5448 (class 2606 OID 146113)
-- Name: Customers Customers_phone_key134; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key134" UNIQUE (phone);


--
-- TOC entry 5450 (class 2606 OID 146149)
-- Name: Customers Customers_phone_key135; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key135" UNIQUE (phone);


--
-- TOC entry 5452 (class 2606 OID 146117)
-- Name: Customers Customers_phone_key136; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key136" UNIQUE (phone);


--
-- TOC entry 5454 (class 2606 OID 146147)
-- Name: Customers Customers_phone_key137; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key137" UNIQUE (phone);


--
-- TOC entry 5456 (class 2606 OID 146121)
-- Name: Customers Customers_phone_key138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key138" UNIQUE (phone);


--
-- TOC entry 5458 (class 2606 OID 146145)
-- Name: Customers Customers_phone_key139; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key139" UNIQUE (phone);


--
-- TOC entry 5460 (class 2606 OID 146187)
-- Name: Customers Customers_phone_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key14" UNIQUE (phone);


--
-- TOC entry 5462 (class 2606 OID 146115)
-- Name: Customers Customers_phone_key140; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key140" UNIQUE (phone);


--
-- TOC entry 5464 (class 2606 OID 146123)
-- Name: Customers Customers_phone_key141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key141" UNIQUE (phone);


--
-- TOC entry 5466 (class 2606 OID 146143)
-- Name: Customers Customers_phone_key142; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key142" UNIQUE (phone);


--
-- TOC entry 5468 (class 2606 OID 146125)
-- Name: Customers Customers_phone_key143; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key143" UNIQUE (phone);


--
-- TOC entry 5470 (class 2606 OID 146141)
-- Name: Customers Customers_phone_key144; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key144" UNIQUE (phone);


--
-- TOC entry 5472 (class 2606 OID 146127)
-- Name: Customers Customers_phone_key145; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key145" UNIQUE (phone);


--
-- TOC entry 5474 (class 2606 OID 146129)
-- Name: Customers Customers_phone_key146; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key146" UNIQUE (phone);


--
-- TOC entry 5476 (class 2606 OID 146311)
-- Name: Customers Customers_phone_key147; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key147" UNIQUE (phone);


--
-- TOC entry 5478 (class 2606 OID 146139)
-- Name: Customers Customers_phone_key148; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key148" UNIQUE (phone);


--
-- TOC entry 5480 (class 2606 OID 146313)
-- Name: Customers Customers_phone_key149; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key149" UNIQUE (phone);


--
-- TOC entry 5482 (class 2606 OID 146225)
-- Name: Customers Customers_phone_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key15" UNIQUE (phone);


--
-- TOC entry 5484 (class 2606 OID 146315)
-- Name: Customers Customers_phone_key150; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key150" UNIQUE (phone);


--
-- TOC entry 5486 (class 2606 OID 146137)
-- Name: Customers Customers_phone_key151; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key151" UNIQUE (phone);


--
-- TOC entry 5488 (class 2606 OID 146317)
-- Name: Customers Customers_phone_key152; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key152" UNIQUE (phone);


--
-- TOC entry 5490 (class 2606 OID 146319)
-- Name: Customers Customers_phone_key153; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key153" UNIQUE (phone);


--
-- TOC entry 5492 (class 2606 OID 146321)
-- Name: Customers Customers_phone_key154; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key154" UNIQUE (phone);


--
-- TOC entry 5494 (class 2606 OID 146323)
-- Name: Customers Customers_phone_key155; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key155" UNIQUE (phone);


--
-- TOC entry 5496 (class 2606 OID 146135)
-- Name: Customers Customers_phone_key156; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key156" UNIQUE (phone);


--
-- TOC entry 5498 (class 2606 OID 146325)
-- Name: Customers Customers_phone_key157; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key157" UNIQUE (phone);


--
-- TOC entry 5500 (class 2606 OID 146133)
-- Name: Customers Customers_phone_key158; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key158" UNIQUE (phone);


--
-- TOC entry 5502 (class 2606 OID 146327)
-- Name: Customers Customers_phone_key159; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key159" UNIQUE (phone);


--
-- TOC entry 5504 (class 2606 OID 146227)
-- Name: Customers Customers_phone_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key16" UNIQUE (phone);


--
-- TOC entry 5506 (class 2606 OID 146131)
-- Name: Customers Customers_phone_key160; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key160" UNIQUE (phone);


--
-- TOC entry 5508 (class 2606 OID 146329)
-- Name: Customers Customers_phone_key161; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key161" UNIQUE (phone);


--
-- TOC entry 5510 (class 2606 OID 146109)
-- Name: Customers Customers_phone_key162; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key162" UNIQUE (phone);


--
-- TOC entry 5512 (class 2606 OID 146331)
-- Name: Customers Customers_phone_key163; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key163" UNIQUE (phone);


--
-- TOC entry 5514 (class 2606 OID 146333)
-- Name: Customers Customers_phone_key164; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key164" UNIQUE (phone);


--
-- TOC entry 5516 (class 2606 OID 146005)
-- Name: Customers Customers_phone_key165; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key165" UNIQUE (phone);


--
-- TOC entry 5518 (class 2606 OID 146335)
-- Name: Customers Customers_phone_key166; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key166" UNIQUE (phone);


--
-- TOC entry 5520 (class 2606 OID 146003)
-- Name: Customers Customers_phone_key167; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key167" UNIQUE (phone);


--
-- TOC entry 5522 (class 2606 OID 146337)
-- Name: Customers Customers_phone_key168; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key168" UNIQUE (phone);


--
-- TOC entry 5524 (class 2606 OID 146339)
-- Name: Customers Customers_phone_key169; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key169" UNIQUE (phone);


--
-- TOC entry 5526 (class 2606 OID 146185)
-- Name: Customers Customers_phone_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key17" UNIQUE (phone);


--
-- TOC entry 5528 (class 2606 OID 146341)
-- Name: Customers Customers_phone_key170; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key170" UNIQUE (phone);


--
-- TOC entry 5530 (class 2606 OID 146001)
-- Name: Customers Customers_phone_key171; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key171" UNIQUE (phone);


--
-- TOC entry 5532 (class 2606 OID 146343)
-- Name: Customers Customers_phone_key172; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key172" UNIQUE (phone);


--
-- TOC entry 5534 (class 2606 OID 145999)
-- Name: Customers Customers_phone_key173; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key173" UNIQUE (phone);


--
-- TOC entry 5536 (class 2606 OID 146345)
-- Name: Customers Customers_phone_key174; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key174" UNIQUE (phone);


--
-- TOC entry 5538 (class 2606 OID 146347)
-- Name: Customers Customers_phone_key175; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key175" UNIQUE (phone);


--
-- TOC entry 5540 (class 2606 OID 145997)
-- Name: Customers Customers_phone_key176; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key176" UNIQUE (phone);


--
-- TOC entry 5542 (class 2606 OID 146349)
-- Name: Customers Customers_phone_key177; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key177" UNIQUE (phone);


--
-- TOC entry 5544 (class 2606 OID 145995)
-- Name: Customers Customers_phone_key178; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key178" UNIQUE (phone);


--
-- TOC entry 5546 (class 2606 OID 146351)
-- Name: Customers Customers_phone_key179; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key179" UNIQUE (phone);


--
-- TOC entry 5548 (class 2606 OID 145985)
-- Name: Customers Customers_phone_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key18" UNIQUE (phone);


--
-- TOC entry 5550 (class 2606 OID 146353)
-- Name: Customers Customers_phone_key180; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key180" UNIQUE (phone);


--
-- TOC entry 5552 (class 2606 OID 146355)
-- Name: Customers Customers_phone_key181; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key181" UNIQUE (phone);


--
-- TOC entry 5554 (class 2606 OID 146357)
-- Name: Customers Customers_phone_key182; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key182" UNIQUE (phone);


--
-- TOC entry 5556 (class 2606 OID 145993)
-- Name: Customers Customers_phone_key183; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key183" UNIQUE (phone);


--
-- TOC entry 5558 (class 2606 OID 145991)
-- Name: Customers Customers_phone_key184; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key184" UNIQUE (phone);


--
-- TOC entry 5560 (class 2606 OID 146065)
-- Name: Customers Customers_phone_key185; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key185" UNIQUE (phone);


--
-- TOC entry 5562 (class 2606 OID 146119)
-- Name: Customers Customers_phone_key186; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key186" UNIQUE (phone);


--
-- TOC entry 5564 (class 2606 OID 146359)
-- Name: Customers Customers_phone_key187; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key187" UNIQUE (phone);


--
-- TOC entry 5566 (class 2606 OID 145983)
-- Name: Customers Customers_phone_key188; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key188" UNIQUE (phone);


--
-- TOC entry 5568 (class 2606 OID 146361)
-- Name: Customers Customers_phone_key189; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key189" UNIQUE (phone);


--
-- TOC entry 5570 (class 2606 OID 146233)
-- Name: Customers Customers_phone_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key19" UNIQUE (phone);


--
-- TOC entry 5572 (class 2606 OID 146163)
-- Name: Customers Customers_phone_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key2" UNIQUE (phone);


--
-- TOC entry 5574 (class 2606 OID 146253)
-- Name: Customers Customers_phone_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key20" UNIQUE (phone);


--
-- TOC entry 5576 (class 2606 OID 146235)
-- Name: Customers Customers_phone_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key21" UNIQUE (phone);


--
-- TOC entry 5578 (class 2606 OID 146237)
-- Name: Customers Customers_phone_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key22" UNIQUE (phone);


--
-- TOC entry 5580 (class 2606 OID 146251)
-- Name: Customers Customers_phone_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key23" UNIQUE (phone);


--
-- TOC entry 5582 (class 2606 OID 146249)
-- Name: Customers Customers_phone_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key24" UNIQUE (phone);


--
-- TOC entry 5584 (class 2606 OID 146239)
-- Name: Customers Customers_phone_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key25" UNIQUE (phone);


--
-- TOC entry 5586 (class 2606 OID 146247)
-- Name: Customers Customers_phone_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key26" UNIQUE (phone);


--
-- TOC entry 5588 (class 2606 OID 146241)
-- Name: Customers Customers_phone_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key27" UNIQUE (phone);


--
-- TOC entry 5590 (class 2606 OID 146243)
-- Name: Customers Customers_phone_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key28" UNIQUE (phone);


--
-- TOC entry 5592 (class 2606 OID 146245)
-- Name: Customers Customers_phone_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key29" UNIQUE (phone);


--
-- TOC entry 5594 (class 2606 OID 146165)
-- Name: Customers Customers_phone_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key3" UNIQUE (phone);


--
-- TOC entry 5596 (class 2606 OID 146199)
-- Name: Customers Customers_phone_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key30" UNIQUE (phone);


--
-- TOC entry 5598 (class 2606 OID 146161)
-- Name: Customers Customers_phone_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key31" UNIQUE (phone);


--
-- TOC entry 5600 (class 2606 OID 146201)
-- Name: Customers Customers_phone_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key32" UNIQUE (phone);


--
-- TOC entry 5602 (class 2606 OID 146203)
-- Name: Customers Customers_phone_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key33" UNIQUE (phone);


--
-- TOC entry 5604 (class 2606 OID 146277)
-- Name: Customers Customers_phone_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key34" UNIQUE (phone);


--
-- TOC entry 5606 (class 2606 OID 146007)
-- Name: Customers Customers_phone_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key35" UNIQUE (phone);


--
-- TOC entry 5608 (class 2606 OID 146159)
-- Name: Customers Customers_phone_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key36" UNIQUE (phone);


--
-- TOC entry 5610 (class 2606 OID 146009)
-- Name: Customers Customers_phone_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key37" UNIQUE (phone);


--
-- TOC entry 5612 (class 2606 OID 146011)
-- Name: Customers Customers_phone_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key38" UNIQUE (phone);


--
-- TOC entry 5614 (class 2606 OID 146013)
-- Name: Customers Customers_phone_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key39" UNIQUE (phone);


--
-- TOC entry 5616 (class 2606 OID 146167)
-- Name: Customers Customers_phone_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key4" UNIQUE (phone);


--
-- TOC entry 5618 (class 2606 OID 146157)
-- Name: Customers Customers_phone_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key40" UNIQUE (phone);


--
-- TOC entry 5620 (class 2606 OID 146155)
-- Name: Customers Customers_phone_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key41" UNIQUE (phone);


--
-- TOC entry 5622 (class 2606 OID 146015)
-- Name: Customers Customers_phone_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key42" UNIQUE (phone);


--
-- TOC entry 5624 (class 2606 OID 146017)
-- Name: Customers Customers_phone_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key43" UNIQUE (phone);


--
-- TOC entry 5626 (class 2606 OID 146019)
-- Name: Customers Customers_phone_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key44" UNIQUE (phone);


--
-- TOC entry 5628 (class 2606 OID 146153)
-- Name: Customers Customers_phone_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key45" UNIQUE (phone);


--
-- TOC entry 5630 (class 2606 OID 146021)
-- Name: Customers Customers_phone_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key46" UNIQUE (phone);


--
-- TOC entry 5632 (class 2606 OID 146275)
-- Name: Customers Customers_phone_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key47" UNIQUE (phone);


--
-- TOC entry 5634 (class 2606 OID 146049)
-- Name: Customers Customers_phone_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key48" UNIQUE (phone);


--
-- TOC entry 5636 (class 2606 OID 146051)
-- Name: Customers Customers_phone_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key49" UNIQUE (phone);


--
-- TOC entry 5638 (class 2606 OID 146169)
-- Name: Customers Customers_phone_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key5" UNIQUE (phone);


--
-- TOC entry 5640 (class 2606 OID 146273)
-- Name: Customers Customers_phone_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key50" UNIQUE (phone);


--
-- TOC entry 5642 (class 2606 OID 146053)
-- Name: Customers Customers_phone_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key51" UNIQUE (phone);


--
-- TOC entry 5644 (class 2606 OID 146055)
-- Name: Customers Customers_phone_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key52" UNIQUE (phone);


--
-- TOC entry 5646 (class 2606 OID 146057)
-- Name: Customers Customers_phone_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key53" UNIQUE (phone);


--
-- TOC entry 5648 (class 2606 OID 146271)
-- Name: Customers Customers_phone_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key54" UNIQUE (phone);


--
-- TOC entry 5650 (class 2606 OID 146059)
-- Name: Customers Customers_phone_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key55" UNIQUE (phone);


--
-- TOC entry 5652 (class 2606 OID 146061)
-- Name: Customers Customers_phone_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key56" UNIQUE (phone);


--
-- TOC entry 5654 (class 2606 OID 146269)
-- Name: Customers Customers_phone_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key57" UNIQUE (phone);


--
-- TOC entry 5656 (class 2606 OID 146063)
-- Name: Customers Customers_phone_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key58" UNIQUE (phone);


--
-- TOC entry 5658 (class 2606 OID 146067)
-- Name: Customers Customers_phone_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key59" UNIQUE (phone);


--
-- TOC entry 5660 (class 2606 OID 146193)
-- Name: Customers Customers_phone_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key6" UNIQUE (phone);


--
-- TOC entry 5662 (class 2606 OID 146267)
-- Name: Customers Customers_phone_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key60" UNIQUE (phone);


--
-- TOC entry 5664 (class 2606 OID 146301)
-- Name: Customers Customers_phone_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key61" UNIQUE (phone);


--
-- TOC entry 5666 (class 2606 OID 146303)
-- Name: Customers Customers_phone_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key62" UNIQUE (phone);


--
-- TOC entry 5668 (class 2606 OID 146265)
-- Name: Customers Customers_phone_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key63" UNIQUE (phone);


--
-- TOC entry 5670 (class 2606 OID 146263)
-- Name: Customers Customers_phone_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key64" UNIQUE (phone);


--
-- TOC entry 5672 (class 2606 OID 146305)
-- Name: Customers Customers_phone_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key65" UNIQUE (phone);


--
-- TOC entry 5674 (class 2606 OID 146307)
-- Name: Customers Customers_phone_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key66" UNIQUE (phone);


--
-- TOC entry 5676 (class 2606 OID 146261)
-- Name: Customers Customers_phone_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key67" UNIQUE (phone);


--
-- TOC entry 5678 (class 2606 OID 146259)
-- Name: Customers Customers_phone_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key68" UNIQUE (phone);


--
-- TOC entry 5680 (class 2606 OID 146309)
-- Name: Customers Customers_phone_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key69" UNIQUE (phone);


--
-- TOC entry 5682 (class 2606 OID 146171)
-- Name: Customers Customers_phone_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key7" UNIQUE (phone);


--
-- TOC entry 5684 (class 2606 OID 146257)
-- Name: Customers Customers_phone_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key70" UNIQUE (phone);


--
-- TOC entry 5686 (class 2606 OID 146207)
-- Name: Customers Customers_phone_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key71" UNIQUE (phone);


--
-- TOC entry 5688 (class 2606 OID 146209)
-- Name: Customers Customers_phone_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key72" UNIQUE (phone);


--
-- TOC entry 5690 (class 2606 OID 146211)
-- Name: Customers Customers_phone_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key73" UNIQUE (phone);


--
-- TOC entry 5692 (class 2606 OID 146073)
-- Name: Customers Customers_phone_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key74" UNIQUE (phone);


--
-- TOC entry 5694 (class 2606 OID 146213)
-- Name: Customers Customers_phone_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key75" UNIQUE (phone);


--
-- TOC entry 5696 (class 2606 OID 146215)
-- Name: Customers Customers_phone_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key76" UNIQUE (phone);


--
-- TOC entry 5698 (class 2606 OID 146071)
-- Name: Customers Customers_phone_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key77" UNIQUE (phone);


--
-- TOC entry 5700 (class 2606 OID 146069)
-- Name: Customers Customers_phone_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key78" UNIQUE (phone);


--
-- TOC entry 5702 (class 2606 OID 146217)
-- Name: Customers Customers_phone_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key79" UNIQUE (phone);


--
-- TOC entry 5704 (class 2606 OID 146173)
-- Name: Customers Customers_phone_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key8" UNIQUE (phone);


--
-- TOC entry 5706 (class 2606 OID 146219)
-- Name: Customers Customers_phone_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key80" UNIQUE (phone);


--
-- TOC entry 5708 (class 2606 OID 146181)
-- Name: Customers Customers_phone_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key81" UNIQUE (phone);


--
-- TOC entry 5710 (class 2606 OID 146183)
-- Name: Customers Customers_phone_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key82" UNIQUE (phone);


--
-- TOC entry 5712 (class 2606 OID 146291)
-- Name: Customers Customers_phone_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key83" UNIQUE (phone);


--
-- TOC entry 5714 (class 2606 OID 146223)
-- Name: Customers Customers_phone_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key84" UNIQUE (phone);


--
-- TOC entry 5716 (class 2606 OID 146075)
-- Name: Customers Customers_phone_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key85" UNIQUE (phone);


--
-- TOC entry 5718 (class 2606 OID 146221)
-- Name: Customers Customers_phone_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key86" UNIQUE (phone);


--
-- TOC entry 5720 (class 2606 OID 146077)
-- Name: Customers Customers_phone_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key87" UNIQUE (phone);


--
-- TOC entry 5722 (class 2606 OID 146079)
-- Name: Customers Customers_phone_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key88" UNIQUE (phone);


--
-- TOC entry 5724 (class 2606 OID 146299)
-- Name: Customers Customers_phone_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key89" UNIQUE (phone);


--
-- TOC entry 5726 (class 2606 OID 146191)
-- Name: Customers Customers_phone_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key9" UNIQUE (phone);


--
-- TOC entry 5728 (class 2606 OID 146081)
-- Name: Customers Customers_phone_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key90" UNIQUE (phone);


--
-- TOC entry 5730 (class 2606 OID 146297)
-- Name: Customers Customers_phone_key91; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key91" UNIQUE (phone);


--
-- TOC entry 5732 (class 2606 OID 146085)
-- Name: Customers Customers_phone_key92; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key92" UNIQUE (phone);


--
-- TOC entry 5734 (class 2606 OID 146087)
-- Name: Customers Customers_phone_key93; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key93" UNIQUE (phone);


--
-- TOC entry 5736 (class 2606 OID 146295)
-- Name: Customers Customers_phone_key94; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key94" UNIQUE (phone);


--
-- TOC entry 5738 (class 2606 OID 146089)
-- Name: Customers Customers_phone_key95; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key95" UNIQUE (phone);


--
-- TOC entry 5740 (class 2606 OID 146293)
-- Name: Customers Customers_phone_key96; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key96" UNIQUE (phone);


--
-- TOC entry 5742 (class 2606 OID 146091)
-- Name: Customers Customers_phone_key97; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key97" UNIQUE (phone);


--
-- TOC entry 5744 (class 2606 OID 146093)
-- Name: Customers Customers_phone_key98; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key98" UNIQUE (phone);


--
-- TOC entry 5746 (class 2606 OID 146095)
-- Name: Customers Customers_phone_key99; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_phone_key99" UNIQUE (phone);


--
-- TOC entry 5748 (class 2606 OID 16479)
-- Name: Customers Customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_pkey" PRIMARY KEY (id);


--
-- TOC entry 6125 (class 2606 OID 16552)
-- Name: Expenses Expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expenses"
    ADD CONSTRAINT "Expenses_pkey" PRIMARY KEY (id);


--
-- TOC entry 4963 (class 2606 OID 145823)
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 4965 (class 2606 OID 145825)
-- Name: Users Users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key1" UNIQUE (email);


--
-- TOC entry 4967 (class 2606 OID 145883)
-- Name: Users Users_email_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key10" UNIQUE (email);


--
-- TOC entry 4969 (class 2606 OID 145685)
-- Name: Users Users_email_key100; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key100" UNIQUE (email);


--
-- TOC entry 4971 (class 2606 OID 145785)
-- Name: Users Users_email_key101; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key101" UNIQUE (email);


--
-- TOC entry 4973 (class 2606 OID 145687)
-- Name: Users Users_email_key102; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key102" UNIQUE (email);


--
-- TOC entry 4975 (class 2606 OID 145689)
-- Name: Users Users_email_key103; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key103" UNIQUE (email);


--
-- TOC entry 4977 (class 2606 OID 145691)
-- Name: Users Users_email_key104; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key104" UNIQUE (email);


--
-- TOC entry 4979 (class 2606 OID 145783)
-- Name: Users Users_email_key105; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key105" UNIQUE (email);


--
-- TOC entry 4981 (class 2606 OID 145693)
-- Name: Users Users_email_key106; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key106" UNIQUE (email);


--
-- TOC entry 4983 (class 2606 OID 145695)
-- Name: Users Users_email_key107; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key107" UNIQUE (email);


--
-- TOC entry 4985 (class 2606 OID 145781)
-- Name: Users Users_email_key108; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key108" UNIQUE (email);


--
-- TOC entry 4987 (class 2606 OID 145697)
-- Name: Users Users_email_key109; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key109" UNIQUE (email);


--
-- TOC entry 4989 (class 2606 OID 145877)
-- Name: Users Users_email_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key11" UNIQUE (email);


--
-- TOC entry 4991 (class 2606 OID 145779)
-- Name: Users Users_email_key110; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key110" UNIQUE (email);


--
-- TOC entry 4993 (class 2606 OID 145699)
-- Name: Users Users_email_key111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key111" UNIQUE (email);


--
-- TOC entry 4995 (class 2606 OID 145777)
-- Name: Users Users_email_key112; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key112" UNIQUE (email);


--
-- TOC entry 4997 (class 2606 OID 145701)
-- Name: Users Users_email_key113; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key113" UNIQUE (email);


--
-- TOC entry 4999 (class 2606 OID 145703)
-- Name: Users Users_email_key114; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key114" UNIQUE (email);


--
-- TOC entry 5001 (class 2606 OID 145775)
-- Name: Users Users_email_key115; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key115" UNIQUE (email);


--
-- TOC entry 5003 (class 2606 OID 145705)
-- Name: Users Users_email_key116; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key116" UNIQUE (email);


--
-- TOC entry 5005 (class 2606 OID 145707)
-- Name: Users Users_email_key117; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key117" UNIQUE (email);


--
-- TOC entry 5007 (class 2606 OID 145773)
-- Name: Users Users_email_key118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key118" UNIQUE (email);


--
-- TOC entry 5009 (class 2606 OID 145709)
-- Name: Users Users_email_key119; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key119" UNIQUE (email);


--
-- TOC entry 5011 (class 2606 OID 145885)
-- Name: Users Users_email_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key12" UNIQUE (email);


--
-- TOC entry 5013 (class 2606 OID 145711)
-- Name: Users Users_email_key120; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key120" UNIQUE (email);


--
-- TOC entry 5015 (class 2606 OID 145713)
-- Name: Users Users_email_key121; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key121" UNIQUE (email);


--
-- TOC entry 5017 (class 2606 OID 145771)
-- Name: Users Users_email_key122; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key122" UNIQUE (email);


--
-- TOC entry 5019 (class 2606 OID 145769)
-- Name: Users Users_email_key123; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key123" UNIQUE (email);


--
-- TOC entry 5021 (class 2606 OID 145767)
-- Name: Users Users_email_key124; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key124" UNIQUE (email);


--
-- TOC entry 5023 (class 2606 OID 145715)
-- Name: Users Users_email_key125; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key125" UNIQUE (email);


--
-- TOC entry 5025 (class 2606 OID 145765)
-- Name: Users Users_email_key126; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key126" UNIQUE (email);


--
-- TOC entry 5027 (class 2606 OID 145717)
-- Name: Users Users_email_key127; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key127" UNIQUE (email);


--
-- TOC entry 5029 (class 2606 OID 145719)
-- Name: Users Users_email_key128; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key128" UNIQUE (email);


--
-- TOC entry 5031 (class 2606 OID 145721)
-- Name: Users Users_email_key129; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key129" UNIQUE (email);


--
-- TOC entry 5033 (class 2606 OID 145887)
-- Name: Users Users_email_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key13" UNIQUE (email);


--
-- TOC entry 5035 (class 2606 OID 145957)
-- Name: Users Users_email_key130; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key130" UNIQUE (email);


--
-- TOC entry 5037 (class 2606 OID 145959)
-- Name: Users Users_email_key131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key131" UNIQUE (email);


--
-- TOC entry 5039 (class 2606 OID 145763)
-- Name: Users Users_email_key132; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key132" UNIQUE (email);


--
-- TOC entry 5041 (class 2606 OID 145961)
-- Name: Users Users_email_key133; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key133" UNIQUE (email);


--
-- TOC entry 5043 (class 2606 OID 145761)
-- Name: Users Users_email_key134; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key134" UNIQUE (email);


--
-- TOC entry 5045 (class 2606 OID 145963)
-- Name: Users Users_email_key135; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key135" UNIQUE (email);


--
-- TOC entry 5047 (class 2606 OID 145759)
-- Name: Users Users_email_key136; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key136" UNIQUE (email);


--
-- TOC entry 5049 (class 2606 OID 145757)
-- Name: Users Users_email_key137; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key137" UNIQUE (email);


--
-- TOC entry 5051 (class 2606 OID 145755)
-- Name: Users Users_email_key138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key138" UNIQUE (email);


--
-- TOC entry 5053 (class 2606 OID 145753)
-- Name: Users Users_email_key139; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key139" UNIQUE (email);


--
-- TOC entry 5055 (class 2606 OID 145875)
-- Name: Users Users_email_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key14" UNIQUE (email);


--
-- TOC entry 5057 (class 2606 OID 145751)
-- Name: Users Users_email_key140; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key140" UNIQUE (email);


--
-- TOC entry 5059 (class 2606 OID 145749)
-- Name: Users Users_email_key141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key141" UNIQUE (email);


--
-- TOC entry 5061 (class 2606 OID 145747)
-- Name: Users Users_email_key142; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key142" UNIQUE (email);


--
-- TOC entry 5063 (class 2606 OID 145745)
-- Name: Users Users_email_key143; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key143" UNIQUE (email);


--
-- TOC entry 5065 (class 2606 OID 145743)
-- Name: Users Users_email_key144; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key144" UNIQUE (email);


--
-- TOC entry 5067 (class 2606 OID 145741)
-- Name: Users Users_email_key145; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key145" UNIQUE (email);


--
-- TOC entry 5069 (class 2606 OID 145581)
-- Name: Users Users_email_key146; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key146" UNIQUE (email);


--
-- TOC entry 5071 (class 2606 OID 145739)
-- Name: Users Users_email_key147; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key147" UNIQUE (email);


--
-- TOC entry 5073 (class 2606 OID 145583)
-- Name: Users Users_email_key148; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key148" UNIQUE (email);


--
-- TOC entry 5075 (class 2606 OID 145737)
-- Name: Users Users_email_key149; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key149" UNIQUE (email);


--
-- TOC entry 5077 (class 2606 OID 145857)
-- Name: Users Users_email_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key15" UNIQUE (email);


--
-- TOC entry 5079 (class 2606 OID 145585)
-- Name: Users Users_email_key150; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key150" UNIQUE (email);


--
-- TOC entry 5081 (class 2606 OID 145735)
-- Name: Users Users_email_key151; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key151" UNIQUE (email);


--
-- TOC entry 5083 (class 2606 OID 145587)
-- Name: Users Users_email_key152; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key152" UNIQUE (email);


--
-- TOC entry 5085 (class 2606 OID 145729)
-- Name: Users Users_email_key153; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key153" UNIQUE (email);


--
-- TOC entry 5087 (class 2606 OID 145727)
-- Name: Users Users_email_key154; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key154" UNIQUE (email);


--
-- TOC entry 5089 (class 2606 OID 145589)
-- Name: Users Users_email_key155; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key155" UNIQUE (email);


--
-- TOC entry 5091 (class 2606 OID 145725)
-- Name: Users Users_email_key156; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key156" UNIQUE (email);


--
-- TOC entry 5093 (class 2606 OID 145591)
-- Name: Users Users_email_key157; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key157" UNIQUE (email);


--
-- TOC entry 5095 (class 2606 OID 145593)
-- Name: Users Users_email_key158; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key158" UNIQUE (email);


--
-- TOC entry 5097 (class 2606 OID 145723)
-- Name: Users Users_email_key159; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key159" UNIQUE (email);


--
-- TOC entry 5099 (class 2606 OID 145859)
-- Name: Users Users_email_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key16" UNIQUE (email);


--
-- TOC entry 5101 (class 2606 OID 145595)
-- Name: Users Users_email_key160; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key160" UNIQUE (email);


--
-- TOC entry 5103 (class 2606 OID 145597)
-- Name: Users Users_email_key161; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key161" UNIQUE (email);


--
-- TOC entry 5105 (class 2606 OID 145657)
-- Name: Users Users_email_key162; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key162" UNIQUE (email);


--
-- TOC entry 5107 (class 2606 OID 145599)
-- Name: Users Users_email_key163; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key163" UNIQUE (email);


--
-- TOC entry 5109 (class 2606 OID 145655)
-- Name: Users Users_email_key164; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key164" UNIQUE (email);


--
-- TOC entry 5111 (class 2606 OID 145601)
-- Name: Users Users_email_key165; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key165" UNIQUE (email);


--
-- TOC entry 5113 (class 2606 OID 145653)
-- Name: Users Users_email_key166; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key166" UNIQUE (email);


--
-- TOC entry 5115 (class 2606 OID 145651)
-- Name: Users Users_email_key167; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key167" UNIQUE (email);


--
-- TOC entry 5117 (class 2606 OID 145649)
-- Name: Users Users_email_key168; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key168" UNIQUE (email);


--
-- TOC entry 5119 (class 2606 OID 145647)
-- Name: Users Users_email_key169; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key169" UNIQUE (email);


--
-- TOC entry 5121 (class 2606 OID 145873)
-- Name: Users Users_email_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key17" UNIQUE (email);


--
-- TOC entry 5123 (class 2606 OID 145603)
-- Name: Users Users_email_key170; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key170" UNIQUE (email);


--
-- TOC entry 5125 (class 2606 OID 145645)
-- Name: Users Users_email_key171; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key171" UNIQUE (email);


--
-- TOC entry 5127 (class 2606 OID 145643)
-- Name: Users Users_email_key172; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key172" UNIQUE (email);


--
-- TOC entry 5129 (class 2606 OID 145641)
-- Name: Users Users_email_key173; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key173" UNIQUE (email);


--
-- TOC entry 5131 (class 2606 OID 145639)
-- Name: Users Users_email_key174; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key174" UNIQUE (email);


--
-- TOC entry 5133 (class 2606 OID 145605)
-- Name: Users Users_email_key175; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key175" UNIQUE (email);


--
-- TOC entry 5135 (class 2606 OID 145607)
-- Name: Users Users_email_key176; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key176" UNIQUE (email);


--
-- TOC entry 5137 (class 2606 OID 145637)
-- Name: Users Users_email_key177; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key177" UNIQUE (email);


--
-- TOC entry 5139 (class 2606 OID 145609)
-- Name: Users Users_email_key178; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key178" UNIQUE (email);


--
-- TOC entry 5141 (class 2606 OID 145635)
-- Name: Users Users_email_key179; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key179" UNIQUE (email);


--
-- TOC entry 5143 (class 2606 OID 145861)
-- Name: Users Users_email_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key18" UNIQUE (email);


--
-- TOC entry 5145 (class 2606 OID 145633)
-- Name: Users Users_email_key180; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key180" UNIQUE (email);


--
-- TOC entry 5147 (class 2606 OID 145611)
-- Name: Users Users_email_key181; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key181" UNIQUE (email);


--
-- TOC entry 5149 (class 2606 OID 145631)
-- Name: Users Users_email_key182; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key182" UNIQUE (email);


--
-- TOC entry 5151 (class 2606 OID 145629)
-- Name: Users Users_email_key183; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key183" UNIQUE (email);


--
-- TOC entry 5153 (class 2606 OID 145627)
-- Name: Users Users_email_key184; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key184" UNIQUE (email);


--
-- TOC entry 5155 (class 2606 OID 145625)
-- Name: Users Users_email_key185; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key185" UNIQUE (email);


--
-- TOC entry 5157 (class 2606 OID 145613)
-- Name: Users Users_email_key186; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key186" UNIQUE (email);


--
-- TOC entry 5159 (class 2606 OID 145615)
-- Name: Users Users_email_key187; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key187" UNIQUE (email);


--
-- TOC entry 5161 (class 2606 OID 145617)
-- Name: Users Users_email_key188; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key188" UNIQUE (email);


--
-- TOC entry 5163 (class 2606 OID 145623)
-- Name: Users Users_email_key189; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key189" UNIQUE (email);


--
-- TOC entry 5165 (class 2606 OID 145863)
-- Name: Users Users_email_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key19" UNIQUE (email);


--
-- TOC entry 5167 (class 2606 OID 145621)
-- Name: Users Users_email_key190; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key190" UNIQUE (email);


--
-- TOC entry 5169 (class 2606 OID 145619)
-- Name: Users Users_email_key191; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key191" UNIQUE (email);


--
-- TOC entry 5171 (class 2606 OID 145579)
-- Name: Users Users_email_key192; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key192" UNIQUE (email);


--
-- TOC entry 5173 (class 2606 OID 145577)
-- Name: Users Users_email_key193; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key193" UNIQUE (email);


--
-- TOC entry 5175 (class 2606 OID 145965)
-- Name: Users Users_email_key194; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key194" UNIQUE (email);


--
-- TOC entry 5177 (class 2606 OID 145575)
-- Name: Users Users_email_key195; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key195" UNIQUE (email);


--
-- TOC entry 5179 (class 2606 OID 145967)
-- Name: Users Users_email_key196; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key196" UNIQUE (email);


--
-- TOC entry 5181 (class 2606 OID 145969)
-- Name: Users Users_email_key197; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key197" UNIQUE (email);


--
-- TOC entry 5183 (class 2606 OID 145827)
-- Name: Users Users_email_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key2" UNIQUE (email);


--
-- TOC entry 5185 (class 2606 OID 145871)
-- Name: Users Users_email_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key20" UNIQUE (email);


--
-- TOC entry 5187 (class 2606 OID 145865)
-- Name: Users Users_email_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key21" UNIQUE (email);


--
-- TOC entry 5189 (class 2606 OID 145867)
-- Name: Users Users_email_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key22" UNIQUE (email);


--
-- TOC entry 5191 (class 2606 OID 145869)
-- Name: Users Users_email_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key23" UNIQUE (email);


--
-- TOC entry 5193 (class 2606 OID 145855)
-- Name: Users Users_email_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key24" UNIQUE (email);


--
-- TOC entry 5195 (class 2606 OID 145889)
-- Name: Users Users_email_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key25" UNIQUE (email);


--
-- TOC entry 5197 (class 2606 OID 145853)
-- Name: Users Users_email_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key26" UNIQUE (email);


--
-- TOC entry 5199 (class 2606 OID 145891)
-- Name: Users Users_email_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key27" UNIQUE (email);


--
-- TOC entry 5201 (class 2606 OID 145851)
-- Name: Users Users_email_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key28" UNIQUE (email);


--
-- TOC entry 5203 (class 2606 OID 145955)
-- Name: Users Users_email_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key29" UNIQUE (email);


--
-- TOC entry 5205 (class 2606 OID 145829)
-- Name: Users Users_email_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key3" UNIQUE (email);


--
-- TOC entry 5207 (class 2606 OID 145849)
-- Name: Users Users_email_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key30" UNIQUE (email);


--
-- TOC entry 5209 (class 2606 OID 145659)
-- Name: Users Users_email_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key31" UNIQUE (email);


--
-- TOC entry 5211 (class 2606 OID 145661)
-- Name: Users Users_email_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key32" UNIQUE (email);


--
-- TOC entry 5213 (class 2606 OID 145847)
-- Name: Users Users_email_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key33" UNIQUE (email);


--
-- TOC entry 5215 (class 2606 OID 145801)
-- Name: Users Users_email_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key34" UNIQUE (email);


--
-- TOC entry 5217 (class 2606 OID 145803)
-- Name: Users Users_email_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key35" UNIQUE (email);


--
-- TOC entry 5219 (class 2606 OID 145805)
-- Name: Users Users_email_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key36" UNIQUE (email);


--
-- TOC entry 5221 (class 2606 OID 145807)
-- Name: Users Users_email_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key37" UNIQUE (email);


--
-- TOC entry 5223 (class 2606 OID 145809)
-- Name: Users Users_email_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key38" UNIQUE (email);


--
-- TOC entry 5225 (class 2606 OID 145845)
-- Name: Users Users_email_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key39" UNIQUE (email);


--
-- TOC entry 5227 (class 2606 OID 145831)
-- Name: Users Users_email_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key4" UNIQUE (email);


--
-- TOC entry 5229 (class 2606 OID 145811)
-- Name: Users Users_email_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key40" UNIQUE (email);


--
-- TOC entry 5231 (class 2606 OID 145813)
-- Name: Users Users_email_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key41" UNIQUE (email);


--
-- TOC entry 5233 (class 2606 OID 145815)
-- Name: Users Users_email_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key42" UNIQUE (email);


--
-- TOC entry 5235 (class 2606 OID 145843)
-- Name: Users Users_email_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key43" UNIQUE (email);


--
-- TOC entry 5237 (class 2606 OID 145841)
-- Name: Users Users_email_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key44" UNIQUE (email);


--
-- TOC entry 5239 (class 2606 OID 145817)
-- Name: Users Users_email_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key45" UNIQUE (email);


--
-- TOC entry 5241 (class 2606 OID 145839)
-- Name: Users Users_email_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key46" UNIQUE (email);


--
-- TOC entry 5243 (class 2606 OID 145893)
-- Name: Users Users_email_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key47" UNIQUE (email);


--
-- TOC entry 5245 (class 2606 OID 145895)
-- Name: Users Users_email_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key48" UNIQUE (email);


--
-- TOC entry 5247 (class 2606 OID 145837)
-- Name: Users Users_email_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key49" UNIQUE (email);


--
-- TOC entry 5249 (class 2606 OID 145833)
-- Name: Users Users_email_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key5" UNIQUE (email);


--
-- TOC entry 5251 (class 2606 OID 145897)
-- Name: Users Users_email_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key50" UNIQUE (email);


--
-- TOC entry 5253 (class 2606 OID 145835)
-- Name: Users Users_email_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key51" UNIQUE (email);


--
-- TOC entry 5255 (class 2606 OID 145899)
-- Name: Users Users_email_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key52" UNIQUE (email);


--
-- TOC entry 5257 (class 2606 OID 145921)
-- Name: Users Users_email_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key53" UNIQUE (email);


--
-- TOC entry 5259 (class 2606 OID 145821)
-- Name: Users Users_email_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key54" UNIQUE (email);


--
-- TOC entry 5261 (class 2606 OID 145923)
-- Name: Users Users_email_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key55" UNIQUE (email);


--
-- TOC entry 5263 (class 2606 OID 145925)
-- Name: Users Users_email_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key56" UNIQUE (email);


--
-- TOC entry 5265 (class 2606 OID 145819)
-- Name: Users Users_email_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key57" UNIQUE (email);


--
-- TOC entry 5267 (class 2606 OID 145953)
-- Name: Users Users_email_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key58" UNIQUE (email);


--
-- TOC entry 5269 (class 2606 OID 145927)
-- Name: Users Users_email_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key59" UNIQUE (email);


--
-- TOC entry 5271 (class 2606 OID 145881)
-- Name: Users Users_email_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key6" UNIQUE (email);


--
-- TOC entry 5273 (class 2606 OID 145929)
-- Name: Users Users_email_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key60" UNIQUE (email);


--
-- TOC entry 5275 (class 2606 OID 145951)
-- Name: Users Users_email_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key61" UNIQUE (email);


--
-- TOC entry 5277 (class 2606 OID 145931)
-- Name: Users Users_email_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key62" UNIQUE (email);


--
-- TOC entry 5279 (class 2606 OID 145933)
-- Name: Users Users_email_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key63" UNIQUE (email);


--
-- TOC entry 5281 (class 2606 OID 145949)
-- Name: Users Users_email_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key64" UNIQUE (email);


--
-- TOC entry 5283 (class 2606 OID 145935)
-- Name: Users Users_email_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key65" UNIQUE (email);


--
-- TOC entry 5285 (class 2606 OID 145937)
-- Name: Users Users_email_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key66" UNIQUE (email);


--
-- TOC entry 5287 (class 2606 OID 145947)
-- Name: Users Users_email_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key67" UNIQUE (email);


--
-- TOC entry 5289 (class 2606 OID 145945)
-- Name: Users Users_email_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key68" UNIQUE (email);


--
-- TOC entry 5291 (class 2606 OID 145939)
-- Name: Users Users_email_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key69" UNIQUE (email);


--
-- TOC entry 5293 (class 2606 OID 145731)
-- Name: Users Users_email_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key7" UNIQUE (email);


--
-- TOC entry 5295 (class 2606 OID 145941)
-- Name: Users Users_email_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key70" UNIQUE (email);


--
-- TOC entry 5297 (class 2606 OID 145943)
-- Name: Users Users_email_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key71" UNIQUE (email);


--
-- TOC entry 5299 (class 2606 OID 145919)
-- Name: Users Users_email_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key72" UNIQUE (email);


--
-- TOC entry 5301 (class 2606 OID 145917)
-- Name: Users Users_email_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key73" UNIQUE (email);


--
-- TOC entry 5303 (class 2606 OID 145915)
-- Name: Users Users_email_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key74" UNIQUE (email);


--
-- TOC entry 5305 (class 2606 OID 145913)
-- Name: Users Users_email_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key75" UNIQUE (email);


--
-- TOC entry 5307 (class 2606 OID 145901)
-- Name: Users Users_email_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key76" UNIQUE (email);


--
-- TOC entry 5309 (class 2606 OID 145903)
-- Name: Users Users_email_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key77" UNIQUE (email);


--
-- TOC entry 5311 (class 2606 OID 145911)
-- Name: Users Users_email_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key78" UNIQUE (email);


--
-- TOC entry 5313 (class 2606 OID 145905)
-- Name: Users Users_email_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key79" UNIQUE (email);


--
-- TOC entry 5315 (class 2606 OID 145733)
-- Name: Users Users_email_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key8" UNIQUE (email);


--
-- TOC entry 5317 (class 2606 OID 145907)
-- Name: Users Users_email_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key80" UNIQUE (email);


--
-- TOC entry 5319 (class 2606 OID 145909)
-- Name: Users Users_email_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key81" UNIQUE (email);


--
-- TOC entry 5321 (class 2606 OID 145799)
-- Name: Users Users_email_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key82" UNIQUE (email);


--
-- TOC entry 5323 (class 2606 OID 145663)
-- Name: Users Users_email_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key83" UNIQUE (email);


--
-- TOC entry 5325 (class 2606 OID 145665)
-- Name: Users Users_email_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key84" UNIQUE (email);


--
-- TOC entry 5327 (class 2606 OID 145667)
-- Name: Users Users_email_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key85" UNIQUE (email);


--
-- TOC entry 5329 (class 2606 OID 145797)
-- Name: Users Users_email_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key86" UNIQUE (email);


--
-- TOC entry 5331 (class 2606 OID 145669)
-- Name: Users Users_email_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key87" UNIQUE (email);


--
-- TOC entry 5333 (class 2606 OID 145671)
-- Name: Users Users_email_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key88" UNIQUE (email);


--
-- TOC entry 5335 (class 2606 OID 145795)
-- Name: Users Users_email_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key89" UNIQUE (email);


--
-- TOC entry 5337 (class 2606 OID 145879)
-- Name: Users Users_email_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key9" UNIQUE (email);


--
-- TOC entry 5339 (class 2606 OID 145673)
-- Name: Users Users_email_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key90" UNIQUE (email);


--
-- TOC entry 5341 (class 2606 OID 145793)
-- Name: Users Users_email_key91; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key91" UNIQUE (email);


--
-- TOC entry 5343 (class 2606 OID 145675)
-- Name: Users Users_email_key92; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key92" UNIQUE (email);


--
-- TOC entry 5345 (class 2606 OID 145677)
-- Name: Users Users_email_key93; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key93" UNIQUE (email);


--
-- TOC entry 5347 (class 2606 OID 145791)
-- Name: Users Users_email_key94; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key94" UNIQUE (email);


--
-- TOC entry 5349 (class 2606 OID 145679)
-- Name: Users Users_email_key95; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key95" UNIQUE (email);


--
-- TOC entry 5351 (class 2606 OID 145789)
-- Name: Users Users_email_key96; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key96" UNIQUE (email);


--
-- TOC entry 5353 (class 2606 OID 145681)
-- Name: Users Users_email_key97; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key97" UNIQUE (email);


--
-- TOC entry 5355 (class 2606 OID 145683)
-- Name: Users Users_email_key98; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key98" UNIQUE (email);


--
-- TOC entry 5357 (class 2606 OID 145787)
-- Name: Users Users_email_key99; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key99" UNIQUE (email);


--
-- TOC entry 5359 (class 2606 OID 16408)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 5752 (class 2606 OID 16506)
-- Name: Visits Visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visits"
    ADD CONSTRAINT "Visits_pkey" PRIMARY KEY (id);


--
-- TOC entry 5366 (class 2606 OID 16456)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5364 (class 2606 OID 16443)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5757 (class 2606 OID 16528)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 5759 (class 2606 OID 146600)
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- TOC entry 5761 (class 2606 OID 146602)
-- Name: products products_sku_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key1 UNIQUE (sku);


--
-- TOC entry 5763 (class 2606 OID 146616)
-- Name: products products_sku_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key10 UNIQUE (sku);


--
-- TOC entry 5765 (class 2606 OID 146566)
-- Name: products products_sku_key100; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key100 UNIQUE (sku);


--
-- TOC entry 5767 (class 2606 OID 146568)
-- Name: products products_sku_key101; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key101 UNIQUE (sku);


--
-- TOC entry 5769 (class 2606 OID 146570)
-- Name: products products_sku_key102; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key102 UNIQUE (sku);


--
-- TOC entry 5771 (class 2606 OID 146710)
-- Name: products products_sku_key103; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key103 UNIQUE (sku);


--
-- TOC entry 5773 (class 2606 OID 146572)
-- Name: products products_sku_key104; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key104 UNIQUE (sku);


--
-- TOC entry 5775 (class 2606 OID 146708)
-- Name: products products_sku_key105; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key105 UNIQUE (sku);


--
-- TOC entry 5777 (class 2606 OID 146574)
-- Name: products products_sku_key106; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key106 UNIQUE (sku);


--
-- TOC entry 5779 (class 2606 OID 146576)
-- Name: products products_sku_key107; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key107 UNIQUE (sku);


--
-- TOC entry 5781 (class 2606 OID 146582)
-- Name: products products_sku_key108; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key108 UNIQUE (sku);


--
-- TOC entry 5783 (class 2606 OID 146578)
-- Name: products products_sku_key109; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key109 UNIQUE (sku);


--
-- TOC entry 5785 (class 2606 OID 146630)
-- Name: products products_sku_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key11 UNIQUE (sku);


--
-- TOC entry 5787 (class 2606 OID 146580)
-- Name: products products_sku_key110; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key110 UNIQUE (sku);


--
-- TOC entry 5789 (class 2606 OID 146662)
-- Name: products products_sku_key111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key111 UNIQUE (sku);


--
-- TOC entry 5791 (class 2606 OID 146422)
-- Name: products products_sku_key112; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key112 UNIQUE (sku);


--
-- TOC entry 5793 (class 2606 OID 146420)
-- Name: products products_sku_key113; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key113 UNIQUE (sku);


--
-- TOC entry 5795 (class 2606 OID 146480)
-- Name: products products_sku_key114; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key114 UNIQUE (sku);


--
-- TOC entry 5797 (class 2606 OID 146418)
-- Name: products products_sku_key115; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key115 UNIQUE (sku);


--
-- TOC entry 5799 (class 2606 OID 146482)
-- Name: products products_sku_key116; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key116 UNIQUE (sku);


--
-- TOC entry 5801 (class 2606 OID 146416)
-- Name: products products_sku_key117; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key117 UNIQUE (sku);


--
-- TOC entry 5803 (class 2606 OID 146484)
-- Name: products products_sku_key118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key118 UNIQUE (sku);


--
-- TOC entry 5805 (class 2606 OID 146486)
-- Name: products products_sku_key119; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key119 UNIQUE (sku);


--
-- TOC entry 5807 (class 2606 OID 146618)
-- Name: products products_sku_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key12 UNIQUE (sku);


--
-- TOC entry 5809 (class 2606 OID 146488)
-- Name: products products_sku_key120; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key120 UNIQUE (sku);


--
-- TOC entry 5811 (class 2606 OID 146490)
-- Name: products products_sku_key121; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key121 UNIQUE (sku);


--
-- TOC entry 5813 (class 2606 OID 146524)
-- Name: products products_sku_key122; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key122 UNIQUE (sku);


--
-- TOC entry 5815 (class 2606 OID 146492)
-- Name: products products_sku_key123; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key123 UNIQUE (sku);


--
-- TOC entry 5817 (class 2606 OID 146522)
-- Name: products products_sku_key124; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key124 UNIQUE (sku);


--
-- TOC entry 5819 (class 2606 OID 146494)
-- Name: products products_sku_key125; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key125 UNIQUE (sku);


--
-- TOC entry 5821 (class 2606 OID 146520)
-- Name: products products_sku_key126; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key126 UNIQUE (sku);


--
-- TOC entry 5823 (class 2606 OID 146496)
-- Name: products products_sku_key127; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key127 UNIQUE (sku);


--
-- TOC entry 5825 (class 2606 OID 146518)
-- Name: products products_sku_key128; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key128 UNIQUE (sku);


--
-- TOC entry 5827 (class 2606 OID 146498)
-- Name: products products_sku_key129; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key129 UNIQUE (sku);


--
-- TOC entry 5829 (class 2606 OID 146620)
-- Name: products products_sku_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key13 UNIQUE (sku);


--
-- TOC entry 5831 (class 2606 OID 146516)
-- Name: products products_sku_key130; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key130 UNIQUE (sku);


--
-- TOC entry 5833 (class 2606 OID 146500)
-- Name: products products_sku_key131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key131 UNIQUE (sku);


--
-- TOC entry 5835 (class 2606 OID 146514)
-- Name: products products_sku_key132; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key132 UNIQUE (sku);


--
-- TOC entry 5837 (class 2606 OID 146502)
-- Name: products products_sku_key133; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key133 UNIQUE (sku);


--
-- TOC entry 5839 (class 2606 OID 146512)
-- Name: products products_sku_key134; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key134 UNIQUE (sku);


--
-- TOC entry 5841 (class 2606 OID 146510)
-- Name: products products_sku_key135; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key135 UNIQUE (sku);


--
-- TOC entry 5843 (class 2606 OID 146504)
-- Name: products products_sku_key136; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key136 UNIQUE (sku);


--
-- TOC entry 5845 (class 2606 OID 146508)
-- Name: products products_sku_key137; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key137 UNIQUE (sku);


--
-- TOC entry 5847 (class 2606 OID 146506)
-- Name: products products_sku_key138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key138 UNIQUE (sku);


--
-- TOC entry 5849 (class 2606 OID 146456)
-- Name: products products_sku_key139; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key139 UNIQUE (sku);


--
-- TOC entry 5851 (class 2606 OID 146628)
-- Name: products products_sku_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key14 UNIQUE (sku);


--
-- TOC entry 5853 (class 2606 OID 146458)
-- Name: products products_sku_key140; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key140 UNIQUE (sku);


--
-- TOC entry 5855 (class 2606 OID 146470)
-- Name: products products_sku_key141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key141 UNIQUE (sku);


--
-- TOC entry 5857 (class 2606 OID 146460)
-- Name: products products_sku_key142; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key142 UNIQUE (sku);


--
-- TOC entry 5859 (class 2606 OID 146462)
-- Name: products products_sku_key143; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key143 UNIQUE (sku);


--
-- TOC entry 5861 (class 2606 OID 146468)
-- Name: products products_sku_key144; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key144 UNIQUE (sku);


--
-- TOC entry 5863 (class 2606 OID 146464)
-- Name: products products_sku_key145; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key145 UNIQUE (sku);


--
-- TOC entry 5865 (class 2606 OID 146466)
-- Name: products products_sku_key146; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key146 UNIQUE (sku);


--
-- TOC entry 5867 (class 2606 OID 146436)
-- Name: products products_sku_key147; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key147 UNIQUE (sku);


--
-- TOC entry 5869 (class 2606 OID 146438)
-- Name: products products_sku_key148; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key148 UNIQUE (sku);


--
-- TOC entry 5871 (class 2606 OID 146448)
-- Name: products products_sku_key149; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key149 UNIQUE (sku);


--
-- TOC entry 5873 (class 2606 OID 146622)
-- Name: products products_sku_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key15 UNIQUE (sku);


--
-- TOC entry 5875 (class 2606 OID 146440)
-- Name: products products_sku_key150; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key150 UNIQUE (sku);


--
-- TOC entry 5877 (class 2606 OID 146446)
-- Name: products products_sku_key151; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key151 UNIQUE (sku);


--
-- TOC entry 5879 (class 2606 OID 146444)
-- Name: products products_sku_key152; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key152 UNIQUE (sku);


--
-- TOC entry 5881 (class 2606 OID 146442)
-- Name: products products_sku_key153; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key153 UNIQUE (sku);


--
-- TOC entry 5883 (class 2606 OID 146722)
-- Name: products products_sku_key154; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key154 UNIQUE (sku);


--
-- TOC entry 5885 (class 2606 OID 146412)
-- Name: products products_sku_key155; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key155 UNIQUE (sku);


--
-- TOC entry 5887 (class 2606 OID 146724)
-- Name: products products_sku_key156; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key156 UNIQUE (sku);


--
-- TOC entry 5889 (class 2606 OID 146726)
-- Name: products products_sku_key157; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key157 UNIQUE (sku);


--
-- TOC entry 5891 (class 2606 OID 146410)
-- Name: products products_sku_key158; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key158 UNIQUE (sku);


--
-- TOC entry 5893 (class 2606 OID 146728)
-- Name: products products_sku_key159; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key159 UNIQUE (sku);


--
-- TOC entry 5895 (class 2606 OID 146546)
-- Name: products products_sku_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key16 UNIQUE (sku);


--
-- TOC entry 5897 (class 2606 OID 146408)
-- Name: products products_sku_key160; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key160 UNIQUE (sku);


--
-- TOC entry 5899 (class 2606 OID 146730)
-- Name: products products_sku_key161; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key161 UNIQUE (sku);


--
-- TOC entry 5901 (class 2606 OID 146732)
-- Name: products products_sku_key162; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key162 UNIQUE (sku);


--
-- TOC entry 5903 (class 2606 OID 146734)
-- Name: products products_sku_key163; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key163 UNIQUE (sku);


--
-- TOC entry 5905 (class 2606 OID 146406)
-- Name: products products_sku_key164; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key164 UNIQUE (sku);


--
-- TOC entry 5907 (class 2606 OID 146736)
-- Name: products products_sku_key165; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key165 UNIQUE (sku);


--
-- TOC entry 5909 (class 2606 OID 146404)
-- Name: products products_sku_key166; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key166 UNIQUE (sku);


--
-- TOC entry 5911 (class 2606 OID 146738)
-- Name: products products_sku_key167; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key167 UNIQUE (sku);


--
-- TOC entry 5913 (class 2606 OID 146740)
-- Name: products products_sku_key168; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key168 UNIQUE (sku);


--
-- TOC entry 5915 (class 2606 OID 146402)
-- Name: products products_sku_key169; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key169 UNIQUE (sku);


--
-- TOC entry 5917 (class 2606 OID 146626)
-- Name: products products_sku_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key17 UNIQUE (sku);


--
-- TOC entry 5919 (class 2606 OID 146742)
-- Name: products products_sku_key170; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key170 UNIQUE (sku);


--
-- TOC entry 5921 (class 2606 OID 146400)
-- Name: products products_sku_key171; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key171 UNIQUE (sku);


--
-- TOC entry 5923 (class 2606 OID 146744)
-- Name: products products_sku_key172; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key172 UNIQUE (sku);


--
-- TOC entry 5925 (class 2606 OID 146746)
-- Name: products products_sku_key173; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key173 UNIQUE (sku);


--
-- TOC entry 5927 (class 2606 OID 146748)
-- Name: products products_sku_key174; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key174 UNIQUE (sku);


--
-- TOC entry 5929 (class 2606 OID 146398)
-- Name: products products_sku_key175; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key175 UNIQUE (sku);


--
-- TOC entry 5931 (class 2606 OID 146750)
-- Name: products products_sku_key176; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key176 UNIQUE (sku);


--
-- TOC entry 5933 (class 2606 OID 146752)
-- Name: products products_sku_key177; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key177 UNIQUE (sku);


--
-- TOC entry 5935 (class 2606 OID 146396)
-- Name: products products_sku_key178; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key178 UNIQUE (sku);


--
-- TOC entry 5937 (class 2606 OID 146754)
-- Name: products products_sku_key179; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key179 UNIQUE (sku);


--
-- TOC entry 5939 (class 2606 OID 146548)
-- Name: products products_sku_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key18 UNIQUE (sku);


--
-- TOC entry 5941 (class 2606 OID 146756)
-- Name: products products_sku_key180; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key180 UNIQUE (sku);


--
-- TOC entry 5943 (class 2606 OID 146394)
-- Name: products products_sku_key181; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key181 UNIQUE (sku);


--
-- TOC entry 5945 (class 2606 OID 146758)
-- Name: products products_sku_key182; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key182 UNIQUE (sku);


--
-- TOC entry 5947 (class 2606 OID 146660)
-- Name: products products_sku_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key19 UNIQUE (sku);


--
-- TOC entry 5949 (class 2606 OID 146604)
-- Name: products products_sku_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key2 UNIQUE (sku);


--
-- TOC entry 5951 (class 2606 OID 146552)
-- Name: products products_sku_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key20 UNIQUE (sku);


--
-- TOC entry 5953 (class 2606 OID 146664)
-- Name: products products_sku_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key21 UNIQUE (sku);


--
-- TOC entry 5955 (class 2606 OID 146666)
-- Name: products products_sku_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key22 UNIQUE (sku);


--
-- TOC entry 5957 (class 2606 OID 146550)
-- Name: products products_sku_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key23 UNIQUE (sku);


--
-- TOC entry 5959 (class 2606 OID 146428)
-- Name: products products_sku_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key24 UNIQUE (sku);


--
-- TOC entry 5961 (class 2606 OID 146668)
-- Name: products products_sku_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key25 UNIQUE (sku);


--
-- TOC entry 5963 (class 2606 OID 146426)
-- Name: products products_sku_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key26 UNIQUE (sku);


--
-- TOC entry 5965 (class 2606 OID 146670)
-- Name: products products_sku_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key27 UNIQUE (sku);


--
-- TOC entry 5967 (class 2606 OID 146674)
-- Name: products products_sku_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key28 UNIQUE (sku);


--
-- TOC entry 5969 (class 2606 OID 146672)
-- Name: products products_sku_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key29 UNIQUE (sku);


--
-- TOC entry 5971 (class 2606 OID 146606)
-- Name: products products_sku_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key3 UNIQUE (sku);


--
-- TOC entry 5973 (class 2606 OID 146632)
-- Name: products products_sku_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key30 UNIQUE (sku);


--
-- TOC entry 5975 (class 2606 OID 146544)
-- Name: products products_sku_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key31 UNIQUE (sku);


--
-- TOC entry 5977 (class 2606 OID 146634)
-- Name: products products_sku_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key32 UNIQUE (sku);


--
-- TOC entry 5979 (class 2606 OID 146528)
-- Name: products products_sku_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key33 UNIQUE (sku);


--
-- TOC entry 5981 (class 2606 OID 146530)
-- Name: products products_sku_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key34 UNIQUE (sku);


--
-- TOC entry 5983 (class 2606 OID 146532)
-- Name: products products_sku_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key35 UNIQUE (sku);


--
-- TOC entry 5985 (class 2606 OID 146542)
-- Name: products products_sku_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key36 UNIQUE (sku);


--
-- TOC entry 5987 (class 2606 OID 146534)
-- Name: products products_sku_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key37 UNIQUE (sku);


--
-- TOC entry 5989 (class 2606 OID 146536)
-- Name: products products_sku_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key38 UNIQUE (sku);


--
-- TOC entry 5991 (class 2606 OID 146538)
-- Name: products products_sku_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key39 UNIQUE (sku);


--
-- TOC entry 5993 (class 2606 OID 146608)
-- Name: products products_sku_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key4 UNIQUE (sku);


--
-- TOC entry 5995 (class 2606 OID 146540)
-- Name: products products_sku_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key40 UNIQUE (sku);


--
-- TOC entry 5997 (class 2606 OID 146598)
-- Name: products products_sku_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key41 UNIQUE (sku);


--
-- TOC entry 5999 (class 2606 OID 146558)
-- Name: products products_sku_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key42 UNIQUE (sku);


--
-- TOC entry 6001 (class 2606 OID 146584)
-- Name: products products_sku_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key43 UNIQUE (sku);


--
-- TOC entry 6003 (class 2606 OID 146586)
-- Name: products products_sku_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key44 UNIQUE (sku);


--
-- TOC entry 6005 (class 2606 OID 146596)
-- Name: products products_sku_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key45 UNIQUE (sku);


--
-- TOC entry 6007 (class 2606 OID 146588)
-- Name: products products_sku_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key46 UNIQUE (sku);


--
-- TOC entry 6009 (class 2606 OID 146594)
-- Name: products products_sku_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key47 UNIQUE (sku);


--
-- TOC entry 6011 (class 2606 OID 146592)
-- Name: products products_sku_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key48 UNIQUE (sku);


--
-- TOC entry 6013 (class 2606 OID 146636)
-- Name: products products_sku_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key49 UNIQUE (sku);


--
-- TOC entry 6015 (class 2606 OID 146610)
-- Name: products products_sku_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key5 UNIQUE (sku);


--
-- TOC entry 6017 (class 2606 OID 146526)
-- Name: products products_sku_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key50 UNIQUE (sku);


--
-- TOC entry 6019 (class 2606 OID 146638)
-- Name: products products_sku_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key51 UNIQUE (sku);


--
-- TOC entry 6021 (class 2606 OID 146450)
-- Name: products products_sku_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key52 UNIQUE (sku);


--
-- TOC entry 6023 (class 2606 OID 146434)
-- Name: products products_sku_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key53 UNIQUE (sku);


--
-- TOC entry 6025 (class 2606 OID 146640)
-- Name: products products_sku_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key54 UNIQUE (sku);


--
-- TOC entry 6027 (class 2606 OID 146642)
-- Name: products products_sku_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key55 UNIQUE (sku);


--
-- TOC entry 6029 (class 2606 OID 146432)
-- Name: products products_sku_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key56 UNIQUE (sku);


--
-- TOC entry 6031 (class 2606 OID 146624)
-- Name: products products_sku_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key57 UNIQUE (sku);


--
-- TOC entry 6033 (class 2606 OID 146644)
-- Name: products products_sku_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key58 UNIQUE (sku);


--
-- TOC entry 6035 (class 2606 OID 146646)
-- Name: products products_sku_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key59 UNIQUE (sku);


--
-- TOC entry 6037 (class 2606 OID 146556)
-- Name: products products_sku_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key6 UNIQUE (sku);


--
-- TOC entry 6039 (class 2606 OID 146430)
-- Name: products products_sku_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key60 UNIQUE (sku);


--
-- TOC entry 6041 (class 2606 OID 146648)
-- Name: products products_sku_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key61 UNIQUE (sku);


--
-- TOC entry 6043 (class 2606 OID 146650)
-- Name: products products_sku_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key62 UNIQUE (sku);


--
-- TOC entry 6045 (class 2606 OID 146652)
-- Name: products products_sku_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key63 UNIQUE (sku);


--
-- TOC entry 6047 (class 2606 OID 146658)
-- Name: products products_sku_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key64 UNIQUE (sku);


--
-- TOC entry 6049 (class 2606 OID 146654)
-- Name: products products_sku_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key65 UNIQUE (sku);


--
-- TOC entry 6051 (class 2606 OID 146656)
-- Name: products products_sku_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key66 UNIQUE (sku);


--
-- TOC entry 6053 (class 2606 OID 146676)
-- Name: products products_sku_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key67 UNIQUE (sku);


--
-- TOC entry 6055 (class 2606 OID 146424)
-- Name: products products_sku_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key68 UNIQUE (sku);


--
-- TOC entry 6057 (class 2606 OID 146678)
-- Name: products products_sku_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key69 UNIQUE (sku);


--
-- TOC entry 6059 (class 2606 OID 146612)
-- Name: products products_sku_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key7 UNIQUE (sku);


--
-- TOC entry 6061 (class 2606 OID 146478)
-- Name: products products_sku_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key70 UNIQUE (sku);


--
-- TOC entry 6063 (class 2606 OID 146680)
-- Name: products products_sku_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key71 UNIQUE (sku);


--
-- TOC entry 6065 (class 2606 OID 146682)
-- Name: products products_sku_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key72 UNIQUE (sku);


--
-- TOC entry 6067 (class 2606 OID 146684)
-- Name: products products_sku_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key73 UNIQUE (sku);


--
-- TOC entry 6069 (class 2606 OID 146476)
-- Name: products products_sku_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key74 UNIQUE (sku);


--
-- TOC entry 6071 (class 2606 OID 146686)
-- Name: products products_sku_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key75 UNIQUE (sku);


--
-- TOC entry 6073 (class 2606 OID 146688)
-- Name: products products_sku_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key76 UNIQUE (sku);


--
-- TOC entry 6075 (class 2606 OID 146474)
-- Name: products products_sku_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key77 UNIQUE (sku);


--
-- TOC entry 6077 (class 2606 OID 146472)
-- Name: products products_sku_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key78 UNIQUE (sku);


--
-- TOC entry 6079 (class 2606 OID 146690)
-- Name: products products_sku_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key79 UNIQUE (sku);


--
-- TOC entry 6081 (class 2606 OID 146614)
-- Name: products products_sku_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key8 UNIQUE (sku);


--
-- TOC entry 6083 (class 2606 OID 146454)
-- Name: products products_sku_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key80 UNIQUE (sku);


--
-- TOC entry 6085 (class 2606 OID 146692)
-- Name: products products_sku_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key81 UNIQUE (sku);


--
-- TOC entry 6087 (class 2606 OID 146694)
-- Name: products products_sku_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key82 UNIQUE (sku);


--
-- TOC entry 6089 (class 2606 OID 146696)
-- Name: products products_sku_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key83 UNIQUE (sku);


--
-- TOC entry 6091 (class 2606 OID 146452)
-- Name: products products_sku_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key84 UNIQUE (sku);


--
-- TOC entry 6093 (class 2606 OID 146698)
-- Name: products products_sku_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key85 UNIQUE (sku);


--
-- TOC entry 6095 (class 2606 OID 146414)
-- Name: products products_sku_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key86 UNIQUE (sku);


--
-- TOC entry 6097 (class 2606 OID 146700)
-- Name: products products_sku_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key87 UNIQUE (sku);


--
-- TOC entry 6099 (class 2606 OID 146702)
-- Name: products products_sku_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key88 UNIQUE (sku);


--
-- TOC entry 6101 (class 2606 OID 146720)
-- Name: products products_sku_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key89 UNIQUE (sku);


--
-- TOC entry 6103 (class 2606 OID 146554)
-- Name: products products_sku_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key9 UNIQUE (sku);


--
-- TOC entry 6105 (class 2606 OID 146704)
-- Name: products products_sku_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key90 UNIQUE (sku);


--
-- TOC entry 6107 (class 2606 OID 146718)
-- Name: products products_sku_key91; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key91 UNIQUE (sku);


--
-- TOC entry 6109 (class 2606 OID 146590)
-- Name: products products_sku_key92; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key92 UNIQUE (sku);


--
-- TOC entry 6111 (class 2606 OID 146706)
-- Name: products products_sku_key93; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key93 UNIQUE (sku);


--
-- TOC entry 6113 (class 2606 OID 146716)
-- Name: products products_sku_key94; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key94 UNIQUE (sku);


--
-- TOC entry 6115 (class 2606 OID 146560)
-- Name: products products_sku_key95; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key95 UNIQUE (sku);


--
-- TOC entry 6117 (class 2606 OID 146714)
-- Name: products products_sku_key96; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key96 UNIQUE (sku);


--
-- TOC entry 6119 (class 2606 OID 146562)
-- Name: products products_sku_key97; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key97 UNIQUE (sku);


--
-- TOC entry 6121 (class 2606 OID 146712)
-- Name: products products_sku_key98; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key98 UNIQUE (sku);


--
-- TOC entry 6123 (class 2606 OID 146564)
-- Name: products products_sku_key99; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key99 UNIQUE (sku);


--
-- TOC entry 6134 (class 2606 OID 16593)
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- TOC entry 5362 (class 1259 OID 145976)
-- Name: attendances_user_id_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attendances_user_id_date ON public."Attendances" USING btree ("userId", date);


--
-- TOC entry 6130 (class 1259 OID 146811)
-- Name: collections_collected_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX collections_collected_at ON public."Collections" USING btree ("collectedAt");


--
-- TOC entry 6131 (class 1259 OID 146814)
-- Name: collections_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX collections_status ON public."Collections" USING btree (status);


--
-- TOC entry 6132 (class 1259 OID 146810)
-- Name: collections_user_id_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX collections_user_id_order_id ON public."Collections" USING btree ("userId", "orderId");


--
-- TOC entry 5749 (class 1259 OID 19053)
-- Name: customers_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_assigned_to ON public."Customers" USING btree ("assignedTo");


--
-- TOC entry 5750 (class 1259 OID 146370)
-- Name: customers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_status ON public."Customers" USING btree (status);


--
-- TOC entry 6126 (class 1259 OID 146806)
-- Name: expenses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX expenses_status ON public."Expenses" USING btree (status);


--
-- TOC entry 6127 (class 1259 OID 19115)
-- Name: expenses_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX expenses_user_id ON public."Expenses" USING btree ("userId");


--
-- TOC entry 5753 (class 1259 OID 19061)
-- Name: visits_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX visits_customer_id ON public."Visits" USING btree ("customerId");


--
-- TOC entry 5754 (class 1259 OID 146791)
-- Name: visits_planned_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX visits_planned_at ON public."Visits" USING btree ("plannedAt");


--
-- TOC entry 5755 (class 1259 OID 19059)
-- Name: visits_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX visits_user_id ON public."Visits" USING btree ("userId");


--
-- TOC entry 6139 (class 2606 OID 146363)
-- Name: Customers Customers_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 6142 (class 2606 OID 146797)
-- Name: Expenses Expenses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expenses"
    ADD CONSTRAINT "Expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE;


--
-- TOC entry 6140 (class 2606 OID 146786)
-- Name: Visits Visits_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visits"
    ADD CONSTRAINT "Visits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customers"(id) ON UPDATE CASCADE;


--
-- TOC entry 6141 (class 2606 OID 146781)
-- Name: Visits Visits_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visits"
    ADD CONSTRAINT "Visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE;


--
-- TOC entry 6137 (class 2606 OID 146766)
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 6138 (class 2606 OID 146771)
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE;


--
-- TOC entry 6135 (class 2606 OID 146378)
-- Name: orders orders_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customers"(id) ON UPDATE CASCADE;


--
-- TOC entry 6136 (class 2606 OID 146373)
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE;


--
-- TOC entry 6143 (class 2606 OID 146822)
-- Name: routes routes_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT "routes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customers"(id) ON UPDATE CASCADE;


--
-- TOC entry 6144 (class 2606 OID 146817)
-- Name: routes routes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT "routes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE;


-- Completed on 2026-01-29 16:18:43

--
-- PostgreSQL database dump complete
--

\unrestrict jXXVnOre8GqInbDwqpwcsaxnaC1Uxba1EAcON5ahUykpqwPUtPbRsCevZdkTxfm

