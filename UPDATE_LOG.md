# Catatan Pembaruan & Perbaikan (Update Log)

Dokumen ini berisi daftar masalah yang telah diperbaiki pada proyek **Audit Tracker v1** (frontend & backend).

## 1. Perbaikan Bug & Keamanan
- **Celah XSS pada Daftar Klien:** Mengganti cara pelemparan data pada atribut `onclick` dari yang sebelumnya menggunakan `JSON.stringify(cl)` menjadi hanya melempar `ID_Client`. Data klien kemudian diakses dengan aman melalui `clientsCache` di sisi JavaScript. Ini mencegah terjadinya manipulasi DOM/XSS jika data klien mengandung karakter spesial.
- **Validasi Form Klien & Tim:** Menambahkan validasi (`trim()`) sebelum _submit_ ke backend. Pengguna tidak bisa lagi menyimpan Klien atau Tim jika field nama (atau tahun buku) hanya berisi spasi kosong.
- **Tipe Data Tahun Buku:** Mengubah form input Tahun Buku di `index.html` dari `type="text"` menjadi `type="number"` dengan limit (min 2000, max 2100) guna menghindari salah ketik (typo).

## 2. Peningkatan Alur Kerja (Workflow UI)
- **Klaim / Ambil Task (Self-Assign):** 
  - Ditambahkan fungsi bagi Anggota Tim untuk mengambil task yang masih kosong (belum di-assign oleh Ketua). 
  - **[BACKEND UPDATED - Visibility]** Memperbaiki filter pada fungsi `getTasks` di `code.gs`. Sebelumnya, *role* Anggota tidak diberikan data *task* yang kosong (belum ditugaskan). Kini filter telah diperbarui sehingga Anggota dapat melihat *task* kosong tersebut di tabel dan memunculkan tombol klaim.
  - **[BACKEND UPDATED - Authorization]** Kode pada file `code.gs` telah diperbarui sehingga fungsi `assignTask` kini secara sah mengizinkan user dengan role `Anggota` untuk menugaskan suatu task *asalkan* email tujuannya adalah dirinya sendiri (`isSelfAssigning`).
- **Batasan Tahapan Reporting (Hanya untuk Ketua):**
  - Kini semua *task* yang berada pada tahapan **Reporting** dikunci secara eksklusif untuk diselesaikan oleh Ketua Tim.
  - **[FRONTEND UPDATED]** Anggota tim tidak akan melihat tombol "Ambil Task" pada tahapan Reporting. Jika Ketua mengklik tombol "Tugaskan", pilihan nama yang muncul di modal dropdown (hanya) memunculkan nama Ketua.
  - **[BACKEND UPDATED]** Backend (via `code.gs`) akan secara ketat memblokir penugasan (assign) jika tahapan adalah 'Reporting' dan email target bukanlah email milik Ketua.
- **Penyederhanaan UI: Penghapusan Due Date:**
  - Menghapus kolom dan fungsi input `Due Date` dari semua elemen UI (tabel Task, modal Assign) di `app.js` dan `index.html`, serta menghapus logika pembacaan due date pada API `assignTask` di `code.gs` agar antarmuka menjadi lebih bersih karena tidak digunakan.
  - **[BACKEND UPDATED]** Menghapus referensi `Due_Date` dari susunan array `HEADERS` dalam *source code* `code.gs` agar backend sepenuhnya terlepas dari kolom tersebut.
- **Perbaikan UI Re-open (Buka Kembali):**
  - Tombol **Buka Kembali** tidak lagi menampilkan Modal "Tolak Pekerjaan" yang wajib diisi dengan alasan penolakan yang membingungkan.
  - Sekarang aplikasi hanya memunculkan sebuah dialog konfirmasi standar (_browser confirm_) yang memberikan note otomatis `"Dibuka kembali oleh reviewer"`.
- **Pengembalian Status "Ke Belum":**
  - Anggota tim kini dapat mengklik **"Ke Belum"** untuk me-reset kembali pekerjaan yang pernah ditolak (_Rejected_), asalkan statusnya saat ini bukan sedang dalam proses _Review_ ('Menunggu Review') dan bukan _Approved_. Ini memungkinkan anggota mengulang task yang telah di-_reject_.

## 3. Peningkatan Antarmuka (UI/UX)
- **Hierarki Visual & Kenyamanan Mobile:**
  - Menambahkan pembatas visual di bawah tab navigasi utama agar tidak menyatu dengan konten (*Whitespace/Border*).
  - Menyederhanakan tata letak tombol aksi di dalam tabel pada mode _desktop_ (dari _vertical_ menjadi _inline flex_).
  - Menyelaraskan bobot visual tombol *review* (*Approve* dan *Reject*) menggunakan gaya *outline*.
  - Mengubah _Toast_ notifikasi agar muncul di posisi tengah atas (bukan di kanan bawah) pada layar _mobile_ agar tidak tertutup jari pengguna.
  - Memaksimalkan semua _modal form_ menjadi mode _fullscreen_ pada layar kecil (`modal-fullscreen-sm-down`).
  - Menambahkan fitur *CSS Scroll Snap* pada tab navigasi agar pergeseran tab di *mobile* terasa natural dan halus layaknya aplikasi *native*.
- **Konsistensi Tema Warna & Logo:**
  - Mengekstrak warna utama dari file logo KAP KBS (`src/logo/logo.png`) dan menjadikannya dasar skema warna (*Navy Blue, Red, Yellow*) dengan cara melakukan *override* variabel akar Bootstrap 5 (`:root`). 
  - Mengubah latar belakang layar _login_ menjadi gradien biru dongker yang relevan dengan citra profesional logo perusahaan.
  - Menempatkan logo aplikasi di atas _form_ layar _login_ dengan batas maksimal yang diperbesar, menggantikan *icon clipboard* bawaan.
- **Implementasi SweetAlert2 pada Alur Login:**
  - Layar "Memverifikasi akun..." yang dulunya teks statis kini digantikan oleh *loading popup* SweetAlert2 yang menahan klik pengguna di luar area.
  - Pesan penolakan masuk (seperti email tidak berwenang/sesi kedaluwarsa) sekarang ditampilkan melalui _modal error_ SweetAlert2 yang besar dan jelas di tengah layar alih-alih peringatan kecil (_toast_).
- **Refaktor Tombol Folder (Penyederhanaan UI):**
  - **Penghapusan Tombol Repetitif:** Menghapus tombol "Folder" yang sebelumnya muncul berulang kali di setiap baris dari 17 tugas.
  - **4 Tombol Utama:** Menyederhanakan akses Google Drive dengan hanya menyediakan 4 tombol utama: (1) Folder Klien (di sebelah nama klien), (2) Folder Planning, (3) Folder Execution, dan (4) Folder Reporting yang menempel rapi pada judul (*header*) masing-masing tabel tahapan.
  - **Visualisasi Menonjol:** Tombol folder di-desain ulang menggunakan bentuk elips (*rounded-pill*), warna solid (`btn-primary`), dan ditambahkan ikon link eksternal (`bi-box-arrow-up-right`) agar fungsinya lebih jelas bagi pengguna.
