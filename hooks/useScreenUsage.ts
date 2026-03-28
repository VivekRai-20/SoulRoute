import { useState, useCallback } from 'react';
import { NativeModules } from 'react-native';
import type { UserStats } from '@/types';
import { mockUserStats } from '@/data/mockData';

const { DigitalWellbeing } = NativeModules;

export interface UseScreenUsageReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useScreenUsage(): UseScreenUsageReturn {
  const [stats, setStats] = useState<UserStats | null>(mockUserStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (DigitalWellbeing?.getUsageStats) {
        const raw = await DigitalWellbeing.getUsageStats();
        const total = raw.reduce(
          (acc: number, s: any) => acc + (s.totalTimeInForeground || 0),
          0
        );
        // Build a basic UserStats from native data
        setStats({
          ...mockUserStats,
          date: new Date().toISOString(),
          totalScreenTimeMs: total,
        });
      } else {
        // fallback to mock data
        setStats(mockUserStats);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load usage stats');
      setStats(mockUserStats); // safe fallback
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, refresh };
}
