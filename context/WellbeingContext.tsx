import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  UserStats, AppUsage, NotificationData, CategoryBreakdown,
  WeeklyTrend, Recommendation, MoodLogEntry, FocusSession, StreakData,
} from '@/types';
import { useDeviceStats, type PermissionState } from '@/hooks/useDeviceStats';
import { useStreak } from '@/hooks/useStreak';
import { useMoodLog } from '@/hooks/useMoodLog';
import { useFocusHistory } from '@/hooks/useFocusHistory';
import { useOnboarding } from '@/hooks/useOnboarding';
import { generateRecommendations } from '@/services/recommendations';
import { computeFatigueScore } from '@/services/deviceStats';
import {
  getDailyGoalMs,
  saveDailyGoalMs,
  getDismissedRecommendations,
  dismissRecommendation as storageDismiss,
} from '@/services/storage';
import type { Mood } from '@/types';

interface WellbeingContextValue {
  // ── Device data ──────────────────────────────────────────────────────────
  userStats: UserStats | null;
  apps: AppUsage[];
  categoryBreakdown: CategoryBreakdown[];
  notifications: NotificationData[];
  totalNotifications: number;
  weeklyTrend: WeeklyTrend[];
  nightUsage: { hour: string; minutes: number }[];
  notificationDebug: any;

  // ── Loading / error ───────────────────────────────────────────────────────
  loading: boolean;
  error: string | null;
  globalLoading: boolean;
  isUsingMockData: boolean;

  // ── Permissions ───────────────────────────────────────────────────────────
  permissions: PermissionState;
  openUsageSettings: () => void;
  openNotificationSettings: () => void;
  openOverlaySettings: () => void;
  isNotificationServiceActive: boolean;

  // ── Insights ──────────────────────────────────────────────────────────────
  todayInsight: string;
  recommendations: Recommendation[];
  dismissRecommendation: (id: string) => Promise<void>;

  // ── User preferences ──────────────────────────────────────────────────────
  dailyGoalMs: number;
  setDailyGoalMs: (ms: number) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;

  // ── Gamification ──────────────────────────────────────────────────────────
  streak: StreakData;
  addXP: (amount: number) => Promise<void>;

  // ── Mood ──────────────────────────────────────────────────────────────────
  recentMoodLog: MoodLogEntry[];
  todayMood: MoodLogEntry | null;
  logMood: (value: Mood) => Promise<void>;

  // ── Focus history ─────────────────────────────────────────────────────────
  todayFocusSessions: FocusSession[];
  todayFocusMinutes: number;
  todayFocusCount: number;
  saveSession: (s: FocusSession) => Promise<void>;

  // ── Onboarding & identity ─────────────────────────────────────────────────
  userName: string;
  setUserName: (name: string) => Promise<void>;
  isOnboardingComplete: boolean;
  isInBaselinePhase: boolean;
  baselineDaysElapsed: number | null;
  finishOnboarding: (name: string, goalMs: number) => Promise<void>;

  // ── Refresh & Advanced ───────────────────────────────────────────────────
  refreshAll: () => Promise<void>;
  allApps: { packageName: string; appName: string }[];
  fetchAllApps: () => Promise<{ packageName: string; appName: string }[]>;
}

const WellbeingContext = createContext<WellbeingContextValue | null>(null);

const INSIGHTS = [
  'Monitor your screen time to improve focus.',
  'Taking short breaks can boost productivity.',
  'Consistent sleep schedules improve wellbeing.',
  'Reducing evening phone use helps you sleep better.',
  'Focus mode can help you enter a flow state.',
  'Small changes in digital habits lead to big results.',
  'Review your weekly trend to see your progress.',
];

