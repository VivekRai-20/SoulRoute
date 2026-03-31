import React from 'react';
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
import { SkeletonCard, SkeletonStatGrid } from '@/components/ui/SkeletonLoader';
import { PermissionPrompt } from '@/components/ui/PermissionPrompt';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

function formatMs(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '< 1m';
}

const MOODS = [
  { icon: 'Frown', label: 'Exhausted', value: 1, color: '#E74C3C' },
  { icon: 'Meh', label: 'Low', value: 2, color: '#F39C12' },
  { icon: 'Circle', label: 'Neutral', value: 3, color: '#3498DB' },
  { icon: 'Smile', label: 'Good', value: 4, color: '#2ECC71' },
  { icon: 'Laugh', label: 'Great', value: 5, color: '#27AE60' },
] as const;

export default function HomeDashboard() {
  const {
    userStats,
    loading,
    apps,
    totalNotifications,
    todayInsight,
    refreshAll,
    permissions,
    isUsingMockData,
    openUsageSettings,
    openNotificationSettings,
    openOverlaySettings,
  } = useWellbeing();

  const [selectedMood, setSelectedMood] = React.useState<number | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const topApps = apps.slice(0, 5);
  const score = userStats?.fatigueScore?.score ?? 0;
  const level = userStats?.fatigueScore?.level ?? 'low';
  const goalPercent =
    userStats && userStats.dailyGoalMs > 0
      ? Math.min(100, (userStats.totalScreenTimeMs / userStats.dailyGoalMs) * 100)
      : 0;

  // Permission state
  const needsUsage = permissions.checked && !permissions.usageAccess;
  const needsNotif = permissions.checked && !permissions.notificationAccess;
  const needsOverlay = permissions.checked && !permissions.overlayAccess;
  const needsAny = needsUsage || needsNotif || needsOverlay;

  const getPermissionType = (): 'usage' | 'notification' | 'overlay' | 'all' => {
    if (needsUsage && needsNotif && needsOverlay) return 'all';
    if (needsUsage) return 'usage';
    if (needsNotif) return 'notification';
    if (needsOverlay) return 'overlay';
    return 'all'; // Fallback
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Palette.bgLight}
        translucent={false}
      />

      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
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
        {/* ── Permission Prompt ───────────────────── */}
        {needsAny && permissions.checked && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <PermissionPrompt
              type={getPermissionType()}
              onGrantUsage={openUsageSettings}
              onGrantNotification={openNotificationSettings}
              onGrantOverlay={openOverlaySettings}
            />
          </Animated.View>
        )}

        {/* ── Mock data banner ─────────────────────── */}
        {isUsingMockData && permissions.checked && !needsAny && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <PermissionPrompt
              type="all"
              onGrantUsage={openUsageSettings}
              onGrantNotification={openNotificationSettings}
              onGrantOverlay={openOverlaySettings}
              compact
            />
          </Animated.View>
        )}

        {/* ── Fatigue Score Card ──────────────────── */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <GradientCard
            colors={
              level === 'low'
                ? ['#A8D5BA', '#C8E6C9']
                : level === 'medium'
                ? ['#FFF9C4', '#FFECB3']
                : level === 'high'
                ? ['#FFE0B2', '#FFCCBC']
                : ['#FFCDD2', '#FFEBEE']
            }
            style={{ marginBottom: Spacing.base }}
          >
            <Text style={styles.cardLabel}>Digital Fatigue Score</Text>
            <View style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreHint}>
                  {level === 'low'
                    ? "✨ You're doing great today!"
                    : level === 'medium'
                    ? '⚡ Watch your screen habits'
                    : level === 'high'
                    ? '⚠️ Take a break soon'
                    : '🚨 Digital overload — rest now!'}
                </Text>
                <Text style={styles.goalText}>
                  Daily Goal: {formatMs(userStats?.totalScreenTimeMs ?? 0)} /{' '}
                  {formatMs(userStats?.dailyGoalMs ?? 10800000)}
                </Text>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(goalPercent, 100)}%` as any,
                        backgroundColor:
                          goalPercent > 100
                            ? Palette.fatigueCritical
                            : goalPercent > 75
                            ? Palette.fatigueHigh
                            : Palette.tealDark,
                      },
                    ]}
                  />
                </View>
                {!isUsingMockData && (
                  <View style={styles.realDataBadge}>
                    <Icon name="TrendingUp" size={11} color="#2E7D32" strokeWidth={2.5} />
                    <Text style={styles.realDataText}>Live data</Text>
                  </View>
                )}
              </View>
              <FatigueScoreRing score={score} level={level} />
            </View>
          </GradientCard>
        </Animated.View>

        {/* ── Stats Grid ─────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          {loading ? (
            <SkeletonStatGrid />
          ) : (
            <View style={styles.statsRow}>
              <StatCard
                iconName="Smartphone"
                value={formatMs(userStats?.totalScreenTimeMs ?? 0)}
                label="Screen Time"
                color={Palette.tealDark}
                bgColor="#F0FFF4"
              />
              <StatCard
                iconName="Lock"
                value={`${userStats?.unlockCount ?? 0}`}
                label="Unlocks"
                color="#E67E22"
                bgColor="#FFF8F0"
              />
              <StatCard
                iconName="Bell"
                value={`${totalNotifications}`}
                label="Notifications"
                color="#8E44AD"
                bgColor="#F8F0FF"
              />
            </View>
          )}
        </Animated.View>

        {/* ── Today's Insight ────────────────────── */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <Text style={styles.sectionTitle}>Today's Insight</Text>
          <View style={[styles.insightCard, Shadow.sm]}>
            <View style={styles.insightIconWrap}>
              <Icon name="Lightbulb" size={24} color={Palette.amber} strokeWidth={2} />
            </View>
            <Text style={styles.insightText}>{todayInsight}</Text>
          </View>
        </Animated.View>

        {/* ── Top Apps ──────────────────────────── */}
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
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : topApps.length === 0 ? (
            <EmptyState
              iconName="Inbox"
              title="No app usage data"
              subtitle="Grant Usage Access in Settings, then pull to refresh"
            />
          ) : (
            topApps.map((app, index) => (
              <Animated.View
                key={app.packageName}
                entering={SlideInRight.duration(400).delay(index * 80)}
              >
                <View style={[styles.appRow, Shadow.sm]}>
                  <View
                    style={[
                      styles.appIconWrap,
                      { backgroundColor: app.iconColor + '22' },
                    ]}
                  >
                    <Icon name="Smartphone" size={18} color={app.iconColor} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.appName}>{app.appName}</Text>
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
            ))
          )}
        </Animated.View>

        {/* ── Mood Check ──────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <Text style={styles.sectionTitle}>How are you feeling? 😌</Text>
          <View style={[styles.moodCard, Shadow.sm]}>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[
                    styles.moodBtn,
                    selectedMood === m.value && {
                      backgroundColor: Palette.mint + '60',
                      borderColor: Palette.tealDark,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setSelectedMood(m.value)}
                >
                  <Icon name={m.icon as IconName} size={26} color={m.color} style={{ marginBottom: 4 }} />
                  <Text
                    style={[
                      styles.moodLabel,
                      selectedMood === m.value && {
                        color: Palette.tealDark,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedMood !== null && (
              <Text style={styles.moodFeedback}>
                {selectedMood <= 2
                  ? '💙 Take it easy. A short walk or 5 deep breaths can help.'
                  : selectedMood === 3
                  ? '🌿 Decent! A quick mindfulness break could lift your day.'
                  : '🌟 Awesome! Keep that energy going.'}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Night Usage Hint */}
        {(userStats?.nightUsageMs ?? 0) > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(600)}>
            <View style={[styles.nightHint, Shadow.sm]}>
              <Icon name="Moon" size={20} color="#7B1FA2" strokeWidth={2} />
              <Text style={styles.nightText}>
                You used your phone for{' '}
                <Text style={{ fontWeight: '700', color: '#5C35A8' }}>
                  {formatMs(userStats!.nightUsageMs)}
                </Text>{' '}
                last night. This may affect your sleep quality.
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  cardLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Palette.tealDark,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreHint: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Palette.tealDark,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  goalText: {
    fontSize: Typography.size.xs,
    color: Palette.grey600,
    marginBottom: Spacing.xs,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#D0E8D8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  insightIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFDE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Palette.grey800,
    lineHeight: 22,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
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
  appIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Palette.grey800,
    marginBottom: 6,
  },
  barBg: {
    height: 6,
    backgroundColor: '#EEF5F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  appTime: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
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
    marginHorizontal: 2,
  },
  moodEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 9,
    color: Palette.grey400,
    textAlign: 'center',
  },
  moodFeedback: {
    marginTop: Spacing.md,
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  nightHint: {
    backgroundColor: '#EDE7F6',
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  nightText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: '#4A235A',
    lineHeight: 20,
  },
});
