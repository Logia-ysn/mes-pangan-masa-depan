/**
 * Worksheet Config (Frontend)
 * Shared configuration for worksheet UI components
 * 
 * Single source of truth — replaces duplicate declarations across:
 * - WorksheetForm.tsx (shiftConfig at line 71-76)
 * - Worksheets.tsx (shiftConfig at line 40-45, statusConfig at line 47-53, STATUS_FILTERS at line 55-62)
 * 
 * @sync-with src/modules/production/worksheet/worksheet.constants.ts
 *
 * NOTE: These values MUST stay in sync with the backend constants.
 */

// ─── Shift Configuration ────────────────────────────────────────
export const shiftConfig: Record<string, { label: string; class: string }> = {
    SHIFT_1: { label: 'Shift 1', class: 'badge-info' },
    SHIFT_2: { label: 'Shift 2', class: 'badge-warning' },
    SHIFT_3: { label: 'Shift 3', class: 'badge-muted' },
    SHIFT_4: { label: 'Shift 4', class: 'badge-success' }
};

// ─── Status Configuration ───────────────────────────────────────
export const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
    SUBMITTED: { label: 'Menunggu', color: '#1d4ed8', bg: '#dbeafe' },
    COMPLETED: { label: 'Selesai', color: '#15803d', bg: '#dcfce7' },
    REJECTED: { label: 'Ditolak', color: '#b91c1c', bg: '#fee2e2' },
    CANCELLED: { label: 'Batal', color: '#374151', bg: '#e5e7eb' },
};

// ─── Status Filter Options ──────────────────────────────────────
export const STATUS_FILTERS = [
    { value: '', label: 'Semua Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Menunggu Approval' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
] as const;

// ─── Process Steps ──────────────────────────────────────────────
export const PROCESS_STEPS = {
    DRYING: 'DRYING',
    HUSKING: 'HUSKING',
    STONE_POLISHING: 'STONE_POLISHING'
} as const;

// ─── Side Product Auto-Calc Defaults ────────────────────────────
export const SIDE_PRODUCT_AUTO_PERCENTAGE = {
    SEKAM: 15,  // 15% of total input weight
} as const;

// ─── Deletable / Editable Statuses ──────────────────────────────
export const DELETABLE_STATUSES = ['DRAFT', 'REJECTED', 'CANCELLED'] as const;
export const EDITABLE_STATUSES = ['DRAFT', 'REJECTED'] as const;
