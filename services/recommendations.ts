/**
 * services/recommendations.ts
 *
 * Rule-based recommendation engine.
 * Pure function — takes UserStats + WeeklyTrend and returns Recommendation[].
 *
 * Architecture note: When a real ML model is ready, swap this function's body
 * only — callers and UI components need zero changes (same signature).
 */

import type { UserStats, WeeklyTrend, CategoryBreakdown, Recommendation } from '@/types';

function ms2h(ms: number) {
  return ms / 3600000;
}

function ms2min(ms: number) {
  return Math.round(ms / 60000);
}

export function generateRecommendations(
  stats: UserStats | null,
  trend: WeeklyTrend[],
  categoryBreakdown: CategoryBreakdown[],
  dismissedIds: string[]
): Recommendation[] {
  if (!stats) return [];

  const recs: Recommendation[] = [];
  const push = (r: Recommendation) => {
    if (!dismissedIds.includes(r.id)) recs.push(r);
  };

  const screenHours = ms2h(stats.totalScreenTimeMs);
  const goalHours = ms2h(stats.dailyGoalMs);
  const nightMin = ms2min(stats.nightUsageMs);

  // ── Screen Time ───────────────────────────────────────────────────

  if (screenHours > goalHours * 1.75) {
    push({
      id: 'screen_critical',
      title: 'Screen time overload',
      description: `You've used your phone for ${screenHours.toFixed(1)}h — ${((screenHours / goalHours - 1) * 100).toFixed(0)}% over your goal. Put it down and take a real break.`,
      iconName: 'Smartphone',
      severity: 'high',
      actionLabel: 'Start a Focus session',
      category: 'screentime',
    });
  } else if (screenHours > goalHours * 1.2) {
    push({
      id: 'screen_high',
      title: 'Approaching screen limit',
      description: `You're ${Math.round((screenHours - goalHours) * 60)} min over your daily goal. Consider wrapping up non-essential apps.`,
      iconName: 'Smartphone',
      severity: 'medium',
      actionLabel: 'Set a 30-min timer',
      category: 'screentime',
    });
  } else if (screenHours < goalHours * 0.5 && screenHours > 0) {
    push({
      id: 'screen_great',
      title: 'Great digital balance today!',
      description: `Only ${screenHours.toFixed(1)}h of screen time — well under your ${goalHours}h goal. Keep it up 🎉`,
      iconName: 'TrendingDown',
      severity: 'low',
      category: 'screentime',
    });
  }

  // ── Night Usage ───────────────────────────────────────────────────

  if (nightMin >= 45) {
    push({
      id: 'night_critical',
      title: 'Late-night screen exposure',
      description: `${nightMin} minutes of phone use after 10 PM detected. Blue light and stimulation seriously disrupt your sleep cycle.`,
      iconName: 'MoonOff',
      severity: 'high',
      actionLabel: 'Enable bedtime mode',
      category: 'sleep',
    });
  } else if (nightMin >= 15) {
    push({
      id: 'night_medium',
      title: 'Late-night usage detected',
      description: `${nightMin} min of usage last night after 10 PM. Try swapping your phone for a book for the last hour before sleep.`,
      iconName: 'Moon',
      severity: 'medium',
      category: 'sleep',
    });
  }

  // ── Unlocks ───────────────────────────────────────────────────────

  if (stats.unlockCount > 100) {
    push({
      id: 'unlocks_critical',
      title: 'Phone addiction pattern',
      description: `${stats.unlockCount} unlocks today — that's once every ${Math.round((16 * 60) / stats.unlockCount)} minutes. Consider grayscale mode or leaving your phone in another room.`,
      iconName: 'Lock',
      severity: 'high',
      category: 'focus',
    });
  } else if (stats.unlockCount > 60) {
    push({
      id: 'unlocks_medium',
      title: 'Frequent phone checking',
      description: `${stats.unlockCount} unlocks today. Try the "phone-free hours" habit — pick 2 hours where you don't check your phone at all.`,
      iconName: 'Unlock',
      severity: 'medium',
      category: 'focus',
    });
  }

  // ── Notifications ─────────────────────────────────────────────────

  if (stats.notificationCount > 150) {
    push({
      id: 'notif_critical',
      title: 'Notification overload',
      description: `${stats.notificationCount} notifications today. This level of interruption fragments deep focus. Mute your top 3 notification apps.`,
      iconName: 'BellOff',
      severity: 'high',
      actionLabel: 'Manage notifications',
      category: 'notification',
    });
  } else if (stats.notificationCount > 80) {
    push({
      id: 'notif_medium',
      title: 'High notification volume',
      description: `${stats.notificationCount} notifications received. Consider turning off badge notifications for social apps during work hours.`,
      iconName: 'Bell',
      severity: 'medium',
      category: 'notification',
    });
  }

  // ── App Category ──────────────────────────────────────────────────

  const socialCat = categoryBreakdown.find((c) => c.category === 'Social');
  if (socialCat && socialCat.percentage > 45) {
    push({
      id: 'social_dominant',
      title: 'Social media is dominating',
      description: `${socialCat.percentage.toFixed(0)}% of your screen time is social media. Try a 30-min social media detox after lunch each day.`,
      iconName: 'Users',
      severity: 'medium',
      category: 'social',
    });
  }

  const entertainmentCat = categoryBreakdown.find((c) => c.category === 'Entertainment');
  if (entertainmentCat && entertainmentCat.percentage > 50) {
    push({
      id: 'entertainment_dominant',
      title: 'Heavy entertainment usage',
      description: `Over half your screen time is entertainment. Swap one session for a podcast walk — same entertainment, zero screen.`,
      iconName: 'Film',
      severity: 'medium',
      category: 'social',
    });
  }

  // ── Weekly Trend ──────────────────────────────────────────────────

  if (trend.length >= 3) {
    const last3 = trend.slice(-3);
    const allIncreasing =
      last3[0].screenTimeMs < last3[1].screenTimeMs &&
      last3[1].screenTimeMs < last3[2].screenTimeMs;
    if (allIncreasing && ms2h(last3[2].screenTimeMs) > goalHours) {
      push({
        id: 'trend_increasing',
        title: 'Upward usage trend',
        description: 'Your screen time has increased 3 days in a row. This is often a sign of digital stress compensation — check in with yourself.',
        iconName: 'TrendingUp',
        severity: 'medium',
        category: 'screentime',
      });
    }

    const allDecreasing =
      last3[0].screenTimeMs > last3[1].screenTimeMs &&
      last3[1].screenTimeMs > last3[2].screenTimeMs;
    if (allDecreasing) {
      push({
        id: 'trend_improving',
        title: 'Great progress this week!',
        description: 'Your screen time has dropped 3 days in a row. Your digital habits are improving — you\'re building real momentum.',
        iconName: 'TrendingDown',
        severity: 'low',
        category: 'screentime',
      });
    }
  }

  // Sort: high severity first, then medium, then low
  const ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]).slice(0, 5);
}
