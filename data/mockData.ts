import type {
  UserStats,
  AppUsage,
  NotificationData,
  WeeklyTrend,
  CategoryBreakdown,
} from '@/types';

// ─── Today's User Stats ───────────────────────────────────────────────────────
export const mockUserStats: UserStats = {
  date: new Date().toISOString(),
  totalScreenTimeMs: 4 * 3600000 + 23 * 60000, // 4h 23m
  unlockCount: 67,
  notificationCount: 142,
  nightUsageMs: 28 * 60000, // 28m
  dailyGoalMs: 3 * 3600000, // 3h goal
  fatigueScore: {
    score: 72,
    level: 'high',
    breakdown: {
      screenTimeFactor: 32,
      unlockFactor: 18,
      notificationFactor: 15,
      nightUsageFactor: 7,
    },
  },
};

// ─── App Usage ────────────────────────────────────────────────────────────────
export const mockAppUsage: AppUsage[] = [
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    category: 'Social',
    totalTimeInForeground: 78 * 60000,
    percentage: 29.5,
    iconColor: '#E1306C',
  },
  {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    category: 'Entertainment',
    totalTimeInForeground: 62 * 60000,
    percentage: 23.5,
    iconColor: '#FF0000',
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    category: 'Communication',
    totalTimeInForeground: 45 * 60000,
    percentage: 17.0,
    iconColor: '#25D366',
  },
  {
    packageName: 'com.twitter.android',
    appName: 'Twitter/X',
    category: 'Social',
    totalTimeInForeground: 31 * 60000,
    percentage: 11.7,
    iconColor: '#1DA1F2',
  },
  {
    packageName: 'com.netflix.mediaclient',
    appName: 'Netflix',
    category: 'Entertainment',
    totalTimeInForeground: 25 * 60000,
    percentage: 9.5,
    iconColor: '#E50914',
  },
  {
    packageName: 'com.google.android.gm',
    appName: 'Gmail',
    category: 'Productivity',
    totalTimeInForeground: 18 * 60000,
    percentage: 6.8,
    iconColor: '#EA4335',
  },
  {
    packageName: 'com.spotify.music',
    appName: 'Spotify',
    category: 'Entertainment',
    totalTimeInForeground: 5 * 60000,
    percentage: 1.9,
    iconColor: '#1DB954',
  },
];

// ─── Notification Data ────────────────────────────────────────────────────────
export const mockNotifications: NotificationData[] = [
  {
    appName: 'WhatsApp',
    packageName: 'com.whatsapp',
    count: 48,
    lastReceivedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    category: 'Communication',
  },
  {
    appName: 'Instagram',
    packageName: 'com.instagram.android',
    count: 32,
    lastReceivedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    category: 'Social',
  },
  {
    appName: 'Gmail',
    packageName: 'com.google.android.gm',
    count: 21,
    lastReceivedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    category: 'Productivity',
  },
  {
    appName: 'Twitter/X',
    packageName: 'com.twitter.android',
    count: 18,
    lastReceivedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    category: 'Social',
  },
  {
    appName: 'YouTube',
    packageName: 'com.google.android.youtube',
    count: 14,
    lastReceivedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    category: 'Entertainment',
  },
  {
    appName: 'News',
    packageName: 'com.google.android.apps.magazines',
    count: 9,
    lastReceivedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    category: 'News',
  },
];

// ─── Weekly Trend ─────────────────────────────────────────────────────────────
export const mockWeeklyTrend: WeeklyTrend[] = [
  { date: 'Mon', screenTimeMs: 3.2 * 3600000, unlockCount: 52, notificationCount: 98 },
  { date: 'Tue', screenTimeMs: 2.8 * 3600000, unlockCount: 44, notificationCount: 87 },
  { date: 'Wed', screenTimeMs: 5.1 * 3600000, unlockCount: 81, notificationCount: 165 },
  { date: 'Thu', screenTimeMs: 4.7 * 3600000, unlockCount: 73, notificationCount: 148 },
  { date: 'Fri', screenTimeMs: 6.2 * 3600000, unlockCount: 95, notificationCount: 201 },
  { date: 'Sat', screenTimeMs: 5.5 * 3600000, unlockCount: 88, notificationCount: 177 },
  { date: 'Sun', screenTimeMs: 4.4 * 3600000, unlockCount: 67, notificationCount: 142 },
];

// ─── Category Breakdown ───────────────────────────────────────────────────────
export const mockCategoryBreakdown: CategoryBreakdown[] = [
  { category: 'Social', totalTimeMs: 109 * 60000, percentage: 41.2, color: '#FF6B9D' },
  { category: 'Entertainment', totalTimeMs: 92 * 60000, percentage: 34.8, color: '#A78BFA' },
  { category: 'Communication', totalTimeMs: 45 * 60000, percentage: 17.0, color: '#34D399' },
  { category: 'Productivity', totalTimeMs: 18 * 60000, percentage: 6.8, color: '#60A5FA' },
  { category: 'Other', totalTimeMs: 0.5 * 60000, percentage: 0.2, color: '#FCD34D' },
];

// ─── Night Usage Hours ────────────────────────────────────────────────────────
export const mockNightUsage = [
  { hour: '10pm', minutes: 18 },
  { hour: '11pm', minutes: 10 },
  { hour: '12am', minutes: 5 },
  { hour: '1am', minutes: 2 },
  { hour: '2am', minutes: 0 },
  { hour: '3am', minutes: 0 },
];

// ─── Insights ────────────────────────────────────────────────────────────────
export const mockInsights = [
  'Your screen time is 47% above your weekly average. Consider a short digital detox.',
  'You unlocked your phone 12 times in the last hour. Try the Focus Mode to reduce distractions.',
  'Last night you used your phone until 11:18 PM — that can affect your sleep quality.',
  'Your most distracting app today is Instagram with 1h 18m of usage.',
  'You\'ve had 142 notifications today. Muting non-essential apps could reduce stress.',
];
