--
-- PostgreSQL database dump
--

\restrict 390fhVTcNWWg1g0lD6amc90VRCZLvqr3phrDzLXx5r7deZcpN0t8aobIhcKrQ3c

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Attendance_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Attendance_status_enum" AS ENUM (
    'PRESENT',
    'ABSENT',
    'SICK',
    'LEAVE',
    'PERMISSION'
);


ALTER TYPE public."Attendance_status_enum" OWNER TO postgres;

--
-- Name: Employee_employment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Employee_employment_status_enum" AS ENUM (
    'PERMANENT',
    'CONTRACT',
    'DAILY',
    'INTERN'
);


ALTER TYPE public."Employee_employment_status_enum" OWNER TO postgres;

--
-- Name: Employee_gender_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Employee_gender_enum" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public."Employee_gender_enum" OWNER TO postgres;

--
-- Name: Invoice_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Invoice_status_enum" AS ENUM (
    'DRAFT',
    'SENT',
    'PAID',
    'PARTIAL',
    'CANCELLED'
);


ALTER TYPE public."Invoice_status_enum" OWNER TO postgres;

--
-- Name: Machine_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Machine_status_enum" AS ENUM (
    'ACTIVE',
    'MAINTENANCE',
    'INACTIVE'
);


ALTER TYPE public."Machine_status_enum" OWNER TO postgres;

--
-- Name: Maintenance_maintenance_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Maintenance_maintenance_type_enum" AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE',
    'EMERGENCY'
);


ALTER TYPE public."Maintenance_maintenance_type_enum" OWNER TO postgres;

--
-- Name: Notification_severity_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Notification_severity_enum" AS ENUM (
    'INFO',
    'WARNING',
    'CRITICAL'
);


ALTER TYPE public."Notification_severity_enum" OWNER TO postgres;

--
-- Name: Notification_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Notification_type_enum" AS ENUM (
    'LOW_STOCK',
    'OVERDUE_INVOICE',
    'OVERDUE_MAINTENANCE',
    'SYSTEM'
);


ALTER TYPE public."Notification_type_enum" OWNER TO postgres;

--
-- Name: Payment_payment_method_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Payment_payment_method_enum" AS ENUM (
    'CASH',
    'TRANSFER',
    'CHECK',
    'GIRO'
);


ALTER TYPE public."Payment_payment_method_enum" OWNER TO postgres;

--
-- Name: PurchaseOrder_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PurchaseOrder_status_enum" AS ENUM (
    'DRAFT',
    'APPROVED',
    'SENT',
    'PARTIAL_RECEIVED',
    'RECEIVED',
    'CANCELLED'
);


ALTER TYPE public."PurchaseOrder_status_enum" OWNER TO postgres;

--
-- Name: StockMovement_movement_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StockMovement_movement_type_enum" AS ENUM (
    'IN',
    'OUT',
    'ADJUSTMENT'
);


ALTER TYPE public."StockMovement_movement_type_enum" OWNER TO postgres;

--
-- Name: User_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."User_role_enum" AS ENUM (
    'SUPERUSER',
    'ADMIN',
    'MANAGER',
    'SUPERVISOR',
    'OPERATOR'
);


ALTER TYPE public."User_role_enum" OWNER TO postgres;

--
-- Name: Worksheet_shift_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Worksheet_shift_enum" AS ENUM (
    'SHIFT_1',
    'SHIFT_2',
    'SHIFT_3'
);


ALTER TYPE public."Worksheet_shift_enum" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendance" (
    id integer NOT NULL,
    id_employee integer NOT NULL,
    id_user integer NOT NULL,
    attendance_date date NOT NULL,
    check_in_time time(6) without time zone,
    check_out_time time(6) without time zone,
    status public."Attendance_status_enum" DEFAULT 'PRESENT'::public."Attendance_status_enum" NOT NULL,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Attendance" OWNER TO postgres;

--
-- Name: Attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Attendance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Attendance_id_seq" OWNER TO postgres;

--
-- Name: Attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Attendance_id_seq" OWNED BY public."Attendance".id;


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customer" (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    contact_person character varying(200),
    phone character varying(20),
    email character varying(100),
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- Name: Customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Customer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Customer_id_seq" OWNER TO postgres;

--
-- Name: Customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Customer_id_seq" OWNED BY public."Customer".id;


--
-- Name: DailyExpense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DailyExpense" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    id_user integer NOT NULL,
    id_expense_category integer NOT NULL,
    expense_date date NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text NOT NULL,
    receipt_url character varying(255),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public."DailyExpense" OWNER TO postgres;

--
-- Name: DailyExpense_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DailyExpense_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DailyExpense_id_seq" OWNER TO postgres;

--
-- Name: DailyExpense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DailyExpense_id_seq" OWNED BY public."DailyExpense".id;


--
-- Name: Employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Employee" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    id_user integer,
    employee_code character varying(20) NOT NULL,
    fullname character varying(200) NOT NULL,
    nik character varying(16),
    phone character varying(20),
    email character varying(100),
    address text,
    birth_date date,
    birth_place character varying(100),
    gender public."Employee_gender_enum" NOT NULL,
    religion character varying(50),
    marital_status character varying(50),
    "position" character varying(100) NOT NULL,
    department character varying(100),
    join_date date NOT NULL,
    employment_status public."Employee_employment_status_enum" DEFAULT 'PERMANENT'::public."Employee_employment_status_enum" NOT NULL,
    salary numeric(15,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public."Employee" OWNER TO postgres;

--
-- Name: Employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Employee_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Employee_id_seq" OWNER TO postgres;

--
-- Name: Employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Employee_id_seq" OWNED BY public."Employee".id;


--
-- Name: ExpenseCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ExpenseCategory" (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public."ExpenseCategory" OWNER TO postgres;

--
-- Name: ExpenseCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ExpenseCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ExpenseCategory_id_seq" OWNER TO postgres;

--
-- Name: ExpenseCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ExpenseCategory_id_seq" OWNED BY public."ExpenseCategory".id;


--
-- Name: Factory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Factory" (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    address text,
    phone character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Factory" OWNER TO postgres;

--
-- Name: Factory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Factory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Factory_id_seq" OWNER TO postgres;

--
-- Name: Factory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Factory_id_seq" OWNED BY public."Factory".id;


--
-- Name: GoodsReceipt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GoodsReceipt" (
    id integer NOT NULL,
    id_purchase_order integer NOT NULL,
    id_user integer NOT NULL,
    receipt_number character varying(50) NOT NULL,
    receipt_date date NOT NULL,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."GoodsReceipt" OWNER TO postgres;

--
-- Name: GoodsReceiptItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GoodsReceiptItem" (
    id integer NOT NULL,
    id_goods_receipt integer NOT NULL,
    id_purchase_order_item integer NOT NULL,
    quantity_received numeric(15,2) NOT NULL
);


ALTER TABLE public."GoodsReceiptItem" OWNER TO postgres;

--
-- Name: GoodsReceiptItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."GoodsReceiptItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GoodsReceiptItem_id_seq" OWNER TO postgres;

--
-- Name: GoodsReceiptItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."GoodsReceiptItem_id_seq" OWNED BY public."GoodsReceiptItem".id;


--
-- Name: GoodsReceipt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."GoodsReceipt_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GoodsReceipt_id_seq" OWNER TO postgres;

--
-- Name: GoodsReceipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."GoodsReceipt_id_seq" OWNED BY public."GoodsReceipt".id;


--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    id_customer integer NOT NULL,
    id_user integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    invoice_date date NOT NULL,
    due_date date NOT NULL,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    tax numeric(15,2) DEFAULT 0 NOT NULL,
    discount numeric(15,2) DEFAULT 0 NOT NULL,
    total numeric(15,2) DEFAULT 0 NOT NULL,
    status public."Invoice_status_enum" DEFAULT 'DRAFT'::public."Invoice_status_enum" NOT NULL,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InvoiceItem" (
    id integer NOT NULL,
    id_invoice integer NOT NULL,
    id_product_type integer NOT NULL,
    quantity numeric(15,2) NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    subtotal numeric(15,2) NOT NULL
);


ALTER TABLE public."InvoiceItem" OWNER TO postgres;

--
-- Name: InvoiceItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."InvoiceItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."InvoiceItem_id_seq" OWNER TO postgres;

--
-- Name: InvoiceItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."InvoiceItem_id_seq" OWNED BY public."InvoiceItem".id;


--
-- Name: Invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Invoice_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Invoice_id_seq" OWNER TO postgres;

--
-- Name: Invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Invoice_id_seq" OWNED BY public."Invoice".id;


--
-- Name: Machine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Machine" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    machine_type character varying(100),
    capacity_per_hour numeric(10,2),
    status public."Machine_status_enum" DEFAULT 'ACTIVE'::public."Machine_status_enum" NOT NULL,
    last_maintenance_date date,
    next_maintenance_date date
);


ALTER TABLE public."Machine" OWNER TO postgres;

--
-- Name: Machine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Machine_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Machine_id_seq" OWNER TO postgres;

--
-- Name: Machine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Machine_id_seq" OWNED BY public."Machine".id;


--
-- Name: Maintenance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Maintenance" (
    id integer NOT NULL,
    id_machine integer NOT NULL,
    id_user integer NOT NULL,
    maintenance_type public."Maintenance_maintenance_type_enum" NOT NULL,
    maintenance_date date NOT NULL,
    cost numeric(15,2) DEFAULT 0 NOT NULL,
    description text,
    parts_replaced text,
    next_maintenance_date date,
    status character varying(50),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Maintenance" OWNER TO postgres;

--
-- Name: Maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Maintenance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Maintenance_id_seq" OWNER TO postgres;

--
-- Name: Maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Maintenance_id_seq" OWNED BY public."Maintenance".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    id_user integer NOT NULL,
    type public."Notification_type_enum" NOT NULL,
    severity public."Notification_severity_enum" DEFAULT 'INFO'::public."Notification_severity_enum" NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    reference_type character varying(50),
    reference_id integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notification_id_seq" OWNER TO postgres;

--
-- Name: Notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;


--
-- Name: OutputProduct; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OutputProduct" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OutputProduct" OWNER TO postgres;

--
-- Name: OutputProduct_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OutputProduct_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OutputProduct_id_seq" OWNER TO postgres;

--
-- Name: OutputProduct_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OutputProduct_id_seq" OWNED BY public."OutputProduct".id;


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id integer NOT NULL,
    id_invoice integer NOT NULL,
    id_user integer NOT NULL,
    payment_date date NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method public."Payment_payment_method_enum" NOT NULL,
    reference_number character varying(100),
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: Payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Payment_id_seq" OWNER TO postgres;

--
-- Name: Payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Payment_id_seq" OWNED BY public."Payment".id;


--
-- Name: ProcessCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProcessCategory" (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_main_process boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProcessCategory" OWNER TO postgres;

--
-- Name: ProcessCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProcessCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProcessCategory_id_seq" OWNER TO postgres;

--
-- Name: ProcessCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProcessCategory_id_seq" OWNED BY public."ProcessCategory".id;


--
-- Name: ProductType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductType" (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    unit character varying(20) DEFAULT 'kg'::character varying NOT NULL
);


ALTER TABLE public."ProductType" OWNER TO postgres;

--
-- Name: ProductType_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProductType_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProductType_id_seq" OWNER TO postgres;

--
-- Name: ProductType_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProductType_id_seq" OWNED BY public."ProductType".id;


--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrder" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    id_supplier integer NOT NULL,
    id_user integer NOT NULL,
    po_number character varying(50) NOT NULL,
    order_date date NOT NULL,
    expected_date date,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    tax numeric(15,2) DEFAULT 0 NOT NULL,
    discount numeric(15,2) DEFAULT 0 NOT NULL,
    total numeric(15,2) DEFAULT 0 NOT NULL,
    status public."PurchaseOrder_status_enum" DEFAULT 'DRAFT'::public."PurchaseOrder_status_enum" NOT NULL,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public."PurchaseOrder" OWNER TO postgres;

--
-- Name: PurchaseOrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrderItem" (
    id integer NOT NULL,
    id_purchase_order integer NOT NULL,
    id_product_type integer NOT NULL,
    quantity numeric(15,2) NOT NULL,
    received_quantity numeric(15,2) DEFAULT 0 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    subtotal numeric(15,2) NOT NULL
);


