import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'discord_sync' | 'new_upload' | 'system';
  timestamp: string;
  link?: string;
  isRead: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isSubscribed: boolean;
  activePopup: AppNotification | null;
  toggleSubscribe: () => void;
  markAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  dismissActivePopup: () => void;
  triggerNewUploadNotification: (movieTitle?: string, movieId?: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY_NOTIFS = 'sekolah_nakal_notifications';
const STORAGE_KEY_SUBSCRIBED = 'sekolah_nakal_subscribed';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { discordAccount } = useAuth();

  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SUBSCRIBED) === 'true';
    } catch {
      return false;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean legacy fake/dummy notifications
          return parsed.filter(
            (n) =>
              !n.message?.includes('Archive Special Cut') &&
              n.link !== '/watch/16' &&
              n.link !== '/watch/17'
          );
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [activePopup, setActivePopup] = useState<AppNotification | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, String(isSubscribed));
    } catch {
      // ignore
    }
  }, [isSubscribed]);

  // When discord is connected, automatically clear any legacy discord sync notification
  useEffect(() => {
    if (discordAccount) {
      setNotifications((prev) => prev.filter((n) => n.type !== 'discord_sync'));
      if (activePopup?.type === 'discord_sync') {
        setActivePopup(null);
      }
    }
  }, [discordAccount, activePopup]);

  // Listen for real video publish events from Studio
  useEffect(() => {
    const handleRealUpload = (e: Event) => {
      const custom = e as CustomEvent<{ title?: string; id?: string }>;
      if (custom.detail?.title && custom.detail?.id) {
        triggerNewUploadNotification(custom.detail.title, custom.detail.id);
      }
    };
    window.addEventListener('sekolah_nakal_video_published', handleRealUpload);
    return () => window.removeEventListener('sekolah_nakal_video_published', handleRealUpload);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (activePopup?.id === id) {
      setActivePopup(null);
    }
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activePopup?.id === id) {
      setActivePopup(null);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setActivePopup(null);
  };

  const dismissActivePopup = () => {
    setActivePopup(null);
  };

  const triggerNewUploadNotification = (movieTitle?: string, movieId?: string) => {
    if (!movieTitle || !movieId) return;
    const newNotif: AppNotification = {
      id: `upload-${Date.now()}`,
      title: '🎬 Video Baru Dirilis!',
      message: `"${movieTitle}" baru saja dirilis di Sekolah Nakal. Klik untuk menonton langsung.`,
      type: 'new_upload',
      timestamp: 'Baru saja',
      link: `/watch/${movieId}`,
      isRead: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActivePopup(newNotif);
  };

  const toggleSubscribe = () => {
    const nextState = !isSubscribed;
    setIsSubscribed(nextState);

    if (nextState) {
      // Real subscription confirmation notification (No fake mock video)
      const subNotif: AppNotification = {
        id: `sub-${Date.now()}`,
        title: '🔔 Langganan Notifikasi Aktif',
        message: 'Anda akan menerima pemberitahuan setiap kali ada video baru yang dirilis oleh kreator resmi.',
        type: 'system',
        timestamp: 'Baru saja',
        isRead: false,
      };
      setNotifications((prev) => [subNotif, ...prev.filter((n) => !n.message?.includes('Archive Special Cut'))]);
      setActivePopup(subNotif);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isSubscribed,
        activePopup,
        toggleSubscribe,
        markAsRead,
        clearNotification,
        clearAll,
        dismissActivePopup,
        triggerNewUploadNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
