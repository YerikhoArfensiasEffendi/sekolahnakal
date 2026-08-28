/**
 * Sekolah Nakal Private DRM & Anti-Capture Engine
 * 
 * Proteksi:
 * 1. Menghalangi Perekaman Layar (Screen Recording / Tab Sharing API)
 * 2. Menghalangi Screenshot via Keyboard (PrintScreen, Cmd+Shift+3/4/5, Ctrl+Shift+S)
 * 3. Menghalangi Inspeksi & Ekstraksi Link (F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S)
 * 4. Menonaktifkan Klik Kanan (Context Menu) pada Video Player
 */

export function initScreenCaptureDetection(
  onScreenCaptureDetected: (detected: boolean) => void
): () => void {
  // 1. Intercept navigator.mediaDevices.getDisplayMedia (Screen Recorder / Browser Tab Capture)
  let originalGetDisplayMedia: any = null;
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = async function (constraints) {
      onScreenCaptureDetected(true);
      if (originalGetDisplayMedia) {
        try {
          const stream = await originalGetDisplayMedia(constraints);
          stream.getVideoTracks().forEach((track: MediaStreamTrack) => {
            track.onended = () => onScreenCaptureDetected(false);
          });
          return stream;
        } catch (err) {
          onScreenCaptureDetected(false);
          throw err;
        }
      }
      return new MediaStream();
    };
  }

  // 2. Blokir Tombol Keyboard Screenshot & DevTools
  const handleKeyDetection = (e: KeyboardEvent) => {
    // PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      onScreenCaptureDetected(true);
      return false;
    }

    // Mac Screenshot: Cmd + Shift + 3 / 4 / 5
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && ['3', '4', '5', 's', 'S', 'i', 'I', 'c', 'C', 'j', 'J'].includes(e.key)) {
      e.preventDefault();
      onScreenCaptureDetected(true);
      return false;
    }

    // Windows / Linux DevTools / Save / Print / View Source
    if (
      e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && ['u', 'U', 's', 'S', 'p', 'P'].includes(e.key))
    ) {
      e.preventDefault();
      return false;
    }
  };

  // 3. Blokir Klik Kanan pada player
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && (target.closest('.artplayer-app') || target.tagName === 'VIDEO')) {
      e.preventDefault();
      return false;
    }
  };

  window.addEventListener('keydown', handleKeyDetection, { capture: true });
  window.addEventListener('contextmenu', handleContextMenu, { capture: true });

  return () => {
    if (originalGetDisplayMedia && navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
    }
    window.removeEventListener('keydown', handleKeyDetection, { capture: true });
    window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
  };
}
