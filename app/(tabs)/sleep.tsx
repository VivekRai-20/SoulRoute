import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { GradientCard } from '@/components/ui/GradientCard';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';
import { acceptWindDownChallenge, isTodayWindDownAccepted, getBedtime, saveBedtime } from '@/services/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.base * 2 - 8;

function formatMs(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const SLEEP_TIPS = [
  { iconName: 'Smartphone', text: 'Put your phone away 1 hour before bed' },
  { iconName: 'Lightbulb', text: 'Use Night Light mode from 9 PM onwards' },
  { iconName: 'Bath', text: 'Try a warm bath or light stretching' },
  { iconName: 'BookOpen', text: 'Replace scrolling with reading a book' },
  { iconName: 'Music', text: 'Play calming sleep soundscapes' },
];

const QUALITY_LABELS = ['Poor', 'Fair', 'Okay', 'Good', 'Excellent'];
const QUALITY_COLORS = [
  Palette.fatigueCritical,
  Palette.fatigueHigh,
  Palette.fatigueMedium,
  '#66BB6A',
  '#4CAF50',
];

export default function SleepScreen() {
  const { nightUsage, userStats, notificationsEnabled, setNotificationsEnabled } =
    useWellbeing();

  const [bedtimeReminder, setBedtimeReminder] = useState(true);
  const [bedtime, setBedtime] = useState('10:30 PM');
  const [challengeAccepted, setChallengeAccepted] = useState(false);

  // Load persisted bedtime + challenge state
  useEffect(() => {
    (async () => {
      const [savedBedtime, accepted] = await Promise.all([
        getBedtime(),
        isTodayWindDownAccepted(),
      ]);
      setBedtime(savedBedtime);
      setChallengeAccepted(accepted);
    })();
  }, []);

  const handleBedtimeChange = async (bt: string) => {
    setBedtime(bt);
    await saveBedtime(bt);
  };

  const handleAcceptChallenge = async () => {
    await acceptWindDownChallenge();
    setChallengeAccepted(true);
  };

  // Derive sleep quality score (0–4)
  const nightMs = userStats?.nightUsageMs ?? 0;

  const qualityIndex = useMemo(() => {
    if (nightMs < 5 * 60000) return 4;
    if (nightMs < 15 * 60000) return 3;
    if (nightMs < 30 * 60000) return 2;
    if (nightMs < 60 * 60000) return 1;
    return 0;
  }, [nightMs]);

  const qualityLabel = QUALITY_LABELS[qualityIndex];
  const qualityColor = QUALITY_COLORS[qualityIndex];

  const nightBarData = useMemo(() => ({
    labels: nightUsage.map((n) => n.hour),
    datasets: [{ data: nightUsage.map((n) => Math.max(n.minutes, 1)) }],
  }), [nightUsage]);

  const BEDTIMES = ['9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1c3d" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* New Premium Header */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <GradientCard 
            colors={['#1a1c3d', '#4527A0']} 
            style={styles.headerCard}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Rest and Recovery</Text>
                <Text style={styles.headerSub}>
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Text>
              </View>
              <View style={styles.moonIconWrap}>
                 <Icon name="Moon" size={28} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.headerStats}>
              <View style={styles.headerStatItem}>
                 <Text style={styles.headerStatValue}>{formatMs(nightMs)}</Text>
                 <Text style={styles.headerStatLabel}>Night Usage</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStatItem}>
                 <Text style={[styles.headerStatValue, { color: qualityColor }]}>{qualityLabel}</Text>
                 <Text style={styles.headerStatLabel}>Sleep Quality</Text>
              </View>
            </View>
          </GradientCard>
        </Animated.View>

        {/* Quality Breakdown Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <View style={[styles.card, Shadow.md]}>
            <View style={styles.sectionHeader}>
              <Icon name="Activity" size={18} color={Palette.tealDark} />
              <Text style={styles.sectionTitle}>Quality Analysis</Text>
            </View>
            <View style={styles.qualityVisual}>
               <View style={styles.qualityDots}>
                {QUALITY_LABELS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i <= qualityIndex ? QUALITY_COLORS[i] : '#E0E0E0',
                        width: i === qualityIndex ? 36 : 8,
                        flex: i === qualityIndex ? 1 : 0,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.qualityHint}>
                {qualityIndex >= 3 
                  ? "Your night screen habits are excellent! This helps your circadian rhythm."
                  : "Try to reduce usage between 10 PM and 6 AM to improve REM sleep."}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Night Usage Chart */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <View style={[styles.card, Shadow.md]}>
            <View style={styles.sectionHeader}>
              <Icon name="BarChart2" size={18} color={Palette.tealDark} />
              <Text style={styles.sectionTitle}>Usage Patterns</Text>
            </View>
            <BarChart
              data={nightBarData}
              width={CHART_WIDTH - 32}
              height={180}
              chartConfig={{
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                color: (opacity = 1) => `rgba(69, 39, 160, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(90, 70, 120, ${opacity})`,
                barPercentage: 0.6,
                decimalPlaces: 0,
                propsForBackgroundLines: {
                  strokeDasharray: '0',
                  stroke: '#F0F0F0',
                },
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              yAxisLabel=""
              yAxisSuffix="m"
            />
          </View>
        </Animated.View>

        {/* Settings and Bedtime */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <View style={[styles.card, Shadow.md]}>
            <View style={styles.sectionHeader}>
              <Icon name="Settings" size={18} color={Palette.tealDark} />
              <Text style={styles.sectionTitle}>Bedtime Controls</Text>
            </View>
            
            <View style={styles.settingRow}>
               <View>
                 <Text style={styles.settingLabel}>Wind-down Reminder</Text>
                 <Text style={styles.settingDesc}>Notify me at {bedtime}</Text>
               </View>
               <Switch
                 value={bedtimeReminder}
                 onValueChange={setBedtimeReminder}
                 trackColor={{ false: '#E0E0E0', true: Palette.mint }}
                 thumbColor={bedtimeReminder ? Palette.tealDark : '#FFFFFF'}
               />
            </View>

            {bedtimeReminder && (
              <View style={styles.bedtimePicker}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
                  {BEDTIMES.map((bt) => (
                    <Pressable android_ripple={{color: 'rgba(0,0,0,0.08)'}}
                      key={bt}
                      style={[styles.timeChip, bedtime === bt && styles.timeChipActive]}
                      onPress={() => handleBedtimeChange(bt)}
                    >
                      <Text style={[styles.timeChipText, bedtime === bt && styles.timeChipTextActive]}>{bt}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Tonight's Challenge */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
           <GradientCard colors={['#7986CB', '#9FA8DA']} style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Icon name="Trophy" size={24} color="#FFF" />
              <Text style={styles.challengeTitle}>Wind-down Challenge</Text>
            </View>
            <Text style={styles.challengeText}>
              Reduce usage to <Text style={{fontWeight: '700'}}>under 5 mins</Text> after {bedtime} for bonus XP!
            </Text>
            {challengeAccepted ? (
               <View style={styles.statusBadge}>
                 <Icon name="CheckCircle" size={16} color="#FFF" />
                 <Text style={styles.statusText}>Committed for tonight</Text>
               </View>
            ) : (
              <Pressable android_ripple={{color: 'rgba(0,0,0,0.08)'}} style={styles.acceptBtn} onPress={handleAcceptChallenge}>
                <Text style={styles.acceptBtnText}>Accept Challenge</Text>
              </Pressable>
            )}
           </GradientCard>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
           <Text style={styles.sectionLabel}>Practical Tips</Text>
           <View style={styles.tipsList}>
             {SLEEP_TIPS.map((tip, i) => (
               <View key={i} style={styles.tipItem}>
                  <View style={styles.tipIconWrap}>
                    <Icon name={tip.iconName as any} size={18} color="#5E35B1" />
                  </View>
                  <Text style={styles.tipText}>{tip.text}</Text>
               </View>
             ))}
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
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  headerCard: {
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    marginBottom: Spacing.lg,
    ...Shadow.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  moonIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerStatValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  headerStatLabel: {
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.grey800,
  },
  qualityVisual: {
    alignItems: 'stretch',
  },
  qualityDots: {
    flexDirection: 'row',
    gap: 6,
    height: 8,
    marginBottom: Spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  qualityHint: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  chart: {
    borderRadius: Radius.md,
    marginTop: 8,
    marginLeft: -16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Palette.grey800,
  },
  settingDesc: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
  },
  bedtimePicker: {
    marginTop: Spacing.sm,
  },
  timeScroll: {
    gap: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: '#F3E5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  timeChipActive: {
    borderColor: '#4527A0',
    backgroundColor: '#EDE7F6',
  },
  timeChipText: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    fontWeight: '500',
  },
  timeChipTextActive: {
    color: '#4527A0',
    fontWeight: '700',
  },
  challengeCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  challengeTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#FFF',
  },
  challengeText: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  acceptBtn: {
    backgroundColor: '#FFF',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  acceptBtnText: {
    color: '#4527A0',
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFF',
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
    marginBottom: Spacing.sm,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Palette.grey800,
  },
});
