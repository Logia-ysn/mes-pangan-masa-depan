/**
 * Worksheet Types (Frontend)
 * Single source of truth for all worksheet-related interfaces used in frontend components
 * 
 * Eliminates duplicate interface declarations across:
 * - WorksheetForm.tsx (Factory, Machine, Employee, Stock, ProcessCategory, InputBatch, SideProduct)
 * - Worksheets.tsx (Worksheet interface)
 * - WorksheetDetail.tsx
 */

// ─── Reference Data Types ───────────────────────────────────────

export interface Factory {
    id: number;
    code: string;
    name: string;
    batch_code_prefix?: string;
}

export interface Machine {
    id: number;
    name: string;
    id_factory: number;
    id_process_category?: number;
}

export interface Employee {
    id: number;
    fullname: string;
    position: string;
}

export interface Stock {
    id: number;
    id_factory: number;
    id_product_type: number;
    quantity: number;
    unit: string;
    ProductType?: { id: number; code: string; name: string };
    Factory?: { id: number; code: string; name: string };
}

export interface ProcessCategory {
    id: number;
    code: string;
    name: string;
    is_main_process: boolean;
}

// ─── Worksheet Data Types ───────────────────────────────────────

export interface Worksheet {
    id: number;
    id_factory: number;
    worksheet_date: string;
    shift: string;
    status: string;
    gabah_input: number;
    beras_output: number;
    menir_output: number;
    dedak_output: number;
    sekam_output: number;
    rendemen: number;
    machine_hours: number;
    downtime_hours: number;
    process_steps?: string;
    batch_code?: string;
    production_cost?: number;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    hpp_per_kg?: number;
    rejection_reason?: string;
    // Relations (populated by API)
    otm_id_factory?: { id: number; name: string; code: string };
    otm_id_output_product?: { id: number; code: string; name: string };
    ProductType?: { id: number; code: string; name: string };
    OutputProduct?: { id: number; code: string; name: string };
    otm_id_machine?: { id: number; name: string };
    otm_id_user?: { id: number; fullname: string };
    side_products?: SideProduct[];
    WorksheetInputBatch?: WorksheetInputBatchRelation[];
    input_batches?: WorksheetInputBatchRelation[];
    notes?: string;
    // Workflow timestamps
    submitted_at?: string;
    submitted_by?: number;
    approved_at?: string;
    approved_by?: number;
    completed_at?: string;
    rejected_at?: string;
    rejected_by?: number;
}

// ─── Input Batch Types ──────────────────────────────────────────

export interface InputBatch {
    id_stock: number;
    stock_name: string;     // Display name, e.g. "BTC-2026-001 - Gabah Kering Panen"
    quantity: number;
    unit_price: number;
    batch_code?: string;    // e.g. "P1-PD-IR-160226-001"
}

export interface WorksheetInputBatchRelation {
    id?: number;
    id_stock: number;
    quantity: number;
    unit_price?: number;
    batch_code?: string;
    total_cost?: number;
    Stock?: Stock & { ProductType?: { id: number; code: string; name: string } };
    otm_id_stock?: Stock & { otm_id_product_type?: { name: string } };
}

// ─── Side Product Types ─────────────────────────────────────────

export interface SideProduct {
    id_product_type?: number;
    product_code: string;
    product_name: string;
    quantity: number;
    is_auto: boolean;
    unit_price: number;
    batch_code?: string;
}

// ─── Receipt Batch (for Batch Selection Modal) ──────────────────

export interface ReceiptBatch {
    id: number;
    id_stock: number;
    batchId: string;
    supplier: string;
    category: string;
    productName: string;
    productCode: string;
    qualityGrade: string;
    quantity: number;
    pricePerKg: number;
    otherCosts: number;
    dateReceived: string;
    stockQuantity: number;
}

// ─── HPP Calculation (for client-side display) ──────────────────

export interface HPPCalculation {
    productionCost: number;
    rawMaterialCost: number;
    sideProductRevenue: number;
    hpp: number;
    hppPerKg: number;
}

// ─── Form State ─────────────────────────────────────────────────

export interface WorksheetFormData {
    worksheet_date: string;
    shift: string;
    id_output_product: string;
    selected_processes: string[];
    selected_machines: number[];
    batch_code: string;
    input_batches: InputBatch[];
    beras_output: string;
    side_products: SideProduct[];
    selected_operators: number[];
    production_cost: string;
}
