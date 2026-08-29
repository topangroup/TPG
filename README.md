# Data Karyawan Topan Group — v2

Website data karyawan (Indo & Khmer) dengan 4 tab:
- **Data Karyawan** — paspor, visa, rekening, dll (sama seperti versi sebelumnya, hanya tipe staf sekarang **INDO** / **KHMER**, tanpa kata "STAFF")
- **Daftar Cuti**
- **Claim Tiket / Cuti Lokal**
- **Resign / Pecat**

Data **sinkron real-time** — kalau 1 orang input data, semua orang lain yang buka website langsung lihat perubahannya, tanpa refresh. Ini dicapai pakai **Firebase Firestore** (database gratis dari Google) sebagai backend, karena GitHub Pages sendiri hanya bisa menghos­ting file statis (HTML/CSS/JS) — tidak punya database, jadi wajib disambungkan ke database seperti Firebase agar bisa "shared" antar orang.

Hanya orang yang **diberi akun oleh admin** yang bisa login dan melihat/mengubah data. Tidak ada tombol daftar sendiri di website.

---

## 1. Setup Firebase (sekali saja, ±10 menit)

1. Buka [console.firebase.google.com](https://console.firebase.google.com), login pakai akun Google.
2. Klik **Add project** → beri nama (mis. `topan-group-hr`) → lanjutkan (boleh matikan Google Analytics, tidak perlu).
3. Di dashboard project, klik ikon **`</>`** (Web) untuk mendaftarkan aplikasi web.
   - Beri nama app (mis. `topan-hr-web`), **jangan** centang Firebase Hosting (kita pakai GitHub Pages).
   - Setelah selesai, Firebase akan menampilkan blok kode `firebaseConfig = {...}`. **Copy semua isinya.**
4. Buka file **`js/firebase-config.js`** di folder project ini, ganti bagian `firebaseConfig` dengan yang tadi di-copy. Simpan.
5. Di menu kiri Firebase Console, buka **Build → Authentication** → klik **Get started** → pada tab "Sign-in method", aktifkan **Email/Password**.
6. Masih di tab "Sign-in method", aktifkan juga **Email link (passwordless sign-in)** — ini yang dipakai untuk fitur "Kirim Link ke Email" saat login.
7. Buka tab **Settings** (masih di halaman Authentication) → bagian **Authorized domains** → klik **Add domain** → masukkan domain GitHub Pages Anda, contoh: `namaakun.github.io` (tanpa `https://`, tanpa slash di akhir). **Wajib dilakukan**, kalau tidak, fitur "Link Masuk" akan gagal dengan error domain tidak diizinkan.
8. Buka **Build → Firestore Database** → **Create database** → pilih lokasi server terdekat (mis. `asia-southeast1`) → mode **production**.
9. Buka tab **Rules** di Firestore, hapus isinya, lalu copy-paste seluruh isi file **`firestore.rules`** dari project ini, klik **Publish**.
   - Ini yang membuat data **aman**: hanya user yang login yang bisa baca/tulis. Orang lain yang buka link website tanpa login tidak akan bisa melihat data sama sekali.

Selesai — backend sudah siap. Orang-orang sekarang bisa **daftar sendiri** dari halaman website (tab "Daftar": isi Username, Password, Gmail) — tidak perlu lagi Anda buatkan akun satu-satu di Firebase Console.

---

## 2. Publish ke GitHub (GitHub Pages)

1. Buat repository baru di GitHub (boleh **Private** kalau mau — GitHub Pages tetap bisa jalan untuk repo private di paket berbayar; kalau pakai akun gratis, repo harus **Public** agar Pages aktif — datanya tetap aman karena diproteksi Firestore Rules, bukan dari kerahasiaan kode).
2. Upload semua isi folder project ini (`index.html`, folder `css/`, folder `js/`, dll) ke repo tersebut.
3. Di repo, buka **Settings → Pages**.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)` → **Save**.
5. Tunggu 1–2 menit, GitHub akan menampilkan link seperti:
   `https://namaakun.github.io/nama-repo/`
6. Buka link itu, login pakai salah satu akun yang sudah dibuat di langkah 1.6 tadi.

Website sudah bisa diakses siapa saja yang punya link **dan** akun login yang sah.

---

## 3. Cara maintenance / ubah-ubah ke depannya

Struktur file sengaja dipisah biar gampang dicari & diubah, tidak perlu paham semua kode:

```
index.html                 → kerangka halaman & daftar tab
css/style.css               → semua tampilan/warna/ukuran
js/firebase-config.js       → kunci koneksi ke database
js/common.js                → fungsi bantu kecil (format tanggal, dll)
js/crud-table.js            → "mesin" tabel — tambah/edit/hapus/cari/urutkan.
                               DIPAKAI BERSAMA oleh ke-4 tab, jadi kalau
                               benerin/ubah 1 hal di sini, otomatis
                               berlaku ke semua tab.
js/module-karyawan.js       → daftar kolom tab "Data Karyawan"
js/module-cuti.js           → daftar kolom tab "Daftar Cuti"
js/module-claim.js          → daftar kolom tab "Claim Tiket / Cuti Lokal"
js/module-resign.js         → daftar kolom tab "Resign / Pecat"
js/app.js                   → logika ganti-tab & menyalakan semua modul
firestore.rules             → aturan keamanan database
```

### Contoh: menambah/mengubah kolom pada suatu tab
Buka file `js/module-<nama-tab>.js`, cari array `..._FIELDS`, lalu:
- Tambah kolom baru → tambah baris baru di array, contoh:
  ```js
  {key:'contoh', label:'Kolom Contoh', type:'text'}
  ```
- Hapus kolom → hapus barisnya.
- Ubah pilihan dropdown → ubah isi `options:[...]`.

Tidak perlu sentuh `crud-table.js` sama sekali untuk perubahan kolom seperti ini.

### Contoh: menambah tab baru
1. Buat file baru `js/module-xxx.js` (contek pola `js/module-cuti.js`).
2. Di `index.html`, tambah satu tombol di `.tabs` dan satu `<div id="panel-xxx" class="tab-panel"></div>`.
3. Di `js/app.js`, panggil `initXxxModule()` di dalam `initModules()`.

---

## 4. Ringkasan keamanan

- **apiKey Firebase yang terlihat di kode publik itu normal**, bukan celah keamanan — Firebase memang didesain begitu (dijelaskan resmi di dokumentasi Firebase).
- Keamanan sesungguhnya ada di 2 lapis:
  1. **Login wajib** (Firebase Authentication) — tanpa akun yang dibuatkan admin, tidak bisa masuk sama sekali.
  2. **Firestore Security Rules** — server Google menolak semua permintaan baca/tulis dari siapapun yang belum login, walau mereka coba akses langsung ke database tanpa lewat website ini.
- Rekomendasi tambahan:
  - Jangan bagikan email/password akun ke luar tim.
  - Kalau ada staf yang resign dan sebelumnya punya akses admin, hapus akunnya di Firebase Console → Authentication → Users.
  - Backup data secara berkala: gunakan tombol **Ekspor CSV** di tiap tab, atau lihat data langsung di Firebase Console → Firestore Database.
