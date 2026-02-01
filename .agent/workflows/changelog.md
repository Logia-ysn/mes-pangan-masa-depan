---
description: Memperbarui changelog setiap ada perubahan pada proyek
---

# Workflow: Update Changelog

Setiap kali ada perubahan signifikan pada proyek, ikuti langkah-langkah berikut untuk memperbarui CHANGELOG.md:

## Langkah-langkah

### 1. Identifikasi Jenis Perubahan

Tentukan kategori perubahan yang dilakukan:
- **Ditambahkan**: Fitur baru
- **Diubah**: Perubahan pada fitur yang sudah ada
- **Diperbaiki**: Bug fixes
- **Dihapus**: Fitur yang dihapus
- **Keamanan**: Perbaikan keamanan
- **Deprecated**: Fitur yang akan dihapus di versi mendatang

### 2. Update CHANGELOG.md

Buka file `CHANGELOG.md` dan tambahkan entri baru di bawah section `## [Unreleased]`:

```markdown
## [Unreleased]

### [Kategori]
- Deskripsi singkat perubahan yang dilakukan
```

### 3. Format Penulisan

- Gunakan bahasa Indonesia yang jelas dan ringkas
- Mulai dengan kata kerja (Menambahkan, Memperbaiki, Menghapus, dll)
- Sertakan referensi modul/komponen yang terpengaruh
- Contoh: "Menambahkan fitur export PDF pada modul Invoice"

### 4. Saat Rilis Versi Baru

Ketika siap merilis versi baru:

1. Ganti `## [Unreleased]` menjadi `## [X.X.X] - YYYY-MM-DD`
2. Tambahkan section `## [Unreleased]` baru di atasnya
3. Update link referensi di bagian bawah file
4. Ikuti Semantic Versioning:
   - **MAJOR** (X.0.0): Breaking changes
   - **MINOR** (0.X.0): Fitur baru yang backward compatible
   - **PATCH** (0.0.X): Bug fixes yang backward compatible

## Contoh Entry

```markdown
## [Unreleased]

### Ditambahkan
- Menambahkan fitur notifikasi email untuk invoice jatuh tempo
- Menambahkan halaman laporan stok bulanan

### Diperbaiki
- Memperbaiki bug kalkulasi OEE yang tidak akurat
- Memperbaiki tampilan dark mode pada dropdown

### Diubah
- Mengoptimasi performa query laporan kehadiran
```

## Catatan Penting

- **SELALU** update changelog sebelum commit perubahan
- Changelog harus mencerminkan semua perubahan yang user-facing
- Jangan memasukkan perubahan internal yang tidak mempengaruhi pengguna
