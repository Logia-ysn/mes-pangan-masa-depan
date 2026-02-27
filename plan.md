# Plan: Konfigurasi Pabrik Global & Scalable

## Context

Lokasi pabrik saat ini di-hardcode di banyak tempat (PMD 1 - Penggilingan, PMD 2 - Finishing). Nama pabrik menyertakan jenis proses produksi, padahal seharusnya hanya tag lokasi. Tidak ada UI untuk manage pabrik. Perubahan ini akan:

1. Membuat PMD 1 dan PMD 2 hanya sebagai tag lokasi (tanpa deskripsi proses produksi)
2. Proses produksi di-input manual saat entry worksheet (sudah berjalan via ProcessCategory)
3. Pabrik bisa ditambah/dikurangi via UI admin, dan seluruh sistem menyesuaikan

---

## Step 1: Schema Migration — Tambah `batch_code_prefix` di Factory

### Mengapa

Batch numbering (misal `P1-PD-IR-160226-001`) butuh prefix per pabrik. Saat ini di-hardcode: PMD-1 → P1, PMD-2 → P2. Dengan menambah field `batch_code_prefix` langsung di model Factory, setiap pabrik baru otomatis punya prefix sendiri.

### File: `prisma/schema.prisma`

Di model Factory (line 100-122), tambahkan field `batch_code_prefix` setelah field `phone`:

```diff
 model Factory {
   id                    Int                     @id(map: "PK_6635a0ad5ed4a0499652a126970") @default(autoincrement())
   code                  String                  @unique @db.VarChar(20)
   name                  String                  @db.VarChar(200)
   address               String?
   phone                 String?                 @db.VarChar(20)
+  batch_code_prefix     String?                 @db.VarChar(10)
   is_active             Boolean                 @default(true)
   created_at            DateTime                @default(now()) @db.Timestamp(6)
   // ... relations tetap sama
 }
```

### Jalankan Migration

```bash
cd /Users/yay/Project/erp-pangan-masa-depan/.claude/worktrees/serene-volhard
npx prisma migrate dev --name add_factory_batch_code_prefix
```

### File: `types/model/table/Factory.ts`

Tambah column declaration agar NAIV codegen types menyertakan field baru:

```diff
+  @Column({ type: 'varchar', nullable: true, length: 10 })
+  batch_code_prefix?: string;
```

Cari file ini dan tambahkan deklarasi kolom baru sejajar dengan kolom lainnya (code, name, address, phone, dll).

---

## Step 2: Update Backend Handlers

### File: `types/api/T_createFactory.ts`

Tambahkan `batch_code_prefix` ke body type. Cari class body definition dan tambahkan:

```diff
+  @IsNotEmpty()
+  @IsString()
+  batch_code_prefix: string;
```

### File: `types/api/T_updateFactory.ts`

Tambahkan `batch_code_prefix` sebagai optional field di body type:

```diff
+  @IsOptional()
+  @IsString()
+  batch_code_prefix?: string;
```

### File: `implementation/T_createFactory.ts`

Di handler create factory, pastikan `batch_code_prefix` di-extract dari req.body dan di-pass ke create. Cari bagian yang destructure req.body dan tambahkan `batch_code_prefix`:

```diff
- const { code, name, address, phone } = req.body;
+ const { code, name, address, phone, batch_code_prefix } = req.body;
```

Dan pastikan field tersebut ikut di-persist ke database (biasanya sudah otomatis jika pakai spread operator atau repository pattern yang ada).

### File: `implementation/T_updateFactory.ts`

Sama, pastikan `batch_code_prefix` bisa di-update:

```diff
- const { code, name, address, phone, is_active } = req.body;
+ const { code, name, address, phone, is_active, batch_code_prefix } = req.body;
```

---

## Step 3: Cleanup Batch Numbering Service

### File: `src/services/batch-numbering.service.ts`

#### 3a. Hapus FALLBACK_FACTORY_MAP (lines 15-18)

Hapus seluruh constant ini:

```diff
- const FALLBACK_FACTORY_MAP: Record<string, string> = {
-     'PMD-1': 'P1',
-     'PMD-2': 'P2',
- };
```

#### 3b. Rewrite `getFactoryBatchCode()` (line 254-257)

