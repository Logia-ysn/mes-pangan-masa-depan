# Development Log - ERP Pangan Masa Depan

## 🟢 Status: Phase 25 — Mobile Navigation Final Integrity
**Date**: Feb 16, 2026
**Current Version**: 2.17.1

### ✅ Phase 25: Mobile Navigation Final Integrity (Feb 16, 2026)
Resolved a subtle rendering bug where the navigation sidebar appeared blurred and non-interactive on specific mobile devices despite correct layout.
1. **DOM Order Optimization** — Moved `<Sidebar />` to the very end of the main Layout container to ensure the browser paints it on top of the blurred overlay.
2. **Z-Index Maximization** — Applied `z-index: 9999` to the sidebar to override any overlapping header or toast elements.
3. **Background Hardening** — Switched mobile sidebar from semi-transparent glass to solid white to block the "blur-under-blur" effect that was degrading text clarity.
4. **Full local backup** — Created version tag `v2.17.1` and secured all documentation updates.

### ✅ Phase 24: Mobile UI Reconstruction & Final Polishing (Feb 15, 2026)
Successfully overhauled the mobile user experience to fix a "broken" layout and standardized navigational patterns.
1. **Responsive Refactor** — Implemented horizontal scrolling for factory selectors across all 10+ pages, preventing layout wrapping on small screens.
2. **Typography Scaling** — Added CSS media queries for global typography (h1-h3) to ensure text fits comfortably on mobile viewports.
3. **Header Optimization** — Refactored the global header to hide non-essential search bars and subtitles on mobile, resolving overlap issues.
4. **Build Optimization** — Cleaned up unused imports and linting errors in Invoices and Purchase Orders to ensure production build stability.
5. **Direct Deployment** — Successfully verified build and pushed to Vercel (Frontend) and Railway (Backend).

### ✅ Phase 23: System Security Hardening & Transactional Integrity (Feb 15, 2026)

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
