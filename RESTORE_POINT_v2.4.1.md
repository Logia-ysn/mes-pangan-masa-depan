# RESTORE POINT v2.4.1 (Critical Hotfixes)
**Date:** 2026-02-13
**Description:** Restore point captured after applying critical hotfixes for production stability (BigInt serialization, Stock Detection, Auto-Factory creation).

## Key Files Modified in this Release

### 1. Backend Entry Point (`index.ts`)
**Change:** Patched `BigInt` prototype to allow JSON serialization.
```typescript
// --- BigInt Serialization Patch ---
// Prevent "Do not know how to serialize a BigInt" error in JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
```

### 2. Stock Movement Handler (`implementation/T_createStockMovement.ts`)
**Change:** Explicit BigInt conversion and role downgrade to OPERATOR.
```typescript
export const t_createStockMovement: T_createStockMovement = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'OPERATOR');
  // ...
  reference_id: reference_id !== undefined ? BigInt(reference_id) : null,
  // ...
});
```

### 3. Raw Material Receipt (`frontend/src/pages/production/RawMaterialReceipt.tsx`)
**Change:** Fixed stock array detection and added missing 'code' for new entities.
```typescript
// Stock detection fix
const stocksResponse = await stockApi.getAll();
const stocks = Array.isArray(stocksResponse.data) ? stocksResponse.data : stocksResponse.data?.data || [];

// Factory creation fix
const newFactoryRes = await api.post('/factories', {
    code: 'F001',
    // ...
});
```

## How to Restore
If v2.4.1 causes regressions, revert to the commit tagged `v2.4.0` or restore files from `RESTORE_POINT_v2.3.0.md`.

## Active Services
- **Backend:** Port 3000 (Production) / 3005 (Dev)
- **Frontend:** Port 3006 (Dev)
- **Database:** Port 5434 (Docker)
- **ML Service:** Port 8000
