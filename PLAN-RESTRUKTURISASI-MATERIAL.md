# Plan: Restrukturisasi Sistem Material & Produk ERP PMD

## Context

Sistem ERP PMD saat ini menggunakan model `ProductType` flat (hanya code+name) tanpa klasifikasi terstruktur. Plan ini merestrukturisasi agar:
- Pembedaan bahan baku per factory (GKP/GKG untuk PMD-1, PK/Glosor untuk PMD-2)
- SKU beras jadi = Level + Klasifikasi/Varietas + Merk (contoh: "Premium - IR - Walemu")
- 5 produk samping standar (Bekatul, Broken, Menir, Sekam, Reject) dengan batch tracking
- Transfer antar factory terlacak (output PMD-1 → input PMD-2)

**Project root**: `/Users/yay/Project/erp-pangan-masa-depan`
**Frontend**: `/Users/yay/Project/erp-pangan-masa-depan/frontend`

---

## FASE 1: Schema & Master Data (Foundation)

### Step 1A — Prisma Schema Changes

**File**: `prisma/schema.prisma`

#### 1A-1. Tambah 2 enum baru

Tambahkan setelah enum `Notification_severity_enum`:

```prisma
enum ProductCategory {
  RAW_MATERIAL
  INTERMEDIATE
  FINISHED_RICE
  SIDE_PRODUCT
}

enum SideProductType {
  BEKATUL
  BROKEN
  MENIR
  SEKAM
  REJECT
}
```

#### 1A-2. Tambah 3 model master baru

Tambahkan sebelum model `ProductType`:

```prisma
model RiceVariety {
  id               Int                @id @default(autoincrement())
  code             String             @unique @db.VarChar(30)
  name             String             @db.VarChar(100)
  description      String?
  is_active        Boolean            @default(true)
  created_at       DateTime           @default(now())
  ProductType      ProductType[]
  QualityParameter QualityParameter[]
}

model RiceLevel {
  id          Int           @id @default(autoincrement())
  code        String        @unique @db.VarChar(30)
  name        String        @db.VarChar(100)
  sort_order  Int           @default(0)
  is_active   Boolean       @default(true)
  created_at  DateTime      @default(now())
  ProductType ProductType[]
}

model RiceBrand {
  id          Int           @id @default(autoincrement())
  code        String        @unique @db.VarChar(30)
  name        String        @db.VarChar(100)
  is_active   Boolean       @default(true)
  created_at  DateTime      @default(now())
  ProductType ProductType[]
}
```

#### 1A-3. Tambah model FactoryMaterialConfig

```prisma
model FactoryMaterialConfig {
  id              Int         @id @default(autoincrement())
  id_factory      Int
  id_product_type Int
  is_input        Boolean     @default(false)
  is_output       Boolean     @default(false)
  created_at      DateTime    @default(now())
  Factory         Factory     @relation(fields: [id_factory], references: [id])
  ProductType     ProductType @relation(fields: [id_product_type], references: [id])

  @@unique([id_factory, id_product_type])
}
```

#### 1A-4. Modifikasi model ProductType

Ubah model `ProductType` yang saat ini:
```prisma
model ProductType {
  id                Int                 @id @default(autoincrement())
  code              String              @unique @db.VarChar(20)
  name              String              @db.VarChar(100)
  description       String?
  unit              String              @default("kg") @db.VarChar(20)
  InvoiceItem       InvoiceItem[]
  PurchaseOrderItem PurchaseOrderItem[]
  Stock             Stock[]
  Worksheet         Worksheet[]
}
```

Menjadi:
```prisma
model ProductType {
  id                    Int                     @id @default(autoincrement())
  code                  String                  @unique @db.VarChar(50)
  name                  String                  @db.VarChar(200)
  description           String?
  unit                  String                  @default("kg") @db.VarChar(20)
  category              ProductCategory?
  id_variety            Int?
  id_rice_level         Int?
  id_rice_brand         Int?
  side_product_type     SideProductType?
  is_active             Boolean                 @default(true)
  created_at            DateTime                @default(now())
  RiceVariety           RiceVariety?            @relation(fields: [id_variety], references: [id])
  RiceLevel             RiceLevel?              @relation(fields: [id_rice_level], references: [id])
  RiceBrand             RiceBrand?              @relation(fields: [id_rice_brand], references: [id])
  InvoiceItem           InvoiceItem[]
  PurchaseOrderItem     PurchaseOrderItem[]
  Stock                 Stock[]
  Worksheet             Worksheet[]
  WorksheetSideProduct  WorksheetSideProduct[]
  FactoryMaterialConfig FactoryMaterialConfig[]
  WorksheetInput        Worksheet[]             @relation("WorksheetInputProduct")
}
```

#### 1A-5. Modifikasi model WorksheetSideProduct

Tambahkan 2 field baru ke model `WorksheetSideProduct`:

```prisma
model WorksheetSideProduct {
  id                 Int       @id @default(autoincrement())
  id_worksheet       Int
  product_code       String    @db.VarChar(30)
  product_name       String    @db.VarChar(100)
  quantity           Decimal   @default(0) @db.Decimal(15, 2)
  is_auto_calculated Boolean   @default(false)
  auto_percentage    Decimal?  @db.Decimal(10, 2)
  unit_price         Decimal?  @db.Decimal(15, 2)
  total_value        Decimal?  @db.Decimal(15, 2)
  created_at         DateTime  @default(now())
  id_product_type    Int?
  batch_code         String?   @db.VarChar(50)
  Worksheet          Worksheet @relation(fields: [id_worksheet], references: [id])
  ProductType        ProductType? @relation(fields: [id_product_type], references: [id])
}
```

#### 1A-6. Modifikasi model StockMovement

Tambahkan field baru:

