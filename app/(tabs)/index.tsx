import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { FatigueScoreRing } from '@/components/ui/FatigueScoreRing';
import { StatCard } from '@/components/ui/StatCard';
import { GradientCard } from '@/components/ui/GradientCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { SkeletonCard, SkeletonStatGrid } from '@/components/ui/SkeletonLoader';
import { PermissionPrompt } from '@/components/ui/PermissionPrompt';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { NudgeBanner, deriveNudgeType } from '@/components/ui/NudgeBanner';
import { RecommendationCard } from '@/components/ui/RecommendationCard';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';
import type { Mood, AppUsage } from '@/types';

function formatMs(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '< 1m';
}

const MOOD_OPTIONS: { value: Mood; icon: IconName; label: string; color: string }[] = [
  { value: 1, icon: 'Frown', label: 'Exhausted', color: '#E74C3C' },
  { value: 2, icon: 'Meh',   label: 'Low',       color: '#F39C12' },
  { value: 3, icon: 'Circle',label: 'Neutral',   color: '#3498DB' },
  { value: 4, icon: 'Smile', label: 'Good',      color: '#2ECC71' },
  { value: 5, icon: 'Laugh', label: 'Great',     color: '#27AE60' },
];

// ─── Sub-component: Memoized App Row ──────────────────────────────────────────

