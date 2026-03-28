import { useState, useCallback } from 'react';
import type { NotificationData } from '@/types';
import { mockNotifications } from '@/data/mockData';

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  totalCount: number;
  topApp: NotificationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>(mockNotifications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCount = notifications.reduce((acc, n) => acc + n.count, 0);
  const topApp = notifications.length > 0 ? notifications[0] : null;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Native notification listener integration would go here
      // For now, use mock data — ready for future native bridge
      await new Promise((r) => setTimeout(r, 300)); // simulate async
      setNotifications(mockNotifications);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications');
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  }, []);

  return { notifications, totalCount, topApp, loading, error, refresh };
}
