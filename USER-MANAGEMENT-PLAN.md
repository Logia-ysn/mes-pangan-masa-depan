# User Management Page Implementation Plan — ERP Pangan Masa Depan

## Context

Kamu akan membuat halaman User Management untuk aplikasi ERP berbasis React + Express + Prisma. Backend API untuk CRUD user **sudah lengkap**, yang perlu dibuat hanya frontend + sedikit tambahan backend (reset password, create user by admin).

### Tech Stack
- **Backend**: Node.js + Express + NAIV framework + Prisma ORM + PostgreSQL
- **Frontend**: React 19 + Vite 7 + React Router 7 + Plain CSS (CSS Variables, dark/light theme)
- **Auth**: JWT (httpOnly cookie), role hierarchy: OPERATOR < SUPERVISOR < MANAGER < ADMIN < SUPERUSER
- **Icons**: Material Symbols via className (bukan library import)

### Yang Sudah Ada di Backend
| Endpoint | Method | Auth | Fungsi |
|----------|--------|------|--------|
| `GET /users` | GET | ADMIN | List users (pagination, search, filter role) |
| `GET /users/:id` | GET | ADMIN | Get user by ID |
| `PUT /users/:id` | PUT | ADMIN | Update user (email, fullname, role, is_active, id_factory) |
| `DELETE /users/:id` | DELETE | ADMIN | Soft delete (deactivate user) |
| `POST /auth/register` | POST | Public | Self-register (selalu jadi OPERATOR) |

### Yang Belum Ada di Backend
1. **Create user by admin** — Admin bisa buat user dengan role apapun
2. **Reset password by admin** — Admin bisa reset password user lain

---

## Task yang Harus Dikerjakan

### Task 1: Backend — Create User by Admin Endpoint

Buat endpoint baru untuk admin membuat user dengan role tertentu.

**Type file**: `types/api/T_createUserByAdmin.ts`
```typescript
import { Request, Response } from 'express';

export const method = 'POST';
export const url_path = '/users';
export const alias = 'createUserByAdmin';

export type T_createUserByAdmin = (
    req: Request<
        {},                          // params
        {},                          // res body
        {                            // req body
            email: string;
            password: string;
            fullname: string;
            role?: string;           // default OPERATOR
            id_factory?: number;
        },
        {},                          // query
        { authorization: string }    // headers
    >,
    res: Response
) => Promise<void>;
```

**Implementation file**: `implementation/T_createUserByAdmin.ts`
```typescript
import { apiWrapper } from '../src/utils/apiWrapper';
import { requireAuth, sanitizeUser } from '../utility/auth';
import { UserService } from '../src/services/user.service';

const userService = new UserService();

export const t_createUserByAdmin = apiWrapper(async (req: any, res: any) => {
    await requireAuth(req, 'ADMIN');

    const { email, password, fullname, role, id_factory } = req.body;

    if (!email || !password || !fullname) {
        return res.status(400).json({ error: 'Email, password, dan fullname wajib diisi' });
    }

    const user = await userService.createUser({
        email,
        password,
        fullname,
        role: role || 'OPERATOR',
        id_factory,
    });

    res.status(201).json(sanitizeUser(user));
});
```

> **Catatan**: `UserService.createUser()` sudah ada dan sudah handle validasi email, password min 6 char, dan hash password. Tapi cek dulu apakah method ini menerima parameter `role` — jika tidak, tambahkan.

### Task 2: Backend — Reset Password by Admin Endpoint

**Type file**: `types/api/T_resetUserPassword.ts`
```typescript
import { Request, Response } from 'express';

export const method = 'PUT';
export const url_path = '/users/:id/reset-password';
export const alias = 'resetUserPassword';

export type T_resetUserPassword = (
    req: Request<
        { id: number },             // params
        {},                          // res body
        { new_password: string },    // req body
        {},                          // query
        { authorization: string }    // headers
    >,
    res: Response
) => Promise<void>;
```

**Implementation file**: `implementation/T_resetUserPassword.ts`
```typescript
import { apiWrapper } from '../src/utils/apiWrapper';
import { requireAuth, hashPassword } from '../utility/auth';
import { UserRepository } from '../src/repositories/user.repository';

const userRepo = new UserRepository();

export const t_resetUserPassword = apiWrapper(async (req: any, res: any) => {
    await requireAuth(req, 'ADMIN');

    const id = Number(req.path.id || req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const hashedPassword = await hashPassword(new_password);
    await userRepo.updatePassword(id, hashedPassword);

    res.json({ success: true, message: 'Password berhasil direset' });
});
```

> **Catatan**: `userRepo.updatePassword(id, hash)` sudah ada di repository.

### Task 3: Frontend — API Client Methods

Di `frontend/src/services/api.ts`, tambahkan:

```typescript
// User Management API (Admin)
export const userApi = {
    getAll: (params?: { limit?: number; offset?: number; search?: string; role?: string }) =>
        api.get('/users', { params }),
    getById: (id: number) =>
        api.get(`/users/${id}`),
    create: (data: { email: string; password: string; fullname: string; role?: string; id_factory?: number }) =>
        api.post('/users', data),
    update: (id: number, data: { email?: string; fullname?: string; role?: string; is_active?: boolean; id_factory?: number }) =>
        api.put(`/users/${id}`, data),
    delete: (id: number) =>
        api.delete(`/users/${id}`),
    resetPassword: (id: number, data: { new_password: string }) =>
        api.put(`/users/${id}/reset-password`, data),
};
```

### Task 4: Frontend — Users Page

Buat file `frontend/src/pages/admin/Users.tsx`.

Ikuti pattern dari `pages/sales/Customers.tsx` (modal-based CRUD). Halaman ini hanya bisa diakses oleh role ADMIN ke atas.

#### Struktur UI:

```
┌─────────────────────────────────────────────┐
│ Header: "Manajemen User" / "Kelola user..." │
├─────────────────────────────────────────────┤
│ Stats Grid (4 cards):                       │
│ [Total User] [Aktif] [Admin+] [Operator]    │
├─────────────────────────────────────────────┤
│ Card:                                       │
│ ┌─ Card Header ──────────────────────────┐  │
│ │ "Daftar User"  [Search] [Filter] [+Add]│  │
│ ├────────────────────────────────────────┤  │
│ │ Table:                                 │  │
│ │ Nama | Email | Role | Factory | Status │  │
│ │ | Aksi (Edit, Reset PW, Deactivate)    │  │
│ ├────────────────────────────────────────┤  │
│ │ Pagination (jika > 20)                 │  │
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

#### State:
```typescript
const [users, setUsers] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [showModal, setShowModal] = useState(false);          // Create/Edit modal
const [showPasswordModal, setShowPasswordModal] = useState(false); // Reset password modal
const [editingUser, setEditingUser] = useState<any | null>(null);
const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
const [search, setSearch] = useState('');
const [roleFilter, setRoleFilter] = useState('');
const [factories, setFactories] = useState<any[]>([]);      // Untuk dropdown factory
```

#### Fitur:
1. **List User** — Tabel dengan kolom: Nama, Email, Role (badge warna), Factory, Status (Aktif/Nonaktif), Aksi
2. **Search** — Filter by fullname (debounce 300ms atau on-enter)
3. **Filter Role** — Dropdown/button group: Semua, OPERATOR, SUPERVISOR, MANAGER, ADMIN
4. **Create User** — Modal form: Email, Password, Fullname, Role (dropdown), Factory (dropdown)
5. **Edit User** — Modal form: Email, Fullname, Role (dropdown), Factory (dropdown) — tanpa password
6. **Reset Password** — Modal terpisah: input New Password + Confirm Password
7. **Toggle Active** — Tombol activate/deactivate dengan konfirmasi
8. **Role Badge Colors**:
   - SUPERUSER: `badge-error` (merah)
   - ADMIN: `badge-warning` (kuning)
   - MANAGER: `badge-info` (biru)
   - SUPERVISOR: `badge-success` (hijau)
   - OPERATOR: `badge-secondary` (abu-abu)

#### Proteksi:
- Jangan tampilkan tombol edit/delete untuk SUPERUSER (kecuali current user adalah SUPERUSER)
- Jangan biarkan user mendeactivate dirinya sendiri
- Ambil `user` dari `useAuth()` untuk cek current user

#### Factory Dropdown:
Factory list bisa diambil dari API yang sudah ada. Cek di `api.ts` apakah ada `factoryApi` atau method untuk get factories. Jika tidak ada, bisa hardcode PMD-1 dan PMD-2 sementara, atau fetch dari endpoint factory jika tersedia.

### Task 5: Frontend — Route di App.tsx

Di `frontend/src/App.tsx`:

1. Tambah lazy import:
```typescript
const Users = React.lazy(() => import('./pages/admin/Users'));
```

2. Tambah route di dalam `<Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>`:
```tsx
{/* Admin */}
<Route path="admin">
    <Route path="users" element={<Users />} />