```prisma
model StockMovement {
  id                         Int                              @id @default(autoincrement())
  id_stock                   Int
  id_user                    Int
  movement_type              StockMovement_movement_type_enum
  quantity                   Decimal                          @db.Decimal(15, 2)
  reference_type             String?                          @db.VarChar(50)
  reference_id               BigInt?
  notes                      String?
  created_at                 DateTime                         @default(now())
  batch_code                 String?                          @db.VarChar(50)
  transfer_id                Int?
  from_factory_id            Int?
  to_factory_id              Int?
  RawMaterialQualityAnalysis RawMaterialQualityAnalysis[]
  Stock                      Stock                            @relation(fields: [id_stock], references: [id])
  User                       User                             @relation(fields: [id_user], references: [id])

  @@index([batch_code])
  @@index([reference_type])
}
```

#### 1A-7. Modifikasi model Worksheet

Tambahkan field `id_input_product_type` ke model `Worksheet`:

```prisma
// Tambahkan field ini di model Worksheet, setelah field-field existing:
  id_input_product_type Int?

// Tambahkan relasi ini (selain relasi ProductType yang sudah ada):
  InputProductType      ProductType?           @relation("WorksheetInputProduct", fields: [id_input_product_type], references: [id])
```

**PENTING**: Relasi `ProductType` yang sudah ada (`id_output_product`) tetap dipertahankan untuk output. Field baru `id_input_product_type` untuk input.

#### 1A-8. Modifikasi model QualityParameter

Ubah FK dari `RawMaterialVariety` ke `RiceVariety`:

```prisma
// Di model QualityParameter, ganti:
  id_variety         Int?
  RawMaterialVariety RawMaterialVariety? @relation(fields: [id_variety], ...)

// Menjadi:
  id_variety   Int?
  RiceVariety  RiceVariety? @relation(fields: [id_variety], references: [id])
```

**CATATAN**: `RawMaterialVariety.QualityParameter` relation harus dihapus dari model `RawMaterialVariety`.

#### 1A-9. Tambah relasi di model Factory

Tambahkan relasi `FactoryMaterialConfig` di model `Factory`:

```prisma
// Di model Factory, tambahkan:
  FactoryMaterialConfig FactoryMaterialConfig[]
```

#### 1A-10. Run migration

```bash
cd /Users/yay/Project/erp-pangan-masa-depan
npx prisma migrate dev --name restructure_material_system
```

---

### Step 1B — Data Migration Script

**File baru**: `scripts/migrate-material-system.ts`

Script ini dijalankan SETELAH prisma migrate sukses. Urutan eksekusi:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed RiceVariety dari RawMaterialVariety yang ada
  const rawVarieties = await prisma.rawMaterialVariety.findMany();
  for (const rv of rawVarieties) {
    await prisma.riceVariety.upsert({
      where: { code: rv.code },
      update: {},
      create: {
        code: rv.code,
        name: rv.name,
        description: rv.description,
        is_active: rv.is_active,
      },
    });
  }
  console.log(`Seeded ${rawVarieties.length} rice varieties`);

  // 2. Seed RiceLevel (4 level standar)
  const levels = [
    { code: 'MEDIUM', name: 'Medium', sort_order: 1 },
    { code: 'MEDIUM_SUPER', name: 'Medium Super', sort_order: 2 },
    { code: 'PREMIUM', name: 'Premium', sort_order: 3 },
    { code: 'PREMIUM_SUPER', name: 'Premium Super', sort_order: 4 },
  ];
  for (const level of levels) {
    await prisma.riceLevel.upsert({
      where: { code: level.code },
      update: {},
      create: level,
    });
  }
  console.log('Seeded 4 rice levels');

  // 3. Seed RiceBrand awal
  const brands = [
    { code: 'WALEMU', name: 'Walemu' },
    // Tambah merk lain sesuai kebutuhan user
  ];
  for (const brand of brands) {
    await prisma.riceBrand.upsert({
      where: { code: brand.code },
      update: {},
      create: brand,
    });
  }
  console.log(`Seeded ${brands.length} rice brands`);

  // 4. Klasifikasi ProductType existing berdasarkan code
  const allPT = await prisma.productType.findMany();
  for (const pt of allPT) {
    let category: string | null = null;
    let sideProductType: string | null = null;

    const code = pt.code.toUpperCase();
    if (['GKP', 'GKG'].includes(code)) {
      category = 'RAW_MATERIAL';
    } else if (['PK', 'GLOSOR'].includes(code)) {
      category = 'INTERMEDIATE';
    } else if (code.startsWith('BRS')) {
      category = 'FINISHED_RICE';
    } else if (['BEKATUL', 'BROKEN', 'MENIR', 'SEKAM', 'REJECT'].includes(code)) {
      category = 'SIDE_PRODUCT';
      sideProductType = code;
    } else if (['MENIR_JITAY', 'MENIR_GULA'].includes(code)) {
      // Menir variants -> map ke MENIR
      category = 'SIDE_PRODUCT';
      sideProductType = 'MENIR';
    }

    if (category) {
      await prisma.productType.update({
        where: { id: pt.id },
        data: {
          category: category as any,
          side_product_type: sideProductType as any,
        },
      });
    }
  }
  console.log('Classified existing product types');

  // 5. Buat 5 side product standar jika belum ada
  const sideProducts = [
    { code: 'BEKATUL', name: 'Bekatul', side_product_type: 'BEKATUL' },
    { code: 'BROKEN', name: 'Broken', side_product_type: 'BROKEN' },
    { code: 'MENIR', name: 'Menir', side_product_type: 'MENIR' },
    { code: 'SEKAM', name: 'Sekam', side_product_type: 'SEKAM' },
    { code: 'REJECT', name: 'Reject', side_product_type: 'REJECT' },
  ];
  for (const sp of sideProducts) {
    const existing = await prisma.productType.findFirst({ where: { code: sp.code } });
    if (!existing) {
      await prisma.productType.create({
        data: {
          code: sp.code,
          name: sp.name,
          category: 'SIDE_PRODUCT' as any,
          side_product_type: sp.side_product_type as any,
          unit: 'kg',
        },
      });
    }
  }
  console.log('Ensured 5 standard side products exist');

  // 6. Seed FactoryMaterialConfig
  const factories = await prisma.factory.findMany();
  const productTypes = await prisma.productType.findMany();
  const ptMap = Object.fromEntries(productTypes.map(pt => [pt.code, pt.id]));

  for (const f of factories) {
    const code = f.code.toUpperCase().replace('-', '');
    let inputs: string[] = [];
    let outputs: string[] = [];

    if (code === 'PMD1') {
      inputs = ['GKP', 'GKG'];
      outputs = ['PK', 'GLOSOR', 'BEKATUL', 'BROKEN', 'MENIR', 'SEKAM', 'REJECT'];
    } else if (code === 'PMD2') {
      inputs = ['PK', 'GLOSOR'];
      outputs = ['BEKATUL', 'BROKEN', 'MENIR', 'SEKAM', 'REJECT'];
      // FINISHED_RICE outputs are dynamic (created via SKU system), no static config needed
    }

    for (const ptCode of inputs) {
      if (ptMap[ptCode]) {
        await prisma.factoryMaterialConfig.upsert({
          where: {
            id_factory_id_product_type: { id_factory: f.id, id_product_type: ptMap[ptCode] },
          },
          update: { is_input: true },
          create: { id_factory: f.id, id_product_type: ptMap[ptCode], is_input: true, is_output: false },
        });
      }
    }
    for (const ptCode of outputs) {
      if (ptMap[ptCode]) {
        await prisma.factoryMaterialConfig.upsert({
          where: {
            id_factory_id_product_type: { id_factory: f.id, id_product_type: ptMap[ptCode] },
          },
          update: { is_output: true },
          create: { id_factory: f.id, id_product_type: ptMap[ptCode], is_input: false, is_output: true },
        });
      }
    }
  }
  console.log('Seeded factory material configs');

  // 7. Backfill WorksheetSideProduct.id_product_type
  const wsps = await prisma.worksheetSideProduct.findMany();
  for (const wsp of wsps) {
    const pt = await prisma.productType.findFirst({ where: { code: wsp.product_code } });
    if (pt) {
      await prisma.worksheetSideProduct.update({
        where: { id: wsp.id },
        data: { id_product_type: pt.id },
      });
    }
  }
  console.log(`Backfilled ${wsps.length} worksheet side product FK refs`);

  // 8. Backfill QualityParameter id_variety -> RiceVariety
  // Map old RawMaterialVariety ids to new RiceVariety ids by matching code
  const riceVarieties = await prisma.riceVariety.findMany();
  const rvMap = new Map<string, number>();
  for (const rv of rawVarieties) {
    const match = riceVarieties.find(r => r.code === rv.code);
    if (match) rvMap.set(String(rv.id), match.id);
  }
  const qps = await prisma.qualityParameter.findMany({ where: { id_variety: { not: null } } });
  for (const qp of qps) {
    const newId = rvMap.get(String(qp.id_variety));
    if (newId && newId !== qp.id_variety) {
      await prisma.qualityParameter.update({
        where: { id: qp.id },
        data: { id_variety: newId },
      });
    }
  }
  console.log('Remapped quality parameter variety references');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Jalankan**:
```bash
npx ts-node scripts/migrate-material-system.ts
```

---

### Step 1C — Backend CRUD Endpoints

#### 1C-1. Type definitions (ts-rest pattern)

**Buat 8 file baru** di `types/api/`:

**File `types/api/T_getRiceVarieties.ts`**:
```typescript
export class T_getRiceVarieties_headers {
  @IsNotEmpty() @IsString() authorization!: string;
}
export type T_getRiceVarieties = (
  request: { headers: T_getRiceVarieties_headers },
  response: Response
) => Promise<any>;
export const method = 'get';
export const url_path = '/rice-varieties';
export const alias = 'T_getRiceVarieties';
export const is_streaming = false;
```

**File `types/api/T_createRiceVariety.ts`**:
```typescript
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class T_createRiceVariety_headers {
  @IsNotEmpty() @IsString() authorization!: string;
}
export class T_createRiceVariety_body {
  @IsNotEmpty() @IsString() code!: string;
  @IsNotEmpty() @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
}
export type T_createRiceVariety = (
  request: { headers: T_createRiceVariety_headers; body: T_createRiceVariety_body },
  response: Response
) => Promise<any>;
export const method = 'post';
export const url_path = '/rice-varieties';
export const alias = 'T_createRiceVariety';
export const is_streaming = false;
```

**File `types/api/T_updateRiceVariety.ts`**:
```typescript
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_updateRiceVariety_headers {
  @IsNotEmpty() @IsString() authorization!: string;
}
export class T_updateRiceVariety_params {
  @IsNotEmpty() @Transform(({ value }) => parseInt(value)) id!: number;
}
export class T_updateRiceVariety_body {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
export type T_updateRiceVariety = (
  request: { headers: T_updateRiceVariety_headers; params: T_updateRiceVariety_params; body: T_updateRiceVariety_body },
  response: Response
) => Promise<any>;
export const method = 'put';
export const url_path = '/rice-varieties/:id';
export const alias = 'T_updateRiceVariety';
export const is_streaming = false;
```

**Ulangi pola yang sama untuk**:
- `T_getRiceLevels.ts` (GET `/rice-levels`)
- `T_createRiceLevel.ts` (POST `/rice-levels`) — body: code, name, sort_order (number)
- `T_updateRiceLevel.ts` (PUT `/rice-levels/:id`)
- `T_getRiceBrands.ts` (GET `/rice-brands`)
- `T_createRiceBrand.ts` (POST `/rice-brands`)
- `T_updateRiceBrand.ts` (PUT `/rice-brands/:id`)
- `T_getFactoryMaterials.ts` (GET `/factory-materials?id_factory=X`) — query param: id_factory
- `T_upsertFactoryMaterial.ts` (POST `/factory-materials`) — body: id_factory, id_product_type, is_input, is_output
- `T_createProductTypeSKU.ts` (POST `/product-types/sku`) — body: id_rice_level, id_variety, id_rice_brand? (nullable)

