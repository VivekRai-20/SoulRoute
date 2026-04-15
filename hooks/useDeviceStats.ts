/**
 * hooks/useDeviceStats.ts
 *
 * Unified hook that:
 * 1. Checks usage + notification permissions on mount
 * 2. Fetches all real device data when permissions are granted
 * 3. Atomic state updates via useReducer to prevent redundant re-renders
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppUsage, NotificationData, UserStats, WeeklyTrend, CategoryBreakdown } from '@/types';
import {
  hasUsagePermission,
  hasNotificationPermission,
  getAppUsageStats,
  getTotalScreenTime,
  getDeviceUnlocks,
  getNightUsage,
  getNightUsageHourly,
  getNotificationCounts,
  getWeeklyTrend,
  getWeeklyNotificationStats,
  openUsageAccessSettings,
  openNotificationListenerSettings,
  isNotificationServiceRunning,
  getOverlayPermissionState,
  openOverlaySettings as openOverlaySettingsSvc,
  getAllApps,
  getNotificationDebugInfo,
  requestRebind,
} from '@/services/deviceStats';

// ─── Constants & Utils ────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  'com.instagram.android': 'Social',
  'com.twitter.android': 'Social',
  'com.facebook.katana': 'Social',
  'com.whatsapp': 'Communication',
  'com.google.android.youtube': 'Entertainment',
  'com.google.android.gm': 'Productivity',
};

const ICON_COLORS: Record<string, string> = {
  'Social': '#E1306C',
  'Entertainment': '#FF0000',
  'Communication': '#25D366',
  'Productivity': '#4285F4',
  'Other': '#9AB0A8',
};

function classifyApp(packageName: string): { category: string; iconColor: string } {
  const category = CATEGORY_MAP[packageName] ?? 'Other';
  const iconColor = ICON_COLORS[category] ?? '#9AB0A8';
  return { category, iconColor };
}

function buildCategoryBreakdown(apps: AppUsage[]): CategoryBreakdown[] {
  const totalMs = apps.reduce((sum, a) => sum + a.totalTimeInForeground, 0);
  const map: Record<string, number> = {};
  for (const app of apps) {
    map[app.category] = (map[app.category] ?? 0) + app.totalTimeInForeground;
  }
  const CAT_COLORS: Record<string, string> = {
    'Social': '#FF6B9D',
    'Entertainment': '#A78BFA',
    'Communication': '#34D399',
    'Productivity': '#60A5FA',
    'Other': '#94A3B8',
  };
  return Object.entries(map)
    .map(([category, totalTimeMs]) => ({
      category: category as any,
      totalTimeMs,
      percentage: totalMs > 0 ? (totalTimeMs / totalMs) * 100 : 0,
      color: CAT_COLORS[category] ?? '#94A3B8',
    }))
    .sort((a, b) => b.totalTimeMs - a.totalTimeMs);
}

// ─── Types & Reducer ──────────────────────────────────────────────────────────

interface State {
  permissions: {
    usageAccess: boolean;
    notificationAccess: boolean;
    overlayAccess: boolean;
    checked: boolean;
  };
  userStats: UserStats | null;
  apps: AppUsage[];
  categoryBreakdown: CategoryBreakdown[];
  notifications: NotificationData[];
  totalNotifications: number;
  weeklyTrend: WeeklyTrend[];
  nightUsage: { hour: string; minutes: number }[];
  allApps: { packageName: string; appName: string }[];
  loading: boolean;
  error: string | null;
  isUsingMockData: boolean;
  isServiceActive: boolean;
  notificationDebug: any;
}

type Action =
  | { type: 'SET_PERMISSIONS'; payload: Partial<State['permissions']> }
  | { type: 'SET_DATA'; payload: Partial<State> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: State = {
  permissions: { usageAccess: false, notificationAccess: false, overlayAccess: false, checked: false },
  userStats: null,
  apps: [],
  categoryBreakdown: [],
  notifications: [],
  totalNotifications: 0,
  weeklyTrend: [],
  nightUsage: [],
  allApps: [],
  loading: true,
  error: null,
  isUsingMockData: true,
  isServiceActive: false,
  notificationDebug: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PERMISSIONS':
      return { ...state, permissions: { ...state.permissions, ...action.payload } };
    case 'SET_DATA':
      return { ...state, ...action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDeviceStats() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const appStateRef = useRef(AppState.currentState);

  const fetchRealData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [
        rawApps, screenMs, unlocks, nightMs, rawNotifs,
        rawTrend, rawWeeklyNotifs, rawService, rawNightHourly, rawNotifDebug
      ] = await Promise.all([
        getAppUsageStats(),
        getTotalScreenTime(),
        getDeviceUnlocks(),
        getNightUsage(),
        getNotificationCounts().catch(() => []),
        getWeeklyTrend().catch(() => []),
        getWeeklyNotificationStats().catch(() => []),
        isNotificationServiceRunning().catch(() => false),
        getNightUsageHourly().catch(() => []),
        getNotificationDebugInfo().catch(() => null),
      ]);

      // Nudge notification service if permission is granted but it's not active
      const hasPerm = await hasNotificationPermission();
      if (hasPerm && !rawService) {
        requestRebind();
      }

      // Transform data
      const totalMs = rawApps.reduce((s, a) => s + a.totalTimeInForeground, 0);
      const mappedApps: AppUsage[] = rawApps.map((a) => {
        const { category, iconColor } = classifyApp(a.packageName);
        return {
          packageName: a.packageName,
          appName: a.appName ?? a.packageName.split('.').pop() ?? a.packageName,
          category: category as any,
          totalTimeInForeground: a.totalTimeInForeground,
          percentage: totalMs > 0 ? (a.totalTimeInForeground / totalMs) * 100 : 0,
          iconColor,
        };
      });

      const totalNotifCount = rawNotifs.reduce((s, n) => s + n.count, 0);
      const mappedNotifs: NotificationData[] = rawNotifs.slice(0, 10).map((n) => ({
        appName: n.appName ?? n.packageName.split('.').pop() ?? n.packageName,
        packageName: n.packageName,
        count: n.count,
        lastReceivedAt: new Date().toISOString(),
        category: (classifyApp(n.packageName).category as any),
      }));

      // Merge trend
      const trend: WeeklyTrend[] = rawTrend.map((t) => {
        const notif = rawWeeklyNotifs.find((n) => n.date === t.date);
        return { ...t, notificationCount: notif ? notif.count : 0 };
      });

      // Calculate total night usage from hourly breakdown to ensure consistency
      const totalNightMs = rawNightHourly.reduce((acc, curr) => acc + (curr.minutes * 60000), 0);

      dispatch({
        type: 'SET_DATA',
        payload: {
          apps: mappedApps,
          categoryBreakdown: buildCategoryBreakdown(mappedApps),
          notifications: mappedNotifs,
          totalNotifications: totalNotifCount,
          weeklyTrend: trend,
          nightUsage: rawNightHourly,
          userStats: {
            date: new Date().toISOString(),
            totalScreenTimeMs: screenMs,
            unlockCount: unlocks,
            notificationCount: totalNotifCount,
            nightUsageMs: totalNightMs,
            dailyGoalMs: 3 * 3600000,
            fatigueScore: { 
              score: 0, 
              level: 'low' as const,
              breakdown: { screenTimeFactor: 0, unlockFactor: 0, notificationFactor: 0, nightUsageFactor: 0 }
            },
          },
          isServiceActive: rawService,
          isUsingMockData: false,
          notificationDebug: rawNotifDebug,
        }
      });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e?.message ?? 'Fetch failed' });
    }
  }, []);

  const refresh = useCallback(async () => {
    const [usage, notification, overlay] = await Promise.all([
      hasUsagePermission(),
      hasNotificationPermission(),
      getOverlayPermissionState(),
    ]);
    dispatch({ type: 'SET_PERMISSIONS', payload: { usageAccess: usage, notificationAccess: notification, overlayAccess: overlay, checked: true } });
    if (usage) await fetchRealData();
    else dispatch({ type: 'SET_DATA', payload: { isUsingMockData: true } });
  }, [fetchRealData]);

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (appStateRef.current.match(/inactive|background/) && s === 'active') refresh();
      appStateRef.current = s;
    });
    return () => sub.remove();
  }, [refresh]);

  return {
    ...state,
    refresh,
    openUsageSettings: openUsageAccessSettings,
    openNotificationSettings: openNotificationListenerSettings,
    openOverlaySettings: openOverlaySettingsSvc,
    isNotificationServiceActive: state.isServiceActive,
    // Add lazy fetcher for allApps
    fetchAllApps: async () => {
      const apps = await getAllApps();
      dispatch({ type: 'SET_DATA', payload: { allApps: apps } });
      return apps;
    }
  };
}

export type PermissionState = State['permissions'];
export type DeviceStatsReturn = ReturnType<typeof useDeviceStats>;
