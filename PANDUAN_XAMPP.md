# Panduan Penyebaran & Instalasi Koperasi Merah Putih di XAMPP

Aplikasi ini menggunakan teknologi **React (Frontend)** dan **Express Node.js (Backend)**. Jika Anda ingin menjalankan aplikasi ini menggunakan **XAMPP** di komputer lain, berikut adalah panduan lengkap langkah-demi-langkah yang disesuaikan untuk server Apache XAMPP.

---

## Ringkasan Arsitektur
XAMPP secara default adalah server untuk **PHP & MySQL**. Karena aplikasi ini adalah aplikasi web modern (React SPA):
1. **Frontend (Tampilan)**: Dapat langsung diletakkan di dalam folder `htdocs` milik XAMPP dan dijalankan lewat Apache.
2. **Backend (Fungsi API & Sinkronisasi)**: Memerlukan Node.js untuk berjalan di latar belakang, atau Anda dapat menggunakan versi Client-Side (SPA) murni di mana seluruh data disimpan di penyimpanan lokal browser komputer masing-masing.

Berikut adalah 2 metode mudah untuk menginstalnya di XAMPP:

---

## METODE 1: Distribusi Client-Side Mandiri (Paling Mudah & Praktis untuk XAMPP)

Metode ini mengubah seluruh aplikasi menjadi file statis (HTML, CSS, JS) yang bisa langsung dibuka lewat Apache XAMPP tanpa perlu menginstal Node.js di komputer target.

### Langkah 1: Build/Kompilasi Aplikasi
Sebelum memindahkan aplikasi ke komputer lain, kita harus mengompilasinya menjadi file siap pakai:
1. Di folder proyek ini, jalankan perintah pembuatan versi produksi (atau lakukan ekspor ZIP dari AI Studio yang sudah otomatis memuat folder `dist`).
2. Folder hasil kompilasi bernama **`dist`** adalah **"satu kesatuan file aplikasi"** Anda.

### Langkah 2: Memindahkan ke XAMPP di Perangkat Lain
1. Di komputer target, buka aplikasi **XAMPP Control Panel** dan pastikan service **Apache** sudah diaktifkan (klik *Start*).
2. Buka direktori instalasi XAMPP Anda, biasanya terletak di:
   * **Windows**: `C:\xampp\htdocs\`
   * **macOS**: `/Applications/XAMPP/htdocs/`
3. Buat folder baru di dalam `htdocs`, beri nama misalnya **`koperasi`**.
4. Salin (copy) seluruh isi dari folder **`dist`** milik aplikasi ini, lalu tempel (paste) ke dalam folder `C:\xampp\htdocs\koperasi\`.

### Langkah 3: Konfigurasi `.htaccess` agar Halaman Tidak Error saat di-Refresh (Sangat Penting!)
Karena ini adalah Single Page Application (SPA), Apache perlu diarahkan agar selalu membaca `index.html` saat halaman disegarkan.
1. Buat file baru bernama **`.htaccess`** di dalam folder `C:\xampp\htdocs\koperasi\`.
2. Masukkan kode berikut ke dalam file `.htaccess` tersebut:
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteBase /koperasi/
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /koperasi/index.html [L]
   ```
3. Simpan file tersebut.

### Langkah 4: Jalankan Aplikasi!
Buka browser (Chrome/Edge/Firefox) di perangkat tersebut, lalu ketik alamat:
👉 **`http://localhost/koperasi`**

Aplikasi Koperasi Merah Putih sekarang berjalan 100% lokal di komputer tersebut melalui server XAMPP!

---

## METODE 2: Full-Stack dengan Node.js (Mendukung Sinkronisasi Cloud Google Sheets)

Jika Anda memerlukan fitur sinkronisasi Google Sheets online berjalan secara realtime di server lokal:

### Langkah 1: Persiapan di Komputer Target
1. Instal **Node.js** di komputer target (Unduh gratis dari [nodejs.org](https://nodejs.org/)).
2. Ekstrak folder proyek koperasi ini di mana saja (misalnya di `D:\koperasi`).

### Langkah 2: Jalankan Service via Windows Batch Script
Kami telah menyediakan file otomatis bernama **`jalankan_aplikasi.bat`** (untuk Windows) dan **`jalankan_aplikasi.sh`** (untuk macOS/Linux).
1. Masuk ke folder proyek koperasi.
2. Klik dua kali file **`jalankan_aplikasi.bat`**.
3. Skrip akan otomatis menginstal library yang diperlukan dan mengaktifkan server di port `3000`.
4. Browser akan terbuka otomatis mengarah ke **`http://localhost:3000`**.

### Langkah 3: Hubungkan Apache XAMPP sebagai Proxy (Opsional)
Jika Anda ingin pengguna mengakses lewat port standar HTTP XAMPP (`http://localhost/koperasi`) tapi tetap terhubung ke server backend Node.js:
1. Buka file konfigurasi Apache `httpd.conf` di XAMPP Control Panel (klik tombol *Config* di sebelah Apache -> pilih `httpd.conf`).
2. Cari dan pastikan baris berikut tidak memiliki tanda pagar `#` di depannya (aktifkan modul proxy):
   ```apache
   LoadModule proxy_module modules/mod_proxy.so
   LoadModule proxy_http_module modules/mod_proxy_http.so
   ```
3. Tambahkan baris konfigurasi berikut di bagian paling bawah file `httpd.conf`:
   ```apache
   ProxyPass /koperasi http://localhost:3000
   ProxyPassReverse /koperasi http://localhost:3000
   ```
4. Restart Apache di XAMPP Control panel.
5. Sekarang Anda bisa mengakses aplikasi lewat **`http://localhost/koperasi`** yang di-proxy-kan ke server Node.js di latar belakang!

---

## Fitur Ekspor Tabel Spreadsheet yang Siap Digunakan:
Dengan XAMPP ataupun Node.js, Anda dapat mengunduh spreadsheet offline tanpa internet:
1. **Ekspor Data Program Kerja**: Buka tab **Sirkulasi Progja** di Dasbor Pengurus, lalu tekan tombol hijau **"Unduh Progja (CSV)"**.
2. **Ekspor Transaksi Keuangan**: Buka tab **Keuangan** di Dasbor Pengurus, lalu tekan tombol hijau **"Unduh Spreadsheet (CSV)"**.
3. **Ekspor Log Audit Keamanan**: Buka tab **Log Aktivitas**, lalu tekan tombol **"Unduh Laporan Audit (CSV)"**.