ALTER TABLE public."PurchaseOrderItem" OWNER TO postgres;

--
-- Name: PurchaseOrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PurchaseOrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PurchaseOrderItem_id_seq" OWNER TO postgres;

--
-- Name: PurchaseOrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PurchaseOrderItem_id_seq" OWNED BY public."PurchaseOrderItem".id;


--
-- Name: PurchaseOrder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PurchaseOrder_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PurchaseOrder_id_seq" OWNER TO postgres;

--
-- Name: PurchaseOrder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PurchaseOrder_id_seq" OWNED BY public."PurchaseOrder".id;


--
-- Name: QCGabah; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QCGabah" (
    supplier character varying(255),
    lot character varying(50),
    image_url text NOT NULL,
    green_percentage numeric(5,2) NOT NULL,
    grade character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."QCGabah" OWNER TO postgres;

--
-- Name: QCGabah_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."QCGabah_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."QCGabah_id_seq" OWNER TO postgres;

--
-- Name: QCGabah_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."QCGabah_id_seq" OWNED BY public."QCGabah".id;


--
-- Name: QualityParameter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QualityParameter" (
    name character varying NOT NULL,
    grade character varying NOT NULL,
    min_value numeric(10,2),
    max_value numeric(10,2),
    unit character varying DEFAULT 'percentage'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    id integer NOT NULL,
    id_variety integer
);


ALTER TABLE public."QualityParameter" OWNER TO postgres;

--
-- Name: QualityParameter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."QualityParameter_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."QualityParameter_id_seq" OWNER TO postgres;

--
-- Name: QualityParameter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."QualityParameter_id_seq" OWNED BY public."QualityParameter".id;


--
-- Name: RawMaterialCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RawMaterialCategory" (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RawMaterialCategory" OWNER TO postgres;

--
-- Name: RawMaterialCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RawMaterialCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RawMaterialCategory_id_seq" OWNER TO postgres;

--
-- Name: RawMaterialCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RawMaterialCategory_id_seq" OWNED BY public."RawMaterialCategory".id;


--
-- Name: RawMaterialQualityAnalysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RawMaterialQualityAnalysis" (
    moisture_value numeric(10,2),
    density_value numeric(10,2),
    green_percentage numeric(10,2),
    yellow_percentage numeric(10,2),
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    analysis_date date DEFAULT ('now'::text)::date NOT NULL,
    moisture_grade character varying(20),
    density_grade character varying(20),
    red_percentage numeric(10,2),
    color_grade character varying(20),
    image_url text,
    id integer NOT NULL,
    batch_id character varying(50) NOT NULL,
    id_stock_movement integer,
    final_grade character varying(20)
);


ALTER TABLE public."RawMaterialQualityAnalysis" OWNER TO postgres;

--
-- Name: RawMaterialQualityAnalysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RawMaterialQualityAnalysis_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RawMaterialQualityAnalysis_id_seq" OWNER TO postgres;

--
-- Name: RawMaterialQualityAnalysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RawMaterialQualityAnalysis_id_seq" OWNED BY public."RawMaterialQualityAnalysis".id;


--
-- Name: RawMaterialVariety; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RawMaterialVariety" (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RawMaterialVariety" OWNER TO postgres;

--
-- Name: RawMaterialVariety_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RawMaterialVariety_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RawMaterialVariety_id_seq" OWNER TO postgres;

--
-- Name: RawMaterialVariety_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RawMaterialVariety_id_seq" OWNED BY public."RawMaterialVariety".id;


--
-- Name: Stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Stock" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    id_product_type integer NOT NULL,
    quantity numeric(15,2) DEFAULT 0 NOT NULL,
    unit character varying(20) DEFAULT 'kg'::character varying NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public."Stock" OWNER TO postgres;

--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StockMovement" (
    id integer NOT NULL,
    id_stock integer NOT NULL,
    id_user integer NOT NULL,
    movement_type public."StockMovement_movement_type_enum" NOT NULL,
    quantity numeric(15,2) NOT NULL,
    reference_type character varying(50),
    reference_id bigint,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockMovement" OWNER TO postgres;

--
-- Name: StockMovement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."StockMovement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."StockMovement_id_seq" OWNER TO postgres;

--
-- Name: StockMovement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."StockMovement_id_seq" OWNED BY public."StockMovement".id;


--
-- Name: Stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Stock_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Stock_id_seq" OWNER TO postgres;

--
-- Name: Stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Stock_id_seq" OWNED BY public."Stock".id;


--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supplier" (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    contact_person character varying(200),
    phone character varying(20),
    email character varying(100),
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Supplier" OWNER TO postgres;

--
-- Name: Supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Supplier_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Supplier_id_seq" OWNER TO postgres;

--
-- Name: Supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Supplier_id_seq" OWNED BY public."Supplier".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    fullname character varying(200) NOT NULL,
    role public."User_role_enum" DEFAULT 'OPERATOR'::public."User_role_enum" NOT NULL,
    id_factory integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Worksheet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Worksheet" (
    id integer NOT NULL,
    id_factory integer NOT NULL,
    id_user integer NOT NULL,
    worksheet_date date NOT NULL,
    shift public."Worksheet_shift_enum" NOT NULL,
    gabah_input numeric(15,2) NOT NULL,
    beras_output numeric(15,2) NOT NULL,
    menir_output numeric(15,2) DEFAULT 0 NOT NULL,
    dedak_output numeric(15,2) DEFAULT 0 NOT NULL,
    sekam_output numeric(15,2) DEFAULT 0 NOT NULL,
    rendemen numeric(5,2),
    machine_hours numeric(5,2) DEFAULT 0 NOT NULL,
    downtime_hours numeric(5,2) DEFAULT 0 NOT NULL,
    downtime_reason text,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    id_output_product integer,
    id_machine integer,
    batch_code character varying(50),
    process_step character varying(50),
    production_cost numeric(15,2),
    raw_material_cost numeric(15,2),
    side_product_revenue numeric(15,2),
    hpp numeric(15,2),
    hpp_per_kg numeric(15,2)
);


ALTER TABLE public."Worksheet" OWNER TO postgres;

--
-- Name: WorksheetInputBatch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorksheetInputBatch" (
    id integer NOT NULL,
    id_worksheet integer NOT NULL,
    id_stock integer NOT NULL,
    batch_code character varying(50),
    quantity numeric(15,2) NOT NULL,
    unit_price numeric(15,2),
    total_cost numeric(15,2),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WorksheetInputBatch" OWNER TO postgres;

--
-- Name: WorksheetInputBatch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WorksheetInputBatch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorksheetInputBatch_id_seq" OWNER TO postgres;

--
-- Name: WorksheetInputBatch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WorksheetInputBatch_id_seq" OWNED BY public."WorksheetInputBatch".id;


--
-- Name: WorksheetSideProduct; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorksheetSideProduct" (
    id integer NOT NULL,
    id_worksheet integer NOT NULL,
    product_code character varying(30) NOT NULL,
    product_name character varying(100) NOT NULL,
    quantity numeric(15,2) DEFAULT 0 NOT NULL,
    is_auto_calculated boolean DEFAULT false NOT NULL,
    auto_percentage numeric(10,2),
    unit_price numeric(15,2),
    total_value numeric(15,2),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WorksheetSideProduct" OWNER TO postgres;

--
-- Name: WorksheetSideProduct_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WorksheetSideProduct_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorksheetSideProduct_id_seq" OWNER TO postgres;

--
-- Name: WorksheetSideProduct_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WorksheetSideProduct_id_seq" OWNED BY public."WorksheetSideProduct".id;


--
-- Name: Worksheet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Worksheet_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Worksheet_id_seq" OWNER TO postgres;

--
-- Name: Worksheet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Worksheet_id_seq" OWNED BY public."Worksheet".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: Attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance" ALTER COLUMN id SET DEFAULT nextval('public."Attendance_id_seq"'::regclass);


--
-- Name: Customer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer" ALTER COLUMN id SET DEFAULT nextval('public."Customer_id_seq"'::regclass);


--
-- Name: DailyExpense id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyExpense" ALTER COLUMN id SET DEFAULT nextval('public."DailyExpense_id_seq"'::regclass);


--
-- Name: Employee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee" ALTER COLUMN id SET DEFAULT nextval('public."Employee_id_seq"'::regclass);


--
-- Name: ExpenseCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExpenseCategory" ALTER COLUMN id SET DEFAULT nextval('public."ExpenseCategory_id_seq"'::regclass);


--
-- Name: Factory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Factory" ALTER COLUMN id SET DEFAULT nextval('public."Factory_id_seq"'::regclass);


--
-- Name: GoodsReceipt id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceipt" ALTER COLUMN id SET DEFAULT nextval('public."GoodsReceipt_id_seq"'::regclass);


--
-- Name: GoodsReceiptItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceiptItem" ALTER COLUMN id SET DEFAULT nextval('public."GoodsReceiptItem_id_seq"'::regclass);


--
-- Name: Invoice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice" ALTER COLUMN id SET DEFAULT nextval('public."Invoice_id_seq"'::regclass);


--
-- Name: InvoiceItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem" ALTER COLUMN id SET DEFAULT nextval('public."InvoiceItem_id_seq"'::regclass);


--
-- Name: Machine id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Machine" ALTER COLUMN id SET DEFAULT nextval('public."Machine_id_seq"'::regclass);


--
-- Name: Maintenance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenance" ALTER COLUMN id SET DEFAULT nextval('public."Maintenance_id_seq"'::regclass);


--
-- Name: Notification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);


--
-- Name: OutputProduct id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OutputProduct" ALTER COLUMN id SET DEFAULT nextval('public."OutputProduct_id_seq"'::regclass);


--
-- Name: Payment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN id SET DEFAULT nextval('public."Payment_id_seq"'::regclass);


--
-- Name: ProcessCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProcessCategory" ALTER COLUMN id SET DEFAULT nextval('public."ProcessCategory_id_seq"'::regclass);


--
-- Name: ProductType id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductType" ALTER COLUMN id SET DEFAULT nextval('public."ProductType_id_seq"'::regclass);


--
-- Name: PurchaseOrder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder" ALTER COLUMN id SET DEFAULT nextval('public."PurchaseOrder_id_seq"'::regclass);


--
-- Name: PurchaseOrderItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem" ALTER COLUMN id SET DEFAULT nextval('public."PurchaseOrderItem_id_seq"'::regclass);


--
-- Name: QCGabah id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QCGabah" ALTER COLUMN id SET DEFAULT nextval('public."QCGabah_id_seq"'::regclass);


--
-- Name: QualityParameter id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityParameter" ALTER COLUMN id SET DEFAULT nextval('public."QualityParameter_id_seq"'::regclass);


--
-- Name: RawMaterialCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RawMaterialCategory" ALTER COLUMN id SET DEFAULT nextval('public."RawMaterialCategory_id_seq"'::regclass);


--
-- Name: RawMaterialQualityAnalysis id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RawMaterialQualityAnalysis" ALTER COLUMN id SET DEFAULT nextval('public."RawMaterialQualityAnalysis_id_seq"'::regclass);


--
-- Name: RawMaterialVariety id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RawMaterialVariety" ALTER COLUMN id SET DEFAULT nextval('public."RawMaterialVariety_id_seq"'::regclass);


--
-- Name: Stock id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Stock" ALTER COLUMN id SET DEFAULT nextval('public."Stock_id_seq"'::regclass);


--
-- Name: StockMovement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement" ALTER COLUMN id SET DEFAULT nextval('public."StockMovement_id_seq"'::regclass);


--
-- Name: Supplier id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supplier" ALTER COLUMN id SET DEFAULT nextval('public."Supplier_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: Worksheet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Worksheet" ALTER COLUMN id SET DEFAULT nextval('public."Worksheet_id_seq"'::regclass);


--
-- Name: WorksheetInputBatch id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorksheetInputBatch" ALTER COLUMN id SET DEFAULT nextval('public."WorksheetInputBatch_id_seq"'::regclass);


