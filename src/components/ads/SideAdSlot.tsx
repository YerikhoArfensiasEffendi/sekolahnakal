import { useState, useEffect } from 'react';
import { adStore, type AdSlotConfig } from '@/services/adStore.service';

interface SideAdSlotProps {
  position: 'left' | 'right';
}

export function SideAdSlot({ position }: SideAdSlotProps) {
  const [slots, setSlots] = useState<AdSlotConfig[]>(() =>
    adStore.getActiveSlotsByPosition(position)
  );

  useEffect(() => {
    const updateSlots = () => {
      setSlots(adStore.getActiveSlotsByPosition(position));
    };

    window.addEventListener('sekolah_nakal_ads_updated', updateSlots);
    window.addEventListener('storage', updateSlots);
    return () => {
      window.removeEventListener('sekolah_nakal_ads_updated', updateSlots);
      window.removeEventListener('storage', updateSlots);
    };
  }, [position]);

  if (slots.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label={`Banner Iklan Sisi ${position === 'left' ? 'Kiri' : 'Kanan'}`}
      className="hidden 2xl:flex flex-col gap-6 w-36 2xl:w-40 shrink-0 select-none pt-4"
    >
      {slots.map((slot) => {
        if (slot.type === 'embed' && slot.embedCode.trim()) {
          return (
            <div
              key={slot.id}
              className="w-full min-h-[600px] bg-[#121212] border border-zinc-800 rounded-md overflow-hidden flex items-center justify-center shadow-lg"
              dangerouslySetInnerHTML={{ __html: slot.embedCode }}
            />
          );
        }

        // Tipe Gambar / GIF
        if (slot.mediaUrl.trim()) {
          return (
            <a
              key={slot.id}
              href={slot.targetUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-full h-[600px] rounded-md overflow-hidden border border-zinc-800 bg-black shadow-lg transition-transform hover:scale-[1.01]"
              title={slot.altText || slot.label}
            >
              <img
                src={slot.mediaUrl}
                alt={slot.altText || 'Banner Iklan'}
                className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                loading="lazy"
              />
            </a>
          );
        }

        // Placeholder default jika belum diisi media
        return (
          <a
            key={slot.id}
            href={slot.targetUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-[600px] bg-white border border-gray-300 shadow-lg flex flex-col items-center justify-center text-center p-3 rounded-md transition-opacity hover:opacity-95"
            title={slot.altText || slot.label}
          >
            <span className="text-xs font-black tracking-widest text-black uppercase">
              BANNER ADS
            </span>
            <span className="text-[10px] font-mono font-bold text-gray-500 mt-1">
              160 x 600
            </span>
          </a>
        );
      })}
    </aside>
  );
}
