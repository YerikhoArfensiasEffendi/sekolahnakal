#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Title Generator Engine for Sekolah Nakal (Strict Garbage Elimination)
Menghasilkan judul video yang 100% bersih, natural, dan polos tanpa nama acak/mentah.
Format: Bersih, Title Case, tanpa awalan kurung [Lokal] dan tanpa kata 'Edisi'.
"""

import re
import hashlib
import random

# Keyword pools per category for realistic, engaging, plain titles
LOKAL_SUBJECTS = [
    "Skandal Mahasiswi Bandung", "Pasangan Kosan Jaksel", "Koleksi Pribadi Selebgram",
    "Kencan Romantis Villa Seminyak", "Gadis Cantik Rekaman Kamar", "Skandal Viral Kamar Kost",
    "Selebgram Cantik Liburan", "Malam Pertama Pengantin Baru", "Aksi Menggoda Gadis Manja",
    "Kencan Rahasia Pasangan Muda", "Mahasiswi Cantik Kampus Ternama", "Skandal Panas Asisten Pribadi",
    "Rekaman Rahasia Hotel Bintang Lima", "Aksi Manja Pacar Idaman", "Kencan Romantis Pasangan Viral",
    "Gadis Cantik Rekaman Pribadi", "Model Cantik Jakarta Selatan", "Kencan Malam Minggu Kosan",
    "Skandal Selebgram TikTok Viral", "Koleksi Eksklusif Kamar Hotel", "Aksi Gemas Pacar Cantik",
    "Kencan Manis Apartemen Mewah", "Gadis Manis Baju Tidur", "Skandal Viral Mahasiswi Jogja",
    "Koleksi Pribadi Cewek Cantik", "Kencan Privat Villa Puncak", "Aksi Romantis Pasangan Kekasih",
    "Gadis Desa Cantik Natural", "Skandal Kantor Ruang Pribadi", "Koleksi Video Kamar Tidur",
    "Pasangan Romantis Bali Trip", "Selebgram Cantik Kolam Renang", "Kencan Rahasia Hotel Mewah"
]

LOKAL_CONTEXTS = [
    "di Hotel Bintang", "Malam Minggu", "di Kamar Hotel", "Suasana Romantis",
    "Kamar Tidur Pribadi", "di Apartemen Mewah", "Suasana Santai", "di Villa Privat",
    "Bikin Meleleh", "Tanpa Sensor", "Koleksi Langka", "Bikin Penasaran",
    "Penuh Gairah", "Momen Manis", "Tampil Menggoda", "Kamar Kost Mewah",
    "Suasana Syahdu", "Gaya Manja", "Senyuman Manis", "Malam Berdua"
]

JEPANG_SUBJECTS = [
    "Cosplay Idol", "Sensual Room Massage", "Japanese Schoolgirl", "Office Lady",
    "Nurse Clinic Private Care", "Idol Cosplay Bunny Girl", "Sensual Hot Spring",
    "Japanese Maid Private Service", "Tokyo Night Club Hostess", "Shibuya Girl",
    "Sensual Kimono Maiden", "Japanese Stepmom Secret", "Swimsuit Idol",
    "Akihabara Cosplay Special", "Sensual Spa Therapist", "Japanese Teacher Private Lesson",
    "Shinjuku Beauty Romance", "Secret Bathhouse Relaxation", "Kawaii Anime Cosplayer"
]

JEPANG_CONTEXTS = [
    "Secret Room Session", "Tokyo Special", "Private Care Session", "Secret Fantasy",
    "Secret Meeting", "Ryokan Romance", "Private Service", "Private Apartment Room",
    "Kyoto Romance", "Photo Studio Session", "Relaxation Room", "Private Lesson",
    "Night Romance", "Romantic Secret", "Fantasy Roleplay", "Uncensored Experience"
]

BARAT_SUBJECTS = [
    "Private Bedroom Romance", "Photoshoot Model Pantai", "Exclusive Luxury Villa",
    "Latin Beauty Romance", "Sensual Sunset Beach", "Blonde Model Penthouse",
    "Romantic Midnight Hotel Suite", "Luxury Yacht Party", "Model Agency Casting",
    "Sensual Shower Room", "Miami Beach Romance", "California Dream Girl",
    "European Model Private", "Summer Vacation Lovers", "Exclusive VIP Suite"
]

BARAT_CONTEXTS = [
    "Romantic Night", "Miami Edition", "Secret Session", "Private Romance",
    "Lovers Session", "Full HD Experience", "Romantic Suite", "Casting Room Session",
    "Romantic Session", "Golden Hour Romance", "VIP Experience", "Secret Fantasy"
]

CHINA_SUBJECTS = [
    "Chinese Cosplay Maiden", "Shenzhen Beauty", "Shanghai Model", "Ancient Hanfu Maiden",
    "Chinese Streamer", "Guangzhou Beauty", "Beijing Luxury Suite", "Douyin Viral Idol",
    "Chengdu Sweetheart Romance", "Chinese College Beauty"
]

CHINA_CONTEXTS = [
    "Secret Studio Session", "Private Suite Session", "Luxury Penthouse Date", "Secret Romance",
    "Private Room Special", "Exclusive Night", "Romantic Streamer Session", "Private Date"
]

TALENT_SUBJECTS = [
    "Kencan Romantis Villa Privat", "Photoshoot Bersama Verified Talent", "Malam Indah Suite Mewah",
    "Sesi Privat Kamar Hotel", "Liburan Eksklusif Pulau Dewata", "Dinner Romantis & Staycation",
    "Private Room Stay Bersama Talent", "Kolaborasi Eksklusif Verified Member", "Momen Manis Suite Bintang Lima"
]

TALENT_CONTEXTS = [
    "Seminyak Bali", "Bareng Talent Populer", "VIP Session", "Suasana Romantis",
    "Malam Spesial", "Kamar Mewah", "Penuh Kehangatan", "Bareng Bintang Tamu"
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

    # Check words that have numbers inside them (e.g. 0Dhlr86In3Vtaayk, Vjk73Prfs)
    words = re.split(r'[\s_.-]+', t_lower)
    for w in words:
        if len(w) >= 5 and re.search(r'[a-z]', w) and re.search(r'\d', w):
            return True
        # Check gibberish word without vowels (e.g. uiwtfgietfg4ui)
        if len(w) >= 7 and not re.search(r'[aeiou]', w):
            return True

    # Check single or double word that is too long
    if len(words) == 1 and len(words[0]) >= 10:
        return True
    if len(words) <= 2 and any(len(w) >= 14 for w in words):
        return True

    return False


def clean_discord_caption(caption: str) -> str:
    """Membersihkan teks caption pesan Discord menjadi judul Title Case rapi."""
    if not caption:
        return ""
    
    # Ambil baris pertama
    first_line = caption.split("\n")[0].strip()
    
    # Hapus URL
    cleaned = re.sub(r'https?://\S+', '', first_line)
    
    # Hapus Discord mentions <@...>, <#...>, <:emoji:...>
    cleaned = re.sub(r'<[@#:].*?>', '', cleaned)
    
    # Hapus hashtag berlebihan
    cleaned = re.sub(r'#\S+', '', cleaned)
    
    # Hapus tanda kurung berlebih seperti [Lokal], (Part 1), dll
    cleaned = re.sub(r'\[.*?\]', '', cleaned)
    cleaned = re.sub(r'\(.*?\)', '', cleaned)
    
    # Hapus ekstensi file seperti .mp4, .mov, .mkv
    cleaned = re.sub(r'\.(mp4|mov|mkv|avi|webm|flv)$', '', cleaned, flags=re.I)
    
    # Ganti underscore dan dash dengan spasi
    cleaned = re.sub(r'[_.-]+', ' ', cleaned).strip()
    
    # Hapus karakter aneh
    cleaned = re.sub(r'[^\w\s]', '', cleaned).strip()
    
    # Jika hasil bersih masih valid dan bukan garbage
    if len(cleaned) >= 5 and not is_garbage_or_random_title(cleaned):
        # Format ke Title Case alami
        words = [w.capitalize() for w in cleaned.split()]
        return " ".join(words[:8])  # Batasi maksimal 8 kata agar tidak kepanjangan
        
    return ""


def generate_thematic_title(category: str, tier: str, seed_id: str) -> str:
    """Menghasilkan judul polos, natural, dan sinematik berdasarkan tema kategori."""
    cat_lower = (category or "").lower()
    tier_lower = (tier or "").lower()
    
    # Gunakan hash seed_id untuk konsistensi & keunikan
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


def generate_natural_overview(title: str, category: str) -> str:
    """Menghasilkan ringkasan cerita/sinopsis pendek yang menarik."""
    return f"Saksikan tayangan eksklusif \"{title}\" berkualitas tinggi di server privat Sekolah Nakal."


def resolve_best_title(raw_title: str, content: str, category: str, tier: str, item_id: str) -> tuple[str, str]:
    """
    Fungsi utama untuk memutuskan judul terbaik:
    1. Coba ekstrak dari caption teks asli Discord
    2. Coba periksa apakah raw_title sudah bagus/bukan garbage
    3. Jika garbage/acak, buat judul tematik polos & natural
    """
    # 1. Coba bersihkan caption Discord
    clean_cap = clean_discord_caption(content)
    if clean_cap and not is_garbage_or_random_title(clean_cap):
        overview = generate_natural_overview(clean_cap, category)
        return clean_cap, overview

    # 2. Coba periksa apakah raw_title sudah punya nama yang bagus (contoh: "Kencan di Bali")
    if raw_title and not is_garbage_or_random_title(raw_title):
        # Bersihkan awalan kurung jika ada [Lokal], [Jepang] dll
        cleaned_raw = re.sub(r'^\[.*?\]\s*', '', raw_title).strip()
        cleaned_raw = re.sub(r'\(.*?\)', '', cleaned_raw).strip()
        cleaned_raw = re.sub(r'\s*-\s*Edisi.*$', '', cleaned_raw, flags=re.I).strip()
        if len(cleaned_raw) >= 5 and not is_garbage_or_random_title(cleaned_raw):
            overview = generate_natural_overview(cleaned_raw, category)
            return cleaned_raw, overview

    # 3. Hasilkan judul tematik yang polos & elegan
    thematic_title = generate_thematic_title(category, tier, item_id)
    overview = generate_natural_overview(thematic_title, category)
    return thematic_title, overview