--
-- Name: WorksheetSideProduct id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorksheetSideProduct" ALTER COLUMN id SET DEFAULT nextval('public."WorksheetSideProduct_id_seq"'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendance" (id, id_employee, id_user, attendance_date, check_in_time, check_out_time, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customer" (id, code, name, contact_person, phone, email, address, is_active, created_at) FROM stdin;
20	CUST-DUMMY-001	Toko Beras Makmur	\N	08111111111	\N	Pasar Induk, Jakarta	t	2026-02-15 05:27:15.521
21	CUST-DUMMY-002	CV Pangan Sejahtera	\N	08222222222	\N	Jl. Gatot Subroto, Jakarta	t	2026-02-15 05:27:15.522
22	CUST-DUMMY-003	Warung Bu Siti	\N	08333333333	\N	Desa Sukamaju, Karawang	t	2026-02-15 05:27:15.522
\.


--
-- Data for Name: DailyExpense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DailyExpense" (id, id_factory, id_user, id_expense_category, expense_date, amount, description, receipt_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Employee" (id, id_factory, id_user, employee_code, fullname, nik, phone, email, address, birth_date, birth_place, gender, religion, marital_status, "position", department, join_date, employment_status, salary, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ExpenseCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ExpenseCategory" (id, code, name, description) FROM stdin;
\.


--
-- Data for Name: Factory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Factory" (id, code, name, address, phone, is_active, created_at) FROM stdin;
2	F001	Pabrik Utama	Alamat Pabrik	000000	t	2026-02-13 16:47:39.072
3	PMD-1	PMD 1	Lokasi PMD 1	08123456789	t	2026-02-14 15:52:52.423
4	PMD-2	PMD 2 - Finishing	Lokasi PMD Pusat	08123456780	t	2026-02-14 15:52:52.532
\.


--
-- Data for Name: GoodsReceipt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GoodsReceipt" (id, id_purchase_order, id_user, receipt_number, receipt_date, notes, created_at) FROM stdin;
13	51	1	GR-DUMMY-3	2026-02-06	[DUMMY] Auto goods receipt	2026-02-15 05:27:15.537
14	54	1	GR-DUMMY-6	2026-01-28	[DUMMY] Auto goods receipt	2026-02-15 05:27:15.541
\.


--
-- Data for Name: GoodsReceiptItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GoodsReceiptItem" (id, id_goods_receipt, id_purchase_order_item, quantity_received) FROM stdin;
13	13	51	12267.00
14	14	54	18284.00
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, id_factory, id_customer, id_user, invoice_number, invoice_date, due_date, subtotal, tax, discount, total, status, notes, created_at, updated_at) FROM stdin;
50	4	21	1	INV-DUMMY-0001	2026-02-13	2026-02-27	10056000.00	1106160.00	0.00	11162160.00	SENT	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.523	2026-02-15 05:27:15.523
51	4	22	1	INV-DUMMY-0002	2026-02-11	2026-02-25	6456000.00	710160.00	0.00	7166160.00	DRAFT	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.524	2026-02-15 05:27:15.524
52	4	20	1	INV-DUMMY-0003	2026-02-09	2026-02-23	17892000.00	1968120.00	0.00	19860120.00	PAID	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.525	2026-02-15 05:27:15.525
53	4	21	1	INV-DUMMY-0004	2026-02-07	2026-02-21	15552000.00	1710720.00	0.00	17262720.00	SENT	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.526	2026-02-15 05:27:15.526
54	4	22	1	INV-DUMMY-0005	2026-02-05	2026-02-19	6456000.00	710160.00	0.00	7166160.00	DRAFT	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.527	2026-02-15 05:27:15.527
55	4	20	1	INV-DUMMY-0006	2026-02-03	2026-02-17	13668000.00	1503480.00	0.00	15171480.00	PAID	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.528	2026-02-15 05:27:15.528
56	4	21	1	INV-DUMMY-0007	2026-02-01	2026-02-15	16248000.00	1787280.00	0.00	18035280.00	SENT	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.53	2026-02-15 05:27:15.53
57	4	22	1	INV-DUMMY-0008	2026-01-30	2026-02-13	17868000.00	1965480.00	0.00	19833480.00	DRAFT	[DUMMY] Auto-generated invoice	2026-02-15 05:27:15.53	2026-02-15 05:27:15.53
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InvoiceItem" (id, id_invoice, id_product_type, quantity, unit_price, subtotal) FROM stdin;
49	50	82	838.00	12000.00	10056000.00
50	51	82	538.00	12000.00	6456000.00
51	52	82	1491.00	12000.00	17892000.00
52	53	82	1296.00	12000.00	15552000.00
53	54	82	538.00	12000.00	6456000.00
54	55	82	1139.00	12000.00	13668000.00
55	56	82	1354.00	12000.00	16248000.00
56	57	82	1489.00	12000.00	17868000.00
\.


--
-- Data for Name: Machine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Machine" (id, id_factory, code, name, machine_type, capacity_per_hour, status, last_maintenance_date, next_maintenance_date) FROM stdin;
13	3	MSN-DRY-01	Dryer A	Dryer	2000.00	ACTIVE	\N	\N
14	3	MSN-HSK-01	Husker A	Husker	2000.00	ACTIVE	\N	\N
15	4	MSN-PLB-01	Polisher Batu A	Polisher	2000.00	ACTIVE	\N	\N
16	4	MSN-PLK-01	Polisher Kebi A	Polisher	2000.00	ACTIVE	\N	\N
17	4	MSN-SRT-01	Sorter A	Sorter	2000.00	ACTIVE	\N	\N
18	4	MSN-GRD-01	Grader A	Grader	2000.00	ACTIVE	\N	\N
\.


--
-- Data for Name: Maintenance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Maintenance" (id, id_machine, id_user, maintenance_type, maintenance_date, cost, description, parts_replaced, next_maintenance_date, status, created_at) FROM stdin;
51	13	1	PREVENTIVE	2026-02-09	422804.00	[DUMMY] Routine maintenance check	\N	\N	COMPLETED	2026-02-15 05:27:15.518
52	13	1	PREVENTIVE	2026-02-14	225249.00	[DUMMY] Routine maintenance check	\N	\N	COMPLETED	2026-02-15 05:27:15.518
53	14	1	PREVENTIVE	2026-02-18	369294.00	[DUMMY] Routine maintenance check	\N	\N	COMPLETED	2026-02-15 05:27:15.519
54	18	1	PREVENTIVE	2026-02-18	337973.00	[DUMMY] Routine maintenance check	\N	\N	COMPLETED	2026-02-15 05:27:15.519
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, id_user, type, severity, title, message, is_read, reference_type, reference_id, created_at) FROM stdin;
22	1	LOW_STOCK	CRITICAL	Stok rendah: Glosor	Stok Glosor di PMD 1 hanya 0 kg (batas: 5.000 kg)	t	Stock	28	2026-02-15 04:32:48.012
23	1	LOW_STOCK	CRITICAL	Stok rendah: Glosor	Stok Glosor di PMD 1 hanya 0 kg (batas: 5.000 kg)	t	Stock	28	2026-02-15 04:32:48.012
24	1	LOW_STOCK	CRITICAL	Stok rendah: Glosor	Stok Glosor di PMD Pusat hanya 0 kg (batas: 5.000 kg)	t	Stock	32	2026-02-15 04:32:48.033
25	1	LOW_STOCK	CRITICAL	Stok rendah: Glosor	Stok Glosor di PMD Pusat hanya 0 kg (batas: 5.000 kg)	t	Stock	32	2026-02-15 04:32:48.035
26	1	LOW_STOCK	CRITICAL	Stok rendah: Gabah Kering Panen	Stok Gabah Kering Panen di PMD 1 hanya -63.519 kg (batas: 5.000 kg)	t	Stock	25	2026-02-15 04:32:48.045
27	1	LOW_STOCK	CRITICAL	Stok rendah: Pecah Kulit	Stok Pecah Kulit di PMD Pusat hanya -51.117 kg (batas: 5.000 kg)	t	Stock	31	2026-02-15 04:32:48.048
28	1	LOW_STOCK	CRITICAL	Stok rendah: Pecah Kulit	Stok Pecah Kulit di PMD Pusat hanya -51.117 kg (batas: 5.000 kg)	t	Stock	31	2026-02-15 04:32:48.048
29	1	LOW_STOCK	WARNING	Stok rendah: Menir	Stok Menir di PMD Pusat hanya 3.306 kg (batas: 5.000 kg)	t	Stock	35	2026-02-15 04:32:48.05
30	1	OVERDUE_INVOICE	WARNING	Invoice jatuh tempo: INV-DUMMY-0008	Invoice INV-DUMMY-0008 untuk Warung Bu Siti telah melewati jatuh tempo 3 hari (Rp 8.671.320)	t	Invoice	33	2026-02-15 04:32:48.063
31	1	OVERDUE_INVOICE	WARNING	Invoice jatuh tempo: INV-DUMMY-0008	Invoice INV-DUMMY-0008 untuk Warung Bu Siti telah melewati jatuh tempo 3 hari (Rp 14.012.640)	f	Invoice	41	2026-02-15 04:55:56.637
32	1	OVERDUE_INVOICE	WARNING	Invoice jatuh tempo: INV-DUMMY-0008	Invoice INV-DUMMY-0008 untuk Warung Bu Siti telah melewati jatuh tempo 3 hari (Rp 14.012.640)	f	Invoice	41	2026-02-15 04:55:56.636
33	1	OVERDUE_INVOICE	WARNING	Invoice jatuh tempo: INV-DUMMY-0008	Invoice INV-DUMMY-0008 untuk Warung Bu Siti telah melewati jatuh tempo 3 hari (Rp 19.833.480)	f	Invoice	57	2026-02-15 05:27:17.881
\.


--
-- Data for Name: OutputProduct; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OutputProduct" (id, id_factory, code, name, description, display_order, is_active, created_at) FROM stdin;
9	3	PK	Pecah Kulit	\N	1	t	2026-02-15 04:32:42.246
10	3	GLO	Glosor	\N	2	t	2026-02-15 04:32:42.256
11	4	BRS-MS	Beras Medium/Super	\N	1	t	2026-02-15 04:32:42.257
12	4	BRS-P	Beras Premium	\N	2	t	2026-02-15 04:32:42.258
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, id_invoice, id_user, payment_date, amount, payment_method, reference_number, notes, created_at) FROM stdin;
13	52	1	2026-02-09	19860120.00	TRANSFER	PAY-DUMMY-3	[DUMMY] Auto payment	2026-02-15 05:27:15.526
14	55	1	2026-02-03	15171480.00	TRANSFER	PAY-DUMMY-6	[DUMMY] Auto payment	2026-02-15 05:27:15.529
\.


--
-- Data for Name: ProcessCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProcessCategory" (id, code, name, description, is_main_process, display_order, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: ProductType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductType" (id, code, name, description, unit) FROM stdin;
77	GKP	Gabah Kering Panen	\N	kg
78	GKG	Gabah Kering Giling	\N	kg
79	PK	Pecah Kulit	\N	kg
80	GLO	Glosor	\N	kg
81	BRS-MS	Beras Medium/Super	\N	kg
82	BRS-P	Beras Premium	\N	kg
83	SKM	Sekam	\N	kg
84	DDK	Dedak	\N	kg
85	MNR	Menir	\N	kg
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrder" (id, id_factory, id_supplier, id_user, po_number, order_date, expected_date, subtotal, tax, discount, total, status, notes, created_at, updated_at) FROM stdin;
49	3	21	1	PO-DUMMY-0001	2026-02-12	2026-02-12	108066000.00	11887260.00	0.00	119953260.00	APPROVED	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.533	2026-02-15 05:27:15.533
50	3	22	1	PO-DUMMY-0002	2026-02-09	2026-02-09	84936000.00	9342960.00	0.00	94278960.00	DRAFT	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.535	2026-02-15 05:27:15.535
51	3	20	1	PO-DUMMY-0003	2026-02-06	2026-02-06	73602000.00	8096220.00	0.00	81698220.00	RECEIVED	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.536	2026-02-15 05:27:15.536
52	3	21	1	PO-DUMMY-0004	2026-02-03	2026-02-03	68112000.00	7492320.00	0.00	75604320.00	APPROVED	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.539	2026-02-15 05:27:15.539
53	3	22	1	PO-DUMMY-0005	2026-01-31	2026-01-31	68964000.00	7586040.00	0.00	76550040.00	DRAFT	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.54	2026-02-15 05:27:15.54
54	3	20	1	PO-DUMMY-0006	2026-01-28	2026-01-28	109704000.00	12067440.00	0.00	121771440.00	RECEIVED	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.541	2026-02-15 05:27:15.541
55	3	21	1	PO-DUMMY-0007	2026-01-25	2026-01-25	106788000.00	11746680.00	0.00	118534680.00	APPROVED	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.542	2026-02-15 05:27:15.542
56	3	22	1	PO-DUMMY-0008	2026-01-22	2026-01-22	67908000.00	7469880.00	0.00	75377880.00	DRAFT	[DUMMY] Auto-generated PO	2026-02-15 05:27:15.543	2026-02-15 05:27:15.543
\.


