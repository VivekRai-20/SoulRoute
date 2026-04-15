/**
 * services/storage.ts
 *
 * Typed AsyncStorage wrapper for all persisted SoulRoute data.
 * All keys are namespaced under 'soulroute:' to avoid collisions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MoodLogEntry, FocusSession, StreakData, OnboardingState } from '@/types';

const KEY = {
  ONBOARDING: 'soulroute:onboarding',
  DAILY_GOAL: 'soulroute:daily_goal_ms',
  USER_NAME: 'soulroute:user_name',
  STREAK: 'soulroute:streak',
  MOOD_LOG: 'soulroute:mood_log',
  FOCUS_SESSIONS: 'soulroute:focus_sessions',
  DISMISSED_RECS: 'soulroute:dismissed_recommendations',
  WIND_DOWN_CHALLENGE: 'soulroute:wind_down_challenge',
  BEDTIME: 'soulroute:bedtime',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail — never crash the UI due to storage issues
  }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

const DEFAULT_ONBOARDING: OnboardingState = {
  complete: false,
  startDate: null,
  permissionsGranted: false,
};

export async function getOnboarding(): Promise<OnboardingState> {
  return getJSON(KEY.ONBOARDING, DEFAULT_ONBOARDING);
}

export async function saveOnboarding(state: OnboardingState): Promise<void> {
  return setJSON(KEY.ONBOARDING, state);
}

export async function setOnboardingComplete(): Promise<void> {
  const current = await getOnboarding();
  return saveOnboarding({
    ...current,
    complete: true,
    startDate: current.startDate ?? new Date().toISOString(),
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserName(): Promise<string> {
  return getJSON(KEY.USER_NAME, 'Friend');
}

export async function saveUserName(name: string): Promise<void> {
  return setJSON(KEY.USER_NAME, name);
}

export async function getDailyGoalMs(): Promise<number> {
  return getJSON(KEY.DAILY_GOAL, 3 * 3600000); // default 3h
}

export async function saveDailyGoalMs(ms: number): Promise<void> {
  return setJSON(KEY.DAILY_GOAL, ms);
}

export async function getBedtime(): Promise<string> {
  return getJSON(KEY.BEDTIME, '10:30 PM');
}

export async function saveBedtime(time: string): Promise<void> {
  return setJSON(KEY.BEDTIME, time);
}

// ─── Streak ───────────────────────────────────────────────────────────────────

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalXP: 0,
};

export async function getStreak(): Promise<StreakData> {
  return getJSON(KEY.STREAK, DEFAULT_STREAK);
}

export async function saveStreak(data: StreakData): Promise<void> {
  return setJSON(KEY.STREAK, data);
}

/**
 * Called once per day when the user opens the app.
 * Returns the updated streak.
 */
export async function tickStreak(): Promise<StreakData> {
  const data = await getStreak();
  const today = new Date().toDateString();

  if (data.lastActiveDate === today) {
    // Already ticked today
    return data;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = data.lastActiveDate === yesterday.toDateString();

  const newStreak = isConsecutive ? data.currentStreak + 1 : 1;
  const updated: StreakData = {
    currentStreak: newStreak,
    longestStreak: Math.max(data.longestStreak, newStreak),
    lastActiveDate: today,
    totalXP: data.totalXP + 10,
  };
  await saveStreak(updated);
  return updated;
}

// ─── Mood Log ─────────────────────────────────────────────────────────────────

export async function getMoodLog(): Promise<MoodLogEntry[]> {
  return getJSON(KEY.MOOD_LOG, []);
}

export async function appendMoodEntry(entry: MoodLogEntry): Promise<MoodLogEntry[]> {
  const log = await getMoodLog();
  // Remove today's entry if already exists, then append new one
  const today = new Date().toDateString();
  const filtered = log.filter((e) => new Date(e.date).toDateString() !== today);
  // Keep only last 30 days
  const trimmed = [...filtered, entry].slice(-30);
  await setJSON(KEY.MOOD_LOG, trimmed);
  return trimmed;
}

export async function getRecentMoodLog(days = 7): Promise<MoodLogEntry[]> {
  const log = await getMoodLog();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return log.filter((e) => new Date(e.date) >= cutoff);
}

// ─── Focus Sessions ───────────────────────────────────────────────────────────

export async function getFocusSessions(): Promise<FocusSession[]> {
  return getJSON(KEY.FOCUS_SESSIONS, []);
}

export async function appendFocusSession(session: FocusSession): Promise<FocusSession[]> {
  const sessions = await getFocusSessions();
  const updated = [...sessions, session].slice(-100); // keep last 100
  await setJSON(KEY.FOCUS_SESSIONS, updated);
  return updated;
}

export async function getTodayFocusSessions(): Promise<FocusSession[]> {
  const sessions = await getFocusSessions();
  const today = new Date().toDateString();
  return sessions.filter((s) => new Date(s.startTime).toDateString() === today);
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export async function getDismissedRecommendations(): Promise<string[]> {
  return getJSON(KEY.DISMISSED_RECS, []);
}

export async function dismissRecommendation(id: string): Promise<void> {
  const current = await getDismissedRecommendations();
  if (!current.includes(id)) {
    await setJSON(KEY.DISMISSED_RECS, [...current, id]);
  }
}

export async function clearDismissedRecommendations(): Promise<void> {
  await setJSON(KEY.DISMISSED_RECS, []);
}

// ─── Wind-down Challenge ──────────────────────────────────────────────────────

interface WindDownChallenge {
  date: string;
  accepted: boolean;
}

export async function getWindDownChallenge(): Promise<WindDownChallenge | null> {
  return getJSON(KEY.WIND_DOWN_CHALLENGE, null);
}

export async function acceptWindDownChallenge(): Promise<void> {
  const today = new Date().toDateString();
  await setJSON(KEY.WIND_DOWN_CHALLENGE, { date: today, accepted: true });
}

export async function isTodayWindDownAccepted(): Promise<boolean> {
  const challenge = await getWindDownChallenge();
  if (!challenge) return false;
  return challenge.accepted && challenge.date === new Date().toDateString();
}

// ─── Nuke everything (user-facing "delete data") ─────────────────────────────

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEY));
}
