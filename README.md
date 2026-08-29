# 🎬 Sekolah Nakal — High-Performance Cloud Video Streaming & Discord Ecosystem

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20%7C%20Mobile-ff0055.svg)](https://sekolahnakal.so791.com)
[![Status](https://img.shields.io/badge/Status-Production%20Active-00c853.svg)](https://sekolahnakal.so791.com)
[![React](https://img.shields.io/badge/React-19%20%7C%20TypeScript-61dafb.svg)](https://react.dev/)
[![Scraper Engine](https://img.shields.io/badge/Cloud%20Engine-GitHub%20Actions%204--Worker%20Matrix-blueviolet.svg)](https://github.com/YerikhoArfensiasEffendi/sekolahnakal/actions)
[![Storage](https://img.shields.io/badge/Cloud%20Storage-ZeroStorage.net%20CDN-orange.svg)](https://zerostorage.net)
[![Security](https://img.shields.io/badge/Security-RBAC%20%7C%20Anti--DDoS%20%7C%20XSS%20Guarded-green.svg)](https://sekolahnakal.so791.com)

**Sekolah Nakal** adalah platform web streaming video berkinerja tinggi yang terintegrasi secara *real-time* dengan ekosistem Discord Guild. Platform ini dilengkapi dengan arsitektur penarikan arsip cloud terdistribusi (*4-Worker Parallel Matrix Scraper*), optimasi *FastStart MP4 Remuxing* untuk pemutaran instan 0-detik tanpa buffering di perangkat mobile, sistem manajemen akses berbasis peran (RBAC Tier: VVIP, VIP, Talent, Reguler), serta panel Studio Admin profesional.

---

## 📑 Daftar Isi
1. [Arsitektur & Alur Kerja Sistem (System Workflow)](#-arsitektur--alur-kerja-sistem-system-workflow)
2. [Fitur-Fitur Utama Platform](#-fitur-fitur-utama-platform)
3. [Pipeline Scraper Otomatis (4-Worker Parallel Matrix)](#-pipeline-scraper-otomatis-4-worker-parallel-matrix)
4. [Standar Keamanan Sistem (Security Architecture)](#-standar-keamanan-sistem-security-architecture)
5. [Hasil Uji Coba & Log Pengujian (Testing & Verification)](#-hasil-uji-coba--log-pengujian-testing--verification)
6. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
7. [Panduan Instalasi & Deployment](#-panduan-instalasi--deployment)

---

## 🏗️ Arsitektur & Alur Kerja Sistem (System Workflow)

Platform ini mengadopsi arsitektur *Hybrid Headless SPA + Distributed Cloud Ingestion Pipeline* dengan alur data *end-to-end* sebagai berikut:

```mermaid
flowchart TD
    subgraph Discord["1. Discord Guild & Community (6.800+ Arsip)"]
        DC1["14 Channel Target (Lokal, Asia, China, Barat, Arab, Jepang, Korea, Latin, dll)"]
        DC2["#purchase-history (Transaksi Member Real-time)"]
    end

    subgraph GitHubActions["2. Cloud Ingestion Engine (GitHub Actions)"]
        W1["⚡ Worker 1: Reguler Stream"]
        W2["⚡ Worker 2: VIP Asia-East (China, Korea, Jepang, Taiwan)"]
        W3["⚡ Worker 3: VIP Lokal-Asia"]
        W4["⚡ Worker 4: VIP Global (Barat, Arab, India, Latin)"]
        FFMPEG["FFmpeg Remux (+faststart header)"]
    end

    subgraph CloudStorage["3. High-Speed Cloud Storage"]
        ZS["ZeroStorage.net Universal CDN"]
        ZS_API["Direct Streaming Endpoint (/api/files/{id}/stream)"]
    end

    subgraph ServerBackend["4. Hostinger Production API (PHP 8.2)"]
        API_MOVIES["/api/movies.php (Atomic LOCK_EX & Auto Anti-Duplikat)"]
        API_POSTERS["/uploads/posters/ (Static JPG Decoded Assets)"]
        API_DISCORD["/api/discord.php (Role-Based Sync & Transaction Feed)"]
    end

    subgraph FrontendApp["5. Client Frontend (React 19 + TypeScript + Vite)"]
        HOME["Beranda (Rekomendasi Stabil, Swipe Transaksi Mobile)"]
        PRIVATE["Private Server (Pagination 20 Video/Halaman)"]
        WATCH["Pemutar Video (ArtPlayer Modern + iOS PlaysInline)"]
    end

    DC1 -->|Deep Historical Pagination| W1 & W2 & W3 & W4
    W1 & W2 & W3 & W4 --> FFMPEG
    FFMPEG -->|Universal API Upload| ZS
    ZS --> ZS_API
    W1 & W2 & W3 & W4 -->|JSON Payload with Poster JPG| API_MOVIES
    API_MOVIES --> API_POSTERS
    DC2 -->|Live Sync| API_DISCORD
    API_MOVIES & API_DISCORD --> FrontendApp
    ZS_API --> WATCH
```

### Penjelasan Tahapan Alur Kerja:
1. **Pengambilan Arsip (Ingestion)**:
   * 4 Worker di GitHub Actions menjelajahi riwayat pesan Discord secara mendalam (*Deep Historical Pagination* menggunakan parameter `before=last_message_id`).
   * Filter anti-duplikat langsung mengecek database server sebelum mengunduh agar tidak ada file yang diunggah dua kali.
2. **Optimasi Buffer Instan (*FastStart Remuxing*)**:
   * Skrip menjalankan `ffmpeg -i input.mp4 -c copy -movflags +faststart` untuk memindahkan metadata atom `moov` ke bagian awal file video. Hal ini memungkinkan pemutaran seketika (0 detik) di iPhone, Android, dan Desktop tanpa harus mengunduh keseluruhan file.
3. **Penyimpanan di Cloud CDN**:
   * Video diunggah langsung ke **ZeroStorage.net CDN**. Endpoint stream yang dihasilkan didaftarkan ke API server.
4. **Penyimpanan Database & Kompresi Poster (99.4% Payload Reduction)**:
   * Backend PHP menerima data video baru, mengonversi string poster Base64 menjadi file gambar `.jpg` statis berukuran kecil di disk server, dan mengunci file database dengan `LOCK_EX` agar penulisan paralel antar-worker aman tanpa *race condition*.
5. **Penyajian di Aplikasi Web Client**:
   * Aplikasi React membaca data dengan *cache-first strategy* (0ms rendering) dan memperbarui tampilan secara *asynchronous* di latar belakang.

---

## 🌟 Fitur-Fitur Utama Platform

### 1. 📱 Desain Mobile-First & Ultra Responsive Layout
* **Riwayat Transaksi Mobile Swipe Carousel**: Menampilkan bukti pembelian VIP/VVIP dari Discord dalam bentuk *horizontal swipe carousel* yang ringkas di HP (~110px tinggi layar), menggantikan daftar vertikal panjang yang memakan ruang.
* **Bar Navigasi Modern**: Dilengkapi tautan langsung ke **Server Discord Resmi**, **Channel Telegram Resmi**, **Paket Akses & Promo**, dan **Pengaturan**.
* **Katalog Private Server Kompak**: Navigasi filter kategori *horizontal chips*, pencarian terintegrasi, dan *Numbered Pagination* (maksimal 20 video per halaman) yang mudah disentuh dengan jempol di ponsel.

### 2. 🎬 Modern Video Streaming Engine (ArtPlayer + HLS)
* **Penyajian Multi-Format**: Mendukung pemutaran langsung MP4 high-bitrate, ZeroStorage CDN, dan HLS `.m3u8`.
* **Dukungan Penuh iOS Safari & Android**: Menggunakan atribut `playsInline`, `webkit-playsinline`, dan `x5-video-player-type: h5` agar video tidak mengalami error *00:00 duration* atau terblokir di iPhone/iPad.
* **Fitur Kontrol Lengkap**: Pilihan resolusi, pengaturan kecepatan putar (*playback rate*), *auto orientation*, *custom progress bar*, dan *touch gestures* (tap ganda untuk maju/mundur).

### 3. 🛡️ Role-Based Access Control (RBAC Discord Sync)
* Mengintegrasikan hak akses ke dalam 4 tingkatan tier:
  * 👑 **EXCLUSIF VVIP VAULT** (Akses master raw footage & edisi 4K uncensored)
  * ⭐ **EXCLUSIF VIP STUDIO** (Serial sinematik Asia, Cosplay & JAV style)
  * 💎 **EXCLUSIF TALENT POV** (Konten sudut pandang POV & talent resmi)
  * 👤 **REGULER STREAM** (Katalog gratis bebas akses)
* Verifikasi ID Discord dan penetapan role otomatis melalui endpoint API.

### 4. 🎛️ Studio Admin & Bulk Management
* Unggah video massal (*bulk upload*), pengaturan poster kustom, manajemen slot iklan banner/video, dan pengaturan kategori dinamis.

---

## ⚡ Pipeline Scraper Otomatis (4-Worker Parallel Matrix)

Scraper cloud dirancang dengan strategi matriks paralel di GitHub Actions untuk membagi beban 14 channel Discord menjadi 4 worker yang bekerja serentak:

| No | Worker Group | Target Channel Discord |
|:---|:---|:---|
| ⚡ **Worker 1** | `reguler` | `Media Forward`, `Media Barat (Reguler)`, `Media Asia (Reguler)`, `Media Lokal (Reguler)` |
| ⚡ **Worker 2** | `vip-asia-east` | `VIP Media China`, `VIP Media Korea`, `VIP Media Jepang`, `VIP Media Taiwan` |
| ⚡ **Worker 3** | `vip-lokal-asia` | `VIP Media Lokal`, `VIP Media Asia` |
| ⚡ **Worker 4** | `vip-global` | `VIP Media Barat`, `VIP Media Arab`, `VIP Media India`, `VIP Media Latin` |

* **Jadwal Eksekusi**:
  * 🕒 **Setiap Jam (`cron: '0 * * * *'`)**: Berjalan otomatis 24/7 di cloud untuk menyedot gelombang arsip 6.800+ video lama secara berkelanjutan.
  * ⏰ **Pukul 01:00 Pagi WIB (`cron: '0 18 * * *'`)**: Siklus harian terjadwal.
  * 🔘 **Manual Workflow Dispatch**: Dapat dipicu kapan saja melalui antarmuka GitHub Actions.

---

## 🔒 Standar Keamanan Sistem (Security Architecture)

Platform ini menerapkan standar keamanan berlapis:

1. **Anti-Duplikat & Integritas Data (Zero Duplicate Guarantee)**:
   * Verifikasi unik 3 lapis pada backend PHP (`id`, `discordMsgId`, `videoUrl`).
   * Operasi penulisan file menggunakan `LOCK_EX` eksklusif untuk mencegah korupsi data akibat request konkuren dari 4 worker bersamaan.
2. **Optimasi & Keamanan Payload (Base64 Sanitization)**:
   * Mengonversi seluruh string Base64 yang masuk menjadi file JPG fisik di server.
   * Ukuran database menyusut **99.4%** (dari 14MB menjadi 89KB), memangkas latensi respon API dari 15 detik menjadi **~300ms** dan mencegah serangan *Memory Exhaustion (DoS)*.
3. **Pembersihan XSS (Cross-Site Scripting Protection)**:
   * Seluruh input data (judul, sinopsis, nama genre, metadata) disaring ketat melalui `htmlspecialchars(strip_tags(...), ENT_QUOTES, 'UTF-8')`.
4. **Isolasi Kredensial & Header Proteksi**:
   * Token bot Discord dan API key ZeroStorage diisolasi dalam environment variable `.env` & GitHub Actions Secrets.
   * Proteksi `no-store, no-cache, must-revalidate` pada API untuk mencegah *stale cache* data autentikasi.

---

## 🧪 Hasil Uji Coba & Log Pengujian (Testing & Verification)

| No | Komponen yang Diuji | Skenario Pengujian | Hasil Uji Coba | Status |
|:---|:---|:---|:---|:---:|
| 1 | **Playback Lintas Perangkat** | Memutar video ZeroStorage di iOS Safari, Android Chrome, dan Desktop | Durasi terdeteksi normal, video berputar instan tanpa jeda `00:00` | ✅ PASS |
| 2 | **Optimasi FastStart** | Pengujian kecepatan awal pemutaran video berukuran 100MB+ | Buffer awal turun dari ~12 detik menjadi < 1 detik | ✅ PASS |
| 3 | **Kompresi Database** | Konversi 143+ poster Base64 menjadi file `.jpg` statis | Ukuran `movies.json` turun dari 14.1 MB ke 89 KB | ✅ PASS |
| 4 | **Uji Beban Anti-Duplikat** | Pemindaian duplikasi pada seluruh database dan input scraper | 13 video duplikat terhapus, filter mencegah re-upload 100% | ✅ PASS |
| 5 | **Parallel Matrix Scraper** | Eksekusi serentak 4 worker di GitHub Actions | 4 worker berhasil mengunggah 147+ video baru dalam 15 menit | ✅ PASS |
| 6 | **Stabilitas Rekomendasi** | Navigasi bolak-balik Beranda dan Private Server | Rekomendasi acak menggunakan bobot stabil per sesi tanpa reshuffle loop | ✅ PASS |

---

## 📁 Struktur Direktori Proyek

```
sekolah-nakal/
├── .github/
│   └── workflows/
│       └── auto-scraper.yml        # Workflow GitHub Actions 4-Worker Matrix & Hourly Schedule
├── public/
│   ├── api/
│   │   ├── data/
│   │   │   ├── config.json         # Konfigurasi Guild & Role Discord
│   │   │   └── movies.json         # Database utama katalog video (89 KB)
│   │   ├── uploads/
│   │   │   └── posters/            # Direktori file gambar poster JPG statis
│   │   ├── ads.php                 # API Manajemen Iklan
│   │   ├── categories.php          # API Manajemen Kategori
│   │   ├── discord.php             # API Autentikasi & Live Transaksi Discord
│   │   ├── movies.php              # API Katalog dengan deduplikasi & LOCK_EX
│   │   └── zerostorage.php         # Endpoint integrasi ZeroStorage
│   └── images/                     # Aset branding dan logo
├── scripts/
│   └── auto_scraper_discord.py     # Skrip Python Master Scraper, Remuxer & Publisher
├── src/
│   ├── components/
│   │   ├── layout/Header.tsx       # Bar navigasi dengan link Discord & Telegram
│   │   ├── payment/                # Horizontal Swipe Transaction History Feed
│   │   ├── player/ArtPlayer.tsx    # Modern video player dengan optimasi iOS
│   │   └── movie/                  # Grid, Card, dan Row katalog responsif
│   ├── pages/
│   │   ├── Home.tsx                # Beranda dengan cache-first rendering
│   │   ├── PrivateServer.tsx       # Katalog server privat dengan pagination 20/page
│   │   └── Watch.tsx               # Halaman pemutar video dan detail streaming
│   ├── services/                   # Service layer (movieStore, discordRealtime, dll)
│   └── utils/                      # Helper tier, sanitasi, dan URL formatter
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Panduan Instalasi & Deployment

### 1. Menjalankan di Komputer Lokal (Local Dev)
```bash
# 1. Clone repositori
git clone https://github.com/YerikhoArfensiasEffendi/sekolahnakal.git
cd sekolahnakal

# 2. Pasang dependensi Node.js
npm install

# 3. Jalankan development server
npm run dev

# 4. Bangun file produksi (Build dist)
npm run build
```

### 2. Menjalankan Scraper Lokal
```bash
# Menjalankan grup kategori tertentu:
python3 scripts/auto_scraper_discord.py --group reguler --limit 30
python3 scripts/auto_scraper_discord.py --group vip-asia-east --limit 30
python3 scripts/auto_scraper_discord.py --group vip-lokal-asia --limit 30
python3 scripts/auto_scraper_discord.py --group vip-global --limit 30
```

---

## 👥 Tim & Pengembang

* **Lead Fullstack Engineer**: Yerikho Arfensias Effendi (*beone*)
* **Platform**: [Sekolah Nakal Streaming Network](https://sekolahnakal.so791.com)
* **Lisensi**: Hak Cipta Dilindungi Undang-Undang © 2026 Sekolah Nakal.