Ganti method ini agar ambil `batch_code_prefix` dari Factory record:

```typescript
private static async getFactoryBatchCode(factoryCode: string, db: any): Promise<string> {
    // 1. Ambil langsung dari Factory record
    const factory = await db.factory.findFirst({
        where: { code: factoryCode },
        select: { batch_code_prefix: true }
    });
    if (factory?.batch_code_prefix) return factory.batch_code_prefix;

    // 2. Fallback ke BatchCodeMapping table (backward compat)
    const mapped = await this.getMapping('FACTORY', factoryCode, db);
    if (mapped) return mapped;

    // 3. Last resort: generic dari kode factory
    return factoryCode.replace(/[^A-Z0-9]/gi, '').substring(0, 4).toUpperCase();
}
```

#### 3c. Hapus PMD-specific entries dari `seedDefaultMappings()`

Cari method `seedDefaultMappings()` (sekitar line 320-340). Hapus 2 baris ini:

```diff
-  { param_type: 'FACTORY', param_key: 'PMD-1', batch_code: 'P1' },
-  { param_type: 'FACTORY', param_key: 'PMD-2', batch_code: 'P2' },
```

Sisakan semua mapping JENIS, VARIETAS, dan LEVEL — itu tetap valid.

#### 3d. Hapus referensi FALLBACK_FACTORY_MAP di tempat lain

Cari semua referensi `FALLBACK_FACTORY_MAP` di file ini dan hapus atau ganti sesuai logic baru di 3b.

---

## Step 4: Update worksheet.service.ts

### File: `src/services/worksheet.service.ts`

Cari line 101 yang berisi fallback ke PMD-1:

```diff
- const factoryCode = factory?.code || 'PMD-1';
+ if (!factory) throw new Error(`Factory with id ${dto.id_factory} not found`);
+ const factoryCode = factory.code;
```

Fail fast lebih baik daripada diam-diam pakai factory yang salah.

---

## Step 5: Update Seed & Dummy Data

### File: `src/seed/initial-setup/data.ts` (lines 17-20)

Ubah nama factory jadi generic (tanpa deskripsi proses) dan tambah `batch_code_prefix`:

```diff
 export const INITIAL_FACTORIES = [
-    { code: 'PMD-1', name: 'PMD 1 - Penggilingan', address: 'Jl. Raya Padi No.1, Karawang' },
-    { code: 'PMD-2', name: 'PMD 2 - Finishing', address: 'Jl. Raya Beras No.2, Karawang' },
+    { code: 'PMD-1', name: 'PMD 1', address: 'Jl. Raya Padi No.1, Karawang', batch_code_prefix: 'P1' },
+    { code: 'PMD-2', name: 'PMD 2', address: 'Jl. Raya Beras No.2, Karawang', batch_code_prefix: 'P2' },
 ];
```

### File: `src/seed/initial-setup/seeder.ts` (line 35)

Ganti hardcoded PMD-1 lookup jadi generic (ambil factory pertama):

```diff
- const factory = await tx.factory.findFirst({ where: { code: 'PMD-1' } });
+ const factory = await tx.factory.findFirst({ where: { is_active: true }, orderBy: { id: 'asc' } });
```

### File: `src/services/dummy.service.ts` (lines 48-49)

Update nama factory di dummy data:

```diff
- const pmd1 = await this.ensureFactory(tx, 'PMD-1', 'PMD 1 - Penggilingan', 'Jl. Raya Padi No.1, Karawang');
- const pmd2 = await this.ensureFactory(tx, 'PMD-2', 'PMD 2 - Finishing', 'Jl. Raya Beras No.2, Karawang');
+ const pmd1 = await this.ensureFactory(tx, 'PMD-1', 'PMD 1', 'Jl. Raya Padi No.1, Karawang');
+ const pmd2 = await this.ensureFactory(tx, 'PMD-2', 'PMD 2', 'Jl. Raya Beras No.2, Karawang');
```

Pastikan juga `ensureFactory` method menyertakan `batch_code_prefix` jika perlu (misal tambahkan parameter ke method atau set default).

---

## Step 6: Cleanup Frontend Hook `useFactory`

### File: `frontend/src/hooks/useFactory.ts`

#### 6a. Update interface Factory

