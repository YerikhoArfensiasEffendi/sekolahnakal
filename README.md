# Sekolah Nakal — Modern Private Streaming Platform

Platform web streaming video privat berkecepatan tinggi dengan integrasi multi-cloud storage (ZeroStorage.net & Lulustream Cloud), sistem autentikasi Discord Role-Based Access Control (RBAC), Studio Admin Upload interaktif, serta antarmuka editorial streaming modern.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend Core**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation & Motion**: [Framer Motion](https://www.framer.com/motion/)
- **Video Player**: [ArtPlayer](https://artplayer.js.org/) + [Hls.js](https://github.com/video-dev/hls.js)
- **Backend API**: PHP REST Endpoint Proxy (`/public/api/*.php`)
- **Cloud Storage**: [ZeroStorage.net](https://zerostorage.net) & [Lulustream](https://lulustream.com)
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library

---

## 🌟 Fitur Utama

### 1. 🔒 Private Server & Tier Access Control (Discord RBAC)
- Node streaming terbagi dalam 4 tingkatan tier:
  - 👑 **EXCLUSIF VVIP VAULT** (Uncensored Master Cut 4K)
  - ⭐ **EXCLUSIF VIP STUDIO** (Asian Sinematik, Cosplay & Roleplay)
  - 💎 **EXCLUSIF TALENT POV** (POV Realistis & Official Talent Showcase)
  - 👤 **REGULER STREAM** (Tontonan gratis bebas akses)
- Sinkronisasi otomatis role Discord (`VVIP`, `VIP`, `Talent`, `Admin/Uploader`) melalui integrasi REST API.

### 2. 🚀 Dual Cloud Storage & Direct Client Upload
- Integrasi setara antara **ZeroStorage.net Cloud** dan **Lulustream Cloud**.
- Direct client-side upload ke cloud endpoint untuk mengatasi limit upload PHP server pada video berukuran besar.
- Fitur auto-failover otomatis jika salah satu provider mengalami gangguan koneksi.

### 3. 🎬 Studio Admin Dashboard
- **Single & Bulk Upload**: Unggah puluhan video sekaligus dengan kalkulasi durasi otomatis.
- **Custom Thumbnail Editor**: Pemilih frame, zoom skala, serta pan/shift (X/Y) langsung dari canvas video.
- **Ad Slot Management**: Manajemen sayap banner iklan desktop dan in-stream ads.
- **Category & Taxonomy Management**: Tambah, ubah, dan susun genre secara dinamis.

### 4. 🔍 Advanced Search & Filter System
- Pencarian judul, sinopsis, dan talent dengan debounce real-time.
- Multi-kriteria filter: Filter Tier, Kategori/Genre, Durasi Video (Pendek, Sedang, Panjang), Minimal Rating, dan Multi-Option Sort.
- Breadcrumb tag filter aktif dengan fitur reset instan.

### 5. 🛡️ Content Protection
- Proteksi pemutar video dari tangkapan layar (*screen recording / screen capture*) dan pencegahan pintasan *Inspect Element / DevTools*.

---

## 📁 Struktur Direktori

```
├── public/
│   ├── api/                  # PHP backend proxy & storage handler
│   │   ├── ads.php           # Konfigurasi iklan
│   │   ├── categories.php    # Manajemen kategori
│   │   ├── discord.php       # Verifikasi akun & role Discord
│   │   ├── lulustream.php    # Integrasi API Lulustream
│   │   ├── movies.php        # Sinkronisasi database katalog
│   │   ├── upload.php        # Proxy upload server
│   │   └── zerostorage.php   # Integrasi API ZeroStorage.net
│   └── images/               # Aset statis & logo
├── src/
│   ├── components/           # Komponen UI, Player, Movie, Ads, Layout
│   ├── constants/            # Routes, genres, Discord roles
│   ├── contexts/             # AuthContext, NotificationContext, ToastContext
│   ├── hooks/                # Custom React hooks (useDebounce, useAuth, dll)
│   ├── pages/                # Home, PrivateServer, Search, Watch, AdminUpload, dll
│   ├── services/             # movieStore, videoStorage, categoryStore, adStore
│   ├── types/                # Definisi tipe data TypeScript
│   └── utils/                # Utility helpers & tier parser
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Memulai Proyek (Getting Started)

### Prasyarat
- Node.js (v18 atau lebih baru)
- npm atau yarn

### Instalasi & Menjalankan Lokal

```bash
# 1. Clone repository
git clone https://github.com/YerikhoArfensiasEffendi/sekolahnakal.git
cd sekolahnakal

# 2. Install dependensi
npm install

# 3. Jalankan server lokal
npm run dev

# 4. Jalankan pengujian unit
npm test

# 5. Build untuk produksi
npm run build
```

---

## ⚙️ Konfigurasi Environment (`.env`)

```env
VITE_APP_NAME="Sekolah Nakal"
VITE_APP_URL="https://sekolahnakal.so791.com"
```

---

## 👤 Author & Maintainer

- **Lead Developer**: Yerikho Arfensias Effendi (*beone*)
- **Platform**: Sekolah Nakal Streaming Network