--
-- Data for Name: PurchaseOrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrderItem" (id, id_purchase_order, id_product_type, quantity, received_quantity, unit_price, subtotal) FROM stdin;
49	49	77	18011.00	0.00	6000.00	108066000.00
50	50	77	14156.00	0.00	6000.00	84936000.00
51	51	77	12267.00	0.00	6000.00	73602000.00
52	52	77	11352.00	0.00	6000.00	68112000.00
53	53	77	11494.00	0.00	6000.00	68964000.00
54	54	77	18284.00	0.00	6000.00	109704000.00
55	55	77	17798.00	0.00	6000.00	106788000.00
56	56	77	11318.00	0.00	6000.00	67908000.00
\.


--
-- Data for Name: QCGabah; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QCGabah" (supplier, lot, image_url, green_percentage, grade, status, created_at, level, id) FROM stdin;
\.


--
-- Data for Name: QualityParameter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QualityParameter" (name, grade, min_value, max_value, unit, is_active, created_at, updated_at, level, id, id_variety) FROM stdin;
GreenPercentage	KW 1	0.00	3.00	percentage	t	2026-02-12 07:03:39.563	2026-02-12 07:03:39.563	1	1	\N
GreenPercentage	KW 1	3.00	5.00	percentage	t	2026-02-12 07:03:39.57	2026-02-12 07:03:39.57	2	2	\N
GreenPercentage	KW 1	5.00	10.00	percentage	t	2026-02-12 07:03:39.572	2026-02-12 07:03:39.572	3	3	\N
GreenPercentage	KW 2	10.00	15.00	percentage	t	2026-02-12 07:03:39.574	2026-02-12 07:03:39.574	1	4	\N
GreenPercentage	KW 2	15.00	20.00	percentage	t	2026-02-12 07:03:39.575	2026-02-12 07:03:39.575	2	5	\N
GreenPercentage	KW 3	20.00	100.00	percentage	t	2026-02-12 07:03:39.576	2026-02-12 07:03:39.576	1	6	\N
Calib_Green_Hue	ALL	25.00	95.00	range	t	2026-02-12 07:03:40.652	2026-02-12 07:03:40.652	1	7	\N
Calib_Green_Sat	ALL	25.00	255.00	range	t	2026-02-12 07:03:40.656	2026-02-12 07:03:40.656	1	8	\N
Calib_Green_Val	ALL	40.00	255.00	range	t	2026-02-12 07:03:40.659	2026-02-12 07:03:40.659	1	9	\N
Calib_Yellow_Hue	ALL	10.00	25.00	range	t	2026-02-12 07:03:40.662	2026-02-12 07:03:40.662	1	10	\N
Calib_Yellow_Sat	ALL	40.00	255.00	range	t	2026-02-12 07:03:40.663	2026-02-12 07:03:40.663	1	11	\N
Calib_Yellow_Val	ALL	40.00	255.00	range	t	2026-02-12 07:03:40.666	2026-02-12 07:03:40.666	1	12	\N
\.


--
-- Data for Name: RawMaterialCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RawMaterialCategory" (id, code, name, description, is_active, created_at) FROM stdin;
6	PADI	Padi/Gabah	\N	t	2026-02-15 04:32:42.26
7	PK	Pecah Kulit	\N	t	2026-02-15 04:32:42.269
\.


--
-- Data for Name: RawMaterialQualityAnalysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RawMaterialQualityAnalysis" (moisture_value, density_value, green_percentage, yellow_percentage, notes, created_at, updated_at, analysis_date, moisture_grade, density_grade, red_percentage, color_grade, image_url, id, batch_id, id_stock_movement, final_grade) FROM stdin;
\.


--
-- Data for Name: RawMaterialVariety; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RawMaterialVariety" (id, code, name, description, is_active, created_at) FROM stdin;
8	IR64	IR 64	\N	t	2026-02-15 04:32:42.277
9	CIHERANG	Ciherang	\N	t	2026-02-15 04:32:42.282
10	INPARI	Inpari 32	\N	t	2026-02-15 04:32:42.284
\.


