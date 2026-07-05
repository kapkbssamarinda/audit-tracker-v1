# Catatan Pembaruan & Perbaikan (Update Log)

Dokumen ini berisi daftar masalah yang telah diperbaiki pada proyek **Audit Tracker v1** (frontend & backend).

## 1. Perbaikan Bug & Keamanan
- **Celah XSS pada Daftar Klien:** Mengganti cara pelemparan data pada atribut `onclick` dari yang sebelumnya menggunakan `JSON.stringify(cl)` menjadi hanya melempar `ID_Client`. Data klien kemudian diakses dengan aman melalui `clientsCache` di sisi JavaScript. Ini mencegah terjadinya manipulasi DOM/XSS jika data klien mengandung karakter spesial.
- **Validasi Form Klien & Tim:** Menambahkan validasi (`trim()`) sebelum _submit_ ke backend. Pengguna tidak bisa lagi menyimpan Klien atau Tim jika field nama (atau tahun buku) hanya berisi spasi kosong.
- **Tipe Data Tahun Buku:** Mengubah form input Tahun Buku di `index.html` dari `type="text"` menjadi `type="number"` dengan limit (min 2000, max 2100) guna menghindari salah ketik (typo).

## 2. Peningkatan Alur Kerja (Workflow UI)
- **Klaim / Ambil Task (Self-Assign):** 
  - Ditambahkan fungsi bagi Anggota Tim untuk mengambil task yang masih kosong (belum di-assign oleh Ketua). 
  - **[BACKEND UPDATED]** Kode pada file `code.gs` telah diperbarui sehingga `assignTask` kini secara sah mengizinkan user dengan role `Anggota` untuk menugaskan suatu task *asalkan* email tujuannya adalah dirinya sendiri (`isSelfAssigning`).
- **Batasan Tahapan Reporting (Hanya untuk Ketua):**
  - Kini semua *task* yang berada pada tahapan **Reporting** dikunci secara eksklusif untuk diselesaikan oleh Ketua Tim.
  - **[FRONTEND UPDATED]** Anggota tim tidak akan melihat tombol "Ambil Task" pada tahapan Reporting. Jika Ketua mengklik tombol "Tugaskan", pilihan nama yang muncul di modal dropdown (hanya) memunculkan nama Ketua.
  - **[BACKEND UPDATED]** Backend (via `code.gs`) akan secara ketat memblokir penugasan (assign) jika tahapan adalah 'Reporting' dan email target bukanlah email milik Ketua.
- **Penyederhanaan UI: Penghapusan Due Date:**
  - Menghapus kolom dan fungsi input `Due Date` dari semua elemen UI (tabel Task, modal Assign) di `app.js` dan `index.html`, serta menghapus logika pembacaan due date pada API `assignTask` di `code.gs` agar antarmuka menjadi lebih bersih karena tidak digunakan.
- **Perbaikan UI Re-open (Buka Kembali):**
  - Tombol **Buka Kembali** tidak lagi menampilkan Modal "Tolak Pekerjaan" yang wajib diisi dengan alasan penolakan yang membingungkan.
  - Sekarang aplikasi hanya memunculkan sebuah dialog konfirmasi standar (_browser confirm_) yang memberikan note otomatis `"Dibuka kembali oleh reviewer"`.
- **Pengembalian Status "Ke Belum":**
  - Anggota tim kini dapat mengklik **"Ke Belum"** untuk me-reset kembali pekerjaan yang pernah ditolak (_Rejected_), asalkan statusnya saat ini bukan sedang dalam proses _Review_ ('Menunggu Review') dan bukan _Approved_. Ini memungkinkan anggota mengulang task yang telah di-_reject_.
