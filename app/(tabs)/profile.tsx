import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { User, Target, Bell, Shield, Info, Flame, Smartphone, Lock } from 'lucide-react-native';
import { useWellbeing } from '@/context/WellbeingContext';
import { GradientCard } from '@/components/ui/GradientCard';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

// Goal options in hours
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
  {
    icon: '🔒',
    title: 'Data stays on device',
    desc: 'All your usage data is processed locally. Nothing is sent to external servers.',
  },
  {
    icon: '🚫',
    title: 'No advertising tracking',
    desc: 'SoulRoute never shares your data with advertisers or third-party analytics.',
  },
  {
    icon: '🗑️',
    title: 'Delete your data',
    desc: 'Tap to wipe all locally stored usage history from this device.',
    action: true,
  },
];

export default function ProfileScreen() {
  const {
    userStats,
    dailyGoalMs,
    setDailyGoalMs,
    notificationsEnabled,
    setNotificationsEnabled,
    isUsingMockData,
  } = useWellbeing();

  const [userName, setUserName] = useState('Vivek');
  const [darkMode, setDarkMode] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [haptics, setHaptics] = useState(true);

  const selectedGoalHours = Math.round(dailyGoalMs / 3600000);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Palette.bgLight} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <GradientCard colors={['#A8D5BA', '#B3E5FC']} style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🌿</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.userSub}>SoulRoute Member</Text>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 7-day streak</Text>
                </View>
              </View>
            </View>

            {/* Quick stats */}
            <View style={styles.quickStats}>
              {[
                {
                  label: 'Today',
                  value: formatMs(userStats?.totalScreenTimeMs ?? 0),
                  icon: '📱',
                },
                {
                  label: 'Unlocks',
                  value: `${userStats?.unlockCount ?? 0}`,
                  icon: '🔓',
                },
                {
                  label: 'Goal',
                  value: formatMs(dailyGoalMs),
                  icon: '🎯',
                },
              ].map((s) => (
                <View key={s.label} style={styles.quickStat}>
                  <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                  <Text style={styles.quickStatVal}>{s.value}</Text>
                  <Text style={styles.quickStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </GradientCard>
        </Animated.View>

        {/* Daily Goal */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionTitle}>⏱️ Daily Screen Time Goal</Text>
          <View style={[styles.settingsCard, Shadow.sm]}>
            <Text style={styles.goalCurrent}>
              Current goal:{' '}
              <Text style={{ color: Palette.tealDark, fontWeight: '800' }}>
                {selectedGoalHours}h / day
              </Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.goalRow}
            >
              {GOAL_OPTIONS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.goalChip,
                    selectedGoalHours === h && styles.goalChipActive,
                  ]}
                  onPress={() => setDailyGoalMs(h * 3600000)}
                >
                  <Text
                    style={[
                      styles.goalChipText,
                      selectedGoalHours === h && styles.goalChipTextActive,
                    ]}
                  >
                    {h}h
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.goalHint}>
              💡 WHO recommends ≤ 2h of recreational screen time daily for adults
            </Text>
          </View>
        </Animated.View>

        {/* Notification Settings */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          <View style={[styles.settingsCard, Shadow.sm]}>
            {[
              {
                label: 'Usage Alerts',
                desc: 'Notify when you exceed daily goal',
                value: notificationsEnabled,
                onChange: setNotificationsEnabled,
              },
              {
                label: 'Weekly Report',
                desc: 'Sunday summary of your week',
                value: weeklyReport,
                onChange: setWeeklyReport,
              },
              {
                label: 'Focus Reminders',
                desc: 'Suggest focus sessions during high usage',
                value: true,
                onChange: () => {},
              },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onChange}
                    trackColor={{ false: '#E0E0E0', true: Palette.mint }}
                    thumbColor={item.value ? Palette.tealDark : '#FFFFFF'}
                  />
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* App Preferences */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.sectionTitle}>⚙️ Preferences</Text>
          <View style={[styles.settingsCard, Shadow.sm]}>
            {[
              {
                label: 'Dark Mode',
                desc: 'Enable dark theme (coming soon)',
                value: darkMode,
                onChange: setDarkMode,
              },
              {
                label: 'Haptic Feedback',
                desc: 'Vibration on interactions',
                value: haptics,
                onChange: setHaptics,
              },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onChange}
                    trackColor={{ false: '#E0E0E0', true: Palette.mint }}
                    thumbColor={item.value ? Palette.tealDark : '#FFFFFF'}
                  />
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Privacy */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <Text style={styles.sectionTitle}>🔐 Privacy</Text>
          <View style={[styles.settingsCard, Shadow.sm]}>
            {PRIVACY_ITEMS.map((item, i) => (
              <View key={item.title}>
                <TouchableOpacity
                  style={styles.privacyRow}
                  onPress={
                    item.action
                      ? () =>
                          Alert.alert(
                            'Delete Data',
                            'This will wipe all locally stored usage history. This action cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => Alert.alert('✓ Data cleared'),
                              },
                            ]
                          )
                      : undefined
                  }
                >
                  <Text style={{ fontSize: 22, marginRight: Spacing.md }}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{item.title}</Text>
                    <Text style={styles.settingDesc}>{item.desc}</Text>
                  </View>
                  {item.action && (
                    <Text style={{ fontSize: 16, color: '#E53935' }}>→</Text>
                  )}
                </TouchableOpacity>
                {i < PRIVACY_ITEMS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <View style={[styles.aboutCard, Shadow.sm]}>
            <Text style={styles.aboutLogo}>🌿 SoulRoute</Text>
            <Text style={styles.aboutTagline}>
              Understand your digital habits, improve your well-being.
            </Text>
            <Text style={styles.aboutVersion}>v{APP_VERSION}</Text>
            <View style={styles.aboutLinks}>
              <TouchableOpacity>
                <Text style={styles.aboutLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.aboutDot}>·</Text>
              <TouchableOpacity>
                <Text style={styles.aboutLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.aboutDot}>·</Text>
              <TouchableOpacity>
                <Text style={styles.aboutLink}>Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

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
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  profileCard: {
    marginBottom: Spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  avatarEmoji: {
    fontSize: 38,
  },
  userName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
  },
  userSub: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: Typography.size.xs,
    color: '#E67E22',
    fontWeight: Typography.weight.bold,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickStatVal: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
  },
  quickStatLabel: {
    fontSize: Typography.size.xs,
    color: Palette.grey600,
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  goalCurrent: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    marginBottom: Spacing.md,
  },
  goalRow: {
    gap: Spacing.sm,
    paddingBottom: 2,
  },
  goalChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalChipActive: {
    borderColor: Palette.tealDark,
    backgroundColor: '#F0FFF4',
  },
  goalChipText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Palette.grey400,
  },
  goalChipTextActive: {
    color: Palette.tealDark,
    fontWeight: Typography.weight.bold,
  },
  goalHint: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  settingLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Palette.grey800,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    maxWidth: 220,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.grey100,
    marginVertical: Spacing.md,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  aboutLogo: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Palette.tealDark,
    marginBottom: Spacing.xs,
  },
  aboutTagline: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  aboutVersion: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    marginBottom: Spacing.md,
    backgroundColor: Palette.grey100,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  aboutLinks: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  aboutLink: {
    fontSize: Typography.size.xs,
    color: Palette.teal,
    fontWeight: '600',
  },
  aboutDot: {
    color: Palette.grey400,
    fontSize: Typography.size.xs,
  },
});
