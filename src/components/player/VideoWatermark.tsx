import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const POSITIONS = [
  'top-4 left-4',
  'top-4 right-4',
  'bottom-16 right-4',
  'bottom-16 left-4',
  'top-1/3 left-1/4',
  'bottom-1/3 right-1/4',
];

export function VideoWatermark() {
  const { deviceId, tier, discordAccount } = useAuth();
  const [posIndex, setPosIndex] = useState(0);
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleTimeString());

  // Periodically change position to prevent crop-out / delogo tools
  useEffect(() => {
    const interval = setInterval(() => {
      setPosIndex((prev) => (prev + 1) % POSITIONS.length);
      setTimestamp(new Date().toLocaleTimeString());
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`absolute ${POSITIONS[posIndex]} z-20 pointer-events-none select-none transition-all duration-1000 opacity-30 hover:opacity-10`}
    >
      <div className="font-mono text-[9px] sm:text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-[1px] border border-white/5 flex items-center gap-1.5 shadow-sm">
        <span className="font-bold text-amber-300/80">SN-PRIVATE</span>
        <span>•</span>
        <span>{deviceId}</span>
        {discordAccount && (
          <>
            <span>•</span>
            <span>@{discordAccount.username}</span>
          </>
        )}
        <span>•</span>
        <span className="uppercase text-brand/80 font-bold">{tier}</span>
        <span>•</span>
        <span>{timestamp}</span>
      </div>
    </div>
  );
}
