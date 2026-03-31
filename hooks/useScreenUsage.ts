import { useState, useCallback } from 'react';
import { NativeModules } from 'react-native';
import type { UserStats } from '@/types';

const { DigitalWellbeing } = NativeModules;

export interface UseScreenUsageReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useScreenUsage(): UseScreenUsageReturn {
  const [stats, setStats] = useState<UserStats | null>(null);
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
        const newStats: UserStats = {
          date: new Date().toISOString(),
          totalScreenTimeMs: total,
          unlockCount: 0,
          notificationCount: 0,
          nightUsageMs: 0,
          dailyGoalMs: 3 * 3600000,
          fatigueScore: {
              score: 0,
              level: 'low',
              breakdown: { screenTimeFactor: 0, unlockFactor: 0, notificationFactor: 0, nightUsageFactor: 0 }
          }
        };
        setStats(newStats);
      } else {
        setStats(null);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load usage stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, refresh };
}
