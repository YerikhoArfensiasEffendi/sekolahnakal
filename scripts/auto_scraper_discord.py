#!/usr/bin/env python3
"""
Master Discord Video Scraper & ZeroStorage Auto-Publisher (Sekolah Nakal)
Dibikin oleh: beone - sekolah nakal web dev

Fitur:
- Scanning 14 Channel Discord + Payment History
- Auto-download video attachment & extract real thumbnail snapshot via FFmpeg (Base64 JPEG)
- Auto-extract real video duration via FFprobe
- Auto-upload ke ZeroStorage CDN Universal API
- Integrasi direct stream URL (https://zerostorage.net/api/files/{id}/stream)
- Push live ke database https://sekolahnakal.so791.com/api/movies.php
"""

import os
import re
import sys
import json
import time
import random
import base64
import urllib.request
import urllib.error
import subprocess
import shutil
import tempfile

BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN") or "".join([
    "MTU0MjcyNjkwNDg2MjIxNjM2Mw",
    ".GRYwHk",
    ".jz20_RMP5ATGIDQPvLUhgLW039ytQPo_FzaApk"
])
ZEROSTORAGE_KEY = os.getenv("ZEROSTORAGE_API_KEY", "sk_WLh9zdZcVOf3GA7L_MFbS_IPMqzz7Iv3")
LIVE_API_BASE = os.getenv("LIVE_API_BASE", "https://sekolahnakal.so791.com/api")

TARGET_CHANNELS = [
    # Reguler Channels
    {"id": "1481796670252388362", "name": "⌜🔞⌟⇾media-forward", "category": "Media Forward", "tier": "regular"},
    {"id": "1402628509112864769", "name": "⌜🔞⌟⇾media-barat", "category": "Media Barat", "tier": "regular"},
    {"id": "1402628474157400074", "name": "⌜🔞⌟⇾media-asia", "category": "Media Asia", "tier": "regular"},
    {"id": "1402627069392715876", "name": "⌜🔞⌟⇾media-lokal", "category": "Media Lokal", "tier": "regular"},
    {"id": "1518603870970843269", "name": "⌜👙⌟⇾share-kolpri", "category": "Koleksi Pribadi", "tier": "regular"},

    # VIP Asia & East
    {"id": "1408159322780733491", "name": "⌜💎⌟⇾media-china", "category": "Media China", "tier": "vip"},
    {"id": "1433196972252336169", "name": "⌜💎⌟⇾media-korea", "category": "Media Korea", "tier": "vip"},
    {"id": "1403698066317639741", "name": "⌜💎⌟⇾media-jepang", "category": "Media Jepang", "tier": "vip"},
    {"id": "1433197442656112681", "name": "⌜💎⌟⇾media-taiwan", "category": "Media Taiwan", "tier": "vip"},

    # VIP Lokal & Talent
    {"id": "1403283149508710410", "name": "⌜💎⌟⇾media-lokal", "category": "Media Lokal", "tier": "vip"},
    {"id": "1403698007261712455", "name": "⌜💎⌟⇾media-asia", "category": "Media Asia", "tier": "vip"},
    {"id": "1477917417010102322", "name": "⌜🔖⌟⇾save-telent", "category": "Talent Verified Collab", "tier": "talent"},
    {"id": "1473949617841504390", "name": "⌜💎⌟⇾preview-telent", "category": "Talent Verified Collab", "tier": "talent"},

    # VIP Global & Barat
    {"id": "1403698038329053296", "name": "⌜💎⌟⇾media-barat", "category": "Media Barat", "tier": "vip"},
    {"id": "1434557709859950663", "name": "⌜💎⌟⇾media-arab", "category": "Media Arab", "tier": "vip"},
    {"id": "1434557739694035034", "name": "⌜💎⌟⇾media-india", "category": "Media India", "tier": "vip"},
    {"id": "1433027001320476712", "name": "⌜💎⌟⇾media-latin", "category": "Media Latin", "tier": "vip"},
    {"id": "1453446102492647495", "name": "⌜😈⌟⇾content-farming", "category": "Media Eksklusif", "tier": "vip"},
]

CHANNEL_GROUPS = {
    "reguler": [
        "1481796670252388362", # Media Forward
        "1402628509112864769", # Media Barat Reguler
        "1402628474157400074", # Media Asia Reguler
        "1402627069392715876", # Media Lokal Reguler
        "1518603870970843269", # Share Kolpri
    ],
    "vip-asia-east": [
        "1408159322780733491", # VIP Media China
        "1433196972252336169", # VIP Media Korea
        "1403698066317639741", # VIP Media Jepang
        "1433197442656112681", # VIP Media Taiwan
    ],
    "vip-lokal-asia": [
        "1403283149508710410", # VIP Media Lokal
        "1403698007261712455", # VIP Media Asia
        "1477917417010102322", # Save Telent
        "1473949617841504390", # Preview Telent
    ],
    "vip-global": [
        "1403698038329053296", # VIP Media Barat
        "1434557709859950663", # VIP Media Arab
        "1434557739694035034", # VIP Media India
        "1433027001320476712", # VIP Media Latin
        "1453446102492647495", # Content Farming
    ],
}

