/**
 * hooks/useDeviceStats.ts
 *
 * Unified hook that:
 * 1. Checks usage + notification permissions on mount
 * 2. Fetches all real device data when permissions are granted
 * 3. Falls back to mock data when permissions are missing or on non-Android
 * 4. Exposes permissionState so the UI can render a permission prompt
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@/services/deviceStats';

// ─── Category classifier ──────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  'com.instagram.android': 'Social',
  'com.twitter.android': 'Social',
  'com.facebook.katana': 'Social',
  'com.snapchat.android': 'Social',
  'com.linkedin.android': 'Social',
  'com.google.android.youtube': 'Entertainment',
  'com.netflix.mediaclient': 'Entertainment',
  'com.spotify.music': 'Entertainment',
  'com.disney.disneyplus': 'Entertainment',
  'com.amazon.avod.thirdpartyclient': 'Entertainment',
  'com.whatsapp': 'Communication',
  'com.google.android.talk': 'Communication',
  'org.telegram.messenger': 'Communication',
  'com.skype.raider': 'Communication',
  'com.microsoft.teams': 'Communication',
  'com.google.android.gm': 'Productivity',
  'com.microsoft.launcher': 'Productivity',
  'com.notion.android': 'Productivity',
  'com.todoist.android.Todoist': 'Productivity',
  'com.google.android.calendar': 'Productivity',
};

const ICON_COLORS: Record<string, string> = {
  'Social': '#E1306C',
  'Entertainment': '#FF0000',
  'Communication': '#25D366',
  'Productivity': '#4285F4',
  'Health': '#4CAF50',
  'Games': '#FF9800',
  'News': '#9C27B0',
  'Other': '#9AB0A8',
};

const APP_COLORS: Record<string, string> = {
  'com.instagram.android': '#E1306C',
  'com.google.android.youtube': '#FF0000',
  'com.whatsapp': '#25D366',
  'com.twitter.android': '#1DA1F2',
  'com.netflix.mediaclient': '#E50914',
  'com.google.android.gm': '#EA4335',
  'com.spotify.music': '#1DB954',
  'com.facebook.katana': '#1877F2',
  'org.telegram.messenger': '#2CA5E0',
  'com.snapchat.android': '#FFFC00',
};

function classifyApp(packageName: string): { category: string; iconColor: string } {
  const category = CATEGORY_MAP[packageName] ?? 'Other';
  const iconColor = APP_COLORS[packageName] ?? ICON_COLORS[category] ?? '#9AB0A8';
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
    'Health': '#4CAF50',
    'Games': '#FBBF24',
    'News': '#C084FC',
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

function computeFatigueScore(
  screenTimeMs: number,
  unlocks: number,
  notifCount: number,
  nightMs: number,
  goalMs: number
): UserStats['fatigueScore'] {
  // Score factors (max 100 total)
  const screenFactor = Math.min(35, Math.round((screenTimeMs / (6 * 3600000)) * 35));
  const unlockFactor = Math.min(20, Math.round((unlocks / 100) * 20));
  const notifFactor = Math.min(25, Math.round((notifCount / 200) * 25));
  const nightFactor = Math.min(20, Math.round((nightMs / (30 * 60000)) * 20));

  const score = screenFactor + unlockFactor + notifFactor + nightFactor;
  const level =
    score < 30 ? 'low' : score < 55 ? 'medium' : score < 75 ? 'high' : 'critical';

  return {
    score,
    level,
    breakdown: {
      screenTimeFactor: screenFactor,
      unlockFactor,
      notificationFactor: notifFactor,
      nightUsageFactor: nightFactor,
    },
  };
}

// ─── Permission state type ────────────────────────────────────────────────────

export interface PermissionState {
  usageAccess: boolean;
  notificationAccess: boolean;
  overlayAccess: boolean;
  checked: boolean; // true once we've done the initial check
}

// ─── Return type ──────────────────────────────────────────────────────────────

export interface DeviceStatsReturn {
  userStats: UserStats | null;
  apps: AppUsage[];
  categoryBreakdown: CategoryBreakdown[];
  notifications: NotificationData[];
  totalNotifications: number;
  weeklyTrend: WeeklyTrend[];
  nightUsage: { hour: string; minutes: number }[];

  loading: boolean;
  error: string | null;
  isUsingMockData: boolean;

  permissions: PermissionState;
  openUsageSettings: () => void;
  openNotificationSettings: () => void;
  openOverlaySettings: () => void;
  isNotificationServiceActive: boolean;
  refresh: () => Promise<void>;
  allApps: { packageName: string; appName: string }[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDeviceStats(): DeviceStatsReturn {
  const [permissions, setPermissions] = useState<PermissionState>({
    usageAccess: false,
    notificationAccess: false,
    overlayAccess: false,
    checked: false,
  });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [apps, setApps] = useState<AppUsage[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [nightUsage, setNightUsage] = useState<{ hour: string; minutes: number }[]>([]);
  const [allApps, setAllApps] = useState<{ packageName: string; appName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(true);
  const [isServiceActive, setIsServiceActive] = useState(false);

  // Re-check permissions when the app returns from background
  // (user may have just granted access in Settings)
  const appStateRef = useRef(AppState.currentState);

  const checkPermissions = useCallback(async () => {
    const [usageAccess, notificationAccess, overlayAccess] = await Promise.all([
      hasUsagePermission(),
      hasNotificationPermission(),
      getOverlayPermissionState(),
    ]);
    setPermissions({ usageAccess, notificationAccess, overlayAccess, checked: true });
    return { usageAccess, notificationAccess, overlayAccess };
  }, []);

  const fetchRealData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        rawApps,
        totalScreenTimeMs,
        unlockCount,
        nightMs,
        rawNotifs,
        rawWeeklyTrend,
        rawWeeklyNotifs,
        rawIsServiceActive,
        rawNightHourly,
        allInstalledApps,
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
        getAllApps().catch(() => []),
      ]);

      console.log(`[SoulRoute] Notifications fetched: ${rawNotifs.length}, All Apps: ${allInstalledApps.length}`);
      
      // ─ Transform apps
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

      // ─ Category breakdown
      const breakdown = buildCategoryBreakdown(mappedApps);

      // ─ Notifications
      const totalNotifCount = rawNotifs.reduce((s: number, n: any) => s + n.count, 0);
      const mappedNotifs: NotificationData[] = rawNotifs.slice(0, 10).map((n: any) => ({
        appName: n.appName ?? n.packageName.split('.').pop() ?? n.packageName,
        packageName: n.packageName,
        count: n.count,
        lastReceivedAt: new Date().toISOString(),
        category: (classifyApp(n.packageName).category as any),
      }));

      // ─ Fatigue score
      const fatigueScore = computeFatigueScore(
        totalScreenTimeMs,
        unlockCount,
        totalNotifCount,
        nightMs,
        3 * 3600000 // default goal
      );

      const stats: UserStats = {
        date: new Date().toISOString(),
        totalScreenTimeMs,
        unlockCount,
        notificationCount: totalNotifCount,
        nightUsageMs: nightMs,
        dailyGoalMs: 3 * 3600000,
        fatigueScore,
      };

      // ─ Build merged weekly trend
      const mergedTrend: WeeklyTrend[] = (rawWeeklyTrend as any[]).map((t: any) => {
        const notifDay = (rawWeeklyNotifs as any[]).find((n: any) => n.date === t.date);
        return {
          date: t.date,
          screenTimeMs: t.screenTimeMs,
          unlockCount: t.unlockCount,
          notificationCount: notifDay ? notifDay.count : 0,
        };
      });

      setApps(mappedApps);
      setCategoryBreakdown(breakdown);
      setNotifications(mappedNotifs);
      setWeeklyTrend(mergedTrend);
      setNightUsage(rawNightHourly);
      setUserStats(stats);
      setAllApps(allInstalledApps);
      setIsServiceActive(rawIsServiceActive);
      setIsUsingMockData(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch device stats');
      // Fall back to mock
      loadMockData();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMockData = useCallback(() => {
    // We no longer use mock data as fallbacks
    setApps([]);
    setCategoryBreakdown([]);
    setNotifications([]);
    setWeeklyTrend([]);
    setNightUsage([]);
    setUserStats(null);
    setIsUsingMockData(true);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const perms = await checkPermissions();
    if (perms.usageAccess) {
      await fetchRealData();
    } else {
      loadMockData();
    }
  }, [checkPermissions, fetchRealData, loadMockData]);

  // On mount: check permissions then load
  useEffect(() => {
    refresh();
  }, []);

  // Re-check permissions when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // Always refresh on foreground — the user may have just granted
        // Usage Access or Notification Access in Settings.
        refresh();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refresh]);

  const totalNotifications = notifications.reduce((s, n) => s + n.count, 0);

  return {
    userStats,
    apps,
    categoryBreakdown,
    notifications,
    totalNotifications,
    weeklyTrend,
    nightUsage,
    loading,
    error,
    isUsingMockData,
    permissions,
    openUsageSettings: openUsageAccessSettings,
    openNotificationSettings: openNotificationListenerSettings,
    openOverlaySettings: openOverlaySettingsSvc,
    isNotificationServiceActive: isServiceActive,
    refresh,
    allApps,
  };
}