#### 1C-2. Implementation files

**Buat file** di `implementation/` untuk setiap endpoint di atas. Ikuti pola file implementation existing (cek `implementation/T_getProductTypes.ts` sebagai contoh). Gunakan Prisma client langsung.

Contoh `implementation/T_getRiceVarieties.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const handler: any = async (request: any, response: any) => {
  const varieties = await prisma.riceVariety.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
  });
  return response.json(varieties);
};
export default handler;
```

Contoh `implementation/T_createRiceVariety.ts`:
```typescript
const handler: any = async (request: any, response: any) => {
  const { code, name, description } = request.body;
  const variety = await prisma.riceVariety.create({
    data: { code: code.toUpperCase(), name, description },
  });
  return response.status(201).json(variety);
};
```

#### 1C-3. Service baru: product-classification.service.ts

**File baru**: `src/services/product-classification.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductClassificationService {

  /**
   * Generate SKU code dari level + variety + brand (optional)
   * Contoh: "BRS-PREMIUM-IR-WALEMU" atau "BRS-MEDIUM-MUNCUL"
   */
  static generateSKUCode(levelCode: string, varietyCode: string, brandCode?: string): string {
    const parts = ['BRS', levelCode.toUpperCase(), varietyCode.toUpperCase()];
    if (brandCode) parts.push(brandCode.toUpperCase());
    return parts.join('-');
  }

  /**
   * Find or create ProductType untuk kombinasi SKU
   */
  static async getOrCreateSKU(idRiceLevel: number, idVariety: number, idRiceBrand?: number) {
    const level = await prisma.riceLevel.findUniqueOrThrow({ where: { id: idRiceLevel } });
    const variety = await prisma.riceVariety.findUniqueOrThrow({ where: { id: idVariety } });
    const brand = idRiceBrand ? await prisma.riceBrand.findUnique({ where: { id: idRiceBrand } }) : null;

    const code = this.generateSKUCode(level.code, variety.code, brand?.code);
    const nameParts = [level.name, variety.name];
    if (brand) nameParts.push(brand.name);
    const name = nameParts.join(' - ');

    const existing = await prisma.productType.findFirst({ where: { code } });
    if (existing) return existing;

    return prisma.productType.create({
      data: {
        code,
        name,
        category: 'FINISHED_RICE',
        id_rice_level: idRiceLevel,
        id_variety: idVariety,
        id_rice_brand: idRiceBrand || null,
        unit: 'kg',
      },
    });
  }

  /**
   * Get materials yang di-allow untuk factory tertentu
   */
  static async getFactoryMaterials(factoryId: number) {
    const configs = await prisma.factoryMaterialConfig.findMany({
      where: { id_factory: factoryId },
      include: { ProductType: { include: { RiceVariety: true, RiceLevel: true, RiceBrand: true } } },
    });

    return {
      inputs: configs.filter(c => c.is_input).map(c => c.ProductType),
      outputs: configs.filter(c => c.is_output).map(c => c.ProductType),
    };
  }

  /**
   * Get 5 standard side products
   */
  static async getStandardSideProducts() {
    return prisma.productType.findMany({
      where: { category: 'SIDE_PRODUCT', is_active: true },
      orderBy: { code: 'asc' },
    });
  }
}
```

#### 1C-4. Modifikasi endpoint T_getProductTypes

**File**: `implementation/T_getProductTypes.ts`

Tambah filter `?category=SIDE_PRODUCT` dan include relations:

```typescript
// Tambahkan ke query:
const where: any = {};
if (request.query?.category) {
  where.category = request.query.category;
}
if (request.query?.is_active !== undefined) {
  where.is_active = request.query.is_active === 'true';
}

const productTypes = await prisma.productType.findMany({
  where,
  include: {
    RiceVariety: true,
    RiceLevel: true,
    RiceBrand: true,
  },
  orderBy: { name: 'asc' },
});
```

#### 1C-5. Endpoint T_createProductTypeSKU

**File**: `implementation/T_createProductTypeSKU.ts`

```typescript
import { ProductClassificationService } from '../src/services/product-classification.service';

const handler: any = async (request: any, response: any) => {
  const { id_rice_level, id_variety, id_rice_brand } = request.body;
  const productType = await ProductClassificationService.getOrCreateSKU(
    id_rice_level, id_variety, id_rice_brand || undefined
  );
  return response.json(productType);
};
export default handler;
```

---

## FASE 2: Settings UI (4 Tab Baru)

### Step 2A — API Client Baru

**File**: `frontend/src/services/api.ts`

Tambahkan setelah `rawMaterialVarietyApi`:

```typescript
export const riceVarietyApi = {
  getAll: (params?: any) => api.get('/rice-varieties', { params }),
  create: (data: any) => api.post('/rice-varieties', data),
  update: (id: number, data: any) => api.put(`/rice-varieties/${id}`, data),
};

export const riceLevelApi = {
  getAll: (params?: any) => api.get('/rice-levels', { params }),
  create: (data: any) => api.post('/rice-levels', data),
  update: (id: number, data: any) => api.put(`/rice-levels/${id}`, data),
};

export const riceBrandApi = {
  getAll: (params?: any) => api.get('/rice-brands', { params }),
  create: (data: any) => api.post('/rice-brands', data),
  update: (id: number, data: any) => api.put(`/rice-brands/${id}`, data),
};

export const factoryMaterialApi = {
  getAll: (params?: any) => api.get('/factory-materials', { params }),
  upsert: (data: any) => api.post('/factory-materials', data),
};
```

### Step 2B — Tambah Tab di Settings.tsx

**File**: `frontend/src/pages/Settings.tsx`

#### 2B-1. Ubah TabType dan tabs array

