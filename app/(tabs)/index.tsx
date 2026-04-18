import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { PermissionPrompt } from '@/components/ui/PermissionPrompt';
import { NudgeBanner, deriveNudgeType } from '@/components/ui/NudgeBanner';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';
import type { Mood } from '@/types';

const { width: SW } = Dimensions.get('window');
const CHART_W = SW - Spacing.base * 2 - 2;

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '< 1m';
}

function avgSessionLabel(totalMs: number, unlocks: number): string {
  if (!unlocks) return '—';
  const avgMs = totalMs / unlocks;
  const s = Math.round(avgMs / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function pickupsPerHour(unlocks: number): string {
  const hour = new Date().getHours() || 1;
  return (unlocks / hour).toFixed(1);
}

function fatigueStatusText(level: string): string {
  switch (level) {
    case 'low':      return 'Low Fatigue';
    case 'medium':   return 'Moderate Fatigue';
    case 'high':     return 'High Fatigue';
    case 'critical': return 'Critical Fatigue';
    default:         return 'Tracking…';
  }
}

function fatigueInsight(level: string, totalMs: number, goalMs: number): string {
  const pct = goalMs > 0 ? Math.round((totalMs / goalMs) * 100) : 0;
  switch (level) {
    case 'low':
      return "You're in a good place. Screen time is under control today.";
    case 'medium':
      return `At ${pct}% of your daily goal. Consider a short phone-free break.`;
    case 'high':
      return `Screen time is at ${pct}% of your goal. Rest your eyes and step away.`;
    case 'critical':
      return 'Digital overload detected. Put your phone down and recharge now.';
    default:
      return 'Collecting your usage data…';
  }
}

function fatigueGradient(level: string): [string, string] {
  switch (level) {
    case 'low':      return ['#B1F0CE', '#D8F7E8'];
    case 'medium':   return ['#FFF0B3', '#FFF8D6'];
    case 'high':     return ['#FFD9B3', '#FFEEDC'];
    case 'critical': return ['#FFBDBD', '#FFE0E0'];
    default:         return ['#D8F7E8', '#EAF9F0'];
  }
}

function recoveryPct(totalMs: number, goalMs: number): number {
  if (!goalMs) return 0;
  const used = Math.min(totalMs / goalMs, 1);
  return Math.round((1 - used) * 100);
}

function recoveryMessage(pct: number, level: string): string {
  if (pct >= 80) return 'Great digital balance today. Keep it up! 🌿';
  if (pct >= 50) return `${Math.round((100 - pct) * 0.6)} more minutes offline will restore your focus to Balanced.`;
  if (pct >= 20) return 'Take a 30-minute offline break to recharge your focus.';
  return 'Your device is draining your focus. Rest now to recover.';
}

const LEVEL_COLOR: Record<string, string> = {
  low: '#2D6A4F',
  medium: '#D4850A',
  high: '#C0500A',
  critical: '#B91C1C',
};

const MOOD_OPTIONS: { value: Mood; emoji: string; label: string; color: string }[] = [
  { value: 1, emoji: '😩', label: 'Exhausted', color: '#E74C3C' },
  { value: 2, emoji: '😔', label: 'Low',       color: '#F39C12' },
  { value: 3, emoji: '😐', label: 'Neutral',   color: '#3498DB' },
  { value: 4, emoji: '😊', label: 'Good',      color: '#2ECC71' },
  { value: 5, emoji: '😄', label: 'Great',     color: '#27AE60' },
];

// ─── Fatigue Timeline chart ───────────────────────────────────────────────────

function FatigueTimeline({
  weeklyTrend,
  userStats,
}: {
  weeklyTrend: any[];
  userStats: any;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const labels = weeklyTrend.map((d) => d.date);
  const fatigueData = weeklyTrend.map((d, i) => {
    if (i === weeklyTrend.length - 1 && userStats?.fatigueScore) {
      return userStats.fatigueScore.score;
    }
    // approximate from screenTimeMs (cap at 100)
    return Math.min(100, Math.round((d.screenTimeMs / 18000000) * 100));
  });

  const hasData = fatigueData.some((v) => v > 0);

  // find peak
  const peakIdx = fatigueData.indexOf(Math.max(...fatigueData));
  const peakNotifs = weeklyTrend[peakIdx]?.notificationCount ?? 0;

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(45, 106, 79, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(90, 122, 112, ${opacity})`,
    strokeWidth: 2.5,
    decimalPlaces: 0,
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#2D6A4F', fill: '#B1F0CE' },
    propsForBackgroundLines: { stroke: '#EAEFEE', strokeDasharray: '0' },
    fillShadowGradientFrom: '#B1F0CE',
    fillShadowGradientTo: 'rgba(177,240,206,0)',
    fillShadowGradientOpacity: 0.4,
  };

  return (
    <View style={tl.card}>
      <View style={tl.titleRow}>
        <Icon name="TrendingUp" size={18} color={Palette.tealDark} />
        <Text style={tl.title}>Fatigue Timeline</Text>
        <Text style={tl.sub}>Last 7 days</Text>
      </View>

      {hasData ? (
        <>
          <LineChart
            data={{
              labels: labels.length ? labels : ['-'],
              datasets: [{ data: fatigueData.length ? fatigueData : [0] }],
            }}
            width={CHART_W - 32}
            height={160}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 10, marginLeft: -12, marginTop: 8 }}
            withInnerLines
            withOuterLines={false}
            withShadow={false}
            onDataPointClick={({ index, x, y }) => {
              setTooltip((prev) =>
                prev?.idx === index ? null : { x, y, idx: index }
              );
            }}
          />
          {/* Floating tooltip */}
          {tooltip !== null && (
            <Animated.View
              entering={ZoomIn.duration(200)}
              style={[
                tl.tooltip,
                {
                  top: tooltip.y - 80,
                  left: Math.min(tooltip.x - 10, CHART_W - 220),
                },
              ]}
            >
              <Text style={tl.tooltipDay}>{labels[tooltip.idx]}</Text>
              <Text style={tl.tooltipScore}>Score: {fatigueData[tooltip.idx]}/100</Text>
              {tooltip.idx === peakIdx ? (
                <Text style={tl.tooltipText}>
                  📱 High usage day — {peakNotifs} notifications received.
                </Text>
              ) : (
                <Text style={tl.tooltipText}>
                  Fatigue was {fatigueData[tooltip.idx] < 40 ? 'low & well-managed' : 'elevated'} this day.
                </Text>
              )}
            </Animated.View>
          )}
        </>
      ) : (
        <View style={tl.empty}>
          <Icon name="BarChart2" size={36} color="#ACBAB4" />
          <Text style={tl.emptyText}>Collecting timeline data…</Text>
        </View>
      )}
    </View>
  );
}

const tl = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: 'rgba(45,106,79,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'visible',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#2D3433',
  },
  sub: {
    fontSize: Typography.size.xs,
    color: '#9AB0A8',
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#2D3433',
    borderRadius: 10,
    padding: 10,
    width: 210,
    zIndex: 99,
  },
  tooltipDay: {
    fontSize: 10,
    color: '#9AB0A8',
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipScore: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#B1F0CE',
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 11,
    color: '#E8F5E9',
    lineHeight: 16,
  },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    color: '#9AB0A8',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomeDashboard() {
  const {
    userStats, loading, apps, totalNotifications,
    refreshAll, permissions,
    openUsageSettings, openNotificationSettings, openOverlaySettings,
    logMood, todayMood,
    dailyGoalMs, userName,
    isInBaselinePhase, baselineDaysElapsed,
    weeklyTrend,
    nudgeType: _nt,
  } = useWellbeing() as any;

  const [refreshing, setRefreshing] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // animated recovery bar
  const recovAnim = useRef(new RNAnimated.Value(0)).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const level = userStats?.fatigueScore?.level ?? 'low';
  const score = userStats?.fatigueScore?.score ?? 0;
  const totalMs = userStats?.totalScreenTimeMs ?? 0;
  const unlocks = userStats?.unlockCount ?? 0;

  const needsUsage   = permissions.checked && !permissions.usageAccess;
  const needsNotif   = permissions.checked && !permissions.notificationAccess;
  const needsOverlay = permissions.checked && !permissions.overlayAccess;
  const needsAny     = needsUsage || needsNotif || needsOverlay;

  const nudgeType = useMemo(
    () => (!nudgeDismissed && userStats
      ? deriveNudgeType(level, totalMs, dailyGoalMs)
      : null),
    [nudgeDismissed, userStats, level, totalMs, dailyGoalMs]
  );

  const recPct = recoveryPct(totalMs, dailyGoalMs);
  useMemo(() => {
    RNAnimated.timing(recovAnim, {
      toValue: recPct / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [recPct]);

  const pph = pickupsPerHour(unlocks);
  const avgSession = avgSessionLabel(totalMs, unlocks);
  const levelColor = LEVEL_COLOR[level] ?? Palette.tealDark;
  const [g1, g2] = fatigueGradient(level);

  // driver trend indicators
  const prevWeekUnlocks = weeklyTrend[weeklyTrend.length - 2]?.unlockCount ?? unlocks;
  const unlockTrend: 'up' | 'down' | 'flat' =
    unlocks > prevWeekUnlocks ? 'up' : unlocks < prevWeekUnlocks ? 'down' : 'flat';

  const prevNotifs = weeklyTrend[weeklyTrend.length - 2]?.notificationCount ?? totalNotifications;
  const notifTrend: 'up' | 'down' | 'flat' =
    totalNotifications > prevNotifs ? 'up' : totalNotifications < prevNotifs ? 'down' : 'flat';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" translucent={false} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting}, {userName} 👋</Text>
          <Text style={s.date}>{dateStr}</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} activeOpacity={0.75}>
          <Icon name="RefreshCw" size={18} color={Palette.tealDark} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={Palette.tealDark} colors={[Palette.tealDark]} />
        }
      >
        {/* Permission prompt */}
        {needsAny && permissions.checked && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <PermissionPrompt
              type={needsUsage ? 'usage' : needsNotif ? 'notification' : 'overlay'}
              onGrantUsage={openUsageSettings}
              onGrantNotification={openNotificationSettings}
              onGrantOverlay={openOverlaySettings}
            />
          </Animated.View>
        )}

        {/* Nudge banner */}
        {nudgeType && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <NudgeBanner type={nudgeType} onDismiss={() => setNudgeDismissed(true)} />
          </Animated.View>
        )}

        {/* Baseline banner */}
        {isInBaselinePhase && baselineDaysElapsed !== null && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <View style={s.baselineBanner}>
              <Icon name="Brain" size={16} color="#5E35B1" />
              <View style={{ flex: 1 }}>
                <Text style={s.baselineTitle}>Learning your baseline</Text>
                <View style={s.baselineBar}>
                  <View style={[s.baselineBarFill, { width: `${(baselineDaysElapsed / 14) * 100}%` as any }]} />
                </View>
                <Text style={s.baselineSub}>Day {baselineDaysElapsed} of 14</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── 1. STATUS CARD ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(60)}>
          <LinearGradient colors={[g1, g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.statusCard}>
            {/* Score badge */}
            <View style={[s.scoreBadge, { backgroundColor: levelColor + '22', borderColor: levelColor + '44' }]}>
              <Text style={[s.scoreBadgeNum, { color: levelColor }]}>{score}</Text>
              <Text style={[s.scoreBadgeDen, { color: levelColor }]}>/100</Text>
            </View>

            <Text style={[s.statusLabel, { color: levelColor + '99' }]}>YOUR STATUS</Text>
            <Text style={[s.statusLevel, { color: levelColor }]}>{fatigueStatusText(level)}</Text>
            <Text style={s.statusInsight}>{fatigueInsight(level, totalMs, dailyGoalMs)}</Text>

            <View style={s.statusMeta}>
              <View style={s.statusMetaItem}>
                <Icon name="Smartphone" size={13} color={levelColor} strokeWidth={2.5} />
                <Text style={[s.statusMetaText, { color: levelColor }]}>
                  {formatMs(totalMs)} today
                </Text>
              </View>
              <View style={s.statusMetaDot} />
              <View style={s.statusMetaItem}>
                <Icon name="Target" size={13} color={levelColor} strokeWidth={2.5} />
                <Text style={[s.statusMetaText, { color: levelColor }]}>
                  Goal: {formatMs(dailyGoalMs)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── 2. DRIVERS GRID ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(120)}>
          <Text style={s.sectionTitle}>Activity Drivers</Text>
          <View style={s.driversRow}>

            {/* Focus Flow */}
            <View style={s.driverCard}>
              <View style={s.driverTop}>
                <View style={[s.driverIconWrap, { backgroundColor: '#E8F5EE' }]}>
                  <Icon name="Zap" size={16} color="#2D6A4F" strokeWidth={2.5} />
                </View>
                <TrendArrow dir={unlockTrend === 'down' ? 'down' : unlockTrend === 'up' ? 'up' : 'flat'} good="down" />
              </View>
              <Text style={s.driverValue}>{pph}</Text>
              <Text style={s.driverUnit}>/hr</Text>
              <Text style={s.driverLabel}>Focus Flow</Text>
              <Text style={s.driverSub}>Pickups per hour</Text>
            </View>

            {/* Inflow Volume */}
            <View style={s.driverCard}>
              <View style={s.driverTop}>
                <View style={[s.driverIconWrap, { backgroundColor: '#FFF8E6' }]}>
                  <Icon name="Bell" size={16} color="#D4850A" strokeWidth={2.5} />
                </View>
                <TrendArrow dir={notifTrend} good="down" />
              </View>
              <Text style={[s.driverValue, { color: '#D4850A' }]}>{totalNotifications}</Text>
              <Text style={[s.driverUnit, { color: '#D4850A' }]}> </Text>
              <Text style={s.driverLabel}>Inflow Volume</Text>
              <Text style={s.driverSub}>Notifications today</Text>
            </View>

            {/* Engagement Depth */}
            <View style={s.driverCard}>
              <View style={s.driverTop}>
                <View style={[s.driverIconWrap, { backgroundColor: '#E8EEFF' }]}>
                  <Icon name="Clock" size={16} color="#3B5BCC" strokeWidth={2.5} />
                </View>
                <TrendArrow dir="flat" good="down" />
              </View>
              <Text style={[s.driverValue, { color: '#3B5BCC', fontSize: 20 }]}>{avgSession}</Text>
              <Text style={[s.driverUnit, { color: '#3B5BCC' }]}> </Text>
              <Text style={s.driverLabel}>Eng. Depth</Text>
              <Text style={s.driverSub}>Avg per unlock</Text>
            </View>

          </View>
        </Animated.View>

        {/* ── 3. FATIGUE TIMELINE ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(180)}>
          <Text style={s.sectionTitle}>Fatigue Timeline</Text>
          <FatigueTimeline weeklyTrend={weeklyTrend} userStats={userStats} />
        </Animated.View>

        {/* ── 4. RECOVERY METER ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(240)}>
          <Text style={s.sectionTitle}>Recovery</Text>
          <View style={s.recoveryCard}>
            <View style={s.recoveryTop}>
              <View style={s.recoveryIconWrap}>
                <Icon name="Moon" size={22} color="#5E35B1" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.recoveryMeterBg}>
                  <RNAnimated.View
                    style={[
                      s.recoveryMeterFill,
                      {
                        width: recovAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: recPct > 60 ? '#2D6A4F' : recPct > 30 ? '#D4850A' : '#C0500A',
                      },
                    ]}
                  />
                </View>
                <View style={s.recoveryPctRow}>
                  <Text style={s.recoveryPctLabel}>Recharge</Text>
                  <Text style={s.recoveryPct}>{recPct}%</Text>
                </View>
              </View>
            </View>
            <Text style={s.recoveryMsg}>{recoveryMessage(recPct, level)}</Text>
          </View>
        </Animated.View>

        {/* ── 5. MOOD CHECK-IN ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={s.sectionTitle}>How are you feeling? 😌</Text>
          <View style={s.moodCard}>
            <View style={s.moodRow}>
              {MOOD_OPTIONS.map((m) => {
                const active = todayMood?.value === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[s.moodBtn, active && { backgroundColor: m.color + '20', borderRadius: Radius.md }]}
                    onPress={() => logMood(m.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.moodEmoji, active && { transform: [{ scale: 1.25 }] }]}>{m.emoji}</Text>
                    <Text style={[s.moodLabel, active && { color: m.color, fontWeight: '700' }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Trend Arrow helper ───────────────────────────────────────────────────────

function TrendArrow({ dir, good }: { dir: 'up' | 'down' | 'flat'; good: 'up' | 'down' }) {
  if (dir === 'flat') {
    return (
      <View style={arrow.wrap}>
        <Text style={[arrow.icon, { color: '#9AB0A8' }]}>—</Text>
      </View>
    );
  }
  const positive = dir === good;
  const color = positive ? '#2D6A4F' : '#D4850A';
  const bg    = positive ? '#E8F5EE' : '#FFF8E6';
  return (
    <View style={[arrow.wrap, { backgroundColor: bg }]}>
      <Icon
        name={dir === 'up' ? 'TrendingUp' : 'TrendingDown'}
        size={12}
        color={color}
        strokeWidth={2.5}
      />
    </View>
  );
}

const arrow = StyleSheet.create({
  wrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F3',
  },
  icon: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: '#F8FAF9',
  },
  greeting: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: '#2D3433',
    letterSpacing: -0.3,
  },
  date: {
    fontSize: Typography.size.sm,
    color: '#596060',
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(45,106,79,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },

  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },

  // Baseline banner
  baselineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#EDE7F6',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  baselineTitle: { fontSize: Typography.size.sm, fontWeight: '700', color: '#4527A0' },
  baselineBar: { height: 3, backgroundColor: '#D1C4E9', borderRadius: 2, marginVertical: 4 },
  baselineBarFill: { height: '100%', backgroundColor: '#7E57C2', borderRadius: 2 },
  baselineSub: { fontSize: 10, color: '#7E57C2' },

  // Status Card
  statusCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    shadowColor: 'rgba(45,106,79,0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  scoreBadge: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 1,
  },
  scoreBadgeNum: { fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold },
  scoreBadgeDen: { fontSize: Typography.size.xs, fontWeight: '600' },

  statusLabel: {
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statusLevel: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  statusInsight: {
    fontSize: Typography.size.sm,
    color: '#2D3433CC',
    lineHeight: 20,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  statusMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusMetaText: { fontSize: Typography.size.xs, fontWeight: '600' },
  statusMetaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#2D3433' + '44' },

  // Section title
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#2D3433',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    letterSpacing: -0.2,
  },

  // Drivers Grid
  driversRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  driverCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: 'rgba(45,106,79,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  driverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  driverIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverValue: {
    fontSize: 24,
    fontWeight: Typography.weight.extrabold,
    color: '#2D6A4F',
    lineHeight: 28,
  },
  driverUnit: {
    fontSize: Typography.size.xs,
    color: '#596060',
    fontWeight: '500',
    marginTop: -2,
    marginBottom: 4,
  },
  driverLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#2D3433',
  },
  driverSub: {
    fontSize: 9,
    color: '#9AB0A8',
    marginTop: 1,
  },

  // Recovery
  recoveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: 'rgba(45,106,79,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  recoveryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  recoveryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryMeterBg: {
    height: 10,
    backgroundColor: '#EAEFEE',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  recoveryMeterFill: {
    height: '100%',
    borderRadius: 5,
  },
  recoveryPctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recoveryPctLabel: { fontSize: Typography.size.xs, color: '#596060', fontWeight: '500' },
  recoveryPct: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: '#2D3433' },
  recoveryMsg: {
    fontSize: Typography.size.sm,
    color: '#596060',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Mood
  moodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: 'rgba(45,106,79,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  moodEmoji: {
    fontSize: 26,
  },
  moodLabel: {
    fontSize: 9,
    color: '#9AB0A8',
    marginTop: 4,
    fontWeight: '500',
  },
});