</Route>
```

### Task 6: Frontend — Sidebar Navigation

Di `frontend/src/components/Layout/Sidebar.tsx`:

1. Import `useAuth`:
```typescript
import { useAuth } from '../../contexts/AuthContext';
```

2. Di dalam component, ambil user:
```typescript
const { user } = useAuth();
```

3. Tambahkan section Admin di `navItems` (conditional, hanya tampil jika user role >= ADMIN):

```typescript
// Setelah section Laporan, tambahkan:
...(user && ['ADMIN', 'SUPERUSER'].includes(user.role) ? [{
    label: 'Admin',
    icon: 'admin_panel_settings',
    children: [
        { label: 'Manajemen User', icon: 'group', to: '/admin/users' },
    ],
}] : []),
```

> **Catatan**: Cek bagaimana `navItems` didefinisikan — jika static array di luar component, pindahkan ke dalam component atau gunakan `useMemo` agar bisa conditional.

### Task 7: Frontend — Create/Edit Modal Component

Di dalam `Users.tsx`, buat modal inline (mengikuti pattern Customers.tsx):

#### Create Modal Fields:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Email | `form-input` type="email" | Ya | Validasi format |
| Password | `form-input` type="password" | Ya (create only) | Min 6 char |
| Nama Lengkap | `form-input` type="text" | Ya | |
| Role | `form-select` | Ya | Options: OPERATOR, SUPERVISOR, MANAGER, ADMIN |
| Factory | `form-select` | Tidak | Options dari factory list + "Semua Factory" |

#### Edit Modal Fields:
Sama tapi **tanpa field Password**. Password direset via modal terpisah.

#### Reset Password Modal Fields:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Password Baru | `form-input` type="password" | Ya | Min 6 char |
| Konfirmasi Password | `form-input` type="password" | Ya | Harus sama |

### Task 8: Frontend — Toast Notifications

Gunakan toast yang sudah ada di project. Import:
```typescript
import toast from 'react-hot-toast';
```

Toast messages:
- Create success: `"User berhasil ditambahkan"`
- Update success: `"User berhasil diupdate"`
- Deactivate success: `"User berhasil dinonaktifkan"`
- Activate success: `"User berhasil diaktifkan"`
- Reset password success: `"Password berhasil direset"`
- Error: Tampilkan error message dari API response

---

## File yang Perlu Dimodifikasi

| File | Aksi | Detail |
|------|------|--------|
| `types/api/T_createUserByAdmin.ts` | **CREATE** | Type definition untuk POST /users |
| `implementation/T_createUserByAdmin.ts` | **CREATE** | Handler create user by admin |
| `types/api/T_resetUserPassword.ts` | **CREATE** | Type definition untuk PUT /users/:id/reset-password |
| `implementation/T_resetUserPassword.ts` | **CREATE** | Handler reset password |
| `src/services/user.service.ts` | **EDIT** | Pastikan `createUser()` menerima parameter `role` dan `id_factory` |
| `frontend/src/services/api.ts` | **EDIT** | Tambah `userApi` object |
| `frontend/src/pages/admin/Users.tsx` | **CREATE** | Halaman utama user management |
| `frontend/src/App.tsx` | **EDIT** | Tambah lazy import + route `/admin/users` |
| `frontend/src/components/Layout/Sidebar.tsx` | **EDIT** | Tambah section Admin (conditional role) |

## Referensi Pattern

Untuk pattern UI, ikuti `frontend/src/pages/sales/Customers.tsx`:
- Stats grid di atas
- Card dengan header (title + actions)
- Filter bar (search + filter buttons)
- Table dengan action buttons
- Modal overlay untuk create/edit
- Loading spinner dan empty state
- Toast untuk feedback

## CSS Classes yang Sudah Tersedia (Jangan Buat Baru)

```
Layout:      .page-content, .stats-grid, .stat-card
Card:        .card, .card-header, .card-title, .card-body
Table:       .table-container, table (unstyled class)
Button:      .btn, .btn-primary, .btn-secondary, .btn-ghost, .btn-sm, .btn-icon
Badge:       .badge, .badge-success, .badge-warning, .badge-error, .badge-info
Modal:       .modal-overlay, .modal, .modal-header, .modal-body, .modal-footer
Form:        .form-group, .form-label, .form-input, .form-select, .form-row
State:       .empty-state, .loading-spinner
Alert:       .alert, .alert-warning, .alert-info
```

## Urutan Pengerjaan

1. Backend: `T_createUserByAdmin` type + implementation (Task 1)
2. Backend: `T_resetUserPassword` type + implementation (Task 2)
3. Backend: Cek `user.service.ts` — pastikan createUser support role param (Task 1)
4. Frontend: `api.ts` — tambah `userApi` (Task 3)
5. Frontend: `pages/admin/Users.tsx` — halaman utama (Task 4 + 7)
6. Frontend: `App.tsx` — tambah route (Task 5)
7. Frontend: `Sidebar.tsx` — tambah menu Admin (Task 6)
8. Test manual: Login sebagai ADMIN, cek semua CRUD + reset password

## Catatan Penting

- **NAIV Framework**: Type files di `types/api/` otomatis di-scan oleh framework. Pastikan export `method`, `url_path`, `alias` sudah benar — framework akan generate route otomatis.
- **Password**: Selalu hash di backend, jangan kirim plain text dari frontend selain saat create/reset.
- **Soft Delete**: DELETE endpoint hanya men-deactivate user (`is_active = false`), bukan hard delete.
- **Self-Protection**: User tidak boleh deactivate atau downgrade role dirinya sendiri.
- **SUPERUSER Protection**: Hanya SUPERUSER yang bisa edit SUPERUSER lain.
- **Form input font-size**: Pastikan `font-size: 16px` di mobile untuk prevent iOS zoom (sudah ada di global CSS).
- **Dark mode**: Semua CSS menggunakan CSS Variables — warna otomatis berubah di dark mode, tidak perlu handling khusus.
