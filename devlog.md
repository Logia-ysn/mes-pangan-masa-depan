# Development Log - ERP Pangan Masa Depan

## 🟢 Status: Phase 23 — System Security Hardening & Transactional Integrity
**Date**: Feb 15, 2026
**Current Version**: 2.15.0

### ✅ Phase 23: System Security Hardening & Transactional Integrity (Feb 15, 2026)
Successfully completed a deep-dive security hardening and architectural refactoring based on the latest System Audit.
1. **Transactional Integrity** — Refactored `StockService` to support passthrough transactions. Fixed `InvoiceService` and `PurchaseOrderService` to ensure inventory movements are committed atomically with their parent records.
2. **Security Hardening** — Added input validation layers to creation endpoints and normalized ID inputs (Number conversion) across all path param handlers.
3. **Frontend Architecture** — Implemented `useFactory` custom hook for global factory context management and selection persistence.
4. **Data Optimization** — Unified dashboard statistics data flow and improved is_active filter mapping for core master data entities.

### ✅ Phase 22: Comprehensive Code Audit & Integrity Fixes (Feb 15, 2026)

### ✅ Phase 20: Inter-Factory Stock Transfer (Feb 15, 2026)
Implemented the core business requirement for moving semi-finished products between production sites.
1. **Transfer API** — Created `POST /stocks/transfer` endpoint with robust transactional logic.
2. **Transfer UI** — Added a swap-oriented modal with pre-fill capabilities and real-time available stock validation.
3. **Transfer History** — Integrated a dedicated history table to track movements between factories with user-provided notes.
4. **Enhanced Filtering** — Supported `reference_type` filtering in stock movements for cleaner data retrieval.

### ✅ Phase 19: Invoice View & Print Fix (Feb 15, 2026)
Resolved critical issues in the Sales module where invoice details were inaccessible and the printing process was cumbersome.
1. **Invoice Detail Fix** — Fixed Prisma validation error by correctly parsing numeric IDs in the backend handler.
2. **Direct Print Dialog** — Implemented a hidden iframe mechanism in the frontend to trigger the browser's print service directly, bypassing the manual download-and-open step.
3. **Painless PDF Delivery** — Refactored backend PDF service to return a full Buffer, ensuring documentation is delivered reliably without stream interruptions.

### ✅ Phase 18: Dummy Generator & Data Management (Feb 15, 2026)
Overhauled the dummy data generation system to support multi-factory production flows, integrated Sales/Purchasing modules, and implemented a tagging system for safe dummy data removal and system-wide hard resets.

### ✅ Phase 17.1: Location Relation Fix (Feb 15, 2026)
Fixed "Unknown" display in raw material table by fetching deep relations (`Stock.Factory`) from backend repository and updating frontend mapping logic.
7.  **Delete Permission Fix** — Changed deletion requirement from `ADMIN` to `OPERATOR` in `T_deleteStockMovement.ts` to allow users to fix their own data entry errors.
8.  **Filter Logic Alignment** — Fixed factory filtering bug by ensuring strict numeric comparison in the frontend (`Number(factoryId) === Number(selectedFactory)`), resolving issues where data disappeared under specific filters.
9.  **Backend Deployment Sync** — Performed clean build and server restart to ensure repository changes (nested includes) are active in the production bundle.

### ✅ Phase 17: Multi-Factory Logic & Bug Fixes (Feb 15, 2026)
1.  **Factory ID Bug** — Fixed issue where raw material movements were missing `id_factory` because they were stored directly in `StockMovement` but only linked to `Stock` (which is per-factory).
2.  **Stock Filtering** — Updated `RawMaterialReceipt.tsx` to filter stock by both `id_factory` and `id_product_type`.
3.  **UI Warnings** — Added "Please select a factory" to the create form if no factory is selected.
4.  **Backend Verification** — Verified that the stock API and repository correctly handle multi-column filtering (`id_factory` + `id_product_type`).
5.  **Machines Fix** — Resolved hardcoded factory ID issue in the Machines module form state.

### ✅ Phase 16: Print Receipt Implementation (Feb 15, 2026)
Implemented a professional browser-based printing system for raw material receipts, allowing users to generate physical documentation of incoming batches.
