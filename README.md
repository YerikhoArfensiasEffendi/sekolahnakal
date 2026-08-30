# 🎬 Sekolah Nakal — High-Performance Cloud Video Streaming & Discord Ecosystem

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20%7C%20Mobile-ff0055.svg)](https://sekolahnakal.so791.com)
[![Status](https://img.shields.io/badge/Status-Production%20Active-00c853.svg)](https://sekolahnakal.so791.com)
[![React](https://img.shields.io/badge/React-19%20%7C%20TypeScript-61dafb.svg)](https://react.dev/)
[![Scraper Engine](https://img.shields.io/badge/Cloud%20Engine-GitHub%20Actions%205--Worker%20Pipeline-blueviolet.svg)](https://github.com/YerikhoArfensiasEffendi/sekolahnakal/actions)
[![Storage](https://img.shields.io/badge/Cloud%20Storage-ZeroStorage.net%20CDN-orange.svg)](https://zerostorage.net)
[![Security](https://img.shields.io/badge/Security-RBAC%20%7C%20Deep%20Inspection%20%7C%20Atomic%20Lock-green.svg)](https://sekolahnakal.so791.com)

**Sekolah Nakal** adalah platform web streaming video berkinerja tinggi yang terintegrasi secara *real-time* dengan ekosistem Discord Guild. Platform ini dilengkapi dengan arsitektur penarikan arsip cloud terdistribusi (**5-Worker Parallel Pipeline & Watchdog Daemon**), AI Natural Slang Title & Copywriting Generator, optimasi *FastStart MP4 Remuxing* untuk pemutaran instan 0-detik tanpa buffering di mobile/desktop, sistem manajemen akses berbasis peran (RBAC Tier: VVIP, VIP, Talent, Reguler), serta panel Studio Admin profesional.

---

## 📑 Daftar Isi
1. [Arsitektur & Alur Kerja Sistem (System Workflow)](#-arsitektur--alur-kerja-sistem-system-workflow)
2. [Arsitektur 5 Worker Otomatis (5-Worker Cloud Pipeline)](#-arsitektur-5-worker-otomatis-5-worker-cloud-pipeline)
3. [AI Title & Copywriting Engine (Humanizer Slang)](#-ai-title--copywriting-engine-humanizer-slang)
4. [Fitur-Fitur Utama Platform](#-fitur-fitur-utama-platform)
5. [Standar Keamanan & Integritas Sistem](#-standar-keamanan--integritas-sistem)
6. [Hasil Uji Coba & Log Pengujian (Testing & Verification)](#-hasil-uji-coba--log-pengujian-testing--verification)
7. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
8. [Panduan Instalasi & Deployment](#-panduan-instalasi--deployment)

---

## 🏗️ Arsitektur & Alur Kerja Sistem (System Workflow)

Platform ini mengadopsi arsitektur *Hybrid Headless SPA + Distributed Cloud Ingestion & Watchdog Pipeline* dengan alur data *end-to-end* sebagai berikut:

```mermaid
flowchart TD
    subgraph S1["1. Discord Guild & Community (6.800+ Arsip Video)"]
        DC_CHANNELS["14 Channel Target (Lokal, Asia, China, Barat, Arab, Jepang, Korea, Latin, Talent)"]
        DC_PURCHASE["#purchase-history (Log Transaksi Pembayaran Real-time)"]
    end

    subgraph S2["2. Cloud Ingestion Engine (GitHub Actions Matrix)"]
        W_INGEST["⚡ Worker 1–4: Parallel Ingestion Matrix (Setiap Jam)\n[Reguler, VIP Asia-East, VIP Lokal-Asia, VIP Global]"]
        FFMPEG["⚡ FFmpeg Engine: FastStart Remux (+faststart atom header)"]
        AI_TITLE["🤖 AI Natural Slang Engine: Copywriting & Mixed-Length Generator"]
    end

    subgraph S3["3. High-Speed Cloud Storage & CDN"]
        ZS_STORAGE["ZeroStorage.net Universal CDN"]
        ZS_STREAM["Direct Stream Endpoint (/api/files/{id}/stream)"]
        ZS_THUMB["Cloudflare CDN Thumbnail (/api/files/{id}/thumbnail)"]
    end

    subgraph S4["4. Hostinger Backend API (PHP 8.2 & Atomic File Locking)"]
        API_MOVIES["/api/movies.php (Atomic Temp Write, .backup Fallback, Deduplikasi)"]
        API_DISCORD["/api/discord.php (Role-Based Sync & Transaction Feed)"]
    end

    subgraph S5["5. Cloud Watchdog & Auto-Repair Daemon"]
        W5_WATCHDOG["🛡️ Worker 5: Video Health Watchdog (Setiap 6 Jam)\n[Deep 4KB Byte Inspection & Auto Re-Upload / Purge]"]
    end

    subgraph S6["6. Client Frontend (React 19 + TypeScript + Vite)"]
        CLIENT_HOME["Beranda (Rekomendasi Stabil, Swipe Transaksi Mobile)"]
        CLIENT_PRIVATE["Private Server (Numbered Pagination 20/Page & Auto-Crop)"]
        CLIENT_WATCH["Watch Player (ArtPlayer + Direct Hardware MP4 Binding)"]
    end

    %% Pipeline Data Flow
    DC_CHANNELS -->|Deep Pagination Ingestion| W_INGEST
    W_INGEST -->|Process Raw Stream| FFMPEG
    W_INGEST -->|Clean & Humanize Title| AI_TITLE
    FFMPEG -->|Universal API Upload| ZS_STORAGE
    ZS_STORAGE --> ZS_STREAM & ZS_THUMB
    AI_TITLE -->|Register Payload| API_MOVIES
    ZS_STREAM -->|Register Stream URL| API_MOVIES
    
    %% Watchdog Flow
    W5_WATCHDOG -->|4KB Range Header Audit| ZS_STREAM
    W5_WATCHDOG -->|Auto-Purge / Auto-Rename Sync| API_MOVIES
    
    %% Discord Live Sync Flow
    DC_PURCHASE -->|Instant Fetch| API_DISCORD
    
    %% Frontend Consumption
    API_MOVIES --> CLIENT_HOME & CLIENT_PRIVATE
    API_DISCORD --> CLIENT_HOME
    ZS_STREAM & ZS_THUMB --> CLIENT_WATCH & CLIENT_PRIVATE
```

### 🔍 Penjelasan 7 Tahapan Alur Kerja Sistem:

1. **Tahap 1: Pengambilan Arsip Cerdas (Deep Ingestion & Anti-Duplikat)**:
   * **Worker 1 s/d 4** di GitHub Actions menjalankan *Deep Historical Pagination* menggunakan parameter Discord API `before=message_id` untuk menyedot arsip 6.800+ video.
   * Sistem melakukan pengecekan 3 lapis (`id`, `discordMsgId`, `videoUrl`) ke database server agar tidak ada file yang diunggah ulang (*zero duplicate*).

2. **Tahap 2: Optimasi FastStart MP4 Remuxing (Buffer 0-Detik)**:
   * Skrip memproses video dengan `ffmpeg -i input.mp4 -c copy -movflags +faststart`.
   * Metadata atom `moov` dipindahkan ke bagian paling depan file, memungkinkan video langsung berputar seketika (0 detik) di iPhone, Android, dan Desktop tanpa harus menunggu unduhan selesai.

3. **Tahap 3: AI Natural Slang Title & Copywriting Generator**:
   * Skrip [`scripts/ai_title_generator.py`](scripts/ai_title_generator.py) secara otomatis mengubah nama file mentah (seperti *1000146868.mp4* atau *Kingdom20Of20Dark*) menjadi judul bahasa gaul/slang anak muda Indonesia yang sangat santai, menggoda, bervariasi (pendek 35%, sedang 45%, panjang 20%), tanpa tanda kurung `[...]`, dan tanpa kata `Edisi`.

4. **Tahap 4: Cloud Storage & Cloudflare CDN Thumbnail Ingestion**:
   * Video diunggah ke **ZeroStorage.net Universal CDN**.
   * URL streaming langsung (`https://zerostorage.net/api/files/{id}/stream`) dan thumbnail Cloudflare CDN (`https://zerostorage.net/api/files/{id}/thumbnail`) dicatat secara terpusat.

5. **Tahap 5: Atomic Database Locking & Hostinger API Sync**:
   * Backend PHP [`public/api/movies.php`](public/api/movies.php) menerima payload video dan menuliskan data secara **Atomic** (menulis ke file `.tmp` terlebih dahulu lalu `rename()`) serta membuat salinan otomatis ke `.backup`.
   * Hal ini mencegah korupsi atau terhapusnya data ketika beberapa worker melakukan penulisan secara bersamaan.

6. **Tahap 6: Worker 5 Video Health Watchdog & Deep Byte Auto-Repair**:
   * Berjalan setiap 6 jam (`video-health-watchdog.yml`) untuk membaca **4KB chunk pertama** dari setiap streaming video.
   * Jika terdeteksi video corrupt / 404, watchdog otomatis mengunduh ulang sumber aslinya dari Discord; jika unrecoverable, watchdog otomatis membersihkan video rusak tersebut dari database & storage.

7. **Tahap 7: Client Frontend Rendering & Smart Auto-Crop**:
   * Web client React 19 memuat katalog dengan strategi *cache-first* (0ms rendering).
   * Komponen [`DynamicThumbnail.tsx`](src/components/movie/DynamicThumbnail.tsx) menerapkan *Smart Auto-Crop (`scale-[1.8] object-cover`)* sehingga gambar memenuhi kartu video 16:9 secara penuh tanpa bingkai hitam (*letterbox*).
   * Pemutar video ArtPlayer mengikat stream MP4 langsung ke decoder hardware peramban untuk mencegah *reconnecting loop*.

---

## ⚡ Arsitektur 5 Worker Otomatis (5-Worker Cloud Pipeline)

Sistem didukung oleh **5 Worker Mandiri** yang berjalan otomatis 24/7 di cloud:

| # | Nama Worker | Target Channel / Sumber | Jadwal Eksekusi | Tugas & Operasional |
|---|---|---|---|---|
| **1** | **Worker Reguler**<br>`group: reguler` | • `⌜🔞⌟⇾media-forward`<br>• `⌜🔞⌟⇾media-barat` (Reguler)<br>• `⌜🔞⌟⇾media-asia` (Reguler)<br>• `⌜🔞⌟⇾media-lokal` (Reguler)<br>• `⌜👙⌟⇾share-kolpri` | **Setiap Jam**<br>(`cron: '0 * * * *'`) | Menarik arsip publik gratis, FastStart remuxing, auto-rename slang santai, upload ZeroStorage CDN, dan publikasi ke website. |
| **2** | **Worker VIP Asia & East**<br>`group: vip-asia-east` | • `⌜💎⌟⇾media-china`<br>• `⌜💎⌟⇾media-korea`<br>• `⌜💎⌟⇾media-jepang`<br>• `⌜💎⌟⇾media-taiwan` | **Setiap Jam**<br>(`cron: '0 * * * *'`) | Menarik arsip VIP Asia/JAV/China/Korea, optimasi buffer instan, auto-rename bertema Asia/Jepang, upload ZeroStorage CDN. |
| **3** | **Worker VIP Lokal & Talent**<br>`group: vip-lokal-asia` | • `⌜💎⌟⇾media-lokal` (VIP)<br>• `⌜💎⌟⇾media-asia` (VIP)<br>• `⌜🔖⌟⇾save-telent`<br>• `⌜💎⌟⇾preview-telent` | **Setiap Jam**<br>(`cron: '0 * * * *'`) | Menarik konten VIP Lokal dan kolaborasi *Talent Verified*, FastStart remuxing, auto-rename slang lokal, upload ZeroStorage CDN. |
| **4** | **Worker VIP Global & Barat**<br>`group: vip-global` | • `⌜💎⌟⇾media-barat` (VIP)<br>• `⌜💎⌟⇾media-arab`<br>• `⌜💎⌟⇾media-india`<br>• `⌜💎⌟⇾media-latin`<br>• `⌜😈⌟⇾content-farming` | **Setiap Jam**<br>(`cron: '0 * * * *'`) | Menarik video VIP Barat/Latin/Eksklusif, FastStart remuxing, auto-rename gaya Barat/Latin, upload ZeroStorage CDN. |
| **5** | **Worker Watchdog & Auto-Repair**<br>`video-health-watchdog` | • Seluruh 2.170+ Video Database Live | **Setiap 6 Jam**<br>(`cron: '0 */6 * * *'`) | **Deep Byte Inspection (4KB)** memvalidasi validitas MP4 stream. Jika link mati/404, otomatis download ulang dari Discord; jika unrecoverable, otomatis purge dari database & storage. |

---

## 🤖 AI Title & Copywriting Engine (Humanizer Slang)

Platform dilengkapi modul generator judul cerdas ([`scripts/ai_title_generator.py`](scripts/ai_title_generator.py)) yang mengubah nama file mentah/acak menjadi judul super santai dengan gaya bahasa tongkrongan/anak muda yang menggoda:

1. **Variasi Panjang Alami (Tidak Kaku & Tidak Monoton)**:
   * ⚡ **Judul Pendek (1–3 kata ~ 35%)**: *"gadis desa"*, *"hijab mesum"*, *"Cewek Kosan"*, *"Cewek SMA"*, *"Kepergok wikwik"*, *"kulit mulus"*, *"cewek spanyol"*.
   * 💬 **Judul Sedang (4–6 kata ~ 45%)**: *"Cewek Kosan Minta Jatah Malam"*, *"vcs colmek mendesah keenakan"*, *"Janda Muda Minta Jatah Malam Jumat"*, *"Gadis Manis Pasrah Di Genjot"*.
   * 📜 **Judul Panjang (7–9 kata ~ 20%)**: *"Pasangan SMA kepergok wikwik di kosan temen sampe lemes"*, *"Model bule pirang main kasar di penthouse mewah desah kenceng banget"*.
2. **Tanpa Tanda Kurung & Tanpa Embel-Embel**: Bebas dari bracket kategori `[...]` dan tanpa kata `Edisi` sehingga tampak 100% natural seperti ketikan manusia.
3. **Deskripsi / Sinopsis Menggoda**: Dilengkapi ringkasan naratif 1 kalimat yang memancing rasa penasaran member.

---

## 🌟 Fitur-Fitur Utama Platform

### 1. 📱 Desain Mobile-First & Ultra Responsive Layout
* **Riwayat Transaksi Mobile Swipe Carousel**: Menampilkan bukti pembelian VIP/VVIP dari Discord dalam bentuk *horizontal swipe carousel* yang ringkas di HP (~110px tinggi layar), menggantikan daftar vertikal panjang yang memakan ruang.
* **Bar Navigasi Modern**: Dilengkapi tautan langsung ke **Server Discord Resmi**, **Channel Telegram Resmi**, **Paket Akses & Promo**, dan **Pengaturan**.
* **Katalog Private Server Kompak**: Navigasi filter kategori *horizontal chips*, pencarian terintegrasi, dan *Numbered Pagination* (maksimal 20 video per halaman) yang mudah disentuh dengan jempol di ponsel.

### 2. 🎬 Modern Video Streaming Engine (ArtPlayer + HLS)
* **Penyajian Multi-Format**: Mendukung pemutaran langsung MP4 high-bitrate, ZeroStorage CDN, dan HLS `.m3u8`.
* **Dukungan Penuh iOS Safari & Android**: Menggunakan atribut `playsInline`, `webkit-playsinline`, dan `x5-video-player-type: h5` agar video tidak mengalami error *00:00 duration* atau terblokir di iPhone/iPad.
* **Smart Auto-Crop Thumbnail**: Mengeliminasi padding hitam (*letterbox*) dari thumbnail ZeroStorage secara presisi dengan `scale-[1.8] object-cover` sehingga gambar memenuhi 100% kartu video.

### 3. 🛡️ Role-Based Access Control (RBAC Discord Sync)
* Mengintegrasikan hak akses ke dalam 4 tingkatan tier:
  * 👑 **EXCLUSIF VVIP VAULT** (Akses master raw footage & edisi 4K uncensored)
  * ⭐ **EXCLUSIF VIP STUDIO** (Serial sinematik Asia, Cosplay & JAV style)
  * 💎 **EXCLUSIF TALENT POV** (Konten sudut pandang POV & talent resmi)
  * 👤 **REGULER STREAM** (Katalog gratis bebas akses)
* Verifikasi ID Discord dan penetapan role otomatis melalui endpoint API.

### 4. 🎛️ Studio Admin & Bulk Management
* Unggah video massal (*bulk upload*), manajemen link ZeroStorage, monitoring transaksi Discord, dan log aktivitas real-time.

---

## 🔒 Standar Keamanan & Integritas Sistem

Platform ini menerapkan standar keamanan berlapis:

1. **Anti-Duplikat & Integritas Data (Zero Duplicate Guarantee)**:
   * Verifikasi unik 3 lapis pada backend PHP (`id`, `discordMsgId`, `videoUrl`).
   * Operasi penulisan file menggunakan **Atomic Temp Rename & `.backup` fallback** untuk mencegah korupsi data akibat request konkuren dari 5 worker bersamaan.
2. **Deep Byte Stream Verification**:
   * Worker Watchdog membaca 4KB header pertama setiap video secara berkala untuk mendeteksi file 0-byte atau corrupt sebelum dialami oleh member.
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
| 3 | **Cloudflare CDN Thumbnails** | Migrasi thumbnail lokal ke direct CDN (`zerostorage.net/api/files/{id}/thumbnail`) | Thumbnail tampil tajam, anti-hilang saat deployment | ✅ PASS |
| 4 | **Uji Beban Anti-Duplikat** | Pemindaian duplikasi pada seluruh database dan input scraper | Filter mencegah re-upload 100% dari 2.170+ video | ✅ PASS |
| 5 | **5-Worker Parallel Pipeline** | Eksekusi serentak 5 worker di GitHub Actions | Seluruh worker berjalan paralel tanpa tabrakan file database | ✅ PASS |
| 6 | **Stabilitas Rekomendasi** | Navigasi bolak-balik Beranda dan Private Server | Rekomendasi acak menggunakan bobot stabil per sesi tanpa reshuffle loop | ✅ PASS |

---

## 📁 Struktur Direktori Proyek

```
sekolah-nakal/
├── .github/
│   └── workflows/
│       ├── auto-scraper.yml            # 4-Worker Ingestion Matrix (Hourly Cron)
│       └── video-health-watchdog.yml   # Worker 5: Video Health Watchdog (Every 6h Cron)
├── public/
│   ├── api/
│   │   ├── data/
│   │   │   ├── config.json             # Konfigurasi Guild & Role Discord
│   │   │   └── movies.json             # Database utama katalog video (2.170+ film)
│   │   ├── ads.php                     # API Manajemen Iklan
│   │   ├── categories.php              # API Manajemen Kategori
│   │   ├── discord.php                 # API Autentikasi & Live Transaksi Discord
│   │   ├── movies.php                  # API Katalog dengan Atomic Write & Deduplikasi
│   │   └── zerostorage.php             # Endpoint integrasi ZeroStorage
│   └── images/                         # Aset branding dan logo resmi
├── scripts/
│   ├── auto_scraper_discord.py         # Ingestion Engine untuk Worker 1 s/d 4
│   ├── video_health_checker_daemon.py  # Health Watchdog & Deep Byte Inspector (Worker 5)
│   ├── ai_title_generator.py           # AI Slang Title & Copywriting Engine
│   └── batch_rename_all_movies.py      # Batch Renamer Database Utility
├── src/
│   ├── components/
│   │   ├── layout/Header.tsx           # Bar navigasi dengan link Discord & Telegram
│   │   ├── payment/                    # Horizontal Swipe Transaction History Feed
│   │   ├── player/ArtPlayer.tsx        # Modern video player dengan hardware MP4 binding
│   │   └── movie/                      # Grid, Card, dan DynamicThumbnail responsif
│   ├── pages/
│   │   ├── Home.tsx                    # Beranda dengan cache-first rendering
│   │   ├── PrivateServer.tsx           # Katalog server privat dengan pagination 20/page
│   │   └── Watch.tsx                   # Halaman pemutar video dan detail streaming
│   ├── services/                       # Service layer (movieStore, movieService, dll)
│   └── utils/                          # Helper tier, sanitasi, dan URL formatter
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

### 2. Menjalankan Worker Secara Manual
```bash
# Menjalankan Worker Scraper (Worker 1 s/d 4):
python3 scripts/auto_scraper_discord.py --group reguler --limit 30
python3 scripts/auto_scraper_discord.py --group vip-asia-east --limit 30
python3 scripts/auto_scraper_discord.py --group vip-lokal-asia --limit 30
python3 scripts/auto_scraper_discord.py --group vip-global --limit 30

# Menjalankan Worker Health Watchdog (Worker 5):
python3 scripts/video_health_checker_daemon.py
```

---

## 👥 Tim & Pengembang

* **Lead Fullstack Engineer**: Yerikho Arfensias Effendi (*beone*)
* **Platform**: [Sekolah Nakal Streaming Network](https://sekolahnakal.so791.com)
* **Lisensi**: Hak Cipta Dilindungi Undang-Undang © 2026 Sekolah Nakal.
