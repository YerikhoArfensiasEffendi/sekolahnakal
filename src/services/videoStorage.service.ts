/**
 * Layanan Penyimpanan & Ekstraksi Metadata Video (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 */

import { extractMp4Duration } from '@/utils/mp4Parser';

const DB_NAME = 'sekolah_nakal_video_vault';
const STORE_NAME = 'video_blobs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
const blobUrlCache = new Map<string, string>();

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak didukung pada browser ini.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export const videoStorageService = {
  // 1. Simpan File Video Blob ke IndexedDB
  async saveVideoBlob(id: string, file: Blob): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record = {
          id,
          blob: file,
          name: (file as File).name || `video-${id}.mp4`,
          type: file.type || 'video/mp4',
          size: file.size,
          updatedAt: new Date().toISOString(),
        };

        const req = store.put(record);
        req.onsuccess = () => {
          if (blobUrlCache.has(id)) {
            URL.revokeObjectURL(blobUrlCache.get(id)!);
            blobUrlCache.delete(id);
          }
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  },

  // 2. Ambil Blob URL untuk diputar di ArtPlayer
  async getVideoUrl(id: string): Promise<string | null> {
    if (blobUrlCache.has(id)) {
      return blobUrlCache.get(id)!;
    }

    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const record = req.result;
          if (record && record.blob) {
            const blobUrl = URL.createObjectURL(record.blob);
            blobUrlCache.set(id, blobUrl);
            resolve(blobUrl);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  // 3. Hapus Video Blob dari IndexedDB
  async deleteVideo(id: string): Promise<void> {
    if (blobUrlCache.has(id)) {
      URL.revokeObjectURL(blobUrlCache.get(id)!);
      blobUrlCache.delete(id);
    }

    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  },

  // 4. Otomatis Membaca Durasi Asli & Mengambil Thumbnail Frame dari Video
  extractVideoMetadata(
    file: File
  ): Promise<{
    duration: number;
    rawDurationSec: number;
    posterDataUrl: string;
    variations?: { top: string; center: string; bottom: string };
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.preload = 'auto';
      video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:10px;height:10px;opacity:0;pointer-events:none;z-index:-9999;';

      const tempUrl = URL.createObjectURL(file);
      video.src = tempUrl;

      // Wajib di-append ke DOM agar Safari/iOS tidak membekukan (suspend) decoding frame video
      if (typeof document !== 'undefined' && document.body) {
        document.body.appendChild(video);
      }

      let detectedDuration = 0;
      let isResolved = false;

      // Baca durasi asli langsung dari MP4 box header secara independen
      extractMp4Duration(file).then((dur) => {
        if (dur && dur > 0) {
          detectedDuration = dur;
        }
      }).catch(() => {});

      const finish = (
        posterUrl: string,
        w = 640,
        h = 360,
        variations?: { top: string; center: string; bottom: string }
      ) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeout);
        try {
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
        } catch {}
        URL.revokeObjectURL(tempUrl);

        const finalDur =
          detectedDuration > 0
            ? Math.round(detectedDuration)
            : video.duration && isFinite(video.duration) && video.duration > 0
            ? Math.round(video.duration)
            : Math.round(video.currentTime) > 0
            ? Math.round(video.currentTime)
            : 0;

        resolve({
          duration: finalDur > 0 ? finalDur : 30,
          rawDurationSec: finalDur > 0 ? finalDur : 30,
          posterDataUrl: posterUrl || '/images/logo.png',
          variations: variations || {
            top: posterUrl || '/images/logo.png',
            center: posterUrl || '/images/logo.png',
            bottom: posterUrl || '/images/logo.png',
          },
          width: w,
          height: h,
        });
      };

      let earlyCapturedFrame: string | null = null;

      const timeout = setTimeout(() => {
        if (earlyCapturedFrame) {
          finish(earlyCapturedFrame, 640, 360, {
            top: earlyCapturedFrame,
            center: earlyCapturedFrame,
            bottom: earlyCapturedFrame,
          });
        } else {
          finish('/images/logo.png');
        }
      }, 25000);

      const updateDuration = () => {
        if (video.duration && !isNaN(video.duration) && video.duration > 0 && isFinite(video.duration)) {
          detectedDuration = Math.round(video.duration);
        }
      };

      video.ondurationchange = updateDuration;

      // Helper untuk render canvas standar 16:9 tanpa gap hitam dengan pergeseran optimal ke kiri (fokus subjek)
      const renderGridFrame = (align: 'top' | 'center' | 'bottom') => {
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 360;
        const targetW = 640;
        const targetH = 360;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '/images/logo.png';

        // Latar belakang gelap cinema
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, targetW, targetH);

        // Skala diperluas (1.20x margin) agar saat digeser ke kiri, TIDAK AKAN PERNAH ada gap hitam di kanan/kiri
        const baseScale = Math.max(targetW / vW, targetH / vH);
        const scale = baseScale * 1.20;
        const drawW = Math.round(vW * scale);
        const drawH = Math.round(vH * scale);

        // Geser lebih ke kiri (70% offset) dengan clamping presisi agar tidak tembus canvas (0 gap hitam)
        const maxShiftX = Math.max(0, drawW - targetW);
        const shiftX = Math.round(maxShiftX * 0.70);
        const drawX = -shiftX;

        // Posisi vertikal grid dengan clamping presisi (0 gap hitam)
        const maxShiftY = Math.max(0, drawH - targetH);
        let drawY = 0;
        if (align === 'top') {
          // Fokus atas (12% dari atas untuk wajah & kepala)
          drawY = -Math.round(maxShiftY * 0.12);
        } else if (align === 'center') {
          // Tengah pas
          drawY = -Math.round(maxShiftY * 0.50);
        } else {
          // Bawah
          drawY = -Math.round(maxShiftY * 0.85);
        }

        ctx.drawImage(video, drawX, drawY, drawW, drawH);
        return canvas.toDataURL('image/jpeg', 0.90);
      };

      // Langkah A: Begitu data video pertama tersedia, tangkap frame awal instan sebagai proteksi
      video.onloadeddata = () => {
        updateDuration();
        try {
          if (video.videoWidth > 0 && !earlyCapturedFrame) {
            earlyCapturedFrame = renderGridFrame('top');
          }
        } catch {}
      };

      // Langkah B: Baca durasi asli segera setelah metadata header dimuat
      video.onloadedmetadata = () => {
        updateDuration();

        // Fix untuk browser Chromium pada video WhatsApp/WebM dengan duration Infinity
        if (!isFinite(video.duration) || video.duration === Infinity) {
          video.currentTime = Number.MAX_SAFE_INTEGER || 1e101;
          video.ontimeupdate = () => {
            video.ontimeupdate = null;
            const trueDur = Math.round(video.duration && isFinite(video.duration) ? video.duration : video.currentTime || 0);
            if (trueDur > 0) detectedDuration = trueDur;
            video.currentTime = 1.5;
          };
          return;
        }

        // Cari frame yang bagus untuk thumbnail (detik ke 1.5 - 2.5)
        const seekTime = Math.min(3, Math.max(0.5, (video.duration || 10) * 0.10));
        video.currentTime = seekTime;
      };

      // Langkah C: Tangkap frame gambar saat video sudah seek ke titik waktu
      video.onseeked = () => {
        updateDuration();
        try {
          const topFrame = renderGridFrame('top');
          const centerFrame = renderGridFrame('center');
          const bottomFrame = renderGridFrame('bottom');

          finish(topFrame, 640, 360, {
            top: topFrame,
            center: centerFrame,
            bottom: bottomFrame,
          });
          return;
        } catch {
          // fallback
        }
        if (earlyCapturedFrame) {
          finish(earlyCapturedFrame, 640, 360, {
            top: earlyCapturedFrame,
            center: earlyCapturedFrame,
            bottom: earlyCapturedFrame,
          });
          return;
        }
        finish('/images/logo.png');
      };

      video.onerror = () => {
        clearTimeout(timeout);
        if (earlyCapturedFrame) {
          finish(earlyCapturedFrame);
          return;
        }
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        URL.revokeObjectURL(tempUrl);
        reject(new Error('Gagal membaca format video. Pastikan file berupa .mp4, .webm, atau .mkv'));
      };

      // Kickstart Safari video pipeline
      try {
        video.load();
        const p = video.play();
        if (p !== undefined) {
          p.then(() => video.pause()).catch(() => {});
        }
      } catch {}
    });
  },

  // 5. Tangkap frame kustom pada detik tertentu dengan pengaturan zoom, shiftX, dan shiftY
  captureCustomFrame(
    file: File | string,
    timeSec: number,
    zoom = 1.0,
    shiftXPercent = 0, // -50% (kiri) sampai +50% (kanan)
    shiftYPercent = 0  // -50% (atas) sampai +50% (bawah)
  ): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.preload = 'auto';
      video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:10px;height:10px;opacity:0;pointer-events:none;z-index:-9999;';

      const isBlob = typeof file !== 'string';
      const tempUrl = isBlob ? URL.createObjectURL(file as File) : (file as string);
      video.src = tempUrl;

      if (typeof document !== 'undefined' && document.body) {
        document.body.appendChild(video);
      }

      let earlyFrame: string | null = null;

      const finish = (result: string) => {
        try {
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
        } catch {}
        if (isBlob) URL.revokeObjectURL(tempUrl);
        resolve(result);
      };

      const timer = setTimeout(() => {
        if (earlyFrame) {
          finish(earlyFrame);
        } else {
          finish('/images/logo.png');
        }
      }, 20000);

      video.onloadeddata = () => {
        try {
          if (video.videoWidth > 0 && !earlyFrame) {
            const c = document.createElement('canvas');
            c.width = 640;
            c.height = 360;
            const cx = c.getContext('2d');
            if (cx) {
              cx.drawImage(video, 0, 0, 640, 360);
              earlyFrame = c.toDataURL('image/jpeg', 0.90);
            }
          }
        } catch {}
      };

      video.onloadedmetadata = () => {
        const dur = video.duration && isFinite(video.duration) ? video.duration : 60;
        const targetTime = Math.min(Math.max(0.1, timeSec), dur);
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        clearTimeout(timer);
        try {
          const vW = video.videoWidth || 640;
          const vH = video.videoHeight || 360;
          const targetW = 640;
          const targetH = 360;

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            finish('/images/logo.png');
            return;
          }

          ctx.fillStyle = '#080808';
          ctx.fillRect(0, 0, targetW, targetH);

          // Skala dasar full cover dikali faktor zoom kustom
          const baseScale = Math.max(targetW / vW, targetH / vH);
          const finalScale = baseScale * Math.max(0.7, Math.min(2.5, zoom));

          const drawW = Math.round(vW * finalScale);
          const drawH = Math.round(vH * finalScale);

          // Hitung drawX dan drawY dengan pan offset
          const centerX = (targetW - drawW) / 2;
          const centerY = (targetH - drawH) / 2;

          const maxOffsetX = Math.max(0, (drawW - targetW) / 2);
          const maxOffsetY = Math.max(0, (drawH - targetH) / 2);

          const offsetX = (shiftXPercent / 50) * maxOffsetX;
          const offsetY = (shiftYPercent / 50) * maxOffsetY;

          const drawX = Math.round(centerX + offsetX);
          const drawY = Math.round(centerY + offsetY);

          ctx.drawImage(video, drawX, drawY, drawW, drawH);
          finish(canvas.toDataURL('image/jpeg', 0.92));
        } catch {
          finish('/images/logo.png');
        }
      };

      video.onerror = () => {
        clearTimeout(timer);
        finish('/images/logo.png');
      };

      try {
        video.load();
        const p = video.play();
        if (p !== undefined) {
          p.then(() => video.pause()).catch(() => {});
        }
      } catch {}
    });
  },

  // 6. Otomatis Deteksi Durasi dari URL Video / Stream
  detectUrlDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      if (!url || typeof document === 'undefined') {
        resolve(0);
        return;
      }
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      const timer = setTimeout(() => {
        video.src = '';
        resolve(0);
      }, 4000);

      video.onloadedmetadata = () => {
        clearTimeout(timer);
        const sec = Math.round(video.duration || 0);
        video.src = '';
        resolve(sec > 0 && isFinite(sec) ? sec : 0);
      };

      video.onerror = () => {
        clearTimeout(timer);
        resolve(0);
      };

      video.src = url;
    });
  },
};
