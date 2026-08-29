#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Title Generator & Humanizer Copywriting Engine (Sekolah Nakal)
Format: 100% Real Human-like Casual Typing.
Variasi panjang-pendek acak (1 kata - 8 kata), gaya santai, bahasa slang anak muda, tidak kaku/baku.
"""

import re
import hashlib
import random

# ==========================================
# 1. POOL JUDUL PENDEK (1 - 3 KATA) ~ 35%
# ==========================================
SHORT_LOKAL = [
    "colmek basah", "Tobrut jaksel", "di gas temen", "skandal hotel", "hijab mesum",
    "pasrah di ewe", "main di kosan", "bocil tobrut", "desah parah", "di mobil goyang",
    "VCS colmek", "mandi bareng", "enak banget", "Tobrut indo", "janda muda",
    "main kasar", "wikwik kosan", "abg viral", "minta jatah", "sampe lemes",
    "colmek timun", "di ewe om", "cewek SMA", "goyang desah", "becek parah",
    "main belakang", "kepergok wikwik", "cewek kosan", "desahan renyah", "pamer tobrut",
    "gadis desa", "baju tidur tipis", "sange berat", "desah keenakan", "mandi basah"
]

SHORT_JEPANG = [
    "cosplay tobrut", "tante jepang", "pijat plus", "cewek jepang", "ABG jepang",
    "cosplay bunny", "di ewe di hotel", "onsen bareng", "pasrah di ranjang", "suster tobrut",
    "maid jepang", "desah jepang", "shibuya girl", "guru jepang", "kepergok di kelas"
]

SHORT_BARAT = [
    "bule montok", "cewek latin", "model onlyfans", "bule pirang", "main di penthouse",
    "di kolam renang", "bule tobrut", "miami beach", "gaya liar", "bule pasrah",
    "photoshoot nakal", "bule sange", "cewek spanyol", "latin goyang"
]

SHORT_CHINA = [
    "cindo mulus", "model cindo", "cewek douyin", "streamer cindo", "cindo tobrut",
    "apartemen mewah", "cindo pasrah", "cindo mabuk", "kulit mulus", "shanghai beauty"
]

SHORT_TALENT = [
    "talent tobrut", "staycation bali", "villa privat", "bareng talent", "momen intim",
    "dinner berlanjut", "di ewe di villa", "talent pasrah", "VIP session", "talent viral"
]

# ==========================================
# 2. POOL JUDUL SEDANG (4 - 6 KATA) ~ 45%
# ==========================================
MEDIUM_LOKAL = [
    "di gas temen pas rumah sepi", "cewek kosan minta jatah malam", "skandal mahasiswi bandung hotel melati",
    "bocil tobrut main di kamar", "kepergok wikwik pas ujan deras", "VCS colmek mendesah keenakan",
    "gadis manis pasrah di genjot", "main belakang sampe lemes parah", "colmek di kamar mandi basah",
    "di ewe pacar pas mau tidur", "jilbab tobrut di gas di mobil", "selebgram tobrut pamer bodi di kasur",
    "pasangan SMA colong waktu di kosan", "di ewe tetangga kosan sampe becek", "cewek tobrut goyang desah liar",
    "mandi basah sambil mainin jari", "cewek kuliahan pasrah di gas om", "di ewe bos di ruang kerja",
    "koleksi pribadi cewek cosplay tobrut", "wikwik panas berdua di kasur", "janda muda minta jatah malam jumat",
    "gadis hijab mesum main di mobil", "pasangan kosan jaksel malam minggu", "bikin video pas lagi sange",
    "colmek pake timun di ranjang", "gadis manja minta di gas abis", "di goyang pacar sampe lemes",
    "kepergok mesum di toilet sekolah", "rekaman kamar tidur cewek cantik", "aksi nakal pasangan kekasih di villa"
]

MEDIUM_JEPANG = [
    "cosplay cewek jepang di genjot hotel", "pijat plus plus sensual tokyo", "cewek jepang pasrah di ewe",
    "cosplay bunny tobrut mendesah pasrah", "main bertiga bareng cewek jepang", "cewek ABG jepang kepergok mesum",
    "tante jepang minta di puasin berondong", "idol jepang wikwik di studio foto", "pelayan maid jepang di ewe",
    "cewek shibuya di gas di hotel", "suster cantik jepang main di klinik", "mandi air panas ryokan bareng tante"
]

MEDIUM_BARAT = [
    "bule montok di gas di ranjang", "cewek latin mendesah di kamar hotel", "photoshoot model bule di ewe",
    "bule pirang main kasar di penthouse", "di gas abis abisan bareng bule", "model onlyfans barat wikwik liar",
    "bule tobrut di genjot di kolam", "cewek spanyol liar di atas kasur", "sesi panas bule montok di hotel"
]

MEDIUM_CHINA = [
    "cewek cindo tobrut main di apartemen", "model cindo di ewe di hotel", "cewek douyin pasrah di gas pacar",
    "streamer cindo colmek depan kamera", "cewek cindo baju hanfu di ewe", "cindo mulus pasrah di genjot abis"
]

MEDIUM_TALENT = [
    "staycation bareng talent di gas pagi", "private date villa bali di ewe", "talent cantik minta dimanjain di kasur",
    "wikwik romantis bareng talent populer", "sesi privat suite hotel bareng talent", "talent verified pasrah di genjot"
]

# ==========================================
# 3. POOL JUDUL PANJANG (7 - 9 KATA) ~ 20%
# ==========================================
LONG_LOKAL = [
    "pasangan SMA kepergok wikwik di kosan temen sampe lemes",
    "cewek jilbab tobrut pasrah di gas om girang di hotel bintang",
    "rekaman pribadi selebgram viral main kasar di apartemen jaksel",
    "momen intim berdua di kamar hotel remang remang desah parah",
    "koleksi pribadi cewek tobrut lagi asik colmek sendiri di kasur",
    "pasangan kosan jaksel main liar pas rumah lagi sepi banget",
    "gadis manis baju tidur tipis pasrah di genjot sampe nangis nikmat",
    "di ewe tetangga kosan pas malam minggu goyangannya bikin nagih",
    "aksi nakal cewek kuliahan minta jatah di kamar tidur apartemen",
    "skandal panas asisten pribadi kantor di ewe bos sampe basah"
]

LONG_JEPANG = [
    "cosplay anime tobrut di genjot di kamar hotel tokyo sampe kejang",
    "cewek jepang mabuk pasrah di ewe temen kantor di ruang karaoke",
    "tante jepang montok minta di puasin berondong di pemandian air panas"
]

LONG_BARAT = [
    "model bule pirang main kasar di penthouse mewah desah kenceng banget",
    "cewek latin tobrut di gas abis abisan di pinggir pantai miami",
    "photoshoot model onlyfans barat berlanjut wikwik liar di kamar hotel"
]

LONG_CHINA = [
    "cewek cindo tobrut pasrah di gas pacar di apartemen mewah jakarta",
    "model cindo mulus di ewe di kamar hotel suite suasana remang",
    "streamer douyin cindo colmek basah live depan kamera kamar tidur"
]

LONG_TALENT = [
    "staycation eksklusif bareng talent verified di villa seminyak bali di gas",
    "private room stay bareng talent tobrut di ewe sampe lemes bareng",
    "liburan pulau dewata wikwik romantis bareng talent populer di hotel mewah"
]

# ==========================================
# OVERVIEWS (CASUAL & NATURAL)
# ==========================================
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
    "Aksi nakal pas lagi kangen berat, main berduaan di kamar sampe sprei basah kuyup.",
    "Ceweknya pasrah banget minta digenjot terus, ekspresinya bener-bener nikmat.",
    "Gaya nunggingnya mantap pol, suara desahannya kedengeran jelas bikin horni."
]


def is_garbage_or_random_title(title: str) -> bool:
    """Mendeteksi apakah judul saat ini adalah nama file acak, hash, atau format mentah."""
    if not title:
        return True
    
    t = title.strip()
    t_lower = t.lower()
    
    if len(t_lower) < 4:
        return True
        
    raw_tokens = [
        "vid", "video", "screen recording", "screenrecording", "screen_recording", "recording",
        "rec_", "mov_", "trim_", "img", "image", "snapvideo", "snap_", "whatsapp",
        "telegram", "download", "untitled", "media_", "attachment", "file ", "inshot",
        "poophd", "dood", "lulustream", "mightydee", "att ", "4 5769", "tmp_", "cache_"
    ]
    for p in raw_tokens:
        if t_lower.startswith(p) or f" {p}" in t_lower:
            return True
            
    if any(ext in t_lower for ext in ["mp4", "mkv", "avi", "mov", "3gp", "webm"]):
        return True

    if re.search(r'\d{6,}', t_lower):
        return True
        
    digits_count = sum(c.isdigit() for c in t_lower)
    letters_count = sum(c.isalpha() for c in t_lower)
    if digits_count > 0 and (digits_count >= letters_count or digits_count >= 5):
        return True

    if re.search(r'[0-9a-f]{6,}', t_lower):
        return True

    words = re.split(r'[\s_.-]+', t_lower)
    for w in words:
        if len(w) >= 5 and re.search(r'[a-z]', w) and re.search(r'\d', w):
            return True
        if len(w) >= 7 and not re.search(r'[aeiou]', w):
            return True

    if len(words) == 1 and len(words[0]) >= 10:
        return True
    if len(words) <= 2 and any(len(w) >= 14 for w in words):
        return True

    return False


def clean_discord_caption(caption: str) -> str:
    """Membersihkan teks caption pesan Discord menjadi judul santai natural."""
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
        words = cleaned.split()
        return " ".join(words[:8])
        
    return ""


def apply_human_casing(text: str, seed_int: int) -> str:
    """Menerapkan gaya ketikan manusia santai: Sentence case, lowercase, atau Title case kasual."""
    rng = random.Random(seed_int + 77)
    style_choice = rng.random()
    
    words = text.split()
    if not words:
        return text

    if style_choice < 0.40:
        # Sentence case (Huruf pertama kapital, sisanya santai)
        return text[0].upper() + text[1:]
    elif style_choice < 0.70:
        # Casual Mixed (Kapital kata penting / singkatan seperti SMA, VCS, ABG, VIP)
        capitalized = []
        for w in words:
            if w.upper() in ["SMA", "VCS", "ABG", "VIP", "HD", "JAP"]:
                capitalized.append(w.upper())
            else:
                capitalized.append(w.capitalize())
        return " ".join(capitalized)
    else:
        # Super casual lowercase look (e.g. "colmek basah di kamar")
        return text.lower()


def generate_mixed_title(category: str, tier: str, seed_id: str) -> str:
    """
    Menghasilkan judul yang benar-benar campur (panjang, sedang, pendek)
    dengan distribusi natural:
    - 35% Pendek (1-3 kata)
    - 45% Sedang (4-6 kata)
    - 20% Panjang (7-9 kata)
    """
    cat_lower = (category or "").lower()
    tier_lower = (tier or "").lower()
    
    seed_int = int(hashlib.md5(str(seed_id).encode("utf-8")).hexdigest(), 16)
    rng = random.Random(seed_int)
    
    # Pilih panjang secara dinamis
    length_dice = rng.random()
    
    if "jepang" in cat_lower or "jav" in cat_lower or "cosplay" in cat_lower:
        if length_dice < 0.35:
            raw = rng.choice(SHORT_JEPANG)
        elif length_dice < 0.80:
            raw = rng.choice(MEDIUM_JEPANG)
        else:
            raw = rng.choice(LONG_JEPANG)
            
    elif "barat" in cat_lower or "bule" in cat_lower or "western" in cat_lower or "latin" in cat_lower:
        if length_dice < 0.35:
            raw = rng.choice(SHORT_BARAT)
        elif length_dice < 0.80:
            raw = rng.choice(MEDIUM_BARAT)
        else:
            raw = rng.choice(LONG_BARAT)
            
    elif "china" in cat_lower or "mandarin" in cat_lower or "asia" in cat_lower:
        if length_dice < 0.35:
            raw = rng.choice(SHORT_CHINA)
        elif length_dice < 0.80:
            raw = rng.choice(MEDIUM_CHINA)
        else:
            raw = rng.choice(LONG_CHINA)
            
    elif "talent" in cat_lower or tier_lower == "talent":
        if length_dice < 0.35:
            raw = rng.choice(SHORT_TALENT)
        elif length_dice < 0.80:
            raw = rng.choice(MEDIUM_TALENT)
        else:
            raw = rng.choice(LONG_TALENT)
            
    else:  # Default to Media Lokal / Koleksi Pribadi
        if length_dice < 0.35:
            raw = rng.choice(SHORT_LOKAL)
        elif length_dice < 0.80:
            raw = rng.choice(MEDIUM_LOKAL)
        else:
            raw = rng.choice(LONG_LOKAL)
            
    return apply_human_casing(raw, seed_int)


def generate_humanized_overview(seed_id: str) -> str:
    """Menghasilkan sinopsis casual super santai ala anak muda."""
    seed_int = int(hashlib.md5(str(seed_id).encode("utf-8")).hexdigest(), 16)
    rng = random.Random(seed_int)
    return rng.choice(OVERVIEW_TEMPLATES)


def resolve_best_title(raw_title: str, content: str, category: str, tier: str, item_id: str) -> tuple[str, str]:
    """
    Fungsi utama untuk memutuskan judul terbaik:
    1. Coba ekstrak dari caption teks asli Discord (jika ada teks menarik)
    2. Coba periksa apakah raw_title sudah bagus/bukan garbage
    3. Jika garbage/acak, buat judul casual campur (panjang/pendek bervariasi)
    """
    clean_cap = clean_discord_caption(content)
    if clean_cap and not is_garbage_or_random_title(clean_cap):
        seed_int = int(hashlib.md5(str(item_id).encode("utf-8")).hexdigest(), 16)
        formatted_title = apply_human_casing(clean_cap, seed_int)
        overview = generate_humanized_overview(item_id)
        return formatted_title, overview

    if raw_title and not is_garbage_or_random_title(raw_title):
        cleaned_raw = re.sub(r'^\[.*?\]\s*', '', raw_title).strip()
        cleaned_raw = re.sub(r'\(.*?\)', '', cleaned_raw).strip()
        cleaned_raw = re.sub(r'\s*-\s*Edisi.*$', '', cleaned_raw, flags=re.I).strip()
        if len(cleaned_raw) >= 5 and not is_garbage_or_random_title(cleaned_raw):
            seed_int = int(hashlib.md5(str(item_id).encode("utf-8")).hexdigest(), 16)
            formatted_title = apply_human_casing(cleaned_raw, seed_int)
            overview = generate_humanized_overview(item_id)
            return formatted_title, overview

    mixed_title = generate_mixed_title(category, tier, item_id)
    overview = generate_humanized_overview(item_id)
    return mixed_title, overview
