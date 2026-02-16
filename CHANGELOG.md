## Changelog

### v1.0.0

Rilis awal frontend **2026-SPRK-frontend** untuk Sistem Peminjaman Ruangan Kampus (SPRK).

- **Phase 1 — Fondasi proyek**
  - Inisialisasi project React + TypeScript dengan Vite.
  - Setup path alias `@/` → `src/`.
  - Tambah HTTP client terpusat (`src/api/client.ts`) dan tipe TypeScript bersama (`Room`, `Booking`, dsb.).
  - Implementasi routing dasar dengan layout utama (`Layout`) dan halaman placeholder.

- **Phase 2 — Fitur Ruangan**
  - `RoomsPage`: daftar ruangan dengan informasi kapasitas, lokasi, deskripsi (terpotong), status ketersediaan, dan tanggal dibuat.
  - `RoomDetailPage`: halaman detail ruangan dengan aksi Edit dan Hapus.
  - `RoomsNewPage`: form tambah ruangan dengan validasi:
    - Nama & lokasi wajib diisi.
    - Kapasitas 1–1000.
    - Panjang maksimum mengikuti aturan backend (Name 100, Location 255, Description 500).
  - `RoomEditPage`: form edit ruangan dengan validasi yang sama seperti create.
  - Penanganan loading, error, dan empty state (`Belum ada ruangan`) di halaman list.

- **Phase 3 — Fitur Peminjaman (Bookings)**
  - `BookingsPage`:
    - Daftar peminjaman dengan filter: nama peminjam, ruangan, status, dan tanggal.
    - Opsi sort: tanggal terbaru/terlama, nama A–Z / Z–A.
    - Status badge dengan warna per status.
    - Aksi per baris: Lihat, Edit, Ubah status, Hapus.
  - `BookingDetailPage`:
    - Halaman detail peminjaman: ruangan, peminjam, keperluan, waktu mulai/selesai, status, dan tanggal dibuat.
    - Aksi Edit, Ubah status, dan Hapus.
  - `BookingNewPage`:
    - Form tambah peminjaman dengan field: Ruangan, Nama Peminjam, Keperluan, Waktu Mulai, Waktu Selesai.
    - Validasi: field wajib, panjang teks (BorrowerName 150, Purpose 500), dan `EndTime > StartTime`.
    - Menangani error dari backend (mis. jadwal bentrok) dengan menampilkan `message` dari API.
  - `BookingEditPage`:
    - Form edit peminjaman dengan ruangan non-editable.
    - Aturan: booking dengan status `Cancelled` atau `Rejected` tidak dapat diedit (UI dan guard di route).
  - **Status workflow** untuk bookings:
    - Perubahan status dari halaman list dan detail.
    - Aturan transisi:
      - `Pending` → `Approved` / `Rejected` / `Cancelled`.
      - `Approved` → `Rejected` / `Cancelled`.
      - `Rejected` dan `Cancelled` adalah status final (tidak dapat diubah lagi).
    - Penanganan error per baris (termasuk 409 Conflict dari backend) dengan rollback optimistik jika gagal.

- **Phase 4 — Shared UX dan polish**
  - Tambah `AppErrorBoundary` sebagai global error boundary di `App.tsx`:
    - Menangani error render tak terduga dengan tampilan error yang ramah dan tombol \"Muat ulang halaman\".
  - Konsolidasi pola loading/error/empty state di halaman data:
    - Spinner dan teks loading.
    - Blok error dengan tombol \"Coba lagi\" atau link kembali ke list.
    - Empty state khusus: \"Belum ada ruangan\" dan \"Tidak ada peminjaman yang sesuai filter\".
  - Centralized date/time formatting:
    - Util `formatDateTime` di `src/utils/datetime.ts` menggunakan `Intl.DateTimeFormat` locale `id-ID` dan timezone `Asia/Jakarta (WIB)`.
    - Dipakai di `RoomsPage`, `RoomDetailPage`, `BookingsPage`, dan `BookingDetailPage`.
  - Penyempurnaan tampilan tombol:
    - Konsistensi style dan hover effect untuk tombol Rooms dan Bookings (primary/secondary/danger) agar pengalaman pengguna lebih modern dan selaras.