```typescript
type TabType = 'data' | 'suppliers' | 'categories' | 'varieties' | 'quality' | 'riceLevels' | 'riceBrands' | 'factoryConfig';

const tabs = [
  { key: 'data', label: 'Manajemen Data', icon: 'database' },
  { key: 'suppliers', label: 'Supplier', icon: 'local_shipping' },
  { key: 'categories', label: 'Kategori Bahan', icon: 'category' },
  { key: 'varieties', label: 'Varietas Padi', icon: 'grain' },
  { key: 'riceLevels', label: 'Level Beras', icon: 'signal_cellular_alt' },
  { key: 'riceBrands', label: 'Merk Beras', icon: 'label' },
  { key: 'quality', label: 'Quality Config', icon: 'tune' },
  { key: 'factoryConfig', label: 'Konfigurasi Pabrik', icon: 'factory' },
];
```

#### 2B-2. Tab Varietas Padi (modifikasi tab 'varieties' existing)

Existing tab `varieties` sudah menggunakan `rawMaterialVarietyApi`. **Ganti** agar menggunakan `riceVarietyApi` sebagai sumber data utama. Tetap pertahankan UI CRUD yang sama (tabel dengan code, nama, aksi edit/toggle active).

#### 2B-3. Tab Level Beras (baru)

Komponen CRUD sederhana:
- Tabel: Code, Nama, Urutan, Aksi
- Form: code (input text), name (input text), sort_order (input number)
- API: `riceLevelApi.getAll()`, `riceLevelApi.create()`, `riceLevelApi.update()`
- Sort by `sort_order` ascending

#### 2B-4. Tab Merk Beras (baru)

Komponen CRUD sederhana:
- Tabel: Code, Nama, Aksi
- Form: code (input text), name (input text)
- API: `riceBrandApi.getAll()`, `riceBrandApi.create()`, `riceBrandApi.update()`

#### 2B-5. Tab Konfigurasi Pabrik (baru)

UI berupa **matrix/grid**:
- Baris = setiap ProductType (semua category)
- Kolom = Factory name
- Cell = 2 checkbox: "Input" dan "Output"
- Saat checkbox di-toggle: panggil `factoryMaterialApi.upsert({ id_factory, id_product_type, is_input, is_output })`
- Data awal: `factoryMaterialApi.getAll()` grouped by factory

Ikuti pattern styling yang sama dengan tab CRUD lainnya di Settings.tsx (card-based, responsive table).

---

## FASE 3: Standardisasi Side Product

### Step 3A — WorksheetForm: Hapus Hardcode, Fetch dari API

**File**: `frontend/src/pages/production/WorksheetForm.tsx`

#### 3A-1. Hapus sideProductConfig hardcoded

Hapus seluruh block `sideProductConfig` (lines 79-91 saat ini):
```typescript
// HAPUS INI:
const sideProductConfig = {
    PMD1: [...],
    PMD2: [...],
};
```

#### 3A-2. Fetch side products dari API

Tambahkan state dan fetch:
```typescript
const [standardSideProducts, setStandardSideProducts] = useState<any[]>([]);

useEffect(() => {
  productTypeApi.getAll({ category: 'SIDE_PRODUCT' }).then(res => {
    setStandardSideProducts(res.data);
  });
}, []);
```

#### 3A-3. Ubah inisialisasi side products

Ganti logic yang menggunakan `sideProductConfig` (sekitar line 297-311). Gunakan `standardSideProducts` untuk semua factory:

```typescript
// Saat factory berubah atau standardSideProducts ter-load:
const initSideProducts = standardSideProducts.map(sp => ({
  product_code: sp.code,
  product_name: sp.name,
  id_product_type: sp.id,
  quantity: 0,
  is_auto_calculated: false,
  auto_percentage: null,
  unit_price: null,
  total_value: null,
}));
```

**Catatan**: Jika factory === PMD-1 dan product_code === 'SEKAM', set `is_auto_calculated: true` dan `auto_percentage: 15` (mempertahankan behavior existing).

#### 3A-4. Kirim id_product_type dan batch_code di submit

Di payload submit, tambahkan ke setiap side product:
```typescript
side_products: sideProducts.map(sp => ({
  ...sp,
  id_product_type: sp.id_product_type,
  // batch_code di-generate backend
})),
```

### Step 3B — Worksheet Service: Side Product Stock dengan FK

**File**: `src/services/worksheet.service.ts`

#### 3B-1. Generate batch_code untuk side products

Di dalam `createWorksheet`, setelah create `WorksheetSideProduct` records:

```typescript
// Generate batch code format: SP-{factoryCode}-{YYYYMMDD}-{worksheetId}-{sideProductCode}
const dateStr = worksheetDate.toISOString().slice(0, 10).replace(/-/g, '');
const factoryCode = factory.code.replace('-', '');

for (const sp of sideProductsData) {
  const batchCode = `SP-${factoryCode}-${dateStr}-${worksheet.id}-${sp.product_code}`;

  await tx.worksheetSideProduct.update({
    where: { id: sp.dbId }, // ID dari record yang baru dibuat
    data: { batch_code: batchCode, id_product_type: sp.id_product_type },
  });
}
```

#### 3B-2. Side product stock movement pakai id_product_type

Di `addOutputStocksTransactional`, ubah lookup side product stock dari string matching:

```typescript
// SEBELUMNYA:
const pt = await tx.productType.findFirst({ where: { code: sp.product_code } });

// SESUDAHNYA:
const ptId = sp.id_product_type;
// Jika id_product_type ada, gunakan langsung; fallback ke code matching untuk backward compat
const pt = ptId
  ? await tx.productType.findUnique({ where: { id: ptId } })
  : await tx.productType.findFirst({ where: { code: sp.product_code } });
```

#### 3B-3. Tulis batch_code ke StockMovement

Saat create StockMovement untuk side products, tambahkan `batch_code`:

