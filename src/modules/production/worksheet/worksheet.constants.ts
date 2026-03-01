/**
 * Worksheet Constants
 * Single source of truth for all worksheet-related constants
 * 
 * @module worksheet.constants
 */

// ─── Process Steps ──────────────────────────────────────────────
// Production process steps for PMD 1
export const PROCESS_STEPS = {
    DRYING: 'DRYING',                   // Pengeringan: GKP -> GKG
    HUSKING: 'HUSKING',                 // Penggilingan: GKG -> PK + Sekam
    STONE_POLISHING: 'STONE_POLISHING'  // Poles: PK -> Glosor + Bekatul
} as const;

export type ProcessStep = typeof PROCESS_STEPS[keyof typeof PROCESS_STEPS];

// ─── Shift Configuration ────────────────────────────────────────
export const SHIFT_CONFIG = {
    SHIFT_1: { label: 'Shift 1', class: 'badge-info' },
    SHIFT_2: { label: 'Shift 2', class: 'badge-warning' },
    SHIFT_3: { label: 'Shift 3', class: 'badge-muted' },
    SHIFT_4: { label: 'Shift 4', class: 'badge-success' }
} as const;

export type ShiftKey = keyof typeof SHIFT_CONFIG;

// ─── Status Configuration ───────────────────────────────────────
export const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
    SUBMITTED: { label: 'Menunggu', color: '#1d4ed8', bg: '#dbeafe' },
    COMPLETED: { label: 'Selesai', color: '#15803d', bg: '#dcfce7' },
    REJECTED: { label: 'Ditolak', color: '#b91c1c', bg: '#fee2e2' },
    CANCELLED: { label: 'Batal', color: '#374151', bg: '#e5e7eb' },
} as const;

export type WorksheetStatus = keyof typeof STATUS_CONFIG;

// ─── Status Filter Options ──────────────────────────────────────
export const STATUS_FILTERS = [
    { value: '', label: 'Semua Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Menunggu Approval' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
] as const;

// ─── Side Product Auto-Calc Defaults ────────────────────────────
export const SIDE_PRODUCT_AUTO_PERCENTAGE = {
    SEKAM: 15,  // 15% of total input weight
} as const;

// ─── Workflow Transitions ───────────────────────────────────────
// Which statuses are allowed to transition to which other statuses
export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['COMPLETED', 'REJECTED'],
    REJECTED: ['SUBMITTED', 'CANCELLED'],  // Re-submit after edit
    COMPLETED: ['CANCELLED'],               // Cancel with stock reversal
    CANCELLED: [],                          // Terminal state
};

// ─── Deletable Statuses ─────────────────────────────────────────
export const DELETABLE_STATUSES: WorksheetStatus[] = ['DRAFT', 'REJECTED', 'CANCELLED'];
export const EDITABLE_STATUSES: WorksheetStatus[] = ['DRAFT', 'REJECTED'];
