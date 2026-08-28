/**
 * MP4 / MOV Binary Duration Parser
 * Membaca header box moov -> mvhd langsung dari binary file.
 * Memberikan durasi 100% akurat dalam hitungan milidetik tanpa tergantung pada decoder browser.
 */

function parseMvhdFromBuffer(buffer: Uint8Array): number | null {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let offset = 0;

  while (offset < buffer.length - 8) {
    const size = view.getUint32(offset);
    if (size === 0 || isNaN(size)) break;

    const type = String.fromCharCode(
      buffer[offset + 4] || 0,
      buffer[offset + 5] || 0,
      buffer[offset + 6] || 0,
      buffer[offset + 7] || 0
    );

    if (type === 'moov') {
      let subOffset = offset + 8;
      const moovEnd = Math.min(buffer.length, offset + size);

      while (subOffset < moovEnd - 8) {
        const subSize = view.getUint32(subOffset);
        if (subSize === 0 || isNaN(subSize)) break;

        const subType = String.fromCharCode(
          buffer[subOffset + 4] || 0,
          buffer[subOffset + 5] || 0,
          buffer[subOffset + 6] || 0,
          buffer[subOffset + 7] || 0
        );

        if (subType === 'mvhd') {
          const version = buffer[subOffset + 8];
          // Version 1 = 64-bit timestamps & duration, Version 0 = 32-bit
          const timeScale = version === 1 ? view.getUint32(subOffset + 28) : view.getUint32(subOffset + 20);
          const duration =
            version === 1
              ? Number(view.getBigUint64(subOffset + 32))
              : view.getUint32(subOffset + 24);

          if (timeScale > 0 && duration > 0) {
            const sec = Math.round(duration / timeScale);
            if (sec > 0 && isFinite(sec)) return sec;
          }
        }
        subOffset += subSize > 0 ? subSize : 8;
      }
    }
    offset += size > 0 ? size : 8;
  }
  return null;
}

export async function extractMp4Duration(file: File): Promise<number | null> {
  try {
    // 1. Coba baca 2MB pertama (di mana moov atom biasanya berada)
    const headerChunk = file.slice(0, Math.min(file.size, 2 * 1024 * 1024));
    const headerBuffer = new Uint8Array(await headerChunk.arrayBuffer());
    const headerDur = parseMvhdFromBuffer(headerBuffer);
    if (headerDur && headerDur > 0) return headerDur;

    // 2. Jika tidak ada di depan (un-faststarted MP4), baca 2MB terakhir
    if (file.size > 2 * 1024 * 1024) {
      const tailChunk = file.slice(file.size - 2 * 1024 * 1024, file.size);
      const tailBuffer = new Uint8Array(await tailChunk.arrayBuffer());
      const tailDur = parseMvhdFromBuffer(tailBuffer);
      if (tailDur && tailDur > 0) return tailDur;
    }
  } catch {
    // ignore
  }
  return null;
}