```typescript
await tx.stockMovement.create({
  data: {
    id_stock: stock.id,
    id_user: userId,
    movement_type: 'IN',
    quantity: sp.quantity,
    reference_type: 'WORKSHEET_SIDE_PRODUCT',
    reference_id: BigInt(worksheet.id),
    batch_code: batchCode, // field baru
    notes: JSON.stringify({ worksheet_id: worksheet.id, product_code: sp.product_code }),
  },
});
```

### Step 3C — Backward Compatibility

**Tidak ada perubahan breaking**:
- Worksheet lama tanpa `id_product_type` di WorksheetSideProduct tetap bekerja (fallback ke `product_code` matching)
- Worksheet baru selalu set legacy fields `menir_output = 0`, `dedak_output = 0`, `sekam_output = 0` (semua masuk lewat WorksheetSideProduct)
- Display: cek `WorksheetSideProduct.length > 0` → tampilkan itu; else fallback ke legacy fields

---

## FASE 4: Production Flow & SKU

### Step 4A — SKUSelector Component

**File baru**: `frontend/src/components/Production/SKUSelector.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { riceLevelApi, riceVarietyApi, riceBrandApi, productTypeApi } from '../../services/api';

interface SKUSelectorProps {
  value?: number; // id_product_type
  onChange: (productTypeId: number, skuLabel: string) => void;
}

export const SKUSelector: React.FC<SKUSelectorProps> = ({ value, onChange }) => {
  const [levels, setLevels] = useState<any[]>([]);
  const [varieties, setVarieties] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      riceLevelApi.getAll(),
      riceVarietyApi.getAll(),
      riceBrandApi.getAll(),
    ]).then(([l, v, b]) => {
      setLevels(l.data);
      setVarieties(v.data);
      setBrands(b.data);
    });
  }, []);

  // Auto-create SKU saat semua required field dipilih
  useEffect(() => {
    if (selectedLevel && selectedVariety) {
      setLoading(true);
      // POST /product-types/sku -> find or create
      productTypeApi.createSKU({
        id_rice_level: selectedLevel,
        id_variety: selectedVariety,
        id_rice_brand: selectedBrand || undefined,
      }).then(res => {
        const pt = res.data;
        onChange(pt.id, pt.name);
      }).finally(() => setLoading(false));
    }
  }, [selectedLevel, selectedVariety, selectedBrand]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Level - Radio buttons */}
      <div>
        <label className="block text-sm font-medium mb-2">Level Beras *</label>
        <div className="space-y-1">
          {levels.map(l => (
            <label key={l.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rice-level"
                value={l.id}
                checked={selectedLevel === l.id}
                onChange={() => setSelectedLevel(l.id)}
              />
              <span>{l.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Varietas - Dropdown */}
      <div>
        <label className="block text-sm font-medium mb-2">Varietas *</label>
        <select
          value={selectedVariety || ''}
          onChange={e => setSelectedVariety(Number(e.target.value) || null)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Pilih Varietas</option>
          {varieties.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Merk - Dropdown (optional) */}
      <div>
        <label className="block text-sm font-medium mb-2">Merk (Opsional)</label>
        <select
          value={selectedBrand || ''}
          onChange={e => setSelectedBrand(Number(e.target.value) || null)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Tanpa Merk</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="col-span-3 text-sm text-gray-500">Generating SKU...</div>}
    </div>
  );
};
```

**Tambahkan** di `frontend/src/services/api.ts` pada `productTypeApi`:
```typescript
export const productTypeApi = {
  getAll: (params?: any) => api.get('/product-types', { params }),
  getById: (id: number) => api.get(`/product-types/${id}`),
  create: (data: any) => api.post('/product-types', data),
  createSKU: (data: any) => api.post('/product-types/sku', data), // BARU
};
```

### Step 4B — WorksheetForm: Factory-Aware Inputs/Outputs

**File**: `frontend/src/pages/production/WorksheetForm.tsx`

#### 4B-1. Fetch factory materials

```typescript
const [factoryInputs, setFactoryInputs] = useState<any[]>([]);
const [factoryOutputs, setFactoryOutputs] = useState<any[]>([]);

useEffect(() => {
  if (selectedFactory) {
    factoryMaterialApi.getAll({ id_factory: selectedFactory.id }).then(res => {
      const configs = res.data;
      setFactoryInputs(configs.filter((c: any) => c.is_input).map((c: any) => c.ProductType));
      setFactoryOutputs(configs.filter((c: any) => c.is_output && c.ProductType.category !== 'SIDE_PRODUCT').map((c: any) => c.ProductType));
    });
  }
}, [selectedFactory]);
```

#### 4B-2. Input material dropdown (ganti hardcode)

Ganti dropdown input material yang saat ini hardcoded:

```tsx
<label>Bahan Input *</label>
<select
  value={formData.id_input_product_type || ''}
  onChange={e => setFormData({ ...formData, id_input_product_type: Number(e.target.value) })}
>
  <option value="">Pilih Bahan Input</option>
  {factoryInputs.map(pt => (
    <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>
  ))}
</select>
```

**Fallback**: Jika `factoryInputs` kosong (belum dikonfigurasi), tampilkan semua ProductType sebagai opsi.

#### 4B-3. Output product — conditional rendering

```tsx
{/* PMD-1: Dropdown untuk INTERMEDIATE products */}
{selectedFactory?.code === 'PMD-1' ? (
  <div>
    <label>Produk Output *</label>
    <select
      value={formData.id_output_product || ''}
      onChange={e => setFormData({ ...formData, id_output_product: Number(e.target.value) })}
    >
      <option value="">Pilih Produk Output</option>
      {factoryOutputs.map(pt => (
        <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>
      ))}
    </select>
  </div>
) : (
  /* PMD-2: SKUSelector untuk FINISHED_RICE */
  <div>
    <label>Produk Output (Beras Jadi) *</label>
    <SKUSelector
      value={formData.id_output_product}
      onChange={(ptId, label) => {
        setFormData({ ...formData, id_output_product: ptId });
      }}
    />
  </div>
)}
```

