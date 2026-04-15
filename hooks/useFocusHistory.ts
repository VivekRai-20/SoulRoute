/**
 * hooks/useFocusHistory.ts
 *
 * Tracks completed Pomodoro/focus sessions persisted via AsyncStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import type { FocusSession } from '@/types';
import {
  getFocusSessions,
  appendFocusSession,
  getTodayFocusSessions,
} from '@/services/storage';

export interface UseFocusHistoryReturn {
  todaySessions: FocusSession[];
  allSessions: FocusSession[];
  todayMinutes: number;
  todayCount: number;
  saveSession: (session: FocusSession) => Promise<void>;
  loading: boolean;
}

export function useFocusHistory(): UseFocusHistoryReturn {
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([]);
  const [allSessions, setAllSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [all, today] = await Promise.all([
      getFocusSessions(),
      getTodayFocusSessions(),
    ]);
    setAllSessions(all);
    setTodaySessions(today);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSession = useCallback(async (session: FocusSession) => {
    await appendFocusSession(session);
    await load();
  }, [load]);

  const todayMinutes = todaySessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const todayCount = todaySessions.filter((s) => s.completed).length;

  return {
    todaySessions,
    allSessions,
    todayMinutes,
    todayCount,
    saveSession,
    loading,
  };
}
