@echo off
title Menjalankan Aplikasi Koperasi Merah Putih
color 0a

echo ==========================================================
echo    SELAMAT DATANG DI APLIKASI KOPERASI MERAH PUTIH
echo               Sistem Dasbor dan Sirkulasi Kerja
echo ==========================================================
echo.

:: Memeriksa apakah Node.js sudah terinstal
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstal di PC Anda!
    echo Silakan unduh dan instal Node.js terlebih dahulu dari:
    echo https://nodejs.org/
    echo.
    echo Setelah menginstal Node.js, silakan buka kembali file ini.
    echo.
    pause
    exit
)

echo [OK] Node.js terdeteksi. Mempersiapkan aplikasi...
echo.

:: Memeriksa keberadaan folder node_modules, jika tidak ada maka jalankan npm install
if not exist node_modules (
    echo [INFO] Menginstal modul pembantu (dependencies)... Ini hanya dilakukan satu kali saat pertama dijalankan.
    echo Harap tunggu beberapa menit...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal menginstal komponen pembantu. Pastikan Anda terhubung ke Internet.
        pause
        exit
    )
) else (
    echo [OK] Komponen pendukung sudah terpasang.
)

echo.
echo [INFO] Menjalankan server aplikasi lokal...
echo [INFO] Setelah server berjalan, halaman aplikasi akan terbuka secara otomatis di browser Anda.
echo [INFO] Tekan tombol CTRL + C di jendela ini untuk mematikan aplikasi.
echo.

:: Membuka browser setelah 3 detik jeda agar server sempat boot
start "" "http://localhost:3000"

:: Jalankan server pengembangan
call npm run dev

pause