```diff
 interface Factory {
     id: number;
     code: string;
     name: string;
+    is_active?: boolean;
+    batch_code_prefix?: string;
 }
```

#### 6b. Hapus PMD filter dan PMD-1 default

Ganti isi `fetchFactories`:

```diff
 const fetchFactories = async () => {
     try {
         setLoading(true);
-        const res = await factoryApi.getAll();
+        const res = await factoryApi.getAll({ limit: 100 });
         const data = res.data?.data || res.data || [];
-        const pmdFactories = data.filter((f: Factory) => f.code.startsWith('PMD'));
-        setFactories(pmdFactories);
+        const activeFactories = data.filter((f: Factory) => f.is_active !== false);
+        setFactories(activeFactories);

         // Set default if none selected or previous selection not in list
-        if (selectedFactory === null) {
-            const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
-            const defaultId = pmd1 ? pmd1.id : (pmdFactories.length > 0 ? pmdFactories[0].id : null);
+        if (selectedFactory === null || !activeFactories.find((f: Factory) => f.id === selectedFactory)) {
+            const defaultId = activeFactories.length > 0 ? activeFactories[0].id : null;
             if (defaultId) {
                 setSelectedFactory(defaultId);
                 localStorage.setItem('selectedFactoryId', String(defaultId));
             }
         }
     } catch (error) {
```

---

## Step 7: Cleanup Frontend Pages — Hapus Semua Hardcoded PMD

### File: `frontend/src/pages/production/WorksheetForm.tsx`

#### 7a. Hapus PMD filter (lines 166-175)

Cari bagian `fetchData` atau `useEffect` yang fetch factories, lalu:

```diff
- const pmdFactories = allFactories.filter((f: Factory) => f.code.startsWith('PMD'));
- setFactories(pmdFactories);
- const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
- setSelectedFactory(pmd1?.id || pmdFactories[0].id);
+ const activeFactories = allFactories.filter((f: any) => f.is_active !== false);
+ setFactories(activeFactories);
+ if (activeFactories.length > 0) {
+     setSelectedFactory(activeFactories[0].id);
+ }
```

Juga pastikan fetch-nya pass `limit: 100`.

#### 7b. FIX BUG — Machine filter (line ~627)

Cari filter machines yang ada `|| true` dan hapus:

```diff
- machines.filter(m => !selectedFactory || m.id_factory === selectedFactory || true)
+ machines.filter(m => !selectedFactory || m.id_factory === selectedFactory)
```

Bug ini menyebabkan semua mesin tampil di semua pabrik — seharusnya mesin di-filter per pabrik yang dipilih.

### File: `frontend/src/pages/production/OEE.tsx` (lines 47-51)

```diff
- const pmdFactories = data.filter((f: Factory) => f.code.startsWith('PMD'));
- setFactories(pmdFactories);
- if (pmdFactories.length > 0) setSelectedFactory(pmdFactories[0].id);
+ const activeFactories = data.filter((f: any) => f.is_active !== false);
+ setFactories(activeFactories);
+ if (activeFactories.length > 0) setSelectedFactory(activeFactories[0].id);
```

### File: `frontend/src/pages/production/RendemenMonitor.tsx` (lines 39-40)

```diff
- const filtered = d.filter((f: any) => f.code?.startsWith('PMD'));
+ const filtered = d.filter((f: any) => f.is_active !== false);
```

### File: `frontend/src/pages/Settings.tsx` (line 374)

Cari teks yang menyebut "PMD 1 & PMD 2" dan ganti:

```diff
- <strong>Generate Dummy:</strong> Membuat data sample produksi (PMD 1 &amp; PMD 2), stok, worksheet, invoice...
+ <strong>Generate Dummy:</strong> Membuat data sample produksi, stok, worksheet, invoice, dan purchase order.
```

---

## Step 8: Buat Halaman Manajemen Pabrik

### File baru: `frontend/src/pages/admin/Factories.tsx`

Buat halaman CRUD pabrik mengikuti pattern dari `frontend/src/pages/purchasing/Suppliers.tsx`. Strukturnya:

```tsx
import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { factoryApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Factory {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    batch_code_prefix?: string;
    is_active: boolean;
}

const Factories = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [newFactory, setNewFactory] = useState({
        code: '', name: '', address: '', phone: '', batch_code_prefix: ''
    });

    useEffect(() => { fetchFactories(); }, []);

    const fetchFactories = async () => {
        setLoading(true);
        try {
            const res = await factoryApi.getAll({ limit: 100 });
            setFactories(res.data?.data || []);
        } catch (e) {
            logger.error(e);
            showError("Gagal", "Tidak dapat mengambil data pabrik");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newFactory.code || !newFactory.name || !newFactory.batch_code_prefix) {
            showError("Validasi", "Kode, Nama, dan Kode Batch wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await factoryApi.create(newFactory);
            setNewFactory({ code: '', name: '', address: '', phone: '', batch_code_prefix: '' });
            fetchFactories();
            showSuccess("Berhasil", "Pabrik berhasil ditambahkan");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (factory: Factory) => {
        setLoading(true);
        try {
            await factoryApi.update(factory.id, { is_active: !factory.is_active });
            fetchFactories();
            showSuccess("Berhasil", `Pabrik ${factory.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus pabrik ini? Hanya bisa dihapus jika belum ada data terkait.')) return;
        setLoading(true);
        try {
            await factoryApi.delete(id);
            fetchFactories();
            showSuccess("Berhasil", "Pabrik berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || "Pabrik tidak bisa dihapus karena masih ada data terkait. Gunakan nonaktifkan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Manajemen Pabrik</h3>
                        <p className="card-subtitle">Kelola lokasi pabrik/plant</p>
                    </div>
                    <span className="badge badge-primary">{factories.length} pabrik</span>
                </div>
                <div style={{ padding: 24 }}>
                    {/* Add Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 140px 100px auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kode *</label>
                            <input type="text" className="form-input" placeholder="PMD-3"
                                value={newFactory.code}
                                onChange={e => setNewFactory({ ...newFactory, code: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nama Pabrik *</label>
                            <input type="text" className="form-input" placeholder="PMD 3"
                                value={newFactory.name}
                                onChange={e => setNewFactory({ ...newFactory, name: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Alamat</label>
                            <input type="text" className="form-input" placeholder="Jl. ..."
                                value={newFactory.address}
                                onChange={e => setNewFactory({ ...newFactory, address: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Telepon</label>
                            <input type="text" className="form-input" placeholder="08xxx"
                                value={newFactory.phone}
                                onChange={e => setNewFactory({ ...newFactory, phone: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kode Batch *</label>
                            <input type="text" className="form-input" placeholder="P3" maxLength={4}
                                value={newFactory.batch_code_prefix}
                                onChange={e => setNewFactory({ ...newFactory, batch_code_prefix: e.target.value.toUpperCase() })} />
                        </div>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Tambah
                        </button>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                        Kode Batch digunakan sebagai prefix pada nomor batch produksi (maks 4 karakter, contoh: P1, P2, F1).
                    </p>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama</th>
                                    <th>Alamat</th>
                                    <th>Telepon</th>
                                    <th>Kode Batch</th>
                                    <th>Status</th>
                                    <th style={{ width: 120 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factories.map(f => (
                                    <tr key={f.id} style={{ opacity: f.is_active ? 1 : 0.5 }}>
                                        <td><code>{f.code}</code></td>
                                        <td>{f.name}</td>
                                        <td>{f.address || '-'}</td>
                                        <td>{f.phone || '-'}</td>
                                        <td><code>{f.batch_code_prefix || '-'}</code></td>
                                        <td>
                                            <span className={`badge ${f.is_active ? 'badge-success' : 'badge-warning'}`}>
                                                {f.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-icon btn-sm"
                                                onClick={() => handleToggleActive(f)}
                                                title={f.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                                <span className="material-symbols-outlined">
                                                    {f.is_active ? 'toggle_on' : 'toggle_off'}
                                                </span>
                                            </button>
                                            <button className="btn btn-ghost btn-icon btn-sm"
                                                onClick={() => handleDelete(f.id)} title="Hapus">
                                                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {factories.length === 0 && !loading && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                                        Tidak ada data pabrik
                                    </td></tr>
                                )}
                                {loading && factories.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                                        Memuat data...
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Factories;
```

---

## Step 9: Wire Up Routes & Sidebar

### File: `frontend/src/App.tsx`

Tambah lazy import di bagian atas (di antara import lazy lainnya):

```tsx
const Factories = React.lazy(() => import('./pages/admin/Factories'));
```

Tambah route di bagian admin routes (cari `/admin/` routes):

```tsx
<Route path="factories" element={
    <RoleGuard requiredRole="ADMIN"><Factories /></RoleGuard>
} />
```

### File: `frontend/src/components/Layout/Sidebar.tsx`

Di Admin Panel section (sekitar line 91-98), tambahkan entry baru:

```diff
  { label: 'Manajemen User', to: '/admin/users' },
  { label: 'Data Karyawan', to: '/admin/employees' },
  { label: 'Absensi Karyawan', to: '/admin/attendance' },
+ { label: 'Manajemen Pabrik', to: '/admin/factories' },
  { label: 'Log Audit', to: '/admin/audit-logs' },
```

---

## Urutan Eksekusi

Jalankan step-step di atas secara berurutan:

1. **Step 1** — Schema migration (semua step lain bergantung pada field baru ini)
2. **Step 2** — Backend handlers (agar API bisa terima field baru)
3. **Step 3** — Batch numbering cleanup
4. **Step 4** — Worksheet service cleanup
5. **Step 5** — Seed & dummy data
6. **Step 6** — Frontend hook `useFactory`
7. **Step 7** — Frontend pages (hapus semua hardcoded PMD + fix machine filter bug)
8. **Step 8** — Halaman Manajemen Pabrik baru
9. **Step 9** — Routes & sidebar

---

## Verifikasi

Setelah semua selesai:

1. `npx prisma migrate dev` — harus berhasil tanpa error
2. `npm run build` (frontend & backend) — harus berhasil tanpa error
3. Test manual:
   - Buka Admin Panel > Manajemen Pabrik
   - Coba tambah pabrik baru (misal PMD-3, prefix P3)
   - Buat worksheet baru — factory baru harus muncul di pilihan
   - Batch code harus pakai prefix yang benar (P3-xxx-xxx)
   - Nonaktifkan pabrik — harus hilang dari pilihan worksheet
   - Mesin hanya tampil sesuai pabrik yang dipilih (bug fix)
4. Factory PMD-1 dan PMD-2 tetap berfungsi normal (backward compatible)

---

## File-File yang Dimodifikasi

| # | File | Aksi |
|---|------|------|
| 1 | `prisma/schema.prisma` | Edit — tambah `batch_code_prefix` |
| 2 | `types/model/table/Factory.ts` | Edit — tambah column declaration |
| 3 | `types/api/T_createFactory.ts` | Edit — tambah field di body |
| 4 | `types/api/T_updateFactory.ts` | Edit — tambah field di body |
| 5 | `implementation/T_createFactory.ts` | Edit — extract `batch_code_prefix` |
| 6 | `implementation/T_updateFactory.ts` | Edit — extract `batch_code_prefix` |
| 7 | `src/services/batch-numbering.service.ts` | Edit — hapus hardcoded PMD, rewrite getFactoryBatchCode |
| 8 | `src/services/worksheet.service.ts` | Edit — hapus PMD-1 fallback |
| 9 | `src/seed/initial-setup/data.ts` | Edit — update nama + tambah prefix |
| 10 | `src/seed/initial-setup/seeder.ts` | Edit — hapus hardcoded PMD-1 |
| 11 | `src/services/dummy.service.ts` | Edit — update nama factory |
| 12 | `frontend/src/hooks/useFactory.ts` | Edit — hapus PMD filter |
| 13 | `frontend/src/pages/production/WorksheetForm.tsx` | Edit — hapus PMD filter + fix machine bug |
| 14 | `frontend/src/pages/production/OEE.tsx` | Edit — hapus PMD filter |
| 15 | `frontend/src/pages/production/RendemenMonitor.tsx` | Edit — hapus PMD filter |
| 16 | `frontend/src/pages/Settings.tsx` | Edit — hapus teks hardcoded |
| 17 | `frontend/src/pages/admin/Factories.tsx` | **Baru** — halaman manajemen pabrik |
| 18 | `frontend/src/App.tsx` | Edit — tambah route |
| 19 | `frontend/src/components/Layout/Sidebar.tsx` | Edit — tambah menu |