--
-- Data for Name: Stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Stock" (id, id_factory, id_product_type, quantity, unit, updated_at) FROM stdin;
28	3	80	0.00	kg	2026-02-15 05:27:15.167
32	4	80	0.00	kg	2026-02-15 05:27:15.171
26	3	78	10000.00	kg	2026-02-15 05:27:15.202
25	3	77	-55319.00	kg	2026-02-15 05:27:15.51
27	3	79	62763.00	kg	2026-02-15 05:27:15.511
29	3	83	21066.00	kg	2026-02-15 05:27:15.512
30	3	84	10534.00	kg	2026-02-15 05:27:15.512
31	4	79	-47151.00	kg	2026-02-15 05:27:15.515
33	4	81	39559.00	kg	2026-02-15 05:27:15.515
34	4	82	26042.00	kg	2026-02-15 05:27:15.516
35	4	85	3108.00	kg	2026-02-15 05:27:15.517
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StockMovement" (id, id_stock, id_user, movement_type, quantity, reference_type, reference_id, notes, created_at) FROM stdin;
1053	25	1	IN	50000.00	ADJUSTMENT	25	[DUMMY] Initial Stock GKP	2026-02-15 05:27:15.198
1054	26	1	IN	10000.00	ADJUSTMENT	26	[DUMMY] Initial Stock GKG	2026-02-15 05:27:15.201
1055	31	1	IN	15000.00	ADJUSTMENT	31	[DUMMY] Initial Stock PK	2026-02-15 05:27:15.204
1056	34	1	IN	5000.00	ADJUSTMENT	34	[DUMMY] Initial Stock BRS-P	2026-02-15 05:27:15.206
1057	33	1	IN	8000.00	ADJUSTMENT	33	[DUMMY] Initial Stock BRS-MS	2026-02-15 05:27:15.207
1058	25	1	OUT	5736.00	WORKSHEET	254	[DUMMY] Input GKP	2026-02-09 05:27:15.209
1059	27	1	IN	3412.00	WORKSHEET	254	[DUMMY] Output PK	2026-02-09 05:27:15.209
1060	29	1	IN	1147.00	WORKSHEET	254	[DUMMY] Output Sekam	2026-02-09 05:27:15.209
1061	30	1	IN	574.00	WORKSHEET	254	[DUMMY] Output Dedak	2026-02-09 05:27:15.209
1062	31	1	OUT	3104.00	WORKSHEET	255	[DUMMY] Input PK	2026-02-09 05:27:15.209
1063	33	1	IN	1636.00	WORKSHEET	255	[DUMMY] Output Beras MS	2026-02-09 05:27:15.209
1064	34	1	IN	1091.00	WORKSHEET	255	[DUMMY] Output Beras P	2026-02-09 05:27:15.209
1065	35	1	IN	155.00	WORKSHEET	255	[DUMMY] Output Menir	2026-02-09 05:27:15.209
1066	25	1	OUT	5561.00	WORKSHEET	256	[DUMMY] Input GKP	2026-02-09 05:27:15.209
1067	27	1	IN	3232.00	WORKSHEET	256	[DUMMY] Output PK	2026-02-09 05:27:15.209
1068	29	1	IN	1112.00	WORKSHEET	256	[DUMMY] Output Sekam	2026-02-09 05:27:15.209
1069	30	1	IN	556.00	WORKSHEET	256	[DUMMY] Output Dedak	2026-02-09 05:27:15.209
1070	31	1	OUT	3717.00	WORKSHEET	257	[DUMMY] Input PK	2026-02-09 05:27:15.209
1071	33	1	IN	1849.00	WORKSHEET	257	[DUMMY] Output Beras MS	2026-02-09 05:27:15.209
1072	34	1	IN	1233.00	WORKSHEET	257	[DUMMY] Output Beras P	2026-02-09 05:27:15.209
1073	35	1	IN	186.00	WORKSHEET	257	[DUMMY] Output Menir	2026-02-09 05:27:15.209
1074	25	1	OUT	5395.00	WORKSHEET	258	[DUMMY] Input GKP	2026-02-10 05:27:15.209
1075	27	1	IN	3224.00	WORKSHEET	258	[DUMMY] Output PK	2026-02-10 05:27:15.209
1076	29	1	IN	1079.00	WORKSHEET	258	[DUMMY] Output Sekam	2026-02-10 05:27:15.209
1077	30	1	IN	540.00	WORKSHEET	258	[DUMMY] Output Dedak	2026-02-10 05:27:15.209
1078	31	1	OUT	4351.00	WORKSHEET	259	[DUMMY] Input PK	2026-02-10 05:27:15.209
1079	33	1	IN	2182.00	WORKSHEET	259	[DUMMY] Output Beras MS	2026-02-10 05:27:15.209
1080	34	1	IN	1455.00	WORKSHEET	259	[DUMMY] Output Beras P	2026-02-10 05:27:15.209
1081	35	1	IN	218.00	WORKSHEET	259	[DUMMY] Output Menir	2026-02-10 05:27:15.209
1082	25	1	OUT	5135.00	WORKSHEET	260	[DUMMY] Input GKP	2026-02-10 05:27:15.209
1083	27	1	IN	3163.00	WORKSHEET	260	[DUMMY] Output PK	2026-02-10 05:27:15.209
1084	29	1	IN	1027.00	WORKSHEET	260	[DUMMY] Output Sekam	2026-02-10 05:27:15.209
1085	30	1	IN	514.00	WORKSHEET	260	[DUMMY] Output Dedak	2026-02-10 05:27:15.209
1086	31	1	OUT	3406.00	WORKSHEET	261	[DUMMY] Input PK	2026-02-10 05:27:15.209
1087	33	1	IN	1775.00	WORKSHEET	261	[DUMMY] Output Beras MS	2026-02-10 05:27:15.209
1088	34	1	IN	1184.00	WORKSHEET	261	[DUMMY] Output Beras P	2026-02-10 05:27:15.209
1089	35	1	IN	170.00	WORKSHEET	261	[DUMMY] Output Menir	2026-02-10 05:27:15.209
1090	25	1	OUT	5648.00	WORKSHEET	262	[DUMMY] Input GKP	2026-02-11 05:27:15.209
1091	27	1	IN	3377.00	WORKSHEET	262	[DUMMY] Output PK	2026-02-11 05:27:15.209
1092	29	1	IN	1130.00	WORKSHEET	262	[DUMMY] Output Sekam	2026-02-11 05:27:15.209
1093	30	1	IN	565.00	WORKSHEET	262	[DUMMY] Output Dedak	2026-02-11 05:27:15.209
1094	31	1	OUT	3597.00	WORKSHEET	263	[DUMMY] Input PK	2026-02-11 05:27:15.209
1095	33	1	IN	1873.00	WORKSHEET	263	[DUMMY] Output Beras MS	2026-02-11 05:27:15.209
1096	34	1	IN	1248.00	WORKSHEET	263	[DUMMY] Output Beras P	2026-02-11 05:27:15.209
1097	35	1	IN	180.00	WORKSHEET	263	[DUMMY] Output Menir	2026-02-11 05:27:15.209
1098	25	1	OUT	5056.00	WORKSHEET	264	[DUMMY] Input GKP	2026-02-11 05:27:15.209
1099	27	1	IN	3016.00	WORKSHEET	264	[DUMMY] Output PK	2026-02-11 05:27:15.209
1100	29	1	IN	1011.00	WORKSHEET	264	[DUMMY] Output Sekam	2026-02-11 05:27:15.209
1101	30	1	IN	506.00	WORKSHEET	264	[DUMMY] Output Dedak	2026-02-11 05:27:15.209
1102	31	1	OUT	3028.00	WORKSHEET	265	[DUMMY] Input PK	2026-02-11 05:27:15.209
1103	33	1	IN	1528.00	WORKSHEET	265	[DUMMY] Output Beras MS	2026-02-11 05:27:15.209
1104	34	1	IN	1018.00	WORKSHEET	265	[DUMMY] Output Beras P	2026-02-11 05:27:15.209
1105	35	1	IN	151.00	WORKSHEET	265	[DUMMY] Output Menir	2026-02-11 05:27:15.209
1106	25	1	OUT	5489.00	WORKSHEET	266	[DUMMY] Input GKP	2026-02-12 05:27:15.209
1107	27	1	IN	3351.00	WORKSHEET	266	[DUMMY] Output PK	2026-02-12 05:27:15.209
1108	29	1	IN	1098.00	WORKSHEET	266	[DUMMY] Output Sekam	2026-02-12 05:27:15.209
1109	30	1	IN	549.00	WORKSHEET	266	[DUMMY] Output Dedak	2026-02-12 05:27:15.209
1110	31	1	OUT	3976.00	WORKSHEET	267	[DUMMY] Input PK	2026-02-12 05:27:15.209
1111	33	1	IN	2017.00	WORKSHEET	267	[DUMMY] Output Beras MS	2026-02-12 05:27:15.209
1112	34	1	IN	1345.00	WORKSHEET	267	[DUMMY] Output Beras P	2026-02-12 05:27:15.209
1113	35	1	IN	199.00	WORKSHEET	267	[DUMMY] Output Menir	2026-02-12 05:27:15.209
1114	25	1	OUT	6908.00	WORKSHEET	268	[DUMMY] Input GKP	2026-02-12 05:27:15.209
1115	27	1	IN	4070.00	WORKSHEET	268	[DUMMY] Output PK	2026-02-12 05:27:15.209
1116	29	1	IN	1382.00	WORKSHEET	268	[DUMMY] Output Sekam	2026-02-12 05:27:15.209
1117	30	1	IN	691.00	WORKSHEET	268	[DUMMY] Output Dedak	2026-02-12 05:27:15.209
1118	31	1	OUT	3365.00	WORKSHEET	269	[DUMMY] Input PK	2026-02-12 05:27:15.209
1119	33	1	IN	1765.00	WORKSHEET	269	[DUMMY] Output Beras MS	2026-02-12 05:27:15.209
1120	34	1	IN	1177.00	WORKSHEET	269	[DUMMY] Output Beras P	2026-02-12 05:27:15.209
1121	35	1	IN	168.00	WORKSHEET	269	[DUMMY] Output Menir	2026-02-12 05:27:15.209
1122	25	1	OUT	6769.00	WORKSHEET	270	[DUMMY] Input GKP	2026-02-13 05:27:15.209
1123	27	1	IN	4045.00	WORKSHEET	270	[DUMMY] Output PK	2026-02-13 05:27:15.209
1124	29	1	IN	1354.00	WORKSHEET	270	[DUMMY] Output Sekam	2026-02-13 05:27:15.209
1125	30	1	IN	677.00	WORKSHEET	270	[DUMMY] Output Dedak	2026-02-13 05:27:15.209
1126	31	1	OUT	3095.00	WORKSHEET	271	[DUMMY] Input PK	2026-02-13 05:27:15.209
1127	33	1	IN	1594.00	WORKSHEET	271	[DUMMY] Output Beras MS	2026-02-13 05:27:15.209
1128	34	1	IN	1063.00	WORKSHEET	271	[DUMMY] Output Beras P	2026-02-13 05:27:15.209
1129	35	1	IN	155.00	WORKSHEET	271	[DUMMY] Output Menir	2026-02-13 05:27:15.209
1130	25	1	OUT	6260.00	WORKSHEET	272	[DUMMY] Input GKP	2026-02-13 05:27:15.209
1131	27	1	IN	3797.00	WORKSHEET	272	[DUMMY] Output PK	2026-02-13 05:27:15.209
1132	29	1	IN	1252.00	WORKSHEET	272	[DUMMY] Output Sekam	2026-02-13 05:27:15.209
1133	30	1	IN	626.00	WORKSHEET	272	[DUMMY] Output Dedak	2026-02-13 05:27:15.209
1134	31	1	OUT	3385.00	WORKSHEET	273	[DUMMY] Input PK	2026-02-13 05:27:15.209
1135	33	1	IN	1686.00	WORKSHEET	273	[DUMMY] Output Beras MS	2026-02-13 05:27:15.209
1136	34	1	IN	1124.00	WORKSHEET	273	[DUMMY] Output Beras P	2026-02-13 05:27:15.209
1137	35	1	IN	169.00	WORKSHEET	273	[DUMMY] Output Menir	2026-02-13 05:27:15.209
1138	25	1	OUT	5153.00	WORKSHEET	274	[DUMMY] Input GKP	2026-02-14 05:27:15.209
1139	27	1	IN	3089.00	WORKSHEET	274	[DUMMY] Output PK	2026-02-14 05:27:15.209
1140	29	1	IN	1031.00	WORKSHEET	274	[DUMMY] Output Sekam	2026-02-14 05:27:15.209
1141	30	1	IN	515.00	WORKSHEET	274	[DUMMY] Output Dedak	2026-02-14 05:27:15.209
1142	31	1	OUT	3881.00	WORKSHEET	275	[DUMMY] Input PK	2026-02-14 05:27:15.209
1143	33	1	IN	1949.00	WORKSHEET	275	[DUMMY] Output Beras MS	2026-02-14 05:27:15.209
1144	34	1	IN	1300.00	WORKSHEET	275	[DUMMY] Output Beras P	2026-02-14 05:27:15.209
1145	35	1	IN	194.00	WORKSHEET	275	[DUMMY] Output Menir	2026-02-14 05:27:15.209
1146	25	1	OUT	5969.00	WORKSHEET	276	[DUMMY] Input GKP	2026-02-14 05:27:15.209
1147	27	1	IN	3525.00	WORKSHEET	276	[DUMMY] Output PK	2026-02-14 05:27:15.209
1148	29	1	IN	1194.00	WORKSHEET	276	[DUMMY] Output Sekam	2026-02-14 05:27:15.209
1149	30	1	IN	597.00	WORKSHEET	276	[DUMMY] Output Dedak	2026-02-14 05:27:15.209
1150	31	1	OUT	3474.00	WORKSHEET	277	[DUMMY] Input PK	2026-02-14 05:27:15.209
1151	33	1	IN	1751.00	WORKSHEET	277	[DUMMY] Output Beras MS	2026-02-14 05:27:15.209
1152	34	1	IN	1167.00	WORKSHEET	277	[DUMMY] Output Beras P	2026-02-14 05:27:15.209
1153	35	1	IN	174.00	WORKSHEET	277	[DUMMY] Output Menir	2026-02-14 05:27:15.209
1154	25	1	OUT	6865.00	WORKSHEET	278	[DUMMY] Input GKP	2026-02-16 05:27:15.209
1155	27	1	IN	3986.00	WORKSHEET	278	[DUMMY] Output PK	2026-02-16 05:27:15.209
1156	29	1	IN	1373.00	WORKSHEET	278	[DUMMY] Output Sekam	2026-02-16 05:27:15.209
1157	30	1	IN	687.00	WORKSHEET	278	[DUMMY] Output Dedak	2026-02-16 05:27:15.209
1158	31	1	OUT	3017.00	WORKSHEET	279	[DUMMY] Input PK	2026-02-16 05:27:15.209
1159	33	1	IN	1517.00	WORKSHEET	279	[DUMMY] Output Beras MS	2026-02-16 05:27:15.209
1160	34	1	IN	1011.00	WORKSHEET	279	[DUMMY] Output Beras P	2026-02-16 05:27:15.209
1161	35	1	IN	151.00	WORKSHEET	279	[DUMMY] Output Menir	2026-02-16 05:27:15.209
1162	25	1	OUT	5020.00	WORKSHEET	280	[DUMMY] Input GKP	2026-02-16 05:27:15.209
1163	27	1	IN	2915.00	WORKSHEET	280	[DUMMY] Output PK	2026-02-16 05:27:15.209
1164	29	1	IN	1004.00	WORKSHEET	280	[DUMMY] Output Sekam	2026-02-16 05:27:15.209
1165	30	1	IN	502.00	WORKSHEET	280	[DUMMY] Output Dedak	2026-02-16 05:27:15.209
1166	31	1	OUT	3074.00	WORKSHEET	281	[DUMMY] Input PK	2026-02-16 05:27:15.209
1167	33	1	IN	1560.00	WORKSHEET	281	[DUMMY] Output Beras MS	2026-02-16 05:27:15.209
1168	34	1	IN	1040.00	WORKSHEET	281	[DUMMY] Output Beras P	2026-02-16 05:27:15.209
1169	35	1	IN	154.00	WORKSHEET	281	[DUMMY] Output Menir	2026-02-16 05:27:15.209
1170	25	1	OUT	5863.00	WORKSHEET	282	[DUMMY] Input GKP	2026-02-17 05:27:15.209
1171	27	1	IN	3587.00	WORKSHEET	282	[DUMMY] Output PK	2026-02-17 05:27:15.209
1172	29	1	IN	1173.00	WORKSHEET	282	[DUMMY] Output Sekam	2026-02-17 05:27:15.209
1173	30	1	IN	586.00	WORKSHEET	282	[DUMMY] Output Dedak	2026-02-17 05:27:15.209
1174	31	1	OUT	3501.00	WORKSHEET	283	[DUMMY] Input PK	2026-02-17 05:27:15.209
1175	33	1	IN	1723.00	WORKSHEET	283	[DUMMY] Output Beras MS	2026-02-17 05:27:15.209
1176	34	1	IN	1148.00	WORKSHEET	283	[DUMMY] Output Beras P	2026-02-17 05:27:15.209
1177	35	1	IN	175.00	WORKSHEET	283	[DUMMY] Output Menir	2026-02-17 05:27:15.209
1178	25	1	OUT	5570.00	WORKSHEET	284	[DUMMY] Input GKP	2026-02-17 05:27:15.209
1179	27	1	IN	3257.00	WORKSHEET	284	[DUMMY] Output PK	2026-02-17 05:27:15.209
1180	29	1	IN	1114.00	WORKSHEET	284	[DUMMY] Output Sekam	2026-02-17 05:27:15.209
1181	30	1	IN	557.00	WORKSHEET	284	[DUMMY] Output Dedak	2026-02-17 05:27:15.209
1182	31	1	OUT	4048.00	WORKSHEET	285	[DUMMY] Input PK	2026-02-17 05:27:15.209
1183	33	1	IN	1994.00	WORKSHEET	285	[DUMMY] Output Beras MS	2026-02-17 05:27:15.209
1184	34	1	IN	1330.00	WORKSHEET	285	[DUMMY] Output Beras P	2026-02-17 05:27:15.209
1185	35	1	IN	202.00	WORKSHEET	285	[DUMMY] Output Menir	2026-02-17 05:27:15.209
1186	25	1	OUT	6348.00	WORKSHEET	286	[DUMMY] Input GKP	2026-02-18 05:27:15.209
1187	27	1	IN	3865.00	WORKSHEET	286	[DUMMY] Output PK	2026-02-18 05:27:15.209
1188	29	1	IN	1270.00	WORKSHEET	286	[DUMMY] Output Sekam	2026-02-18 05:27:15.209
1189	30	1	IN	635.00	WORKSHEET	286	[DUMMY] Output Dedak	2026-02-18 05:27:15.209
1190	31	1	OUT	3100.00	WORKSHEET	287	[DUMMY] Input PK	2026-02-18 05:27:15.209
1191	33	1	IN	1562.00	WORKSHEET	287	[DUMMY] Output Beras MS	2026-02-18 05:27:15.209
1192	34	1	IN	1042.00	WORKSHEET	287	[DUMMY] Output Beras P	2026-02-18 05:27:15.209
1193	35	1	IN	155.00	WORKSHEET	287	[DUMMY] Output Menir	2026-02-18 05:27:15.209
1194	25	1	OUT	6574.00	WORKSHEET	288	[DUMMY] Input GKP	2026-02-18 05:27:15.209
1195	27	1	IN	3852.00	WORKSHEET	288	[DUMMY] Output PK	2026-02-18 05:27:15.209
1196	29	1	IN	1315.00	WORKSHEET	288	[DUMMY] Output Sekam	2026-02-18 05:27:15.209
1197	30	1	IN	657.00	WORKSHEET	288	[DUMMY] Output Dedak	2026-02-18 05:27:15.209
1198	31	1	OUT	3032.00	WORKSHEET	289	[DUMMY] Input PK	2026-02-18 05:27:15.209
1199	33	1	IN	1598.00	WORKSHEET	289	[DUMMY] Output Beras MS	2026-02-18 05:27:15.209
1200	34	1	IN	1066.00	WORKSHEET	289	[DUMMY] Output Beras P	2026-02-18 05:27:15.209
1201	35	1	IN	152.00	WORKSHEET	289	[DUMMY] Output Menir	2026-02-18 05:27:15.209
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Supplier" (id, code, name, contact_person, phone, email, address, is_active, created_at) FROM stdin;
20	SUP-DUMMY-001	UD Padi Jaya	Cahyo	083456789012	\N	\N	t	2026-02-15 05:27:15.531
21	SUP-DUMMY-002	PT Gabah Nusantara	Slamet	084567890123	\N	\N	t	2026-02-15 05:27:15.532
22	SUP-DUMMY-003	CV Tani Makmur	Wati	085678901234	\N	\N	t	2026-02-15 05:27:15.533
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password_hash, fullname, role, id_factory, is_active, created_at, updated_at) FROM stdin;
1	root@pangan.com	$2b$10$UpNHXWbaHPV8xMN3A3EeWecY9AXHHKynSHxtWHArHUYaTDWA56r.S	Super Administrator	SUPERUSER	\N	t	2026-02-12 07:03:37.12	2026-02-12 07:03:37.12
2	admin@pangan.com	$2b$10$i61OX0P7tOcsLY1eLjPTw.vvaNnvOdHKNqlaCC2DyRp.Fgmsmtjo6	Administrator	ADMIN	\N	t	2026-02-12 07:03:38.369	2026-02-12 07:03:38.369
\.


