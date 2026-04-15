/**
 * hooks/useStreak.ts
 *
 * Manages the user's daily streak — loaded from AsyncStorage,
 * automatically ticked on mount once per day.
 */

import { useState, useEffect, useCallback } from 'react';
import type { StreakData } from '@/types';
import { getStreak, tickStreak, saveStreak } from '@/services/storage';

export interface UseStreakReturn {
  streak: StreakData;
  addXP: (amount: number) => Promise<void>;
  loading: boolean;
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalXP: 0,
};

// Badge milestones
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export function getMilestoneBadge(streak: number): string | null {
  if (streak >= 100) return '💎 Diamond';
  if (streak >= 60) return '🏆 Platinum';
  if (streak >= 30) return '🥇 Gold';
  if (streak >= 14) return '🥈 Silver';
  if (streak >= 7) return '🔥 Weekly';
  if (streak >= 3) return '⚡ Starter';
  return null;
}

export function useStreak(): UseStreakReturn {
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const updated = await tickStreak(); // safe to call multiple times per day
      setStreak(updated);
      setLoading(false);
    })();
  }, []);

  const addXP = useCallback(async (amount: number) => {
    const current = await getStreak();
    const updated = { ...current, totalXP: current.totalXP + amount };
    await saveStreak(updated);
    setStreak(updated);
  }, []);

  return { streak, addXP, loading };
}
