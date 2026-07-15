# Audit Progress Tracker — KAP KBS

Aplikasi berbasis Progressive Web App (PWA) untuk internal KAP Kuncara Budi Santosa & Rekan. Aplikasi ini bertujuan untuk melacak progres pekerjaan audit per klien, mencakup 17 task standar mulai dari tahap Planning, Execution, hingga Reporting, lengkap dengan alur penugasan, pembaruan status, dan review berjenjang.

## 🌟 Fitur Utama

- **Pelacakan Progres (17 Task Standar):** Memantau progres pekerjaan dengan mudah.
- **Review Berjenjang:** Alur persetujuan pekerjaan (Anggota Tim → Ketua Tim → Manager).
- **Manajemen Klien & Tim:** Menugaskan tim audit ke berbagai klien yang ditangani.
- **Akses Berbasis Peran (Role-based):**
  - **Admin:** Mengelola master data (Tim, User, dll).
  - **Partner:** Melihat laporan progres seluruh klien secara garis besar (overview).
  - **Manager, Ketua Tim, Anggota Tim:** Mengerjakan, mereview, dan memantau tugas audit klien.
- **Autentikasi Aman:** Menggunakan Google Sign-In (OAuth 2.0).

## 🛠️ Teknologi yang Digunakan

Aplikasi ini menggunakan pendekatan sederhana dan ringan (Vanilla stack) di bagian *frontend*, dengan backend memanfaatkan ekosistem Google Workspace.

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (tanpa framework).
- **UI/UX Framework:** Bootstrap 5.3.3 & Bootstrap Icons 1.11.3.
- **PWA (Progressive Web App):** Mendukung instalasi di perangkat seluler (Service Worker `sw.js` dan Web Manifest).
- **Backend & Database:** Google Apps Script (GAS) dan Google Sheets.
- **Authentication:** Google Identity Services (GSI).

## 📂 Struktur Direktori

- `index.html` — Halaman utama aplikasi (Single Page Application UI).
- `app.js` — Logika aplikasi (routing antar tab, panggilan API ke Google Apps Script, manajemen state/session, render UI).
- `style.css` — Penyesuaian antarmuka, warna, dan perbaikan tampilan responsif.
- `PRODUCT.md` — Spesifikasi produk, prinsip desain, persona merek, dan persyaratan aksesibilitas (WCAG).
- `manifest.webmanifest` & `sw.js` — Konfigurasi PWA dan Service Worker untuk mendukung caching & instalasi aplikasi.
- `icons/` — Kumpulan ikon aplikasi untuk kebutuhan PWA.

## 🎨 Prinsip Desain

1. **Mobile-first:** Mengingat staf sering mengakses aplikasi dari lapangan, antarmuka dirancang agar ramah layar sentuh (satu tangan).
2. **Familiar & Bersih:** Menggunakan komponen Bootstrap standar tanpa dekorasi berlebihan. Aplikasi difokuskan pada tugas (tampilan "menghilang" ke dalam tugas).
3. **Status Selalu Terlihat:** Badge status dan review menjadi pusat perhatian.
4. **Alur Singkat:** Aksi utama dioptimalkan agar hanya membutuhkan 1-2 ketukan.

## 🚀 Instalasi & Pengembangan

Karena aplikasi ini berupa Vanilla Web App (HTML/CSS/JS), maka tidak ada proses *build* rumit yang dibutuhkan. Anda cukup:

1. Modifikasi file `index.html`, `app.js`, atau `style.css` menggunakan code editor Anda.
2. Gunakan ekstensi seperti *Live Server* (di VSCode) atau jalankan *local server* (seperti `npx serve`) di folder proyek untuk mengujinya secara lokal.
3. Pastikan konfigurasi `GAS_URL` dan `GOOGLE_CLIENT_ID` di file `app.js` (baris teratas) sesuai dengan *environment* Anda.
4. **Setup Custom Protocol Google Drive (Windows Only):** Agar tombol "Buka Folder" berfungsi di Windows Explorer, pastikan Anda:
   - Membuat folder `C:\Tools\GdriveHandler\` di laptop Anda.
   - Menyalin file `gdrive_handler.ps1` ke dalam folder tersebut.
   - Mengeksekusi (double-click) file `setup-drive-protocol.reg` untuk mendaftarkan protocol handler ke Registry Windows. (Harus di-import ulang jika sebelumnya pernah meng-install versi lama).

### Catatan Pendeployan
Proyek ini dikonfigurasi untuk disebarkan secara otomatis ke GitHub Pages menggunakan GitHub Actions (sesuai referensi di `jobs.json`). Push ke branch `main` akan men-trigger proses deploy.
