import { useState, useCallback } from 'react';
import type { NotificationData } from '@/types';

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  totalCount: number;
  topApp: NotificationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCount = notifications.reduce((acc, n) => acc + n.count, 0);
  const topApp = notifications.length > 0 ? notifications[0] : null;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Logic for real notification stats will be handled by the central useDeviceStats hook
      // This hook can be refactored to consume context or remain empty/placeholder
      setNotifications([]);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { notifications, totalCount, topApp, loading, error, refresh };
}