--
-- Data for Name: Worksheet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Worksheet" (id, id_factory, id_user, worksheet_date, shift, gabah_input, beras_output, menir_output, dedak_output, sekam_output, rendemen, machine_hours, downtime_hours, downtime_reason, notes, created_at, updated_at, id_output_product, id_machine, batch_code, process_step, production_cost, raw_material_cost, side_product_revenue, hpp, hpp_per_kg) FROM stdin;
254	3	1	2026-02-09	SHIFT_1	5736.00	3412.00	0.00	574.00	1147.00	59.49	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.21	2026-02-15 05:27:15.21	79	14	BATCH-PMD1-2026-02-09-SHIFT_1	\N	573600.00	34416000.00	1721500.00	34989600.00	10255.00
255	4	1	2026-02-09	SHIFT_1	3104.00	2727.00	155.00	0.00	0.00	87.87	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.224	2026-02-15 05:27:15.224	81	15	BATCH-PMDP-2026-02-09-SHIFT_1	\N	465600.00	24832000.00	465000.00	25297600.00	9277.00
256	3	1	2026-02-09	SHIFT_2	5561.00	3232.00	0.00	556.00	1112.00	58.12	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.23	2026-02-15 05:27:15.23	79	14	BATCH-PMD1-2026-02-09-SHIFT_2	\N	556100.00	33366000.00	1668000.00	33922100.00	10496.00
257	4	1	2026-02-09	SHIFT_2	3717.00	3082.00	186.00	0.00	0.00	82.92	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.237	2026-02-15 05:27:15.237	81	15	BATCH-PMDP-2026-02-09-SHIFT_2	\N	557550.00	29736000.00	558000.00	30293550.00	9829.00
258	3	1	2026-02-10	SHIFT_1	5395.00	3224.00	0.00	540.00	1079.00	59.76	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.243	2026-02-15 05:27:15.243	79	14	BATCH-PMD1-2026-02-10-SHIFT_1	\N	539500.00	32370000.00	1619500.00	32909500.00	10208.00
259	4	1	2026-02-10	SHIFT_1	4351.00	3637.00	218.00	0.00	0.00	83.60	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.249	2026-02-15 05:27:15.249	81	15	BATCH-PMDP-2026-02-10-SHIFT_1	\N	652650.00	34808000.00	654000.00	35460650.00	9750.00
260	3	1	2026-02-10	SHIFT_2	5135.00	3163.00	0.00	514.00	1027.00	61.59	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.255	2026-02-15 05:27:15.255	79	14	BATCH-PMD1-2026-02-10-SHIFT_2	\N	513500.00	30810000.00	1541500.00	31323500.00	9903.00
261	4	1	2026-02-10	SHIFT_2	3406.00	2959.00	170.00	0.00	0.00	86.88	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.262	2026-02-15 05:27:15.262	81	15	BATCH-PMDP-2026-02-10-SHIFT_2	\N	510900.00	27248000.00	510000.00	27758900.00	9381.00
262	3	1	2026-02-11	SHIFT_1	5648.00	3377.00	0.00	565.00	1130.00	59.78	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.267	2026-02-15 05:27:15.267	79	14	BATCH-PMD1-2026-02-11-SHIFT_1	\N	564800.00	33888000.00	1695000.00	34452800.00	10202.00
263	4	1	2026-02-11	SHIFT_1	3597.00	3121.00	180.00	0.00	0.00	86.76	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.275	2026-02-15 05:27:15.275	81	15	BATCH-PMDP-2026-02-11-SHIFT_1	\N	539550.00	28776000.00	540000.00	29315550.00	9393.00
264	3	1	2026-02-11	SHIFT_2	5056.00	3016.00	0.00	506.00	1011.00	59.64	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.285	2026-02-15 05:27:15.285	79	14	BATCH-PMD1-2026-02-11-SHIFT_2	\N	505600.00	30336000.00	1517500.00	30841600.00	10226.00
265	4	1	2026-02-11	SHIFT_2	3028.00	2546.00	151.00	0.00	0.00	84.09	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.297	2026-02-15 05:27:15.297	81	15	BATCH-PMDP-2026-02-11-SHIFT_2	\N	454200.00	24224000.00	453000.00	24678200.00	9693.00
266	3	1	2026-02-12	SHIFT_1	5489.00	3351.00	0.00	549.00	1098.00	61.04	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.306	2026-02-15 05:27:15.306	79	14	BATCH-PMD1-2026-02-12-SHIFT_1	\N	548900.00	32934000.00	1647000.00	33482900.00	9992.00
267	4	1	2026-02-12	SHIFT_1	3976.00	3362.00	199.00	0.00	0.00	84.56	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.324	2026-02-15 05:27:15.324	81	15	BATCH-PMDP-2026-02-12-SHIFT_1	\N	596400.00	31808000.00	597000.00	32404400.00	9638.00
268	3	1	2026-02-12	SHIFT_2	6908.00	4070.00	0.00	691.00	1382.00	58.92	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.339	2026-02-15 05:27:15.339	79	14	BATCH-PMD1-2026-02-12-SHIFT_2	\N	690800.00	41448000.00	2073000.00	42138800.00	10354.00
269	4	1	2026-02-12	SHIFT_2	3365.00	2942.00	168.00	0.00	0.00	87.42	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.357	2026-02-15 05:27:15.357	81	15	BATCH-PMDP-2026-02-12-SHIFT_2	\N	504750.00	26920000.00	504000.00	27424750.00	9322.00
270	3	1	2026-02-13	SHIFT_1	6769.00	4045.00	0.00	677.00	1354.00	59.76	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.37	2026-02-15 05:27:15.37	79	14	BATCH-PMD1-2026-02-13-SHIFT_1	\N	676900.00	40614000.00	2031000.00	41290900.00	10208.00
271	4	1	2026-02-13	SHIFT_1	3095.00	2657.00	155.00	0.00	0.00	85.85	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.381	2026-02-15 05:27:15.381	81	15	BATCH-PMDP-2026-02-13-SHIFT_1	\N	464250.00	24760000.00	465000.00	25224250.00	9494.00
272	3	1	2026-02-13	SHIFT_2	6260.00	3797.00	0.00	626.00	1252.00	60.66	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.399	2026-02-15 05:27:15.399	79	14	BATCH-PMD1-2026-02-13-SHIFT_2	\N	626000.00	37560000.00	1878000.00	38186000.00	10057.00
273	4	1	2026-02-13	SHIFT_2	3385.00	2810.00	169.00	0.00	0.00	83.03	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.411	2026-02-15 05:27:15.411	81	15	BATCH-PMDP-2026-02-13-SHIFT_2	\N	507750.00	27080000.00	507000.00	27587750.00	9818.00
274	3	1	2026-02-14	SHIFT_1	5153.00	3089.00	0.00	515.00	1031.00	59.95	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.424	2026-02-15 05:27:15.424	79	14	BATCH-PMD1-2026-02-14-SHIFT_1	\N	515300.00	30918000.00	1545500.00	31433300.00	10176.00
275	4	1	2026-02-14	SHIFT_1	3881.00	3249.00	194.00	0.00	0.00	83.71	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.429	2026-02-15 05:27:15.429	81	15	BATCH-PMDP-2026-02-14-SHIFT_1	\N	582150.00	31048000.00	582000.00	31630150.00	9735.00
276	3	1	2026-02-14	SHIFT_2	5969.00	3525.00	0.00	597.00	1194.00	59.05	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.434	2026-02-15 05:27:15.434	79	14	BATCH-PMD1-2026-02-14-SHIFT_2	\N	596900.00	35814000.00	1791000.00	36410900.00	10329.00
277	4	1	2026-02-14	SHIFT_2	3474.00	2918.00	174.00	0.00	0.00	84.01	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.439	2026-02-15 05:27:15.439	81	15	BATCH-PMDP-2026-02-14-SHIFT_2	\N	521100.00	27792000.00	522000.00	28313100.00	9703.00
278	3	1	2026-02-16	SHIFT_1	6865.00	3986.00	0.00	687.00	1373.00	58.06	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.443	2026-02-15 05:27:15.443	79	14	BATCH-PMD1-2026-02-16-SHIFT_1	\N	686500.00	41190000.00	2060500.00	41876500.00	10506.00
279	4	1	2026-02-16	SHIFT_1	3017.00	2528.00	151.00	0.00	0.00	83.81	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.447	2026-02-15 05:27:15.447	81	15	BATCH-PMDP-2026-02-16-SHIFT_1	\N	452550.00	24136000.00	453000.00	24588550.00	9726.00
280	3	1	2026-02-16	SHIFT_2	5020.00	2915.00	0.00	502.00	1004.00	58.07	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.452	2026-02-15 05:27:15.452	79	14	BATCH-PMD1-2026-02-16-SHIFT_2	\N	502000.00	30120000.00	1506000.00	30622000.00	10505.00
281	4	1	2026-02-16	SHIFT_2	3074.00	2600.00	154.00	0.00	0.00	84.57	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.457	2026-02-15 05:27:15.457	81	15	BATCH-PMDP-2026-02-16-SHIFT_2	\N	461100.00	24592000.00	462000.00	25053100.00	9636.00
282	3	1	2026-02-17	SHIFT_1	5863.00	3587.00	0.00	586.00	1173.00	61.18	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.463	2026-02-15 05:27:15.463	79	14	BATCH-PMD1-2026-02-17-SHIFT_1	\N	586300.00	35178000.00	1758500.00	35764300.00	9971.00
283	4	1	2026-02-17	SHIFT_1	3501.00	2871.00	175.00	0.00	0.00	82.00	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.484	2026-02-15 05:27:15.484	81	15	BATCH-PMDP-2026-02-17-SHIFT_1	\N	525150.00	28008000.00	525000.00	28533150.00	9938.00
284	3	1	2026-02-17	SHIFT_2	5570.00	3257.00	0.00	557.00	1114.00	58.47	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.489	2026-02-15 05:27:15.489	79	14	BATCH-PMD1-2026-02-17-SHIFT_2	\N	557000.00	33420000.00	1671000.00	33977000.00	10432.00
285	4	1	2026-02-17	SHIFT_2	4048.00	3324.00	202.00	0.00	0.00	82.13	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.494	2026-02-15 05:27:15.494	81	15	BATCH-PMDP-2026-02-17-SHIFT_2	\N	607200.00	32384000.00	606000.00	32991200.00	9925.00
286	3	1	2026-02-18	SHIFT_1	6348.00	3865.00	0.00	635.00	1270.00	60.88	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.499	2026-02-15 05:27:15.499	79	14	BATCH-PMD1-2026-02-18-SHIFT_1	\N	634800.00	38088000.00	1905000.00	38722800.00	10019.00
287	4	1	2026-02-18	SHIFT_1	3100.00	2604.00	155.00	0.00	0.00	83.99	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.503	2026-02-15 05:27:15.503	81	15	BATCH-PMDP-2026-02-18-SHIFT_1	\N	465000.00	24800000.00	465000.00	25265000.00	9702.00
288	3	1	2026-02-18	SHIFT_2	6574.00	3852.00	0.00	657.00	1315.00	58.59	8.00	0.00	\N	[DUMMY] PMD 1 Worksheet	2026-02-15 05:27:15.508	2026-02-15 05:27:15.508	79	14	BATCH-PMD1-2026-02-18-SHIFT_2	\N	657400.00	39444000.00	1971500.00	40101400.00	10411.00
289	4	1	2026-02-18	SHIFT_2	3032.00	2664.00	152.00	0.00	0.00	87.86	8.00	0.00	\N	[DUMMY] PMD Pusat Worksheet	2026-02-15 05:27:15.513	2026-02-15 05:27:15.513	81	15	BATCH-PMDP-2026-02-18-SHIFT_2	\N	454800.00	24256000.00	456000.00	24710800.00	9276.00
\.


