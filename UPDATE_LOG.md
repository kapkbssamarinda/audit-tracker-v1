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
  - **[FRONTEND UPDATED]** Perbaikan logika pada fungsi `claimTask` di `app.js` agar tidak secara tidak sengaja menimpa *Due Date* dengan nilai kosong saat anggota melakukan klaim pekerjaan.
- **Perbaikan UI Re-open (Buka Kembali):**
  - Tombol **Buka Kembali** tidak lagi menampilkan Modal "Tolak Pekerjaan" yang wajib diisi dengan alasan penolakan yang membingungkan.
  - Sekarang aplikasi hanya memunculkan sebuah dialog konfirmasi standar (_browser confirm_) yang memberikan note otomatis `"Dibuka kembali oleh reviewer"`.
- **Pengembalian Status "Ke Belum":**
  - Anggota tim kini dapat mengklik **"Ke Belum"** untuk me-reset kembali pekerjaan yang pernah ditolak (_Rejected_), asalkan statusnya saat ini bukan sedang dalam proses _Review_ ('Menunggu Review') dan bukan _Approved_. Ini memungkinkan anggota mengulang task yang telah di-_reject_.
