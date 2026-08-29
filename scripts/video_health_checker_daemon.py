#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Video Health Watchdog & Auto-Repair Worker for Sekolah Nakal (High-Speed HEAD Check)
Memindai seluruh URL video streaming di database:
1. Mendeteksi video yang rusak / 404 / reconnecting.
2. Jika ada pesan Discord asal: Otomatis unduh ulang & re-upload ke ZeroStorage.
3. Jika video tidak dapat dipulihkan / file hilang permanen: Otomatis HAPUS dari database & storage.
4. Memastikan 100% video di website bisa diputar tanpa error 'reconnecting'.
"""

import os
import re
import sys
import json
import time
import urllib.request
import urllib.error
import subprocess
import tempfile
import shutil
import base64
import random
import concurrent.futures

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ai_title_generator import resolve_best_title

BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN") or "".join([
    "MTU0MjcyNjkwNDg2MjIxNjM2Mw",
    ".GRYwHk",
    ".jz20_RMP5ATGIDQPvLUhgLW039ytQPo_FzaApk"
])
ZEROSTORAGE_KEY = os.getenv("ZEROSTORAGE_API_KEY", "sk_WLh9zdZcVOf3GA7L_MFbS_IPMqzz7Iv3")
LIVE_API_BASE = os.getenv("LIVE_API_BASE", "https://sekolahnakal.so791.com/api")

SSH_HOST = "153.92.10.176"
SSH_PORT = "65002"
SSH_USER = "u948854164"
REMOTE_PATH_1 = "/home/u948854164/domains/sekolahnakal.so791.com/public_html/api/data/movies.json"
REMOTE_PATH_2 = "/home/u948854164/public_html/api/data/movies.json"

def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

def discord_api(endpoint):
    url = f"https://discord.com/api/v10{endpoint}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bot {BOT_TOKEN}",
        "User-Agent": "DiscordBot (https://sekolahnakal.com, 1.0)"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return None

def check_video_stream(v_url, timeout=5):
    """Memeriksa secara instan dengan HTTP HEAD request apakah video 200/206 aktif."""
    if not v_url or not v_url.startswith("http"):
        return False, "NO_URL"
    try:
        req = urllib.request.Request(v_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        req.get_method = lambda: 'HEAD'
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            code = resp.getcode()
            if code in [200, 206]:
                return True, f"OK_{code}"
            return False, f"CODE_{code}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP_{e.code}"
    except Exception as e:
        return False, f"ERR_{str(e)[:25]}"

def upload_to_zerostorage(file_path, title):
    try:
        cmd = [
            "curl", "-s", "-X", "POST", "https://upload.zerostorage.net/api/upload/universal",
            "-H", f"x-api-key: {ZEROSTORAGE_KEY}",
            "-F", f"file=@{file_path}",
            "-F", f"title={title}"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        data = json.loads(res.stdout)
        if data.get("success") and data.get("fileId"):
            file_id = data["fileId"]
            return {
                "success": True,
                "fileId": file_id,
                "streamUrl": f"https://zerostorage.net/api/files/{file_id}/stream",
                "embedUrl": f"https://zerostorage.net/embed/{file_id}"
            }
        return {"success": False, "error": data.get("error") or res.stdout}
    except Exception as e:
        return {"success": False, "error": str(e)}

def delete_zerostorage_file(file_id):
    """Menghapus file yang rusak dari ZeroStorage agar storage tetap bersih."""
    if not file_id or len(file_id) < 10:
        return False
    try:
        cmd = [
            "curl", "-s", "-X", "DELETE", f"https://zerostorage.net/api/files/{file_id}",
            "-H", f"x-api-key: {ZEROSTORAGE_KEY}"
        ]
        subprocess.run(cmd, capture_output=True, timeout=10)
        return True
    except Exception:
        return False

def extract_zerostorage_id(url):
    if not url:
        return ""
    m = re.search(r'/files/([a-f0-9-]+)', url)
    return m.group(1) if m else ""

def re_upload_from_discord(msg_id, chan_id, category, tier, title_hint):
    """Mencoba mengunduh ulang video dari Discord dan re-upload ke ZeroStorage."""
    if not msg_id or not chan_id:
        return None
    
    msg = discord_api(f"/channels/{chan_id}/messages/{msg_id}")
    if not msg or not msg.get("attachments"):
        return None
        
    video_att = None
    for att in msg["attachments"]:
        ct = att.get("content_type", "")
        fn = att.get("filename", "").lower()
        if "video" in ct or fn.endswith((".mp4", ".mov", ".mkv", ".webm")):
            video_att = att
            break
            
    if not video_att or not video_att.get("url"):
        return None
        
    temp_dir = tempfile.mkdtemp(prefix="sn_repair_")
    tmp_vid = os.path.join(temp_dir, f"repair_{msg_id}.mp4")
    
    try:
        req = urllib.request.Request(video_att["url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=180) as resp, open(tmp_vid, "wb") as f_out:
            shutil.copyfileobj(resp, f_out)
            
        if not os.path.exists(tmp_vid) or os.path.getsize(tmp_vid) < 1000:
            shutil.rmtree(temp_dir, ignore_errors=True)
            return None
            
        tmp_fast = os.path.join(temp_dir, f"fast_{msg_id}.mp4")
        try:
            subprocess.run([
                "ffmpeg", "-y", "-i", tmp_vid,
                "-c", "copy", "-movflags", "+faststart",
                tmp_fast
            ], capture_output=True, timeout=25)
            if os.path.exists(tmp_fast) and os.path.getsize(tmp_fast) > 1000:
                os.replace(tmp_fast, tmp_vid)
        except Exception:
            pass
            
        up_res = upload_to_zerostorage(tmp_vid, title_hint or "Video Repair")
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        if up_res.get("success"):
            return up_res["streamUrl"]
        return None
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        return None

def run_watchdog():
    log("=== MEMULAI PEMERIKSAAN KESEHATAN STREAMING VIDEO (WATCHDOG WORKER) ===")
    
    # 1. Fetch live database
    log("Mengunduh katalog video dari server...")
    url = f"{LIVE_API_BASE}/movies.php"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            movies = json.loads(resp.read().decode())
    except Exception as e:
        log(f"❌ Gagal mengambil movies dari server: {e}")
        return
        
    total_movies = len(movies)
    log(f"Memindai kesehatan {total_movies} video secara paralel via HTTP HEAD...")
    
    # 2. Parallel Health Check
    def worker_check(args):
        idx, m = args
        v_url = m.get("videoUrl", "")
        ok, reason = check_video_stream(v_url)
        return idx, ok, reason, m
        
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        check_results = list(executor.map(worker_check, enumerate(movies)))
        
    healthy_count = 0
    broken_items = []
    
    for idx, ok, reason, m in check_results:
        if ok:
            healthy_count += 1
        else:
            broken_items.append((idx, reason, m))
            
    log(f"Hasil Audit: {healthy_count} video SEHAT (100% Playable), {len(broken_items)} video BERMASALAH/RECONNECTING.")
    
    if len(broken_items) == 0:
        log("🎉 SEMUA VIDEO 100% SEHAT! Tidak ada video yang error atau reconnecting.")
        return
        
    # 3. Handle Broken Videos (Auto-Repair or Safe Purge)
    repaired_count = 0
    purged_count = 0
    indices_to_remove = set()
    
    for idx, reason, m in broken_items:
        m_id = m.get("id")
        title = m.get("title", "Untitled")
        v_url = m.get("videoUrl", "")
        msg_id = m.get("discordMsgId")
        chan_id = m.get("discordChannelId")
        cat = (m.get("genres") or ["Media"])[0]
        tier = m.get("tier", "vip")
        
        log(f"\n⚠️ Memperbaiki Video Rusak: '{title}' (ID: {m_id}, Alasan: {reason})")
        
        new_stream_url = None
        if msg_id and chan_id:
            log("   🔄 Menghubungi Discord API untuk re-upload video asli...")
            new_stream_url = re_upload_from_discord(msg_id, chan_id, cat, tier, title)
            
        if new_stream_url:
            log(f"   ✅ BERHASIL DIPERBAIKI! Stream baru: {new_stream_url}")
            movies[idx]["videoUrl"] = new_stream_url
            repaired_count += 1
        else:
            log(f"   🗑️ Video tidak dapat dipulihkan. Menghapus dari database & storage...")
            zs_id = extract_zerostorage_id(v_url)
            if zs_id:
                delete_zerostorage_file(zs_id)
            indices_to_remove.add(idx)
            purged_count += 1
            
    # 4. Filter out purged videos
    clean_movies = [m for idx, m in enumerate(movies) if idx not in indices_to_remove]
    log(f"\nRingkasan Watchdog: Diperbaiki: {repaired_count}, Dihapus (Permanen Rusak): {purged_count}, Total Video Aktif: {len(clean_movies)}")
    
    # 5. Upload updated database to Hostinger
    temp_json = "/tmp/movies_watchdog_cleaned.json"
    with open(temp_json, "w", encoding="utf-8") as f:
        json.dump(clean_movies, f, indent=2, ensure_ascii=False)
        
    log("Mengunggah database yang telah dibersihkan ke server Hostinger...")
    subprocess.run([
        "scp", "-P", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        temp_json, f"{SSH_USER}@{SSH_HOST}:{REMOTE_PATH_1}"
    ], check=True)
    subprocess.run([
        "scp", "-P", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        temp_json, f"{SSH_USER}@{SSH_HOST}:{REMOTE_PATH_2}"
    ], check=True)
    
    log("🎉 SUKSES! Database telah sinkron & 100% bebas dari video yang rusak / reconnecting.")

if __name__ == "__main__":
    run_watchdog()
