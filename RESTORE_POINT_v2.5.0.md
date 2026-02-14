# RESTORE POINT v2.5.0 (Worksheet Refactor)
**Date:** 2026-02-14
**Description:** Restore point captured after major refactoring of the production worksheet module. The form logic has been extracted from `Worksheets.tsx` into a standalone `WorksheetForm.tsx` page.

## Key Changes in this Release

### 1. Standalone Worksheet Form (`frontend/src/pages/production/WorksheetForm.tsx`)
**Change:** A new page dedicated to creating and editing worksheets, pre-filling data for edit mode.
- Supports `/production/worksheets/new`
- Supports `/production/worksheets/:id/edit`

### 2. Streamlined Worksheets List (`frontend/src/pages/production/Worksheets.tsx`)
**Change:** Removed all form logic, reducing file size by ~80%. Now focuses only on the list view and aggregate stats.
- Integrated `navigate()` for routing to the new form page.

### 3. Routing Update (`frontend/src/App.tsx`)
**Change:** Added lazy-loaded routes for the new standalone form.
```tsx
const WorksheetForm = lazy(() => import('./pages/production/WorksheetForm'));
// ...
<Route path="/production/worksheets/new" element={<WorksheetForm />} />
<Route path="/production/worksheets/:id/edit" element={<WorksheetForm />} />
```

### 4. Version Bump
- Backend: `v2.5.0`
- Frontend: `v1.4.0`

## How to Restore
Revert commit if any regressions occur in the worksheet production flow. All critical business logic (HPP calculation, yield display) has been verified during refactor.

## Active Status
- Core Production: Stable
- Mobile UI: Stable
- Framework Alignment: Stable