--
-- Data for Name: WorksheetInputBatch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorksheetInputBatch" (id, id_worksheet, id_stock, batch_code, quantity, unit_price, total_cost, created_at) FROM stdin;
\.


--
-- Data for Name: WorksheetSideProduct; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorksheetSideProduct" (id, id_worksheet, product_code, product_name, quantity, is_auto_calculated, auto_percentage, unit_price, total_value, created_at) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5eca17df-e268-4cae-9154-6221597e8205	96a69754716b5dd610b4c60553f186d62fb0ce2b8971f6e3d285cfbdd00e5cd3	2026-02-12 07:02:11.009416+00	20260212070210_init_schema	\N	\N	2026-02-12 07:02:10.885047+00	1
65e17beb-c47e-49ff-8731-b2c8e942ab1f	b62745476b5425aee4a5c7e37df4e0059029db2fff7c62ec574552577b117bd4	2026-02-13 08:02:10.513109+00	20260213080210_add_purchase_order	\N	\N	2026-02-13 08:02:10.441903+00	1
c9d5b0eb-04c1-40cd-98f5-b23823a709d9	da21fe2447eb453a3750e0aaaf105d1a9e44fc4512234054ee59ac2c37bb1ffd	2026-02-13 12:43:38.859096+00	20260213124338_add_notification	\N	\N	2026-02-13 12:43:38.7228+00	1
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
\.


--
-- Name: Attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Attendance_id_seq"', 1, false);


--
-- Name: Customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Customer_id_seq"', 22, true);


--
-- Name: DailyExpense_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DailyExpense_id_seq"', 1, false);


--
-- Name: Employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Employee_id_seq"', 1, false);


--
-- Name: ExpenseCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ExpenseCategory_id_seq"', 1, false);


--
-- Name: Factory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Factory_id_seq"', 4, true);


--
-- Name: GoodsReceiptItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."GoodsReceiptItem_id_seq"', 14, true);


--
-- Name: GoodsReceipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."GoodsReceipt_id_seq"', 14, true);


--
-- Name: InvoiceItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InvoiceItem_id_seq"', 56, true);


--
-- Name: Invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Invoice_id_seq"', 57, true);


--
-- Name: Machine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Machine_id_seq"', 18, true);


--
-- Name: Maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Maintenance_id_seq"', 54, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 33, true);


--
-- Name: OutputProduct_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OutputProduct_id_seq"', 12, true);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 14, true);


--
-- Name: ProcessCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProcessCategory_id_seq"', 1, false);


--
-- Name: ProductType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProductType_id_seq"', 85, true);


--
-- Name: PurchaseOrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseOrderItem_id_seq"', 56, true);


--
-- Name: PurchaseOrder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseOrder_id_seq"', 56, true);


--
-- Name: QCGabah_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."QCGabah_id_seq"', 9, true);


--
-- Name: QualityParameter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."QualityParameter_id_seq"', 12, true);


--
-- Name: RawMaterialCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RawMaterialCategory_id_seq"', 7, true);


--
-- Name: RawMaterialQualityAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RawMaterialQualityAnalysis_id_seq"', 1, false);


--
-- Name: RawMaterialVariety_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RawMaterialVariety_id_seq"', 10, true);


--
-- Name: StockMovement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."StockMovement_id_seq"', 1201, true);


--
-- Name: Stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Stock_id_seq"', 35, true);


--
-- Name: Supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Supplier_id_seq"', 22, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 2, true);


--
-- Name: WorksheetInputBatch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WorksheetInputBatch_id_seq"', 1, false);


--
-- Name: WorksheetSideProduct_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WorksheetSideProduct_id_seq"', 1, false);


--
-- Name: Worksheet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Worksheet_id_seq"', 289, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);


--
-- Name: GoodsReceiptItem GoodsReceiptItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceiptItem"
    ADD CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY (id);


--
-- Name: GoodsReceipt GoodsReceipt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceipt"
    ADD CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Supplier PK_03ea59de9d1ab05d7d6e5d3e953; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "PK_03ea59de9d1ab05d7d6e5d3e953" PRIMARY KEY (id);


--
-- Name: DailyExpense PK_06292ff0a9a26203660b736a205; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyExpense"
    ADD CONSTRAINT "PK_06292ff0a9a26203660b736a205" PRIMARY KEY (id);


--
-- Name: Payment PK_07e9fb9a8751923eb876d57a575; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "PK_07e9fb9a8751923eb876d57a575" PRIMARY KEY (id);


--
-- Name: Invoice PK_0ead03cb5a20e5a5cc4d6defbe6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "PK_0ead03cb5a20e5a5cc4d6defbe6" PRIMARY KEY (id);


--
-- Name: Attendance PK_137a8eec2cec8606cdf8f1e4f67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "PK_137a8eec2cec8606cdf8f1e4f67" PRIMARY KEY (id);


--
-- Name: ProductType PK_242e6bc43c0297318eb8560618f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductType"
    ADD CONSTRAINT "PK_242e6bc43c0297318eb8560618f" PRIMARY KEY (id);


--
-- Name: QCGabah PK_25e23bf8af8a9efcee9f4b1f1cd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QCGabah"
    ADD CONSTRAINT "PK_25e23bf8af8a9efcee9f4b1f1cd" PRIMARY KEY (id);


--
-- Name: Stock PK_2725537b7bbe40073a50986598d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Stock"
    ADD CONSTRAINT "PK_2725537b7bbe40073a50986598d" PRIMARY KEY (id);


--
-- Name: Maintenance PK_29c5e2995d22e714bc782e0dabc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenance"
    ADD CONSTRAINT "PK_29c5e2995d22e714bc782e0dabc" PRIMARY KEY (id);


--
-- Name: RawMaterialQualityAnalysis PK_360eda0c8661d53b9df013fa43b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RawMaterialQualityAnalysis"
    ADD CONSTRAINT "PK_360eda0c8661d53b9df013fa43b" PRIMARY KEY (id);


--
-- Name: Machine PK_575ee17453f39be625e174d7a1f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Machine"
    ADD CONSTRAINT "PK_575ee17453f39be625e174d7a1f" PRIMARY KEY (id);


--
-- Name: QualityParameter PK_5d5fdce6fef66d219e1d69d07d7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityParameter"
    ADD CONSTRAINT "PK_5d5fdce6fef66d219e1d69d07d7" PRIMARY KEY (id);


--
-- Name: Customer PK_60596e16740e1fa20dbf0154ec7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "PK_60596e16740e1fa20dbf0154ec7" PRIMARY KEY (id);


--
-- Name: Factory PK_6635a0ad5ed4a0499652a126970; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Factory"
    ADD CONSTRAINT "PK_6635a0ad5ed4a0499652a126970" PRIMARY KEY (id);


--
-- Name: StockMovement PK_89f737b966ba80fd8227b51fe01; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "PK_89f737b966ba80fd8227b51fe01" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: User PK_9862f679340fb2388436a5ab3e4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "PK_9862f679340fb2388436a5ab3e4" PRIMARY KEY (id);


--
-- Name: Employee PK_9a993c20751b9867abc60108433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "PK_9a993c20751b9867abc60108433" PRIMARY KEY (id);


--
-- Name: ExpenseCategory PK_a9db04a82eebfc29ba6bca6e8a0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExpenseCategory"
    ADD CONSTRAINT "PK_a9db04a82eebfc29ba6bca6e8a0" PRIMARY KEY (id);


--
-- Name: WorksheetInputBatch PK_cbcc8c68a536ba6b5eeb90f18ad; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorksheetInputBatch"
    ADD CONSTRAINT "PK_cbcc8c68a536ba6b5eeb90f18ad" PRIMARY KEY (id);


--
-- Name: WorksheetSideProduct PK_d28ee5b7917b61e88f9332d692a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorksheetSideProduct"
    ADD CONSTRAINT "PK_d28ee5b7917b61e88f9332d692a" PRIMARY KEY (id);


--
-- Name: Worksheet PK_dd3c48d621cab0deaa8b38f417e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Worksheet"
    ADD CONSTRAINT "PK_dd3c48d621cab0deaa8b38f417e" PRIMARY KEY (id);


--
-- Name: RawMaterialCategory PK_ddf58cf202d3dc204e7bee72ad2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RawMaterialCategory"
    ADD CONSTRAINT "PK_ddf58cf202d3dc204e7bee72ad2" PRIMARY KEY (id);


--
-- Name: OutputProduct PK_e3c20634774dc24c518a507ad93; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OutputProduct"
    ADD CONSTRAINT "PK_e3c20634774dc24c518a507ad93" PRIMARY KEY (id);


--
-- Name: RawMaterialVariety PK_e6b1cd87e5533fccbed8e7e24b9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RawMaterialVariety"
    ADD CONSTRAINT "PK_e6b1cd87e5533fccbed8e7e24b9" PRIMARY KEY (id);


--
-- Name: ProcessCategory PK_f537bc87f07860fee454dec2de0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProcessCategory"
    ADD CONSTRAINT "PK_f537bc87f07860fee454dec2de0" PRIMARY KEY (id);


--
-- Name: InvoiceItem PK_fe59f574f9f138df4b52fb7ee7a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "PK_fe59f574f9f138df4b52fb7ee7a" PRIMARY KEY (id);


--
-- Name: PurchaseOrderItem PurchaseOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Customer_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Customer_code_key" ON public."Customer" USING btree (code);


--
-- Name: Employee_employee_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Employee_employee_code_key" ON public."Employee" USING btree (employee_code);


--
-- Name: ExpenseCategory_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ExpenseCategory_code_key" ON public."ExpenseCategory" USING btree (code);


--
-- Name: Factory_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Factory_code_key" ON public."Factory" USING btree (code);


--
-- Name: GoodsReceipt_id_purchase_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GoodsReceipt_id_purchase_order_idx" ON public."GoodsReceipt" USING btree (id_purchase_order);


--
-- Name: GoodsReceipt_receipt_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "GoodsReceipt_receipt_number_key" ON public."GoodsReceipt" USING btree (receipt_number);


--
-- Name: IDX_attendance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_attendance_date" ON public."Attendance" USING btree (attendance_date);


--
-- Name: IDX_attendance_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_attendance_employee" ON public."Attendance" USING btree (id_employee);


--
-- Name: IDX_daily_expense_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_daily_expense_date" ON public."DailyExpense" USING btree (expense_date);


--
-- Name: IDX_daily_expense_factory; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_daily_expense_factory" ON public."DailyExpense" USING btree (id_factory);


--
-- Name: IDX_daily_expense_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_daily_expense_user" ON public."DailyExpense" USING btree (id_user);


--
-- Name: IDX_employee_factory; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_employee_factory" ON public."Employee" USING btree (id_factory);


--
-- Name: IDX_employee_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_employee_user" ON public."Employee" USING btree (id_user);


