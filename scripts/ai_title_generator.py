#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Title Generator & Humanizer Copywriting Engine (Sekolah Nakal)
Format: Super casual, bahasa slang anak muda/tongkrongan, natural, dan menggoda.
Tanpa awalan kurung [Lokal] dan tanpa kata 'Edisi'.
"""

import re
import hashlib
import random

# Slang & Humanized Keyword Pools per Category

LOKAL_SUBJECTS = [
    "Di Gas Sama Temen", "Di Ewe Om Girang", "Colmek Basah di Kamar",
    "Pasangan Kosan Jaksel", "Bocil Tobrut Main", "Di Ewe Pacar Pas Rumah Sepi",
    "Kepergok Wikwik di Kamar", "Di Genjot Sampe Lemes", "VCS Colmek Mendesah",
    "Main Kasar Sampe Basah", "Jilbab Mesum Di Gas", "Temen Sekamar Minta Jatah",
    "Di Goyang Pasangan Sampe Puas", "Selebgram Tobrut Pamer Bodi", "Koleksi Pribadi Wikwik",
    "Bikin Video Pas Mau Tidur", "Gadis Hijab Mendesah di Kamar", "Skandal Mahasiswi Bandung",
    "Cewek Sma Pasrah Di Ewe", "Di Ewe di Mobil Goyang", "Main Belakang Sampe Keenakan",
    "Colmek Pake Timun di Kasur", "Gadis Manja Minta di Gas", "Janda Muda Minta Jatah Malam",
    "Wikwik Panas Pas Hujan", "Di Ewe Tetangga Kosan", "Cewek Tobrut Goyang Desah",
    "Pasangan Sma Colong Waktu di Kosan", "Di Genjot di Kamar Mandi", "Mandi Basah Sambil Main Jari",
    "Cewek Kuliahan Pasrah di Gas", "Di Ewe Bos di Ruang Kerja", "Koleksi Pribadi Cewek Cosplay"
]

LOKAL_CONTEXTS = [
    "di Kasur Empuk", "Pas Rumah Kosong", "Sampe Lemes", "Sampe Becek Parah",
    "Malam Minggu", "di Kamar Mandi", "di Hotel Melati", "di Villa Puncak",
    "Bikin Nafsu", "Desahannya Nagih", "Goyangannya Liar", "Keenakan Parah",
    "di Apartemen Mewah", "Tanpa Sensor", "Muka Pasrah", "Sambil Direkam",
    "di Mobil Parkiran", "Sampe Nangis Nikmat", "Minta Nambah Terus", "Bikin Otong Tegang"
]

JEPANG_SUBJECTS = [
    "Cosplay Cewek Jepang Di Genjot", "Pijat Plus Plus Sensual Tokyo", "Cewek Jepang Pasrah Di Ewe",
    "Cosplay Bunny Tobrut Mendesah", "Main Bertiga Sama Cewek Jepang", "Cewek Abg Jepang Kepergok",
    "Tante Jepang Minta Di Puasin", "Idol Jepang Wikwik di Studio", "Pelayan Maid Jepang Di Ewe",
    "Cewek Shibuya Di Gas di Hotel", "Suster Cantik Jepang Main di Klinik", "Guru Jepang Pasrah Sama Murid",
    "Mandi Air Panas Ryokan Bareng Tante", "Cewek Jepang Mabuk Pasrah Di Ewe", "Cosplay Anime Tobrut Di Genjot"
]

JEPANG_CONTEXTS = [
    "Sampe Kejang", "di Kamar Hotel Tokyo", "Desahan Renyah Banget", "Sampe Muncrat",
    "di Pemandian Air Panas", "Gaya Kucing Manja", "Pasrah di Ranjang", "Muka Sange Parah",
    "di Ruang Rahasia", "Full HD Tanpa Sensor", "Sampe Lemes Tak Berdaya", "Nikmat Maksimal"
]

BARAT_SUBJECTS = [
    "Bule Montok Di Gas di Ranjang", "Cewek Latin Mendesah di Kamar", "Photoshoot Model Bule Di Ewe",
    "Bule Pirang Main Kasar di Penthouse", "Di Gas Abis Abisan Bareng Bule", "Model Onlyfans Barat Wikwik",
    "Bule Tobrut Di Genjot di Kolam", "Cewek Spanyol Liar di Kasur", "Bule Abg Pasrah Di Ewe",
    "Sesi Panas Bule Montok di Hotel", "Tante Bule Pirang Minta Di Puasin", "Model Miami Beach Di Gas"
]

BARAT_CONTEXTS = [
    "Sampe Becek Parah", "di Penthouse Mewah", "Suara Desah Kenceng", "Gaya Liar Banget",
    "di Balkon Hotel", "Sampe Teriak Nikmat", "Puas Banget", "Full Sensual Session",
    "di Pinggir Pantai", "Nikmat Parah", "Gaya Nungging Mantap"
]

CHINA_SUBJECTS = [
    "Cewek Cindo Tobrut Main di Apartemen", "Model Cindo Di Ewe di Hotel", "Cewek Douyin Pasrah Di Gas",
    "Streamer Cindo Colmek Depan Kamera", "Cewek Cindo Baju Hanfu Di Ewe", "Cewek Cantik Shanghai Wikwik",
    "Cindo Mulus Pasrah Di Genjot", "Selebgram Cantik China Main di Kasur", "Cewek Cindo Mabuk di Club"
]

CHINA_CONTEXTS = [
    "Sampe Lemes", "di Apartemen Mewah", "Kulit Mulus Bodi Gitar", "Desahan Manja",
    "di Kamar Suite", "Bikin Meleleh", "Gaya Manja Bikin Sange", "Tanpa Sensor"
]

TALENT_SUBJECTS = [
    "Staycation Bareng Talent Di Gas Sampe Pagi", "Private Date Villa Bali Di Ewe",
    "Talent Cantik Minta Di Manjain di Kasur", "Wikwik Romantis Bareng Talent Populer",
    "Sesi Privat Suite Hotel Bareng Talent", "Talent Verified Pasrah Di Genjot",
    "Liburan Dewata Wikwik Bareng Talent", "Dinner Berlanjut Di Ewe di Hotel", "Momen Intim Bareng Talent Tobrut"
]

TALENT_CONTEXTS = [
    "di Villa Seminyak", "Sampe Puas Banget", "Suasana Remang Romantis", "Desahan Manja Nagih",
    "di Kamar Bintang Lima", "VIP Private Session", "Sampe Lemes Bareng", "Momen Paling Nikmat"
]

# Slang Humanizer Overview Templates
OVERVIEW_TEMPLATES = [
    "Rekaman pribadi pas lagi asik main di kasur, desahannya renyah banget bikin sange parah.",
    "Di gas abis-abisan pas rumah lagi sepi, goyangan mantap sampe basah kuyup dan lemes.",
    "Koleksi langka cewek tobrut lagi asik main sendiri di kamar, ekspresi mukanya bikin tegang.",
    "Pasangan muda lagi horny berat colong waktu di kosan, main kasar sampe keluar banyak.",
    "Sesi panas cewek cantik pasrah di ewe sampe puas, body mulus goyangan liar tanpa ampun.",
    "Momen intim berdua di kamar hotel remang-remang, desahannya bikin merinding enak.",
    "Cewek manja minta digenjot abis-abisan, pasrah nungging sampe lemes tak berdaya.",
    "Kepergok main belakang pas lagi berduaan, aksi liar penuh gairah wajib ditonton.",
    "Video pribadi super mulus no sensor, goyangan pinggulnya bikin langsung crot.",
    "Aksi nakal pas lagi kangen berat, main berduaan di kamar sampe sprei basah kuyup."
]


def is_garbage_or_random_title(title: str) -> bool:
    """Mendeteksi secara ketat apakah judul saat ini adalah nama file acak, hash, atau format mentah."""
    if not title:
        return True
    
    t = title.strip()
    t_lower = t.lower()
    
    # Too short
    if len(t_lower) < 4:
        return True
        
    # Check common raw prefixes or tokens
    raw_tokens = [
        "vid", "video", "screen recording", "screenrecording", "screen_recording", "recording",
        "rec_", "mov_", "trim_", "img", "image", "snapvideo", "snap_", "whatsapp",
        "telegram", "download", "untitled", "media_", "attachment", "file ", "inshot",
        "poophd", "dood", "lulustream", "mightydee", "att ", "4 5769", "tmp_", "cache_"
    ]
    for p in raw_tokens:
        if t_lower.startswith(p) or f" {p}" in t_lower:
            return True
            
    # Check if contains extension words
    if any(ext in t_lower for ext in ["mp4", "mkv", "avi", "mov", "3gp", "webm"]):
        return True

    # Check if purely digits or contains long sequence of digits (> 6 consecutive numbers)
    if re.search(r'\d{6,}', t_lower):
        return True
        
    # Check ratio of digits to letters
    digits_count = sum(c.isdigit() for c in t_lower)
    letters_count = sum(c.isalpha() for c in t_lower)
    if digits_count > 0 and (digits_count >= letters_count or digits_count >= 5):
        return True

    # Check hex / UUID / hash patterns
    if re.search(r'[0-9a-f]{6,}', t_lower):
        return True

    # Check words that have numbers inside them
    words = re.split(r'[\s_.-]+', t_lower)
    for w in words:
        if len(w) >= 5 and re.search(r'[a-z]', w) and re.search(r'\d', w):
            return True
        if len(w) >= 7 and not re.search(r'[aeiou]', w):
            return True

    # Check single or double word that is too long
    if len(words) == 1 and len(words[0]) >= 10:
        return True
    if len(words) <= 2 and any(len(w) >= 14 for w in words):
        return True

    return False


def clean_discord_caption(caption: str) -> str:
    """Membersihkan teks caption pesan Discord menjadi judul Title Case santai."""
    if not caption:
        return ""
    
    first_line = caption.split("\n")[0].strip()
    cleaned = re.sub(r'https?://\S+', '', first_line)
    cleaned = re.sub(r'<[@#:].*?>', '', cleaned)
    cleaned = re.sub(r'#\S+', '', cleaned)
    cleaned = re.sub(r'\[.*?\]', '', cleaned)
    cleaned = re.sub(r'\(.*?\)', '', cleaned)
    cleaned = re.sub(r'\.(mp4|mov|mkv|avi|webm|flv)$', '', cleaned, flags=re.I)
    cleaned = re.sub(r'[_.-]+', ' ', cleaned).strip()
    cleaned = re.sub(r'[^\w\s]', '', cleaned).strip()
    
    if len(cleaned) >= 5 and not is_garbage_or_random_title(cleaned):
        words = [w.capitalize() for w in cleaned.split()]
        return " ".join(words[:8])
        
    return ""


def generate_thematic_title(category: str, tier: str, seed_id: str) -> str:
    """Menghasilkan judul casual slang anak muda berdasarkan tema kategori."""
    cat_lower = (category or "").lower()
    tier_lower = (tier or "").lower()
    
    seed_int = int(hashlib.md5(str(seed_id).encode("utf-8")).hexdigest(), 16)
    rng = random.Random(seed_int)
    
    if "jepang" in cat_lower or "jav" in cat_lower or "cosplay" in cat_lower:
        subj = rng.choice(JEPANG_SUBJECTS)
        ctx = rng.choice(JEPANG_CONTEXTS)
        return f"{subj} {ctx}"
        
    elif "barat" in cat_lower or "bule" in cat_lower or "western" in cat_lower or "latin" in cat_lower:
        subj = rng.choice(BARAT_SUBJECTS)
        ctx = rng.choice(BARAT_CONTEXTS)
        return f"{subj} {ctx}"
        
    elif "china" in cat_lower or "mandarin" in cat_lower or "asia" in cat_lower:
        subj = rng.choice(CHINA_SUBJECTS)
        ctx = rng.choice(CHINA_CONTEXTS)
        return f"{subj} {ctx}"
        
    elif "talent" in cat_lower or tier_lower == "talent":
        subj = rng.choice(TALENT_SUBJECTS)
        ctx = rng.choice(TALENT_CONTEXTS)
        return f"{subj} {ctx}"
        
    else:  # Default to Media Lokal / Koleksi Pribadi
        subj = rng.choice(LOKAL_SUBJECTS)
        ctx = rng.choice(LOKAL_CONTEXTS)
        return f"{subj} {ctx}"


def generate_humanized_overview(seed_id: str) -> str:
    """Menghasilkan sinopsis casual super santai ala anak muda."""
    seed_int = int(hashlib.md5(str(seed_id).encode("utf-8")).hexdigest(), 16)
    rng = random.Random(seed_int)
    return rng.choice(OVERVIEW_TEMPLATES)


def resolve_best_title(raw_title: str, content: str, category: str, tier: str, item_id: str) -> tuple[str, str]:
    """
    Fungsi utama untuk memutuskan judul terbaik:
    1. Coba ekstrak dari caption teks asli Discord (jika ada cerita menarik)
    2. Coba periksa apakah raw_title sudah bagus/bukan garbage
    3. Jika garbage/acak, buat judul casual slang anak muda yang menggoda
    """
    clean_cap = clean_discord_caption(content)
    if clean_cap and not is_garbage_or_random_title(clean_cap):
        overview = generate_humanized_overview(item_id)
        return clean_cap, overview

    if raw_title and not is_garbage_or_random_title(raw_title):
        cleaned_raw = re.sub(r'^\[.*?\]\s*', '', raw_title).strip()
        cleaned_raw = re.sub(r'\(.*?\)', '', cleaned_raw).strip()
        cleaned_raw = re.sub(r'\s*-\s*Edisi.*$', '', cleaned_raw, flags=re.I).strip()
        if len(cleaned_raw) >= 5 and not is_garbage_or_random_title(cleaned_raw):
            overview = generate_humanized_overview(item_id)
            return cleaned_raw, overview

    thematic_title = generate_thematic_title(category, tier, item_id)
    overview = generate_humanized_overview(item_id)
    return thematic_title, overview
