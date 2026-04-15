/**
 * hooks/useMoodLog.ts
 *
 * Reads and writes the 7-day mood log from AsyncStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import type { MoodLogEntry, Mood } from '@/types';
import { getMoodLog, appendMoodEntry, getRecentMoodLog } from '@/services/storage';

const MOOD_META: Record<Mood, { label: string; color: string; emoji: string }> = {
  1: { label: 'Exhausted', color: '#E74C3C', emoji: '😫' },
  2: { label: 'Low',       color: '#F39C12', emoji: '😞' },
  3: { label: 'Neutral',   color: '#3498DB', emoji: '😐' },
  4: { label: 'Good',      color: '#2ECC71', emoji: '🙂' },
  5: { label: 'Great',     color: '#27AE60', emoji: '😊' },
};

export { MOOD_META };

export interface UseMoodLogReturn {
  recentLog: MoodLogEntry[];        // last 7 days
  todayMood: MoodLogEntry | null;
  logMood: (value: Mood) => Promise<void>;
  loading: boolean;
}

function getTodayEntry(log: MoodLogEntry[]): MoodLogEntry | null {
  const today = new Date().toDateString();
  return log.find((e) => new Date(e.date).toDateString() === today) ?? null;
}

export function useMoodLog(): UseMoodLogReturn {
  const [recentLog, setRecentLog] = useState<MoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const log = await getRecentMoodLog(7);
      setRecentLog(log);
      setLoading(false);
    })();
  }, []);

  const logMood = useCallback(async (value: Mood) => {
    const meta = MOOD_META[value];
    const entry: MoodLogEntry = {
      date: new Date().toISOString(),
      value,
      label: meta.label,
    };
    const updated = await appendMoodEntry(entry);
    // Refresh to last 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    setRecentLog(updated.filter((e) => new Date(e.date) >= cutoff));
  }, []);

  const todayMood = getTodayEntry(recentLog);

  return { recentLog, todayMood, logMood, loading };
}