--
-- Name: IDX_invoice_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_invoice_customer" ON public."Invoice" USING btree (id_customer);


--
-- Name: IDX_invoice_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_invoice_date" ON public."Invoice" USING btree (invoice_date);


--
-- Name: IDX_invoice_factory; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_invoice_factory" ON public."Invoice" USING btree (id_factory);


--
-- Name: IDX_machine_factory; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_machine_factory" ON public."Machine" USING btree (id_factory);


--
-- Name: IDX_maintenance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_maintenance_date" ON public."Maintenance" USING btree (maintenance_date);


--
-- Name: IDX_maintenance_machine; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_maintenance_machine" ON public."Maintenance" USING btree (id_machine);


--
-- Name: IDX_quality_param_variety; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_quality_param_variety" ON public."QualityParameter" USING btree (id_variety);


--
-- Name: IDX_stock_factory; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_factory" ON public."Stock" USING btree (id_factory);


--
-- Name: IDX_stock_movement_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_movement_created" ON public."StockMovement" USING btree (created_at);


--
-- Name: IDX_stock_movement_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_movement_stock" ON public."StockMovement" USING btree (id_stock);


--
-- Name: IDX_stock_movement_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_movement_user" ON public."StockMovement" USING btree (id_user);


--
-- Name: IDX_stock_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_product_type" ON public."Stock" USING btree (id_product_type);


--
-- Name: IDX_worksheet_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_worksheet_date" ON public."Worksheet" USING btree (worksheet_date);


--
-- Name: IDX_worksheet_factory; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_worksheet_factory" ON public."Worksheet" USING btree (id_factory);


--
-- Name: IDX_worksheet_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_worksheet_user" ON public."Worksheet" USING btree (id_user);


--
-- Name: Invoice_invoice_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON public."Invoice" USING btree (invoice_number);


--
-- Name: Machine_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Machine_code_key" ON public."Machine" USING btree (code);


--
-- Name: Notification_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_created_at_idx" ON public."Notification" USING btree (created_at);


--
-- Name: Notification_id_user_is_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_id_user_is_read_idx" ON public."Notification" USING btree (id_user, is_read);


--
-- Name: ProcessCategory_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProcessCategory_code_key" ON public."ProcessCategory" USING btree (code);


--
-- Name: ProductType_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductType_code_key" ON public."ProductType" USING btree (code);


--
-- Name: PurchaseOrder_id_factory_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PurchaseOrder_id_factory_idx" ON public."PurchaseOrder" USING btree (id_factory);


--
-- Name: PurchaseOrder_id_supplier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PurchaseOrder_id_supplier_idx" ON public."PurchaseOrder" USING btree (id_supplier);


--
-- Name: PurchaseOrder_order_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PurchaseOrder_order_date_idx" ON public."PurchaseOrder" USING btree (order_date);


--
-- Name: PurchaseOrder_po_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PurchaseOrder_po_number_key" ON public."PurchaseOrder" USING btree (po_number);


--
-- Name: Supplier_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Supplier_code_key" ON public."Supplier" USING btree (code);


--
-- Name: UQ_a30e2ec13b6a5c7e7ce45a8951f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UQ_a30e2ec13b6a5c7e7ce45a8951f" ON public."RawMaterialCategory" USING btree (code);


--
-- Name: UQ_b2486d09132793df46873cd3df9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UQ_b2486d09132793df46873cd3df9" ON public."RawMaterialVariety" USING btree (code);


--
-- Name: UQ_stock_factory_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UQ_stock_factory_product" ON public."Stock" USING btree (id_factory, id_product_type);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Invoice FK_019719e73446b44c79a559fa2ed; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "FK_019719e73446b44c79a559fa2ed" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: OutputProduct FK_032c651db48b9984eba12043150; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OutputProduct"
    ADD CONSTRAINT "FK_032c651db48b9984eba12043150" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: StockMovement FK_03c884464cad073305dd53ed7b1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "FK_03c884464cad073305dd53ed7b1" FOREIGN KEY (id_stock) REFERENCES public."Stock"(id);


--
-- Name: QualityParameter FK_046d2225de7a7bedcdf0ca626e8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityParameter"
    ADD CONSTRAINT "FK_046d2225de7a7bedcdf0ca626e8" FOREIGN KEY (id_variety) REFERENCES public."RawMaterialVariety"(id);


--
-- Name: StockMovement FK_0645774788e95617e3ffd45b3b7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "FK_0645774788e95617e3ffd45b3b7" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: DailyExpense FK_0c3ada66474c1cf9dbd04f29c01; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyExpense"
    ADD CONSTRAINT "FK_0c3ada66474c1cf9dbd04f29c01" FOREIGN KEY (id_expense_category) REFERENCES public."ExpenseCategory"(id);


--
-- Name: Worksheet FK_10ff9fd85814d58f9a6d74a5a7e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Worksheet"
    ADD CONSTRAINT "FK_10ff9fd85814d58f9a6d74a5a7e" FOREIGN KEY (id_output_product) REFERENCES public."ProductType"(id);


--
-- Name: Stock FK_1e850f690899d16194616041127; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Stock"
    ADD CONSTRAINT "FK_1e850f690899d16194616041127" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: Invoice FK_327b5e6c32a7ad18d1558f33171; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "FK_327b5e6c32a7ad18d1558f33171" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: Invoice FK_34be43b2cfd1fcc9838743ff67f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "FK_34be43b2cfd1fcc9838743ff67f" FOREIGN KEY (id_customer) REFERENCES public."Customer"(id);


--
-- Name: RawMaterialQualityAnalysis FK_3d06912136df7e15154257cc8f3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RawMaterialQualityAnalysis"
    ADD CONSTRAINT "FK_3d06912136df7e15154257cc8f3" FOREIGN KEY (id_stock_movement) REFERENCES public."StockMovement"(id);


--
-- Name: Worksheet FK_4389afefb4c0bbc4fc7a1a435f3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Worksheet"
    ADD CONSTRAINT "FK_4389afefb4c0bbc4fc7a1a435f3" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: Payment FK_449e7a6f2e2359ffbb8746d11e8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "FK_449e7a6f2e2359ffbb8746d11e8" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: User FK_488e9d8940dc65f34cdf82d750f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "FK_488e9d8940dc65f34cdf82d750f" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: Maintenance FK_56a2aeb1c341080930b90cccfb6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenance"
    ADD CONSTRAINT "FK_56a2aeb1c341080930b90cccfb6" FOREIGN KEY (id_machine) REFERENCES public."Machine"(id);


--
-- Name: Employee FK_6fb1f08d2181fcb9ecfc6e8dbd7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "FK_6fb1f08d2181fcb9ecfc6e8dbd7" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: Payment FK_718e9dbbccb3bfd36ae3e8cd5c2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "FK_718e9dbbccb3bfd36ae3e8cd5c2" FOREIGN KEY (id_invoice) REFERENCES public."Invoice"(id);


--
-- Name: WorksheetInputBatch FK_83e28cc5e280f92c5d0b7a1c09b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorksheetInputBatch"
    ADD CONSTRAINT "FK_83e28cc5e280f92c5d0b7a1c09b" FOREIGN KEY (id_stock) REFERENCES public."Stock"(id);


--
-- Name: DailyExpense FK_8fb9155586106a11a7065f2fcc4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyExpense"
    ADD CONSTRAINT "FK_8fb9155586106a11a7065f2fcc4" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: Employee FK_92445038f4236e0b2109a4ee29f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "FK_92445038f4236e0b2109a4ee29f" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: Maintenance FK_b286f77b3a913862b7ed2e97415; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenance"
    ADD CONSTRAINT "FK_b286f77b3a913862b7ed2e97415" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: Worksheet FK_b6e3fcc79a8ed4484be3f3d8eeb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Worksheet"
    ADD CONSTRAINT "FK_b6e3fcc79a8ed4484be3f3d8eeb" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: Machine FK_b8a0fe79ae166740619fce48848; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Machine"
    ADD CONSTRAINT "FK_b8a0fe79ae166740619fce48848" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: InvoiceItem FK_bd5cd6fccadcc384a73f93c3c89; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "FK_bd5cd6fccadcc384a73f93c3c89" FOREIGN KEY (id_invoice) REFERENCES public."Invoice"(id);


--
-- Name: InvoiceItem FK_c3c3c7442a541e37357ff4b2328; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "FK_c3c3c7442a541e37357ff4b2328" FOREIGN KEY (id_product_type) REFERENCES public."ProductType"(id);


--
-- Name: Stock FK_c976f3986f53fb7ace248099810; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Stock"
    ADD CONSTRAINT "FK_c976f3986f53fb7ace248099810" FOREIGN KEY (id_product_type) REFERENCES public."ProductType"(id);


--
-- Name: Attendance FK_d924a0306d869e3c96a1617247b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "FK_d924a0306d869e3c96a1617247b" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: WorksheetSideProduct FK_da2240b0153fe85db8486b2fbdb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorksheetSideProduct"
    ADD CONSTRAINT "FK_da2240b0153fe85db8486b2fbdb" FOREIGN KEY (id_worksheet) REFERENCES public."Worksheet"(id) ON DELETE CASCADE;


--
-- Name: Worksheet FK_dddd8317548de410ffa729dc394; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Worksheet"
    ADD CONSTRAINT "FK_dddd8317548de410ffa729dc394" FOREIGN KEY (id_machine) REFERENCES public."Machine"(id);


--
-- Name: WorksheetInputBatch FK_e0d88499487a68a02f8b06f91c2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorksheetInputBatch"
    ADD CONSTRAINT "FK_e0d88499487a68a02f8b06f91c2" FOREIGN KEY (id_worksheet) REFERENCES public."Worksheet"(id) ON DELETE CASCADE;


--
-- Name: Attendance FK_e6ea1421dce673712ff1e5e5cb1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "FK_e6ea1421dce673712ff1e5e5cb1" FOREIGN KEY (id_employee) REFERENCES public."Employee"(id);


--
-- Name: DailyExpense FK_fd6f8ee06f6ae2671e585929d5b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyExpense"
    ADD CONSTRAINT "FK_fd6f8ee06f6ae2671e585929d5b" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: GoodsReceiptItem GoodsReceiptItem_id_goods_receipt_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceiptItem"
    ADD CONSTRAINT "GoodsReceiptItem_id_goods_receipt_fkey" FOREIGN KEY (id_goods_receipt) REFERENCES public."GoodsReceipt"(id) ON DELETE CASCADE;


--
-- Name: GoodsReceiptItem GoodsReceiptItem_id_purchase_order_item_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceiptItem"
    ADD CONSTRAINT "GoodsReceiptItem_id_purchase_order_item_fkey" FOREIGN KEY (id_purchase_order_item) REFERENCES public."PurchaseOrderItem"(id);


--
-- Name: GoodsReceipt GoodsReceipt_id_purchase_order_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceipt"
    ADD CONSTRAINT "GoodsReceipt_id_purchase_order_fkey" FOREIGN KEY (id_purchase_order) REFERENCES public."PurchaseOrder"(id);


--
-- Name: GoodsReceipt GoodsReceipt_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceipt"
    ADD CONSTRAINT "GoodsReceipt_id_user_fkey" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: Notification Notification_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_id_user_fkey" FOREIGN KEY (id_user) REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_id_product_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_id_product_type_fkey" FOREIGN KEY (id_product_type) REFERENCES public."ProductType"(id);


--
-- Name: PurchaseOrderItem PurchaseOrderItem_id_purchase_order_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_id_purchase_order_fkey" FOREIGN KEY (id_purchase_order) REFERENCES public."PurchaseOrder"(id);


--
-- Name: PurchaseOrder PurchaseOrder_id_factory_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_id_factory_fkey" FOREIGN KEY (id_factory) REFERENCES public."Factory"(id);


--
-- Name: PurchaseOrder PurchaseOrder_id_supplier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_id_supplier_fkey" FOREIGN KEY (id_supplier) REFERENCES public."Supplier"(id);


--
-- Name: PurchaseOrder PurchaseOrder_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_id_user_fkey" FOREIGN KEY (id_user) REFERENCES public."User"(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 390fhVTcNWWg1g0lD6amc90VRCZLvqr3phrDzLXx5r7deZcpN0t8aobIhcKrQ3c

