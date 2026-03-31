import { useState, useCallback } from 'react';
import { NativeModules } from 'react-native';
import type { AppUsage, CategoryBreakdown } from '@/types';

const { DigitalWellbeing } = NativeModules;

function msToMinutes(ms: number) {
  return Math.round(ms / 60000);
}

export interface UseAppUsageReturn {
  apps: AppUsage[];
  categoryBreakdown: CategoryBreakdown[];
  totalScreenTimeMs: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAppUsage(): UseAppUsageReturn {
  const [apps, setApps] = useState<AppUsage[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [totalScreenTimeMs, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (DigitalWellbeing?.getUsageStats) {
        const raw: any[] = await DigitalWellbeing.getUsageStats();
        const filtered = raw
          .filter((s) => s.totalTimeInForeground > 0)
          .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);

        const total = filtered.reduce((acc, s) => acc + s.totalTimeInForeground, 0);

        const mapped: AppUsage[] = filtered.map((s) => ({
          packageName: s.packageName,
          appName: s.packageName.split('.').pop() ?? s.packageName,
          category: 'Other',
          totalTimeInForeground: s.totalTimeInForeground,
          percentage: total > 0 ? (s.totalTimeInForeground / total) * 100 : 0,
          iconColor: '#9AB0A8',
        }));

        setApps(mapped);
        setTotal(total);
        setCategoryBreakdown([]); // Central hook handles categorization
      } else {
        setApps([]);
        setCategoryBreakdown([]);
        setTotal(0);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load app usage');
      setApps([]);
      setCategoryBreakdown([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { apps, categoryBreakdown, totalScreenTimeMs, loading, error, refresh };
}
