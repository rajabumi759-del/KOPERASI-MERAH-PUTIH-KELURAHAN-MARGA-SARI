#!/bin/bash

# Menghias tampilan terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================================${NC}"
echo -e "${GREEN}    SELAMAT DATANG DI APLIKASI KOPERASI MERAH PUTIH       ${NC}"
echo -e "${GREEN}               Sistem Dasbor dan Sirkulasi Kerja          ${NC}"
echo -e "${BLUE}==========================================================${NC}"
echo ""

# Memeriksa apakah Node.js sudah terinstal
if ! command -v node &> /dev/null
then
    echo -e "${RED}[ERROR] Node.js belum terinstal di komputer Anda!${NC}"
    echo "Silakan unduh dan instal Node.js terlebih dahulu dari:"
    echo "https://nodejs.org/"
    echo ""
    echo "Setelah menginstal Node.js, silakan jalankan kembali skrip ini."
    exit 1
fi

echo -e "${GREEN}[OK] Node.js terdeteksi: $(node -v)${NC}"

# Menginstal modul jika folder node_modules belum ada
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[INFO] Menginstal modul pembantu (dependencies)...${NC}"
    echo "Harap tunggu beberapa menit..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Gagal menginstal komponen pembantu. Pastikan terhubung internet.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}[OK] Komponen pendukung sudah terpasang.${NC}"
fi

echo ""
echo -e "${BLUE}[INFO] Menjalankan server aplikasi lokal...${NC}"
echo "Kunjungi http://localhost:3000 di browser Anda."
echo "Tekan CTRL + C di terminal ini untuk mematikan aplikasi."
echo ""

# Buka browser otomatis sesuai OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2 && open "http://localhost:3000" &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sleep 2 && xdg-open "http://localhost:3000" &
fi

# Jalankan server
npm run dev