#### 4B-4. Submit payload update

Tambahkan `id_input_product_type` ke payload yang dikirim ke backend:
```typescript
const payload = {
  ...formData,
  id_input_product_type: formData.id_input_product_type,
  // id_output_product sudah ada sebelumnya
};
```

### Step 4C — Backend: Accept id_input_product_type

**File**: `types/api/T_createWorksheet.ts`

Tambahkan ke `T_createWorksheet_body`:
```typescript
@IsOptional() @Transform(({ value }) => parseInt(value)) @IsNumber()
id_input_product_type?: number;
```

**File**: `src/services/worksheet.service.ts`

Di `createWorksheet`, simpan `id_input_product_type`:
```typescript
const worksheet = await tx.worksheet.create({
  data: {
    ...existingFields,
    id_input_product_type: body.id_input_product_type || null,
  },
});
```

---

## FASE 5: Stock & Transfer

### Step 5A — Stock Page: Category Filter

**File**: `frontend/src/pages/production/Stocks.tsx`

#### 5A-1. Tambah filter buttons

```tsx
const categoryFilters = [
  { key: 'all', label: 'Semua' },
  { key: 'RAW_MATERIAL', label: 'Bahan Baku' },
  { key: 'INTERMEDIATE', label: 'Intermediate' },
  { key: 'FINISHED_RICE', label: 'Beras Jadi' },
  { key: 'SIDE_PRODUCT', label: 'Produk Samping' },
];

const [categoryFilter, setCategoryFilter] = useState('all');
```

Render sebagai button group di atas tabel. Filter stocks client-side berdasarkan `stock.ProductType.category`.

#### 5A-2. Tambah kolom detail

Di tabel stock, tambahkan kolom kondisional:
- **Varietas**: tampilkan `ProductType.RiceVariety.name` jika ada
- **Level**: tampilkan `ProductType.RiceLevel.name` jika `category === 'FINISHED_RICE'`
- **Merk**: tampilkan `ProductType.RiceBrand.name` jika `category === 'FINISHED_RICE'` dan `RiceBrand` tidak null

#### 5A-3. Update stock API response

**File**: `implementation/T_getStocks.ts` (atau equivalent)

Include ProductType relations di query:
```typescript
const stocks = await prisma.stock.findMany({
  where: { id_factory: factoryId },
  include: {
    ProductType: {
      include: { RiceVariety: true, RiceLevel: true, RiceBrand: true },
    },
  },
});
```

### Step 5B — Transfer Enhancement

**File**: `src/services/stock.service.ts`

Di fungsi `transferStock`, tambahkan field baru ke kedua StockMovement records:

```typescript
// Generate transfer ID (timestamp-based or sequential)
const transferId = Date.now();

// OUT movement (source factory)
await tx.stockMovement.create({
  data: {
    id_stock: sourceStock.id,
    id_user: userId,
    movement_type: 'OUT',
    quantity: quantity,
    reference_type: 'TRANSFER',
    reference_id: BigInt(transferId),
    batch_code: batchCode || null, // dari parameter jika ada
    from_factory_id: sourceFactoryId,
    to_factory_id: destFactoryId,
    notes: JSON.stringify({
      transfer_id: transferId,
      from_factory: sourceFactory.name,
      to_factory: destFactory.name,
      product: productType.name,
    }),
  },
});

// IN movement (destination factory)
await tx.stockMovement.create({
  data: {
    id_stock: destStock.id,
    id_user: userId,
    movement_type: 'IN',
    quantity: quantity,
    reference_type: 'TRANSFER',
    reference_id: BigInt(transferId),
    batch_code: batchCode || null,
    from_factory_id: sourceFactoryId,
    to_factory_id: destFactoryId,
    notes: JSON.stringify({
      transfer_id: transferId,
      from_factory: sourceFactory.name,
      to_factory: destFactory.name,
      product: productType.name,
    }),
  },
});
```

### Step 5C — Raw Material Receipt Update

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx`

#### 5C-1. Material type dropdown: factory-filtered

Ganti dropdown material yang sekarang menggunakan RawMaterialCategory:

```typescript
// Fetch factory inputs
const [factoryInputs, setFactoryInputs] = useState<any[]>([]);
useEffect(() => {
  if (selectedFactory) {
    factoryMaterialApi.getAll({ id_factory: selectedFactory.id }).then(res => {
      setFactoryInputs(res.data.filter((c: any) => c.is_input).map((c: any) => c.ProductType));
    });
  }
}, [selectedFactory]);

// Dropdown:
<select value={materialType} onChange={...}>
  {factoryInputs.map(pt => (
    <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>
  ))}
</select>
```

**Fallback**: Jika `factoryInputs` kosong, tampilkan RawMaterialCategory dropdown (behavior lama).

#### 5C-2. Varietas dropdown: dari RiceVariety

```typescript
// Ganti:
rawMaterialVarietyApi.getAll()
// Menjadi:
riceVarietyApi.getAll()
```

Update state dan rendering accordingly. Tetap pertahankan opsi `__add_new__` yang membuka modal create variety (tapi sekarang panggil `riceVarietyApi.create`).

#### 5C-3. Batch code include varietas

```typescript
// Format batch code baru:
const batchCode = `BTC-${factory.code.replace('-','')}-${dateStr}-${variety.code}-${seq}`;
// Contoh: BTC-PMD1-20260215-IR-001
```

---

## FASE 6: Reports & Cleanup

### Step 6A — Update Report Endpoints

**Files**: Semua file report di `src/services/` dan `implementation/` yang query ProductType.

Tambahkan include relations:
```typescript
include: {
  ProductType: {
    include: { RiceVariety: true, RiceLevel: true, RiceBrand: true },
  },
}
```

Di frontend report pages, tampilkan nama lengkap SKU: `ProductType.name` (yang sudah berformat "Premium - IR - Walemu").

### Step 6B — InvoiceItem: SKU Name

**File**: `frontend/src/pages/sales/InvoiceForm.tsx` (atau equivalent)

Saat menampilkan product di InvoiceItem, tampilkan `ProductType.name` lengkap. Jika `ProductType.category === 'FINISHED_RICE'`, tampilkan juga badge Level dan Varietas.

### Step 6C — Mark Deprecated Models

**File**: `prisma/schema.prisma`

Tambahkan komentar deprecated:
```prisma
/// @deprecated Use RiceVariety instead. Kept for backward compatibility.
model RawMaterialVariety { ... }

