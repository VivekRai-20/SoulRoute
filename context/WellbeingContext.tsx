import React, { createContext, useContext, useCallback, useState } from 'react';
import type { UserStats, AppUsage, NotificationData, CategoryBreakdown, WeeklyTrend } from '@/types';
import { useDeviceStats, type PermissionState } from '@/hooks/useDeviceStats';
import { mockWeeklyTrend, mockInsights } from '@/data/mockData';

interface WellbeingContextValue {
  // User stats (real or mock)
  userStats: UserStats | null;
  apps: AppUsage[];
  categoryBreakdown: CategoryBreakdown[];
  notifications: NotificationData[];
  totalNotifications: number;
  weeklyTrend: WeeklyTrend[];
  nightUsage: { hour: string; minutes: number }[];

  // Loading / error
  loading: boolean;
  error: string | null;
  globalLoading: boolean;
  isUsingMockData: boolean;

  // Permissions
  permissions: PermissionState;
  openUsageSettings: () => void;
  openNotificationSettings: () => void;

  // Static enriched data
  todayInsight: string;

  // User preferences
  dailyGoalMs: number;
  setDailyGoalMs: (ms: number) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;

  // Refresh everything
  refreshAll: () => Promise<void>;
}

const WellbeingContext = createContext<WellbeingContextValue | null>(null);

export function WellbeingProvider({ children }: { children: React.ReactNode }) {
  const deviceStats = useDeviceStats();

  const [dailyGoalMs, setDailyGoalMs] = useState(3 * 3600000);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  const todayInsight = mockInsights[new Date().getDay() % mockInsights.length];

  const value: WellbeingContextValue = {
    userStats: deviceStats.userStats,
    apps: deviceStats.apps,
    categoryBreakdown: deviceStats.categoryBreakdown,
    notifications: deviceStats.notifications,
    totalNotifications: deviceStats.totalNotifications,
    weeklyTrend: deviceStats.weeklyTrend,
    nightUsage: deviceStats.nightUsage,

    loading: deviceStats.loading,
    error: deviceStats.error,
    globalLoading: deviceStats.loading,
    isUsingMockData: deviceStats.isUsingMockData,

    permissions: deviceStats.permissions,
    openUsageSettings: deviceStats.openUsageSettings,
    openNotificationSettings: deviceStats.openNotificationSettings,

    todayInsight,

    dailyGoalMs,
    setDailyGoalMs,
    notificationsEnabled,
    setNotificationsEnabled,
    focusMode,
    setFocusMode,

    refreshAll: deviceStats.refresh,
  };

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
