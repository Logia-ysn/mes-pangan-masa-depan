# Development Log - ERP Pangan Masa Depan

## 🟢 Status: Phase 29 — Material Receipt Approval Flow & PDF Enhancement
**Date**: Feb 23, 2026
**Current Version**: 2.23.0

### ✅ Phase 29: Material Receipt Approval Flow & PDF Enhancement (Feb 23, 2026)
Major overhaul of the Raw Material Receipt module introducing a formal approval/payment workflow and significant PDF improvements.
1. **MaterialReceipt Model** — Created a dedicated `MaterialReceipt` database model replacing the previous stock-movement-only approach. Full relational links to `Supplier`, `Factory`, `ProductType`, `StockMovement`, and `User` (operator, approver, payer).
2. **3-Step Workflow** — Implemented `WAITING_APPROVAL → APPROVED → PAID` status lifecycle with role-based actions and timestamp tracking (`approved_at`, `paid_at`).
3. **PaymentModal Component** — New modal for recording payments with method selection (Cash/Transfer/Giro) and payment reference entry.
4. **Receipt Number System** — Auto-generated unique receipt numbers (`RCV-YYMMDD-SEQ`) for formal documentation.
5. **Quarantine Stock** — Added `quarantine_quantity` field to `Stock` model for tracking incoming material before QC approval.
6. **Invoice PDF Watermark** — Status-based watermark stamps (DRAFT/SENT/PAID/PARTIAL/CANCEL) on invoice PDF reports with diagonal text and corner badge.
7. **Material Receipt PDF** — Full-page professional PDF for material receipts with company header, quality analysis results, and signature blocks.
8. **Status Filter UI** — Added receipt status filter (Semua/Menunggu/Disetujui/Lunas) on the Raw Material Receipt page.
9. **Quality Analysis Visual (Global Only)** — Refined `GreenPercentage` calculation to always use global parameters regardless of variety selection.
10. **Density Unit Cleanup** — Removed verbose density conversion comments and standardized to `g/ml` with 3-decimal precision.

### ✅ Phase 28: Quality Analysis Logic Refinement (Feb 22, 2026)
Successfully refined the Quality Analysis (QA) system to support dynamic density units and specific-to-global parameter fallback logic.
1. **Density Unit Standard (g/ml)** — Updated the density calculation from g/L to g/ml (standard range 0.6 - 1.0) with 3-decimal precision as per industrial requirements.
2. **Specific > Global Fallback Logic** — Re-engineered the backend `QualityAnalysisService` and frontend `QualityAnalysisModal` to prioritize variety-specific parameters (e.g., IR 64 Density) with automatic fallback to Global (General) parameters if no specific config exists.
3. **Visual Analysis (Global Only)** — Standardized "Green Percentage" and "Color" analysis to always use global parameters, regardless of rice variety selection.
4. **PDF Reporting** — Updated the Material Receipt PDF to display Density in `g/ml` instead of `kg/hL` for data consistency.
5. **Database Parameter Sync** — Seeded comprehensive density and moisture level configurations (IR Specific and Global General) to eliminate "Out of Range" errors.

### ✅ Phase 27: Automated Batch Numbering System (Feb 16, 2026)
Implemented a standardized, automated batch code generation system integrated across all production modules.
1. **BatchNumberingService** — Central service for generating batch codes for raw materials, finished goods, side products, and intermediate products with atomic daily sequence numbering.
2. **Database Schema** — Added `BatchCodeMapping` and `BatchSequence` models for extensible parameter-to-code mapping and daily sequence tracking.
3. **Goods Receipt Integration** — Auto-generates batch codes when receiving raw materials through purchase orders.
4. **Worksheet Integration** — Auto-generates output batch codes and side product batch codes during worksheet creation.
5. **Stock Movement Traceability** — Every stock movement now records the associated `batch_code` for full audit trail.
6. **Dummy Data Upgrade** — Updated dummy generator to use the new batch numbering system instead of hardcoded formats.
7. **Auto-Seed on Startup** — Default batch code mappings are automatically seeded when the server starts.

### ✅ Phase 26: SKU Logic Refinement & UI Premium Polishing (Feb 16, 2026)
Successfully refined the SKU management system and enhanced the visual identity of the production module.
1. **Optional Brand Logic** — Refactored SKU creation to support product identification using only Level and Variety (e.g., "Medium - IR") without requiring a Brand.
2. **Factory-Product Linking** — Implemented automatic `FactoryMaterialConfig` linkage during SKU creation, ensuring new products are immediately visible in the production dropdowns.
3. **UI/UX Premium Redesign** — Overhauled the SKU Selector and "Output Product & Process" section with 1.5px borders, 12px border-radius, and micro-animations to match high-end design standards.
4. **Dummy Data Evolution** — Upgraded the Dummy Generator to seed the new material classification system (RiceVariety, RiceLevel, RiceBrand) and generate complex production workflows.
5. **System Reset Integrity** — Fixed Hard Reset functionality to handle the expanded database schema and foreign key dependencies (ProcessCategory, FactoryMaterialConfig).

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