/// @deprecated Use ProductType with category filter instead. Kept for backward compatibility.
model RawMaterialCategory { ... }

/// @deprecated Use FactoryMaterialConfig + ProductType instead. Kept for backward compatibility.
model OutputProduct { ... }
```

**JANGAN hapus** model-model ini. Cukup mark deprecated dan pastikan kode baru tidak menambah dependency ke sana.

---

## Execution Order & Dependencies

```
FASE 1A (Schema)
  └─> FASE 1B (Migration Script) — depends on 1A
       └─> FASE 1C (Backend Endpoints) — depends on 1B
            ├─> FASE 2 (Settings UI) — depends on 1C
            ├─> FASE 3 (Side Products) — depends on 1C
            └─> FASE 4 (Production & SKU) — depends on 1C
                 └─> FASE 5 (Stock & Transfer) — depends on 3 & 4
                      └─> FASE 6 (Reports & Cleanup) — depends on 5
```

**FASE 2, 3, 4** bisa dikerjakan paralel setelah FASE 1 selesai.

---

## Validation Checklist

### Schema & Migration
- [ ] `npx prisma migrate dev` sukses tanpa error
- [ ] Data existing tidak hilang (row count before = after)
- [ ] Semua ProductType existing punya `category` yang benar
- [ ] 5 side product standar ada sebagai ProductType (BEKATUL, BROKEN, MENIR, SEKAM, REJECT)
- [ ] FactoryMaterialConfig ter-seed untuk PMD-1 dan PMD-2
- [ ] RiceVariety ter-seed dari RawMaterialVariety data
- [ ] RiceLevel ter-seed (4 level: MEDIUM, MEDIUM_SUPER, PREMIUM, PREMIUM_SUPER)

### Master Data CRUD
- [ ] CRUD RiceVariety: create IR → tampil di list → update nama → toggle active
- [ ] CRUD RiceLevel: 4 level tersort → tidak bisa duplikat code
- [ ] CRUD RiceBrand: create Walemu → tampil → update
- [ ] FactoryMaterialConfig: set PMD-1 input=GKP,GKG → query return benar

### Worksheet PMD-1
- [ ] Input dropdown hanya menampilkan GKP dan GKG (bukan PK/Glosor)
- [ ] Output dropdown menampilkan PK, Glosor (sesuai factory config)
- [ ] Side products menampilkan 5 jenis standar (bukan 2 seperti sebelumnya)
- [ ] Save worksheet → setiap side product punya batch_code (format: SP-P1-YYYYMMDD-{id}-BEKATUL)
- [ ] Stock movement side product punya batch_code di field dedicated
- [ ] Stock aggregate untuk setiap side product ter-update

### Worksheet PMD-2
- [ ] Input dropdown hanya menampilkan PK dan Glosor
- [ ] Output menggunakan SKUSelector: pilih Level → Varietas → Merk
- [ ] SKU baru auto-create ProductType jika combo belum ada
- [ ] Contoh: Premium + IR + Walemu → ProductType "BRS-PREMIUM-IR-WALEMU"
- [ ] Output stock masuk ke ProductType yang benar
- [ ] Side products sama 5 standar

### SKU System
- [ ] Level "Premium" + Varietas "IR" + Merk "Walemu" → code "BRS-PREMIUM-IR-WALEMU"
- [ ] Level "Medium" + Varietas "Muncul" + tanpa merk → code "BRS-MEDIUM-MUNCUL"
- [ ] Combo yang sama tidak membuat duplikat ProductType
- [ ] Satu Level+Varietas bisa dikemas ke beberapa Merk

### Transfer Antar Factory
- [ ] Transfer PK dari PMD-1 ke PMD-2 → StockMovement OUT di PMD-1, IN di PMD-2
- [ ] Kedua movement punya batch_code, from_factory_id, to_factory_id
- [ ] Stock PMD-1 berkurang, Stock PMD-2 bertambah

### Stock Display
- [ ] Filter "Bahan Baku" → hanya GKP, GKG
- [ ] Filter "Beras Jadi" → hanya SKU finished rice
- [ ] Filter "Produk Samping" → hanya 5 side products
- [ ] Kolom Varietas/Level/Merk muncul untuk FINISHED_RICE

### Raw Material Receipt
- [ ] PMD-1: material dropdown = GKP, GKG
- [ ] PMD-2: material dropdown = PK, Glosor
- [ ] Varietas dari RiceVariety (bukan RawMaterialVariety)
- [ ] Batch code ter-generate termasuk varietas code

### Backward Compatibility
- [ ] Worksheet lama dengan menir_output/dedak_output/sekam_output tetap tampil benar
- [ ] StockMovement lama dengan JSON notes tetap bisa di-parse
- [ ] InvoiceItem dengan id_product_type lama tetap bekerja
- [ ] Report Production, COGM, Stock render tanpa error
- [ ] Dashboard tidak crash karena perubahan schema

### Edge Cases
- [ ] Factory tanpa FactoryMaterialConfig → tampilkan semua material (fallback)
- [ ] ProductType tanpa variety → tampil nama saja (backward compat)
- [ ] Side product quantity 0 → tidak membuat stock movement
- [ ] Transfer quantity > stock available → error message jelas
- [ ] Duplikat SKU code → ditolak dengan pesan jelas