const AppUsageRow = React.memo(({ app, index }: { app: AppUsage; index: number }) => (
  <Animated.View
    entering={SlideInRight.duration(400).delay(index * 60)}
  >
    <View style={[styles.appRow, Shadow.sm]}>
      <AppIcon packageName={app.packageName} size={44} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.appName} numberOfLines={1}>{app.appName}</Text>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${app.percentage}%` as any,
                backgroundColor: app.iconColor,
              },
            ]}
          />
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
        <Text style={styles.appTime}>
          {formatMs(app.totalTimeInForeground)}
        </Text>
        <Text style={styles.appPct}>{app.percentage.toFixed(1)}%</Text>
      </View>
    </View>
  </Animated.View>
));

export default function HomeDashboard() {
  const {
    userStats, loading, apps, totalNotifications, todayInsight,
    refreshAll, permissions, isUsingMockData,
    openUsageSettings, openNotificationSettings, openOverlaySettings,
    streak, logMood, todayMood, recommendations, dismissRecommendation,
    dailyGoalMs, userName,
    isInBaselinePhase, baselineDaysElapsed,
  } = useWellbeing();

  const [refreshing, setRefreshing] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const topApps = useMemo(() => apps.slice(0, 5), [apps]);
  
  const score = userStats?.fatigueScore?.score ?? 0;
  const level = userStats?.fatigueScore?.level ?? 'low';
  const goalPercent = useMemo(() => 
    userStats && userStats.dailyGoalMs > 0
      ? Math.min(100, (userStats.totalScreenTimeMs / userStats.dailyGoalMs) * 100)
      : 0
  , [userStats]);

  // Permission state
  const needsUsage = permissions.checked && !permissions.usageAccess;
  const needsNotif = permissions.checked && !permissions.notificationAccess;
  const needsOverlay = permissions.checked && !permissions.overlayAccess;
  const needsAny = needsUsage || needsNotif || needsOverlay;

  const nudgeType = useMemo(() => 
    !nudgeDismissed && userStats
      ? deriveNudgeType(level, userStats.totalScreenTimeMs, dailyGoalMs)
      : null
  , [nudgeDismissed, userStats, level, dailyGoalMs]);

  const topRec = recommendations[0] ?? null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Palette.bgLight} translucent={false} />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {userName} 👋</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Icon name="RefreshCw" size={20} color={Palette.tealDark} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.tealDark}
            colors={[Palette.tealDark]}
          />
        }
      >
        {/* Permission Prompt */}
        {needsAny && permissions.checked && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <PermissionPrompt
              type={needsUsage ? 'usage' : needsNotif ? 'notification' : 'overlay'}
              onGrantUsage={openUsageSettings}
              onGrantNotification={openNotificationSettings}
              onGrantOverlay={openOverlaySettings}
            />
          </Animated.View>
        )}

        {/* Baseline Banner */}
        {isInBaselinePhase && baselineDaysElapsed !== null && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.baselineBanner}>
              <Icon name="Brain" size={18} color="#5E35B1" strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.baselineTitle}>Learning your baseline</Text>
                <View style={styles.baselineBarBg}>
                  <View style={[styles.baselineBarFill, { width: `${(baselineDaysElapsed / 14) * 100}%` as any }]} />
                </View>
                <Text style={styles.baselineSub}>Day {baselineDaysElapsed} of 14 — insights ready soon</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Nudge Banner */}
        {nudgeType && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <NudgeBanner type={nudgeType} onDismiss={() => setNudgeDismissed(true)} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(600).delay(50)}>
          <StreakBadge streak={streak} />
        </Animated.View>

        {/* Fatigue Score Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <GradientCard
            colors={
              level === 'low' ? ['#A8D5BA', '#C8E6C9'] : 
              level === 'medium' ? ['#FFF9C4', '#FFECB3'] : 
              level === 'high' ? ['#FFE0B2', '#FFCCBC'] : ['#FFCDD2', '#FFEBEE']
            }
            style={{ marginBottom: Spacing.base }}
          >
            <Text style={styles.cardLabel}>Digital Fatigue Score</Text>
            <View style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreHint}>
                  {level === 'low' ? "✨ You're doing great today!" : 
                   level === 'medium' ? '⚡ Watch your screen habits' : 
                   level === 'high' ? '⚠️ Take a break soon' : '🚨 Digital overload — rest now!'}
                </Text>
                <Text style={styles.goalText}>
                  Progress: {formatMs(userStats?.totalScreenTimeMs ?? 0)} / {formatMs(dailyGoalMs)}
                </Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${goalPercent}%` as any, backgroundColor: goalPercent > 90 ? Palette.fatigueCritical : Palette.tealDark }]} />
                </View>

                {/* Fatigue factor breakdown */}
                {userStats?.fatigueScore?.breakdown && (
                  <View style={styles.breakdownRow}>
                    {[
                      { label: 'Screen', value: userStats.fatigueScore.breakdown.screenTimeFactor, max: 35 },
                      { label: 'Unlocks', value: userStats.fatigueScore.breakdown.unlockFactor, max: 20 },
                      { label: 'Notifs', value: userStats.fatigueScore.breakdown.notificationFactor, max: 25 },
                      { label: 'Night', value: userStats.fatigueScore.breakdown.nightUsageFactor, max: 20 },
                    ].map((f) => (
                      <View key={f.label} style={styles.factor}>
                        <Text style={styles.factorLabel}>{f.label}</Text>
                        <View style={styles.factorBarBg}>
                          <View
                            style={[
                              styles.factorBarFill,
                              {
                                width: `${(f.value / f.max) * 100}%` as any,
                                backgroundColor:
                                  f.value / f.max > 0.75
                                    ? Palette.fatigueCritical
                                    : Palette.tealDark,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.factorVal}>{f.value}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {!isUsingMockData && (
                  <View style={styles.realDataBadge}>
                    <Icon name="TrendingUp" size={11} color="#2E7D32" strokeWidth={2.5} />
                    <Text style={styles.realDataText}>Live tracking active</Text>
                  </View>
                )}
              </View>
              <FatigueScoreRing score={score} level={level} />
            </View>
          </GradientCard>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          {loading ? (
            <SkeletonStatGrid />
          ) : (
            <View style={styles.statsRow}>
              <StatCard iconName="Smartphone" value={formatMs(userStats?.totalScreenTimeMs ?? 0)} label="Screen Time" color={Palette.tealDark} bgColor="#F0FFF4" />
              <StatCard iconName="Lock" value={`${userStats?.unlockCount ?? 0}`} label="Unlocks" color="#E67E22" bgColor="#FFF8F0" />
              <StatCard iconName="Bell" value={`${totalNotifications}`} label="Notifications" color="#8E44AD" bgColor="#F8F0FF" />
            </View>
          )}
        </Animated.View>

        {/* Top Recommendation */}
        {topRec && (
          <Animated.View entering={FadeInDown.duration(600).delay(280)}>
            <Text style={styles.sectionTitle}>Recommendation</Text>
            <RecommendationCard recommendation={topRec} onDismiss={dismissRecommendation} compact />
          </Animated.View>
        )}

        {/* Today's Insight */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <Text style={styles.sectionTitle}>Today's Insight</Text>
          <View style={[styles.insightCard, Shadow.sm]}>
            <View style={styles.insightIconWrap}>
              <Icon name="Lightbulb" size={24} color={Palette.amber} strokeWidth={2} />
            </View>
            <Text style={styles.insightText}>{todayInsight}</Text>
          </View>
        </Animated.View>

        {/* Top Apps List */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Top Apps Today</Text>
            {!isUsingMockData && (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>Live</Text>
              </View>
            )}
          </View>

          {loading ? (
            <SkeletonCard />
          ) : topApps.length === 0 ? (
            <EmptyState iconName="Smartphone" title="No usage data" subtitle="Tracking starts once you use apps." />
          ) : (
            topApps.map((app, index) => (
              <AppUsageRow key={app.packageName} app={app} index={index} />
            ))
          )}
        </Animated.View>

        {/* Mood Check */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <Text style={styles.sectionTitle}>How are you feeling? 😌</Text>
          <View style={[styles.moodCard, Shadow.sm]}>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.moodBtn, todayMood?.value === m.value && { backgroundColor: Palette.mint + '60', borderColor: Palette.tealDark, borderWidth: 1 }]}
                  onPress={() => logMood(m.value)}
                >
                  <Icon name={m.icon} size={26} color={m.color} />
                  <Text style={[styles.moodLabel, todayMood?.value === m.value && { color: Palette.tealDark, fontWeight: '700' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    backgroundColor: Palette.bgLight,
  },
  greeting: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
  },
  date: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: '#F0FFF4',
    borderRadius: 20,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  baselineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#EDE7F6',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#B39DDB',
  },
  baselineTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#4527A0',
  },
  baselineBarBg: {
    height: 4,
    backgroundColor: '#D1C4E9',
    borderRadius: 2,
    marginVertical: 4,
  },
  baselineBarFill: {
    height: '100%',
    backgroundColor: '#7E57C2',
    borderRadius: 2,
  },
  baselineSub: {
    fontSize: 10,
    color: '#7E57C2',
  },
  cardLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: Palette.tealDark,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreHint: {
    fontSize: Typography.size.md,
    fontWeight: '600',
    color: Palette.tealDark,
    marginBottom: Spacing.sm,
  },
  goalText: {
    fontSize: Typography.size.xs,
    color: Palette.grey600,
    marginBottom: 4,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#D0E8D8',
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownRow: {
    gap: 5,
    marginBottom: Spacing.sm,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factorLabel: {
    width: 42,
    fontSize: 9,
    color: Palette.tealDark,
    fontWeight: '600',
    opacity: 0.7,
  },
  factorBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  factorVal: {
    width: 18,
    fontSize: 9,
    color: Palette.tealDark,
    textAlign: 'right',
    fontWeight: '700',
    opacity: 0.8,
  },
  realDataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  realDataText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  insightIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFDE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Palette.grey800,
    lineHeight: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  livePillText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '700',
  },
  appRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: Palette.grey800,
  },
  barBg: {
    height: 6,
    backgroundColor: '#EEF5F0',
    borderRadius: 3,
    marginTop: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  appTime: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Palette.tealDark,
  },
  appPct: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
  },
  moodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  moodLabel: {
    fontSize: 9,
    color: Palette.grey400,
    marginTop: 4,
  },
});
