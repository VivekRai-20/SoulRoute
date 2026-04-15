// ─── SoulRoute Data Models ────────────────────────────────────────────────────

export type FatigueLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FatigueScore {
  score: number; // 0–100 (higher = more fatigued)
  level: FatigueLevel;
  breakdown: {
    screenTimeFactor: number;
    unlockFactor: number;
    notificationFactor: number;
    nightUsageFactor: number;
  };
}

export interface UserStats {
  date: string; // ISO date string
  totalScreenTimeMs: number;
  unlockCount: number;
  notificationCount: number;
  nightUsageMs: number; // usage between 22:00–06:00
  fatigueScore: FatigueScore;
  dailyGoalMs: number; // user-set daily limit
}

export interface AppUsage {
  packageName: string;
  appName: string;
  category: AppCategory;
  totalTimeInForeground: number; // ms
  percentage: number; // of total screen time
  iconColor: string; // for UI display
}

export type AppCategory =
  | 'Social'
  | 'Entertainment'
  | 'Productivity'
  | 'Communication'
  | 'Health'
  | 'Games'
  | 'News'
  | 'Other';

export interface NotificationData {
  appName: string;
  packageName: string;
  count: number;
  lastReceivedAt: string; // ISO timestamp
  category: AppCategory;
}

export interface WeeklyTrend {
  date: string; // short label like 'Mon'
  screenTimeMs: number;
  unlockCount: number;
  notificationCount: number;
}

export interface MoodEntry {
  emoji: '😫' | '😞' | '😐' | '🙂' | '😊';
  label: 'Exhausted' | 'Low' | 'Neutral' | 'Good' | 'Great';
  value: 1 | 2 | 3 | 4 | 5;
}

export type Mood = MoodEntry['value'];

export interface CategoryBreakdown {
  category: AppCategory;
  totalTimeMs: number;
  percentage: number;
  color: string;
}

// ─── New Models ───────────────────────────────────────────────────────────────

export interface MoodLogEntry {
  date: string; // ISO timestamp
  value: Mood;
  label: string;
  note?: string;
}

export interface FocusSession {
  startTime: string; // ISO timestamp
  durationMinutes: number;
  completed: boolean;
  blockedApps: string[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // toDateString() format
  totalXP: number;
}

export interface OnboardingState {
  complete: boolean;
  startDate: string | null; // ISO timestamp — when tracking began
  permissionsGranted: boolean;
}

export type RecommendationSeverity = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  iconName: string;
  severity: RecommendationSeverity;
  actionLabel?: string;
  category: 'screentime' | 'sleep' | 'focus' | 'social' | 'notification';
}