PAYMENT_CHANNEL_ID = "1402837561130487908"

def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

def discord_api(endpoint):
    url = f"https://discord.com/api/v10{endpoint}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bot {BOT_TOKEN}",
        "User-Agent": "DiscordBot (https://sekolahnakal.com, 1.0)"
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        log(f"Discord API Error on {endpoint}: {e}")
        return None

def get_existing_live_movies():
    try:
        req = urllib.request.Request(f"{LIVE_API_BASE}/movies.php", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            return data if isinstance(data, list) else []
    except Exception as e:
        log(f"Warning: Could not fetch existing movies: {e}")
        return []

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
        return {"success": False, "error": data.get("error") or res.stdout or "Upload failed"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def push_movie_to_server(movie_data):
    try:
        req = urllib.request.Request(
            f"{LIVE_API_BASE}/movies.php",
            data=json.dumps(movie_data).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            res = json.loads(resp.read().decode())
            return res.get("success", False)
    except Exception as e:
        log(f"Push to server failed: {e}")
        return False

def sync_payments():
    log("Refreshing live payments history feed...")
    try:
        req = urllib.request.Request(
            f"{LIVE_API_BASE}/discord.php?action=get_payments&refresh=1",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            log(f"✓ Payments feed synced successfully: {len(data.get('payments', []))} transactions loaded.")
    except Exception as e:
        log(f"Payment sync warning: {e}")

def fetch_unuploaded_channel_video_items(chan_id, existing_msg_ids, max_videos=50, max_pages=20):
    """
    Menjelajahi arsip riwayat channel Discord (pagination 'before=id') sampai terkumpul
    daftar video item (termasuk multi-attachment dalam 1 pesan & embed) yang belum diunggah.
    """
    unuploaded_items = []
    last_id = None
    pages = 0

    while len(unuploaded_items) < max_videos and pages < max_pages:
        pages += 1
        endpoint = f"/channels/{chan_id}/messages?limit=100"
        if last_id:
            endpoint += f"&before={last_id}"

        msgs = discord_api(endpoint)
        if not msgs or not isinstance(msgs, list):
            break

        last_id = msgs[-1].get("id")

        for m in msgs:
            msg_id = m.get("id")
            content = (m.get("content") or "").strip()
            attachments = m.get("attachments", [])
            embeds = m.get("embeds", [])

            # 1. Check all attachments
            vid_attachments = []
            for att in attachments:
                ctype = (att.get("content_type") or "").lower()
                fname = (att.get("filename") or "").lower()
                if "video" in ctype or fname.endswith((".mp4", ".mov", ".mkv", ".webm", ".m4v", ".avi")):
                    vid_attachments.append(att)

            for att_idx, att in enumerate(vid_attachments):
                unique_key = f"{msg_id}-{att.get('id', att_idx)}" if len(vid_attachments) > 1 else str(msg_id)
                if unique_key in existing_msg_ids:
                    continue

                unuploaded_items.append({
                    "msg_id": msg_id,
                    "unique_key": unique_key,
                    "content": content,
                    "url": att["url"],
                    "filename": att.get("filename", ""),
                    "size": att.get("size", 0),
                    "part_index": att_idx + 1 if len(vid_attachments) > 1 else None,
                    "total_parts": len(vid_attachments) if len(vid_attachments) > 1 else None
                })
                if len(unuploaded_items) >= max_videos:
                    break

            if len(unuploaded_items) >= max_videos:
                break

        if len(msgs) < 100:
            break

    return unuploaded_items

def main(target_group="all", target_category=None, limit=30):
    log("==========================================================")
    log(f"🔥 MASTER SCRAPER: Group='{target_group.upper()}', Cat='{target_category or 'ALL'}', Target/Chan={limit} 🔥")
    log("==========================================================")

    if target_group in ("all", "reguler", "vip-lokal-asia"):
        sync_payments()

    existing_movies = get_existing_live_movies()
    existing_msg_ids = {m.get("discordMsgId") for m in existing_movies if m.get("discordMsgId")}
    log(f"Total video terdaftar di database saat ini: {len(existing_movies)}")

    # Filter target channels based on group/category
    selected_channels = []
    for c in TARGET_CHANNELS:
        if target_group != "all" and target_group in CHANNEL_GROUPS:
            if c["id"] not in CHANNEL_GROUPS[target_group]:
                continue
        if target_category and target_category.lower() not in c["category"].lower():
            continue
        selected_channels.append(c)

    log(f"Memproses {len(selected_channels)} target channels dalam batch ini.")
    total_published = 0
    temp_dir = tempfile.mkdtemp(prefix="sn_scraper_")

    try:
        for idx, chan in enumerate(selected_channels, 1):
            chan_id = chan["id"]
            chan_name = chan["name"]
            category = chan["category"]
            tier = chan["tier"]

            log(f"\n[{idx}/{len(selected_channels)}] Memindai Arsip Channel: {chan_name} (Cat: {category}, Tier: {tier.upper()})")

            # Ambil video baru dengan penjelajahan pagination riwayat channel
            unuploaded_items = fetch_unuploaded_channel_video_items(chan_id, existing_msg_ids, max_videos=limit)
            log(f"  -> Ditemukan {len(unuploaded_items)} video item baru yang siap diproses & diunggah.")

            # Urutkan dari yang lebih lama ke yang terbaru
            unuploaded_items.reverse()

            for item in unuploaded_items:
                msg_id = item["msg_id"]
                unique_key = item["unique_key"]
                content = item["content"]
                video_url = item["url"]
                fname = item["filename"]
                size_bytes = item["size"]
                part_idx = item["part_index"]
                total_parts = item["total_parts"]

                # Parse clean title
                title = ""
                if content and not content.startswith("http"):
                    first_line = content.split("\n")[0].strip()
                    title = re.sub(r'https?://\S+', '', first_line).strip()
                if not title:
                    raw_name = fname or f"Video {msg_id}"
                    base_name = os.path.splitext(raw_name)[0]
                    title = re.sub(r'[_.-]+', ' ', base_name).strip().title()

                if part_idx and total_parts:
                    title = f"{title} (Part {part_idx}/{total_parts})"

                size_mb = round(size_bytes / 1048576, 2) if size_bytes else 0
                log(f"  🎬 Memproses Video: \"{title}\" (ID: {unique_key}, Size: {size_mb} MB)...")

                # Download video
                tmp_vid_path = os.path.join(temp_dir, f"vid_{unique_key.replace('-', '_')}.mp4")

                try:
                    req_dl = urllib.request.Request(video_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req_dl, timeout=180) as resp, open(tmp_vid_path, "wb") as f_out:
                        shutil.copyfileobj(resp, f_out)
                except Exception as e:
                    log(f"    ❌ Gagal mengunduh video: {e}")
                    if os.path.exists(tmp_vid_path):
                        os.remove(tmp_vid_path)
                    continue

                if not os.path.exists(tmp_vid_path) or os.path.getsize(tmp_vid_path) < 1000:
                    log("    ❌ File video unduhan kosong atau rusak.")
                    if os.path.exists(tmp_vid_path):
                        os.remove(tmp_vid_path)
                    continue

                # 1. Extract snapshot thumbnail with FFmpeg
                poster_data_url = "/images/logo_v2.png"
                tmp_thumb = os.path.join(temp_dir, f"thumb_{unique_key.replace('-', '_')}.jpg")
                try:
                    cmd_ff = [
                        "ffmpeg", "-y", "-ss", "00:00:02", "-i", tmp_vid_path,
                        "-vframes", "1", "-vf", "scale=640:-1", "-q:v", "3",
                        tmp_thumb
                    ]
                    subprocess.run(cmd_ff, capture_output=True, timeout=15)
                    if not os.path.exists(tmp_thumb) or os.path.getsize(tmp_thumb) < 500:
                        cmd_ff[2] = "00:00:00.500"
                        subprocess.run(cmd_ff, capture_output=True, timeout=15)

                    if os.path.exists(tmp_thumb) and os.path.getsize(tmp_thumb) > 500:
                        with open(tmp_thumb, "rb") as f_th:
                            b64_img = base64.b64encode(f_th.read()).decode("utf-8")
                            poster_data_url = f"data:image/jpeg;base64,{b64_img}"
                            log(f"    🖼️ Snapshot thumbnail cuplikan video berhasil diekstrak.")
                except Exception as e:
                    log(f"    ⚠️ FFmpeg thumbnail extraction: {e}")

                # 2. Detect duration
                duration_sec = 60
                try:
                    cmd_dur = [
                        "ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=noprint_wrappers=1:nokey=1", tmp_vid_path
                    ]
                    res_dur = subprocess.run(cmd_dur, capture_output=True, text=True, timeout=10)
                    dur_val = float(res_dur.stdout.strip())
                    if dur_val > 0:
                        duration_sec = int(round(dur_val))
                except Exception:
                    pass

                # 3. Optimasi Web Streaming (+faststart moov atom ke awal file)
                tmp_fast_path = os.path.join(temp_dir, f"fast_{unique_key.replace('-', '_')}.mp4")
                try:
                    cmd_fast = [
                        "ffmpeg", "-y", "-i", tmp_vid_path,
                        "-c", "copy", "-movflags", "+faststart",
                        tmp_fast_path
                    ]
                    subprocess.run(cmd_fast, capture_output=True, timeout=25)
                    if os.path.exists(tmp_fast_path) and os.path.getsize(tmp_fast_path) > 1000:
                        os.replace(tmp_fast_path, tmp_vid_path)
                        log(f"    ⚡ Video dioptimalkan dengan FastStart (Buffer instan).")
                except Exception as e:
                    log(f"    ⚠️ Faststart note: {e}")

                # 4. Upload to ZeroStorage
                log("    ☁️ Mengunggah ke ZeroStorage CDN...")
                up_res = upload_to_zerostorage(tmp_vid_path, title)

                if not up_res.get("success"):
                    log(f"    ❌ Gagal upload ke ZeroStorage: {up_res.get('error')}")
                    if os.path.exists(tmp_vid_path):
                        os.remove(tmp_vid_path)
                    continue

                stream_url = up_res["streamUrl"]
                log(f"    ✅ Upload Sukses: {stream_url}")

                # 5. Push payload to live server
                movie_id = f"zs_{int(time.time())}_{random.randint(100, 999)}"
                movie_payload = {
                    "id": movie_id,
                    "title": title,
                    "slug": re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-') + f"-{msg_id[-4:]}",
                    "posterUrl": poster_data_url,
                    "backdropUrl": poster_data_url,
                    "poster": poster_data_url,
                    "banner": poster_data_url,
                    "genres": [category],
                    "category": category,
                    "tier": tier,
                    "duration": max(1, round(duration_sec / 60)),
                    "rating": round(random.uniform(8.5, 9.9), 1),
                    "year": int(time.strftime("%Y")),
                    "overview": content if content and not content.startswith("http") else f"Video arsip {category} - Komunitas Discord Sekolah Nakal.",
                    "description": content if content and not content.startswith("http") else f"Video arsip {category} - Komunitas Discord Sekolah Nakal.",
                    "tags": [category, tier.upper(), "Discord Archive", "ZeroStorage CDN", "FastStart"],
                    "videoUrl": stream_url,
                    "streamProvider": "zerostorage",
                    "discordMsgId": unique_key,
                    "discordChannelId": chan_id,
                    "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "views": random.randint(120, 850)
                }

                if push_movie_to_server(movie_payload):
                    existing_msg_ids.add(unique_key)
                    total_published += 1
                    log(f"    🎉 BERHASIL DIPUBLIKASIKAN ke Server: [{category}] {title} ({tier.upper()})")
                else:
                    log(f"    ❌ Gagal mendaftarkan video ke server database.")

                # Cleanup temp files
                if os.path.exists(tmp_vid_path):
                    os.remove(tmp_vid_path)
                if os.path.exists(tmp_thumb):
                    os.remove(tmp_thumb)

                time.sleep(1)

        log("\n==========================================================")
        log(f"🎉 SCRAPING SELESAI! Total video baru yang dipublikasikan: {total_published}")
        log("==========================================================")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    is_loop = "--loop" in sys.argv
    interval_minutes = 30
    group = "all"
    category = None
    limit = 30

    for idx, arg in enumerate(sys.argv):
        if arg == "--loop" and idx + 1 < len(sys.argv) and sys.argv[idx + 1].isdigit():
            interval_minutes = int(sys.argv[idx + 1])
        elif arg == "--group" and idx + 1 < len(sys.argv):
            group = sys.argv[idx + 1].lower()
        elif arg == "--category" and idx + 1 < len(sys.argv):
            category = sys.argv[idx + 1]
        elif arg == "--limit" and idx + 1 < len(sys.argv) and sys.argv[idx + 1].isdigit():
            limit = int(sys.argv[idx + 1])

    if is_loop:
        log(f"🚀 Memulai Scraper dalam MODE DAEMON OTOMATIS (Group: {group}, Interval: setiap {interval_minutes} menit)...")
        while True:
            try:
                main(target_group=group, target_category=category, limit=limit)
            except KeyboardInterrupt:
                log("🛑 Scraper dihentikan oleh pengguna.")
                break
            except Exception as e:
                log(f"⚠️ Terjadi kesalahan saat siklus scraping: {e}")

            log(f"⏳ Menunggu {interval_minutes} menit sebelum siklus scraping berikutnya...")
            time.sleep(interval_minutes * 60)
    else:
        main(target_group=group, target_category=category, limit=limit)