export function WellbeingProvider({ children }: { children: React.ReactNode }) {
  const device = useDeviceStats();
  const { streak, addXP } = useStreak();
  const { recentLog, todayMood, logMood } = useMoodLog();
  const { todaySessions, todayMinutes, todayCount, saveSession } = useFocusHistory();
  const {
    onboarding, userName, baselineDaysElapsed, isInBaselinePhase,
    finishOnboarding, setName,
  } = useOnboarding();

  const [dailyGoalMs, setDailyGoalMsState] = useState(3 * 3600000);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load persisted goal + dismissed recs on mount
  useEffect(() => {
    (async () => {
      const [goal, dismissed] = await Promise.all([
        getDailyGoalMs(),
        getDismissedRecommendations(),
      ]);
      setDailyGoalMsState(goal);
      setDismissedIds(dismissed);
    })();
  }, []);

  const setDailyGoalMs = useCallback((ms: number) => {
    setDailyGoalMsState(ms);
    saveDailyGoalMs(ms);
  }, []);

  const dismissRecommendation = useCallback(async (id: string) => {
    await storageDismiss(id);
    setDismissedIds((prev) => [...prev, id]);
  }, []);

  // Compute Fatigue Score with current goal
  const computedStats = useMemo(() => {
    if (!device.userStats) return null;
    const scoreData = computeFatigueScore(
      device.userStats.totalScreenTimeMs,
      device.userStats.unlockCount,
      device.userStats.notificationCount,
      device.userStats.nightUsageMs,
      dailyGoalMs
    );
    return { ...device.userStats, fatigueScore: scoreData, dailyGoalMs };
  }, [device.userStats, dailyGoalMs]);

  const recommendations = useMemo(
    () =>
      generateRecommendations(
        computedStats,
        device.weeklyTrend,
        device.categoryBreakdown,
        dismissedIds
      ),
    [computedStats, device.weeklyTrend, device.categoryBreakdown, dismissedIds]
  );

  const todayInsight = useMemo(() => INSIGHTS[new Date().getDay() % INSIGHTS.length], []);

  // Final memoized value to prevent unnecessary re-renders of the entire app
  const value = useMemo<WellbeingContextValue>(() => ({
    userStats: computedStats,
    apps: device.apps,
    categoryBreakdown: device.categoryBreakdown,
    notifications: device.notifications,
    totalNotifications: device.totalNotifications,
    weeklyTrend: device.weeklyTrend,
    nightUsage: device.nightUsage,
    notificationDebug: device.notificationDebug,

    loading: device.loading,
    error: device.error,
    globalLoading: device.loading,
    isUsingMockData: device.isUsingMockData,

    permissions: device.permissions,
    openUsageSettings: device.openUsageSettings,
    openNotificationSettings: device.openNotificationSettings,
    openOverlaySettings: device.openOverlaySettings,
    isNotificationServiceActive: device.isNotificationServiceActive,

    todayInsight,
    recommendations,
    dismissRecommendation,

    dailyGoalMs,
    setDailyGoalMs,
    notificationsEnabled,
    setNotificationsEnabled,
    focusMode,
    setFocusMode,

    streak,
    addXP,

    recentMoodLog: recentLog,
    todayMood,
    logMood,

    todayFocusSessions: todaySessions,
    todayFocusMinutes: todayMinutes,
    todayFocusCount: todayCount,
    saveSession,

    userName,
    setUserName: setName,
    isOnboardingComplete: onboarding.complete,
    isInBaselinePhase,
    baselineDaysElapsed,
    finishOnboarding,

    refreshAll: device.refresh,
    allApps: device.allApps,
    fetchAllApps: device.fetchAllApps,
  }), [
    computedStats, device, todayInsight, recommendations, 
    dismissRecommendation, dailyGoalMs, setDailyGoalMs, notificationsEnabled, 
    focusMode, streak, addXP, recentLog, todayMood, logMood, 
    todaySessions, todayMinutes, todayCount, saveSession, 
    userName, setName, onboarding.complete, isInBaselinePhase, 
    baselineDaysElapsed, finishOnboarding
  ]);

  return (
    <WellbeingContext.Provider value={value}>
      {children}
    </WellbeingContext.Provider>
  );
}

export function useWellbeing(): WellbeingContextValue {
  const ctx = useContext(WellbeingContext);
  if (!ctx) throw new Error('useWellbeing must be used inside <WellbeingProvider>');
  return ctx;
}
