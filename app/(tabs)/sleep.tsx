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
  Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { GradientCard } from '@/components/ui/GradientCard';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

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

  // Derive sleep quality score (0–4)
  const nightMs = userStats?.nightUsageMs ?? 0;
  const qualityIndex =
    nightMs < 5 * 60000
      ? 4
      : nightMs < 15 * 60000
      ? 3
      : nightMs < 30 * 60000
      ? 2
      : nightMs < 60 * 60000
      ? 1
      : 0;

  const qualityLabel = QUALITY_LABELS[qualityIndex];
  const qualityColor = QUALITY_COLORS[qualityIndex];

  const nightBarData = {
    labels: nightUsage.map((n) => n.hour),
    datasets: [{ data: nightUsage.map((n) => n.minutes) }],
  };

  const BEDTIMES = ['9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Header — night gradient */}
      <View style={styles.nightHeader}>
        <Icon name="Moon" size={40} color="#FFFFFF" style={{ marginBottom: Spacing.xs }} />
        <Text style={styles.headerTitle}>Sleep & Night Usage</Text>
        <Text style={styles.headerSub}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Sleep Quality Badge */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={[styles.qualityCard, Shadow.lg]}>
            <View style={styles.qualityLeft}>
              <Text style={styles.qualityLabel}>Sleep Quality Score</Text>
              <Text style={[styles.qualityValue, { color: qualityColor }]}>
                {qualityLabel}
              </Text>
              <Text style={styles.qualityDetail}>
                Night usage:{' '}
                <Text style={{ fontWeight: '700', color: qualityColor }}>
                  {formatMs(userStats?.nightUsageMs ?? 0)}
                </Text>
              </Text>
            </View>
            <View
              style={[
                styles.qualityBadge,
                { backgroundColor: qualityColor + '1A' },
              ]}
            >
              <Icon
                name={qualityIndex >= 3 ? 'Smile' : qualityIndex === 2 ? 'Meh' : 'Frown'}
                size={48}
                color={qualityColor}
              />
              {/* Mini quality dots */}
              <View style={styles.qualityDots}>
                {QUALITY_LABELS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i <= qualityIndex ? QUALITY_COLORS[i] : '#E0E0E0',
                        width: i === qualityIndex ? 12 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Night Usage Chart */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)}>
          <View style={[styles.chartCard, Shadow.md]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon name="BarChart2" size={20} color="#4527A0" />
              <Text style={[styles.chartTitle, { marginBottom: 0 }]}>Night Usage Breakdown</Text>
            </View>
            <Text style={styles.chartSub}>Minutes used per hour (last night)</Text>
            <BarChart
              data={nightBarData}
              width={CHART_WIDTH}
              height={180}
              chartConfig={{
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#EDE7F6',
                color: (opacity = 1) => `rgba(94, 53, 177, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(90, 70, 120, ${opacity})`,
                barPercentage: 0.65,
                decimalPlaces: 0,
              }}
              style={{ borderRadius: Radius.md, marginLeft: -8 }}
              showValuesOnTopOfBars
              withInnerLines
              fromZero
              yAxisLabel=""
              yAxisSuffix="m"
            />
          </View>
        </Animated.View>

        {/* Sleep Suggestions */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="Moon" size={20} color="#4527A0" />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Sleep Suggestions</Text>
          </View>
          <View style={[styles.tipsCard, Shadow.sm, { marginTop: Spacing.sm }]}>
            {SLEEP_TIPS.map((tip, i) => (
              <View
                key={i}
                style={[
                  styles.tipRow,
                  i < SLEEP_TIPS.length - 1 && styles.tipBorder,
                ]}
              >
                <View style={styles.tipIconWrap}>
                  <Icon name={tip.iconName as IconName} size={22} color="#5E35B1" />
                </View>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Bedtime Settings */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.md }}>
            <Icon name="Clock" size={20} color="#4527A0" />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Bedtime Settings</Text>
          </View>
          <View style={[styles.settingsCard, Shadow.sm, { marginTop: Spacing.sm }]}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Bedtime Reminder</Text>
                <Text style={styles.settingDesc}>
                  Get notified {bedtime} to wind down
                </Text>
              </View>
              <Switch
                value={bedtimeReminder}
                onValueChange={setBedtimeReminder}
                trackColor={{ false: '#E0E0E0', true: Palette.mint }}
                thumbColor={bedtimeReminder ? Palette.tealDark : '#FFFFFF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Night Notifications</Text>
                <Text style={styles.settingDesc}>
                  Allow notifications after 10 PM
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E0E0E0', true: Palette.mint }}
                thumbColor={notificationsEnabled ? Palette.tealDark : '#FFFFFF'}
              />
            </View>

            {bedtimeReminder && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.settingLabel, { marginBottom: Spacing.sm }]}>
                  Set Bedtime
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.sm }}
                >
                  {BEDTIMES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      style={[
                        styles.timeChip,
                        bedtime === bt && styles.timeChipActive,
                      ]}
                      onPress={() => setBedtime(bt)}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          bedtime === bt && styles.timeChipTextActive,
                        ]}
                      >
                        {bt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </Animated.View>

        {/* Wind-down gradient card */}
        <Animated.View entering={FadeInDown.duration(500).delay(450)}>
          <GradientCard
            colors={['#7986CB', '#9FA8DA']}
            style={{ marginTop: Spacing.md }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
              <Icon name="Star" size={20} color="#FFFFFF" />
              <Text style={[styles.windDownTitle, { marginBottom: 0 }]}>Tonight's Challenge</Text>
            </View>
            <Text style={styles.windDownText}>
              Try putting your phone in another room at{' '}
              <Text style={{ fontWeight: '800', color: '#FFF' }}>{bedtime}</Text>{' '}
              and see how much better you feel tomorrow morning!
            </Text>
            <TouchableOpacity style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>Accept Challenge ✓</Text>
            </TouchableOpacity>
          </GradientCard>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3E5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  nightHeader: {
    backgroundColor: '#1A237E',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: Typography.size.sm,
    color: '#9FA8DA',
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  qualityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  qualityLeft: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  qualityValue: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    marginBottom: Spacing.xs,
  },
  qualityDetail: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
  },
  qualityBadge: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginLeft: Spacing.base,
  },
  qualityDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#4527A0',
    marginBottom: 4,
  },
  chartSub: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#4527A0',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tipBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0FF',
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Palette.grey800,
    lineHeight: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    maxWidth: 200,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: Spacing.md,
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
    borderColor: '#7B1FA2',
    backgroundColor: '#EDE7F6',
  },
  timeChipText: {
    fontSize: Typography.size.sm,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  timeChipTextActive: {
    color: '#7B1FA2',
    fontWeight: '700',
  },
  windDownTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  windDownText: {
    fontSize: Typography.size.sm,
    color: '#EDE7F6',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  acceptBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
});
