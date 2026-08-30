#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Batch Rename All Movies Script for Sekolah Nakal (100% Clean Plain Natural Titles)
"""

import json
import os
import re
import urllib.request
import subprocess
import time
from ai_title_generator import resolve_best_title, is_garbage_or_random_title

SSH_HOST = "153.92.10.176"
SSH_PORT = "65002"
SSH_USER = "u948854164"
REMOTE_PATH_1 = "/home/u948854164/domains/sekolahnakal.so791.com/public_html/api/data/movies.json"
REMOTE_PATH_2 = "/home/u948854164/public_html/api/data/movies.json"

def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

def main():
    log("=== MEMULAI PROSES AI AUTO-RENAME SELURUH DATABASE VIDEO ===")
    
    # 1. Unduh database movies.json lengkap dari server
    log("Mengunduh database movies.json lengkap dari Hostinger...")
    temp_remote_backup = "/tmp/remote_live_movies.json"
    subprocess.run([
        "scp", "-P", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        f"{SSH_USER}@{SSH_HOST}:{REMOTE_PATH_1}",
        temp_remote_backup
    ], check=True)
    
    with open(temp_remote_backup, "r", encoding="utf-8") as f:
        movies = json.load(f)
        
    log(f"Berhasil memuat {len(movies)} video dari master database.")
    
    # 2. Proses renaming ketat
    renamed_count = 0
    used_titles = {}
    
    for idx, m in enumerate(movies):
        m_id = m.get("id") or f"m_{idx}"
        old_title = m.get("title", "")
        category = (m.get("genres") or ["Media Lokal"])[0]
        tier = m.get("tier", "vip")
        content = m.get("discordMsgContent") or ""
        
        # Tentukan judul baru yang 100% natural & bebas dari nama acak
        new_title, overview = resolve_best_title(old_title, content, category, tier, m_id)
        
        # Hindari tabrakan judul yang persis sama dengan menambahkan diferensiasi halus
        if new_title in used_titles:
            count = used_titles[new_title] + 1
            used_titles[new_title] = count
            unique_title = f"{new_title} {count}"
        else:
            used_titles[new_title] = 1
            unique_title = new_title
            
        m["title"] = unique_title
        m["overview"] = overview
        m["description"] = overview
        m["slug"] = re.sub(r'[^a-z0-9]+', '-', unique_title.lower()).strip('-')
        
        if unique_title != old_title:
            renamed_count += 1
            
    log(f"✅ Selesai memproses {len(movies)} video. Total video yang diganti judulnya: {renamed_count} video.")
    
    # 3. Simpan ke file lokal sementara
    temp_json = "/tmp/movies_renamed_clean.json"
    with open(temp_json, "w", encoding="utf-8") as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)
        
    # 4. Upload ke kedua lokasi Hostinger
    log("Mengunggah database yang telah dipercantik ke server Hostinger...")
    scp_cmd_1 = [
        "scp", "-P", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        temp_json, f"{SSH_USER}@{SSH_HOST}:{REMOTE_PATH_1}"
    ]
    subprocess.run(scp_cmd_1, check=True)
    
    scp_cmd_2 = [
        "scp", "-P", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        temp_json, f"{SSH_USER}@{SSH_HOST}:{REMOTE_PATH_2}"
    ]
    subprocess.run(scp_cmd_2, check=True)
    
    log("🎉 SUKSES! 100% Seluruh video di live website kini memiliki judul polos, natural, dan menarik.")

if __name__ == "__main__":
    main()
