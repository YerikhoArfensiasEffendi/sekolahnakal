import { Outlet } from 'react-router-dom';

/**
 * Full-screen layout for video player.
 * No header, no footer — immersive viewing experience.
 */
export function PlayerLayout() {
  return (
    <div className="min-h-screen bg-black">
      <Outlet />
    </div>
  );
}
