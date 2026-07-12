# Panduan Instalasi Aplikasi Koperasi Merah Putih di PC/Laptop

Panduan ini menjelaskan langkah-langkah untuk mengunduh, menginstal, dan menjalankan aplikasi Koperasi Digital Merah Putih secara lokal di komputer (PC/Laptop) Anda, serta cara menghubungkannya dengan Google Sheets (Spreadsheet) dan mengekspor laporan dalam format Spreadsheet offline (CSV).

---

## Bagian 1: Persiapan Sistem di PC / Laptop

Untuk menjalankan aplikasi ini secara lokal di PC Anda, Anda memerlukan **Node.js** (mesin pembantu untuk menjalankan aplikasi web modern).

### Langkah 1: Instalasi Node.js
1. Unduh penginstal Node.js dari situs web resmi: [https://nodejs.org/](https://nodejs.org/)
2. Direkomendasikan memilih versi **LTS** (versi stabil untuk pengguna umum).
3. Jalankan file penginstal yang telah diunduh (format `.msi` untuk Windows, atau `.pkg` untuk macOS) dan ikuti petunjuk pemasangannya sampai selesai (klik *Next* terus-menerus).

---

## Bagian 2: Mengunduh File Aplikasi dari AI Studio

Untuk memindahkan kode aplikasi dari cloud ke komputer lokal Anda:
1. Klik menu **Settings** (ikon gerigi) atau tombol ekspor di panel kanan atas/samping Google AI Studio.
2. Pilih opsi **Export to ZIP** atau **Download ZIP** untuk mengunduh seluruh folder proyek ini dalam satu file arsip terkompresi.
3. Setelah unduhan selesai, ekstrak file ZIP tersebut ke folder di PC Anda (misalnya di folder `D:\Koperasi-MerahPutih` atau `C:\Koperasi-MerahPutih`).

---

## Bagian 3: Menjalankan Aplikasi di PC secara Otomatis

Kami telah menyertakan skrip otomatis agar Anda tidak perlu mengetik perintah rumit di Command Prompt.

### Opsi A: Bagi Pengguna Windows (PC Biasa)
1. Buka folder tempat Anda mengekstrak file aplikasi tadi.
2. Temukan file bernama **`jalankan_aplikasi.bat`**.
3. Klik dua kali (double click) file tersebut.
4. Jendela hitam (Command Prompt) akan terbuka dan otomatis mengunduh komponen pembantu serta menjalankan server lokal.
5. Setelah muncul tulisan `Server running on http://localhost:3000`, browser Anda akan otomatis terbuka (atau Anda bisa membuka Google Chrome dan mengetik alamat: `http://localhost:3000`).

### Opsi B: Bagi Pengguna macOS atau Linux
1. Jalankan Terminal di komputer Anda.
2. Ketik perintah berikut untuk mengizinkan skrip berjalan:
   ```bash
   chmod +x jalankan_aplikasi.sh
   ./jalankan_aplikasi.sh
   ```
3. Buka browser dan kunjungi `http://localhost:3000`.

---

## Bagian 4: Menjalankan / Mengintegrasikan dengan Spreadsheet (Google Sheets)

Aplikasi ini mendukung dua jenis integrasi dengan spreadsheet:
1. **Ekspor Offline Langsung (Format CSV Spreadsheet)**:
2. **Sinkronisasi Otomatis Cloud (Google Sheets API)**.

### Fitur Baru 1: Unduh Laporan Spreadsheet Offline (CSV)
Anda dapat mengunduh seluruh data dalam format tabel spreadsheet yang kompatibel dengan Microsoft Excel, WPS Office, maupun Google Sheets secara langsung tanpa koneksi internet atau login Google:
* **Rekap Program Kerja (Progja)**: Buka menu **Sirkulasi Progja** di Dasbor Pengurus, lalu klik tombol hijau **"Unduh Progja (CSV)"** di kanan atas tabel filter.
* **Laporan Keuangan**: Buka menu **Keuangan** di Dasbor Pengurus, lalu klik tombol hijau **"Unduh Spreadsheet (CSV)"** di samping tombol input transaksi.
* **Log Aktivitas**: Buka menu **Log Aktivitas**, lalu klik tombol **"Unduh Laporan Audit (CSV)"**.

---

### Fitur Baru 2: Sinkronisasi Cloud ke Google Sheets (Online)
Jika ingin data di aplikasi sinkron otomatis ke file Google Sheets di Google Drive Anda:

1. **Memasukkan ID Spreadsheet**:
   * Buat spreadsheet baru di Google Drive Anda ([sheets.new](https://sheets.new)).
   * Salin kode **ID Spreadsheet** dari URL browser Anda.
     * *Contoh URL*: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
     * *ID Spreadsheet-nya adalah*: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
   * Masuk ke **Dasbor Pengurus** -> buka tab **Sirkulasi Progja** -> klik tombol **Pengaturan** (di bawah).
   * Masukkan ID tersebut pada kolom **Spreadsheet ID**.

2. **Menghubungkan Akun Google**:
   * Klik tombol **"Hubungkan Google"** yang ada di pengaturan sistem.
   * Masuk dengan akun Google Anda dan setujui izin untuk mengelola file Spreadsheet.
   * Aktifkan tombol toggle **"Auto-Sync Otomatis"** agar setiap ada pembaruan program kerja atau keuangan di aplikasi PC, data di Google Sheets online Anda ikut terupdate seketika!
   * Atau klik tombol **"Sinkronisasi Sekarang"** untuk mengunggah rekap data secara manual ke awan.

---

## Bagian 5: Solusi Masalah (Troubleshooting)

1. **Error: `Command not found` atau `Node is not recognized`**
   * Solusi: Anda belum menginstal Node.js, atau Anda perlu menutup Command Prompt dan membukanya kembali setelah instalasi Node.js selesai agar PC mengenali perintah tersebut.
2. **Port 3000 sudah terpakai aplikasi lain**
   * Solusi: Edit file `server.ts` bagian `const PORT = 3000;` ubah angkanya menjadi port lain seperti `3005`.
