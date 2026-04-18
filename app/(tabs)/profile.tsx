import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Platform,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { GradientCard } from '@/components/ui/GradientCard';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { RecommendationCard } from '@/components/ui/RecommendationCard';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

import { FatigueScoreRing } from '@/components/ui/FatigueScoreRing';
import { StatCard } from '@/components/ui/StatCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { SkeletonCard, SkeletonStatGrid } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AppUsage } from '@/types';

// Import the migrated screens to render them inline
import AnalyticsScreen from './analytics';
import SleepScreen from './sleep';
import SummaryScreen from './summary';

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6];

function formatMs(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '< 1m';
}

const APP_VERSION = '1.0.0-beta';
const PRIVACY_ITEMS = [
  { iconName: 'Lock', title: 'Data stays on device', desc: 'All your usage data is processed locally.' },
  { iconName: 'Ban', title: 'No advertising tracking', desc: 'SoulRoute never shares your data.' },
  { iconName: 'Trash2', title: 'Delete your data', desc: 'Tap to wipe all history.', action: true },
];

const MathMin = Math.min;

const TABS = ['Overview', 'Stats', 'Analytics', 'Sleep', 'Summary'];

// ─── Sub-component: Memoized App Row (Migrated from Home) ───────────────────

const AppUsageRow = React.memo(({ app, index }: { app: AppUsage; index: number }) => (
  <Animated.View entering={SlideInRight.duration(400).delay(index * 60)}>
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

// ─── Stats Tab ───────────────────────────────────────────────────────────────

function StatsTab() {
  const { userStats, loading, apps, totalNotifications, dailyGoalMs, isUsingMockData } = useWellbeing();
  
  const topApps = React.useMemo(() => apps.slice(0, 5), [apps]);
  
  const score = userStats?.fatigueScore?.score ?? 0;
  const level = userStats?.fatigueScore?.level ?? 'low';
  const goalPercent = React.useMemo(() => 
    userStats && userStats.dailyGoalMs > 0
      ? MathMin(100, (userStats.totalScreenTimeMs / userStats.dailyGoalMs) * 100)
      : 0
  , [userStats]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
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
                <View style={[styles.progressFill, { width: `${goalPercent}%` as any, backgroundColor: goalPercent > 90 ? '#C2185B' : Palette.tealDark }]} />
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
                                  ? '#C2185B'
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  const {
    userStats, dailyGoalMs, setDailyGoalMs,
    notificationsEnabled, setNotificationsEnabled,
    streak, userName, setUserName,
  } = useWellbeing();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [darkMode, setDarkMode] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [haptics, setHaptics] = useState(true);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) setUserName(trimmed);
    setEditingName(false);
  };

  const selectedGoalHours = Math.round(dailyGoalMs / 3600000);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <GradientCard colors={['#A8D5BA', '#B3E5FC']} style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Icon name="User" size={38} color={Palette.tealDark} />
            </View>
            <View style={{ flex: 1 }}>
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                    maxLength={30}
                  />
                  <Pressable onPress={handleSaveName} style={styles.nameSaveBtn}>
                    <Icon name="Check" size={18} color={Palette.tealDark} strokeWidth={2.5} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={() => { setNameInput(userName); setEditingName(true); }}
                >
                  <Text style={styles.userName}>{userName}</Text>
                  <Icon name="Pencil" size={14} color={Palette.tealDark} strokeWidth={2} />
                </Pressable>
              )}
              <Text style={styles.userSub}>SoulRoute Member</Text>
              <StreakBadge streak={streak} compact />
            </View>
          </View>

          <View style={styles.quickStats}>
            {[
              { label: 'Today', value: formatMs(userStats?.totalScreenTimeMs ?? 0), iconName: 'Smartphone' },
              { label: 'Unlocks', value: `${userStats?.unlockCount ?? 0}`, iconName: 'Unlock' },
              { label: 'Goal', value: formatMs(dailyGoalMs), iconName: 'Target' },
            ].map(s => (
              <View key={s.label} style={styles.quickStat}>
                <Icon name={s.iconName as IconName} size={20} color={Palette.tealDark} />
                <Text style={styles.quickStatVal}>{s.value}</Text>
                <Text style={styles.quickStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </GradientCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View style={styles.sectionHeader}>
          <Icon name="Timer" size={20} color={Palette.tealDark} />
          <Text style={styles.sectionTitle}>Daily Screen Time Goal</Text>
        </View>
        <View style={[styles.settingsCard, Shadow.sm]}>
          <Text style={styles.goalCurrent}>
            Current goal: <Text style={{ color: Palette.tealDark, fontWeight: '800' }}>{selectedGoalHours}h / day</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRow}>
            {GOAL_OPTIONS.map(h => (
              <Pressable
                key={h}
                style={[styles.goalChip, selectedGoalHours === h && styles.goalChipActive]}
                onPress={() => setDailyGoalMs(h * 3600000)}
              >
                <Text style={[styles.goalChipText, selectedGoalHours === h && styles.goalChipTextActive]}>{h}h</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <View style={styles.sectionHeader}>
          <Icon name="Bell" size={20} color={Palette.tealDark} />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        <View style={[styles.settingsCard, Shadow.sm]}>
          {[
            { label: 'Usage Alerts', desc: 'Notify when you exceed goal', value: notificationsEnabled, onChange: setNotificationsEnabled },
            { label: 'Weekly Report', desc: 'Sunday summary', value: weeklyReport, onChange: setWeeklyReport },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDesc}>{item.desc}</Text>
                </View>
                <Switch
                  value={item.value} onValueChange={item.onChange}
                  trackColor={{ false: '#E0E0E0', true: Palette.mint }}
                  thumbColor={item.value ? Palette.tealDark : '#FFFFFF'}
                />
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <View style={styles.sectionHeader}>
          <Icon name="Settings" size={20} color={Palette.tealDark} />
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        <View style={[styles.settingsCard, Shadow.sm]}>
          {[
            { label: 'Dark Mode', desc: 'Coming soon', value: darkMode, onChange: setDarkMode },
            { label: 'Haptic Feedback', desc: 'Vibrate on interactions', value: haptics, onChange: setHaptics },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDesc}>{item.desc}</Text>
                </View>
                <Switch
                  value={item.value} onValueChange={item.onChange}
                  trackColor={{ false: '#E0E0E0', true: Palette.mint }}
                  thumbColor={item.value ? Palette.tealDark : '#FFFFFF'}
                />
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(400)}>
        <View style={styles.sectionHeader}>
          <Icon name="Shield" size={20} color={Palette.tealDark} />
          <Text style={styles.sectionTitle}>Privacy</Text>
        </View>
        <View style={[styles.settingsCard, Shadow.sm]}>
          {PRIVACY_ITEMS.map((item, i) => (
            <View key={item.title}>
              <Pressable
                style={styles.privacyRow}
                onPress={item.action ? () => Alert.alert('Delete Data', 'Wipe history?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive' }]) : undefined}
              >
                <Icon name={item.iconName as IconName} size={22} color={item.action ? '#E53935' : Palette.grey800} style={{ marginRight: Spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{item.title}</Text>
                  <Text style={styles.settingDesc}>{item.desc}</Text>
                </View>
                {item.action && <Text style={{ fontSize: 16, color: '#E53935' }}>→</Text>}
              </Pressable>
              {i < PRIVACY_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </Animated.View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Main Screen Component ───────────────────────────────────────────────────

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Global Header */}
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Your Profile</Text>
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {TABS.map(tab => (
              <Pressable
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Renders the correct migrated view */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Stats' && <StatsTab />}
        {activeTab === 'Analytics' && <AnalyticsScreen />}
        {activeTab === 'Sleep' && <SleepScreen />}
        {activeTab === 'Summary' && <SummaryScreen />}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bgLight,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E8',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    zIndex: 10,
  },
  topHeaderTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: '#2D3433',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  tabContainer: {
    marginBottom: 0,
  },
  tabScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    paddingBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F0F4F3',
  },
  tabBtnActive: {
    backgroundColor: Palette.tealDark,
  },
  tabText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: '#596060',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  
  // Shared
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Palette.tealDark, marginTop: 0, marginBottom: Spacing.sm },
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: Spacing.base },

  // Overview Tab
  profileCard: { marginBottom: Spacing.sm },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.base },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  userName: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Palette.tealDark },
  userSub: { fontSize: Typography.size.sm, color: Palette.grey600, marginTop: 2 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  nameInput: { flex: 1, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Palette.tealDark, borderBottomWidth: 1.5, borderBottomColor: Palette.tealDark },
  nameSaveBtn: { padding: 4 },
  quickStats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: Radius.md, padding: Spacing.md },
  quickStat: { flex: 1, alignItems: 'center', gap: 4 },
  quickStatVal: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Palette.tealDark },
  quickStatLabel: { fontSize: Typography.size.xs, color: Palette.grey600 },
  goalCurrent: { fontSize: Typography.size.sm, color: Palette.grey600, marginBottom: Spacing.md },
  goalRow: { gap: Spacing.sm, paddingBottom: 2 },
  goalChip: { width: 52, height: 52, borderRadius: 26, backgroundColor: Palette.grey100, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  goalChipActive: { borderColor: Palette.tealDark, backgroundColor: '#F0FFF4' },
  goalChipText: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Palette.grey400 },
  goalChipTextActive: { color: Palette.tealDark, fontWeight: Typography.weight.bold },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  settingLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Palette.grey800, marginBottom: 2 },
  settingDesc: { fontSize: Typography.size.xs, color: Palette.grey400, maxWidth: 220 },
  divider: { height: 1, backgroundColor: Palette.grey100, marginVertical: Spacing.md },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.xs },

  // Stats Tab
  cardLabel: { fontSize: Typography.size.xs, fontWeight: '700', color: Palette.tealDark, marginBottom: Spacing.xs, textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreHint: { fontSize: Typography.size.md, fontWeight: '600', color: Palette.tealDark, marginBottom: Spacing.sm },
  goalText: { fontSize: Typography.size.xs, color: Palette.grey600, marginBottom: 4 },
  progressBg: { height: 6, backgroundColor: '#D0E8D8', borderRadius: 3, marginBottom: Spacing.sm },
  progressFill: { height: '100%', borderRadius: 3 },
  breakdownRow: { gap: 5, marginBottom: Spacing.sm },
  factor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factorLabel: { width: 42, fontSize: 9, color: Palette.tealDark, fontWeight: '600', opacity: 0.7 },
  factorBarBg: { flex: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' },
  factorBarFill: { height: '100%', borderRadius: 2 },
  factorVal: { width: 18, fontSize: 9, color: Palette.tealDark, textAlign: 'right', fontWeight: '700', opacity: 0.8 },
  realDataBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  realDataText: { fontSize: 10, color: '#2E7D32', fontWeight: '700' },
  statsRow: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  livePillText: { fontSize: 10, color: '#2E7D32', fontWeight: '700' },
  appRow: { backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center' },
  appName: { fontSize: Typography.size.base, fontWeight: '600', color: Palette.grey800 },
  barBg: { height: 6, backgroundColor: '#EEF5F0', borderRadius: 3, marginTop: 8 },
  barFill: { height: '100%', borderRadius: 3 },
  appTime: { fontSize: Typography.size.md, fontWeight: '700', color: Palette.tealDark },
  appPct: { fontSize: Typography.size.xs, color: Palette.grey400 },
});
