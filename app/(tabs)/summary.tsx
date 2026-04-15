/**
 * app/(tabs)/summary.tsx
 *
 * Daily Summary screen — end-of-day recap showing mood strip,
 * focus sessions, streak celebration, and top recommendation.
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { GradientCard } from '@/components/ui/GradientCard';
import { RecommendationCard } from '@/components/ui/RecommendationCard';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { MOOD_META } from '@/hooks/useMoodLog';
import { getMilestoneBadge } from '@/hooks/useStreak';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

function formatMs(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '< 1m';
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
}

export default function SummaryScreen() {
  const {
    userStats, weeklyTrend, dailyGoalMs,
    recentMoodLog, todayMood,
    todayFocusSessions, todayFocusMinutes, todayFocusCount,
    streak, recommendations, dismissRecommendation,
  } = useWellbeing();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const screenHours = (userStats?.totalScreenTimeMs ?? 0) / 3600000;
  const goalHours = (userStats?.dailyGoalMs ?? dailyGoalMs) / 3600000;
  const goalPercent = goalHours > 0 ? Math.min(100, (screenHours / goalHours) * 100) : 0;
  const fatigueLevel = userStats?.fatigueScore?.level ?? 'low';

  // Yesterday delta
  const yesterday = weeklyTrend[weeklyTrend.length - 2];
  const yesterdayMs = yesterday?.screenTimeMs ?? 0;
  const todayMs = userStats?.totalScreenTimeMs ?? 0;
  const deltaMs = todayMs - yesterdayMs;
  const deltaSign = deltaMs >= 0 ? '+' : '-';
  const deltaFormatted = formatMs(Math.abs(deltaMs));
  const deltaBetter = deltaMs < 0;

  // 7-day mood strip
  const last7Days = getLast7Days();
  const moodMap = Object.fromEntries(
    recentMoodLog.map((e) => [new Date(e.date).toDateString(), e.value])
  );

  // Milestone
  const milestone = getMilestoneBadge(streak.currentStreak);

  // Top recommendation
  const topRec = recommendations[0] ?? null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Palette.bgLight} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Summary</Text>
        <Text style={styles.headerSub}>{dateStr}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Today vs Yesterday ──────────────────── */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <GradientCard
            colors={deltaBetter ? ['#A8D5BA', '#C8E6C9'] : ['#FFE0B2', '#FFCCBC']}
            style={{ marginBottom: Spacing.md }}
          >
            <Text style={styles.cardLabel}>Today vs Yesterday</Text>
            <View style={styles.deltaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deltaMain}>{formatMs(todayMs)}</Text>
                <Text style={styles.dateSub}>Screen time today</Text>
                <View style={styles.deltaChip}>
                  <Icon
                    name={deltaBetter ? 'TrendingDown' : 'TrendingUp'}
                    size={14}
                    color={deltaBetter ? '#2E7D32' : '#BF360C'}
                    strokeWidth={2.5}
                  />
                  <Text style={[styles.deltaChipText, { color: deltaBetter ? '#2E7D32' : '#BF360C' }]}>
                    {deltaSign}{deltaFormatted} vs yesterday
                  </Text>
                </View>
              </View>
              <View style={styles.fatigueFlag}>
                <Text style={styles.fatigueFlagEmoji}>
                  {fatigueLevel === 'low' ? '✨' : fatigueLevel === 'medium' ? '⚡' : fatigueLevel === 'high' ? '⚠️' : '🚨'}
                </Text>
                <Text style={styles.fatigueFlagLabel}>
                  {fatigueLevel.charAt(0).toUpperCase() + fatigueLevel.slice(1)} Fatigue
                </Text>
              </View>
            </View>

            {/* Goal progress bar */}
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.goalLabel}>
                Goal: {screenHours.toFixed(1)}h / {goalHours.toFixed(0)}h
              </Text>
              <View style={styles.progressBg}>
                <View
                  style={[styles.progressFill, {
                    width: `${goalPercent}%` as any,
                    backgroundColor: goalPercent > 100 ? '#F44336' : goalPercent > 75 ? '#FF9800' : Palette.tealDark,
                  }]}
                />
              </View>
            </View>
          </GradientCard>
        </Animated.View>

        {/* ── Streak Card ─────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionTitle}>Streak</Text>
          <StreakBadge streak={streak} />
          {milestone && streak.currentStreak > 0 && (
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneText}>
                🎉 You've reached the {milestone} milestone! Keep it up!
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── 7-Day Mood Strip ────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionTitle}>7-Day Mood</Text>
          <View style={[styles.moodStrip, Shadow.sm]}>
            {last7Days.map((dayStr, i) => {
              const val = moodMap[dayStr] as number | undefined;
              const meta = val ? MOOD_META[val as keyof typeof MOOD_META] : null;
              const isToday = dayStr === new Date().toDateString();
              const dayLabel = new Date(dayStr).toLocaleDateString('en', { weekday: 'short' }).slice(0, 3);

              return (
                <View key={dayStr} style={styles.moodDay}>
                  <View
                    style={[
                      styles.moodDot,
                      {
                        backgroundColor: meta ? meta.color : '#E0E0E0',
                        borderWidth: isToday ? 2 : 0,
                        borderColor: Palette.tealDark,
                      },
                    ]}
                  >
                    {meta && <Text style={styles.moodEmoji}>{meta.emoji}</Text>}
                  </View>
                  <Text style={[styles.moodDayLabel, isToday && styles.moodDayLabelToday]}>
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Focus Sessions ───────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.sectionTitle}>Focus Today</Text>
          <View style={[styles.focusCard, Shadow.sm]}>
            <View style={styles.focusRow}>
              <View style={styles.focusStat}>
                <Icon name="Timer" size={28} color={Palette.tealDark} strokeWidth={2} />
                <Text style={styles.focusVal}>{todayFocusMinutes}</Text>
                <Text style={styles.focusLabel}>minutes</Text>
              </View>
              <View style={styles.focusDivider} />
              <View style={styles.focusStat}>
                <Icon name="Repeat" size={28} color="#9C27B0" strokeWidth={2} />
                <Text style={[styles.focusVal, { color: '#9C27B0' }]}>{todayFocusCount}</Text>
                <Text style={styles.focusLabel}>sessions</Text>
              </View>
              <View style={styles.focusDivider} />
              <View style={styles.focusStat}>
                <Icon name="Trophy" size={28} color="#FF9800" strokeWidth={2} />
                <Text style={[styles.focusVal, { color: '#FF9800' }]}>
                  {todayFocusCount >= 4 ? '🔥' : todayFocusCount >= 2 ? '⚡' : '🌱'}
                </Text>
                <Text style={styles.focusLabel}>
                  {todayFocusCount >= 4 ? 'On fire!' : todayFocusCount >= 2 ? 'Good' : 'Start!'}
                </Text>
              </View>
            </View>

            {todayFocusSessions.length > 0 && (
              <View style={styles.sessionTimeline}>
                {todayFocusSessions.slice(0, 4).map((s, i) => (
                  <View key={i} style={styles.sessionPill}>
                    <View style={[styles.sessionDot, { backgroundColor: s.completed ? '#4CAF50' : '#FF9800' }]} />
                    <Text style={styles.sessionText}>
                      {s.durationMinutes}min{s.completed ? ' ✓' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {todayFocusSessions.length === 0 && (
              <Text style={styles.noFocusText}>
                No focus sessions yet today. Start one from the Focus tab!
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── Recommendation ────────────────────────── */}
        {topRec && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <Text style={styles.sectionTitle}>Today's Recommendation</Text>
            <RecommendationCard
              recommendation={topRec}
              onDismiss={dismissRecommendation}
            />
          </Animated.View>
        )}

        {/* ── Weekly Screen Time Sparkline ────────── */}
        {weeklyTrend.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(500)}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={[styles.sparkCard, Shadow.sm]}>
              <View style={styles.sparkRow}>
                {weeklyTrend.slice(-7).map((t, i) => {
                  const maxMs = Math.max(...weeklyTrend.map((w) => w.screenTimeMs), 1);
                  const pct = Math.max(4, (t.screenTimeMs / maxMs) * 100);
                  const isToday = i === weeklyTrend.length - 1;
                  return (
                    <View key={t.date} style={styles.sparkBar}>
                      <View style={styles.sparkBarBg}>
                        <View
                          style={[
                            styles.sparkBarFill,
                            {
                              height: `${pct}%` as any,
                              backgroundColor: isToday ? Palette.tealDark : Palette.mint,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.sparkLabel, isToday && styles.sparkLabelToday]}>
                        {t.date}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bgLight,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Palette.bgLight,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
  },
  headerSub: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  cardLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: Palette.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  deltaMain: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Palette.tealDark,
    marginBottom: 4,
  },
  dateSub: {
    fontSize: Typography.size.xs,
    color: Palette.grey600,
    marginBottom: Spacing.xs,
  },
  deltaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  deltaChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fatigueFlag: {
    alignItems: 'center',
    gap: 4,
  },
  fatigueFlagEmoji: {
    fontSize: 32,
  },
  fatigueFlagLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.tealDark,
  },
  goalLabel: {
    fontSize: Typography.size.xs,
    color: Palette.tealDark,
    marginBottom: 4,
    fontWeight: '600',
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  milestoneCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  milestoneText: {
    fontSize: Typography.size.sm,
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
  },
  moodStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  moodDay: {
    alignItems: 'center',
    gap: 6,
  },
  moodDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodDayLabel: {
    fontSize: 10,
    color: Palette.grey400,
    fontWeight: '600',
  },
  moodDayLabelToday: {
    color: Palette.tealDark,
    fontWeight: '700',
  },
  focusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  focusVal: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Palette.tealDark,
  },
  focusLabel: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    fontWeight: '600',
  },
  focusDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#EEF5F0',
  },
  sessionTimeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEF5F0',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAF9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E0EDE5',
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionText: {
    fontSize: 11,
    color: Palette.grey800,
    fontWeight: '600',
  },
  noFocusText: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  sparkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    height: 80,
  },
  sparkBar: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    gap: 4,
  },
  sparkBarBg: {
    flex: 1,
    width: '100%',
    backgroundColor: '#EEF5F0',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sparkBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  sparkLabel: {
    fontSize: 9,
    color: Palette.grey400,
    fontWeight: '600',
  },
  sparkLabelToday: {
    color: Palette.tealDark,
    fontWeight: '800',
  },
});
