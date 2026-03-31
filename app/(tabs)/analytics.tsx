import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.base * 2 - 8;

const CHART_CONFIG = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#F0FFF4',
  color: (opacity = 1) => `rgba(45, 106, 79, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(90, 122, 112, ${opacity})`,
  strokeWidth: 2.5,
  barPercentage: 0.55,
  decimalPlaces: 0,
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#2D6A4F',
    fill: '#A8D5BA',
  },
  propsForBackgroundLines: {
    stroke: '#E0EDE5',
    strokeDasharray: '4',
  },
};

type TabKey = 'screentime' | 'apps' | 'notifications';

export default function AnalyticsScreen() {
  const { 
    weeklyTrend, 
    categoryBreakdown, 
    notifications, 
    loading, 
    isUsingMockData, 
    permissions, 
    isNotificationServiceActive,
    openNotificationSettings,
    openUsageSettings,
    refreshAll
  } = useWellbeing();
  const [activeTab, setActiveTab] = useState<TabKey>('screentime');

  const trendLabels = weeklyTrend.map((d) => d.date);
  const screenTimeHours = weeklyTrend.map((d) =>
    parseFloat((d.screenTimeMs / 3600000).toFixed(1))
  );
  const unlockData = weeklyTrend.map((d) => d.unlockCount);
  
  const hasUsageData = screenTimeHours.some(h => h > 0);
  const hasNotifData = notifications.length > 0 || weeklyTrend.some(d => d.notificationCount > 0);

  const pieData = categoryBreakdown.slice(0, 5).map((c) => ({
    name: c.category,
    population: c.totalTimeMs,
    color: c.color,
    legendFontColor: Palette.grey800,
    legendFontSize: 12,
  }));

  const notifBarData = {
    labels: trendLabels,
    datasets: [
      {
        data: weeklyTrend.map((d) => d.notificationCount),
      },
    ],
  };

  const TABS: { key: TabKey; label: string; iconName: IconName }[] = [
    { key: 'screentime', label: 'Screen Time', iconName: 'Smartphone' },
    { key: 'apps', label: 'App Categories', iconName: 'LayoutGrid' },
    { key: 'notifications', label: 'Notifications', iconName: 'Bell' },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <SkeletonCard />
          <View style={{ height: 16 }} />
          <SkeletonCard />
        </View>
      );
    }

    // Check specific permissions per tab
    const isMissingUsage = !permissions.usageAccess;
    const isMissingNotif = !permissions.notificationAccess || !isNotificationServiceActive;

    if ((activeTab === 'screentime' && !hasUsageData) || 
        (activeTab === 'apps' && categoryBreakdown.length === 0) ||
        (activeTab === 'notifications' && !hasNotifData)) {
      
      const showUsagePrompt = activeTab !== 'notifications' && isMissingUsage;
      const showNotifPrompt = activeTab === 'notifications' && isMissingNotif;

      return (
        <View style={styles.emptyState}>
          <Icon name={showUsagePrompt || showNotifPrompt ? "ShieldAlert" : "Search"} size={48} color={Palette.grey400} />
          <Text style={styles.emptyTitle}>
            {showUsagePrompt || showNotifPrompt ? "Permissions Required" : "No Data Recorded"}
          </Text>
          <Text style={styles.emptySub}>
            {showUsagePrompt 
              ? "We need Usage Access to track your app time and trends."
              : showNotifPrompt
                ? "Notification Access is required to count incoming alerts."
                : "Your device hasn't recorded any data for this period yet."}
          </Text>
          
          {showUsagePrompt && (
            <TouchableOpacity style={styles.actionBtn} onPress={openUsageSettings}>
              <Text style={styles.actionBtnText}>Grant Usage Access</Text>
            </TouchableOpacity>
          )}

          {showNotifPrompt && (
            <TouchableOpacity style={styles.actionBtn} onPress={openNotificationSettings}>
              <Text style={styles.actionBtnText}>Grant Notification Access</Text>
            </TouchableOpacity>
          )}

          {!showUsagePrompt && !showNotifPrompt && (
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: Palette.mint}]} onPress={refreshAll}>
              <Text style={styles.actionBtnText}>Refresh Data</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <>
        {/* ── Screen Time Line Chart ──────────────────────── */}
        {activeTab === 'screentime' && (
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={[styles.chartCard, Shadow.md]}>
              <View style={styles.chartTitleRow}>
                <Icon name="TrendingUp" size={20} color={Palette.tealDark} />
                <Text style={styles.chartTitle}>Screen Time Trend (hours/day)</Text>
              </View>
              <LineChart
                data={{
                  labels: trendLabels.length ? trendLabels : ['-'],
                  datasets: [
                    { data: screenTimeHours.length ? screenTimeHours : [0], color: () => Palette.tealDark, strokeWidth: 2.5 },
                  ],
                  legend: ['Screen Time (h)'],
                }}
                width={CHART_WIDTH}
                height={220}
                chartConfig={CHART_CONFIG}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines={false}
                withShadow={false}
              />
            </View>

            {/* Unlock trend */}
            <View style={[styles.chartCard, Shadow.md]}>
              <View style={styles.chartTitleRow}>
                <Icon name="Unlock" size={20} color="#FF9800" />
                <Text style={[styles.chartTitle, { color: '#FF9800' }]}>Phone Unlocks per Day</Text>
              </View>
              <LineChart
                data={{
                  labels: trendLabels.length ? trendLabels : ['-'],
                  datasets: [
                    {
                      data: unlockData.length ? unlockData : [0],
                      color: () => '#FF9800',
                      strokeWidth: 2,
                    },
                  ],
                  legend: ['Unlocks'],
                }}
                width={CHART_WIDTH}
                height={180}
                chartConfig={{
                  ...CHART_CONFIG,
                  color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                }}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines={false}
                withShadow={false}
              />
            </View>

            {/* Summary stats */}
            <View style={styles.summaryRow}>
              {[
                {
                  label: 'Avg Daily',
                  value: `${(screenTimeHours.reduce((a, b) => a + b, 0) / (screenTimeHours.length || 1)).toFixed(1)}h`,
                  color: Palette.tealDark,
                  bg: '#F0FFF4',
                  iconName: 'BarChart2',
                },
                {
                  label: 'Peak Day',
                  value: `${Math.max(...(screenTimeHours.length ? screenTimeHours : [0]))}h`,
                  color: '#E67E22',
                  bg: '#FFF8F0',
                  iconName: 'Zap',
                },
                {
                  label: 'Best Day',
                  value: `${Math.min(...(screenTimeHours.length ? screenTimeHours : [0]))}h`,
                  color: '#27AE60',
                  bg: '#F0FFF4',
                  iconName: 'Leaf',
                },
              ].map((item: any) => (
                <View
                  key={item.label}
                  style={[styles.summaryCard, { backgroundColor: item.bg }, Shadow.sm]}
                >
                  <Icon name={item.iconName} size={24} color={item.color} />
                  <Text style={[styles.summaryVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── App Category Pie Chart ──────────────────────── */}
        {activeTab === 'apps' && (
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={[styles.chartCard, Shadow.md]}>
              <View style={styles.chartTitleRow}>
                <Icon name="LayoutGrid" size={20} color={Palette.tealDark} />
                <Text style={styles.chartTitle}>App Usage by Category</Text>
              </View>
              {pieData.length > 0 ? (
                <PieChart
                  data={pieData}
                  width={CHART_WIDTH}
                  height={200}
                  chartConfig={CHART_CONFIG}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  center={[10, 0]}
                  absolute={false}
                  hasLegend
                />
              ) : (
                <Text style={styles.noDataText}>No category data available</Text>
              )}
            </View>

            {/* Category breakdown list */}
            <View style={[styles.chartCard, Shadow.sm]}>
              <Text style={styles.chartTitle}>Breakdown</Text>
              {categoryBreakdown.length > 0 ? (
                categoryBreakdown.map((cat) => (
                  <View key={cat.category} style={styles.catRow}>
                    <View
                      style={[styles.catDot, { backgroundColor: cat.color }]}
                    />
                    <Text style={styles.catName}>{cat.category}</Text>
                    <View style={styles.catBarBg}>
                      <View
                        style={[
                          styles.catBarFill,
                          {
                            width: `${cat.percentage}%` as any,
                            backgroundColor: cat.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.catPct}>{cat.percentage.toFixed(0)}%</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Notifications Bar Chart ─────────────────────── */}
        {activeTab === 'notifications' && (
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={[styles.chartCard, Shadow.md]}>
              <View style={styles.chartTitleRow}>
                <Icon name="Bell" size={20} color={Palette.tealDark} />
                <Text style={styles.chartTitle}>Notifications Trend (Last 7 Days)</Text>
              </View>
              <BarChart
                data={{
                  labels: notifBarData.labels.length ? notifBarData.labels : ['-'],
                  datasets: notifBarData.datasets
                }}
                width={CHART_WIDTH}
                height={220}
                chartConfig={{
                  ...CHART_CONFIG,
                  color: (opacity = 1) => `rgba(142, 68, 173, ${opacity})`,
                  barPercentage: 0.6,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                withInnerLines
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>

            {/* Notif list */}
            <View style={[styles.chartCard, Shadow.sm]}>
              <Text style={styles.chartTitle}>Top Apps (Today)</Text>
              {notifications.length > 0 ? (
                notifications.map((n, i) => (
                  <View key={n.packageName} style={styles.notifRow}>
                    <Text style={styles.notifRank}>#{i + 1}</Text>
                    <Text style={styles.notifApp}>{n.appName}</Text>
                    <View style={styles.notifBarBg}>
                      <View
                        style={[
                          styles.notifBarFill,
                          {
                            width: `${(n.count / (notifications[0].count || 1)) * 100}%` as any,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.notifCount}>{n.count}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No notifications recorded today</Text>
              )}
            </View>
          </Animated.View>
        )}
      </>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Palette.bgLight} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSub}>Last 7 days overview</Text>
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.iconName}
              size={18}
              color={activeTab === tab.key ? '#FFFFFF' : Palette.grey400}
              style={{ marginBottom: 4 }}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {renderContent()}
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
  center: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Palette.bgLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    ...Shadow.sm,
  },
  tabActive: {
    backgroundColor: Palette.tealDark,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Palette.grey400,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
  },
  chart: {
    borderRadius: Radius.md,
    marginLeft: -8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  summaryVal: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    marginTop: 2,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  catDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  catName: {
    width: 90,
    fontSize: Typography.size.sm,
    color: Palette.grey800,
    fontWeight: '500',
  },
  catBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEF5F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  catPct: {
    width: 32,
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    textAlign: 'right',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  notifRank: {
    width: 24,
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    fontWeight: '700',
  },
  notifApp: {
    width: 80,
    fontSize: Typography.size.sm,
    color: Palette.grey800,
    fontWeight: '500',
  },
  notifBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#EDE7F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  notifBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#9C27B0',
  },
  notifCount: {
    width: 28,
    fontSize: Typography.size.xs,
    color: '#9C27B0',
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
    marginTop: Spacing.base,
  },
  emptySub: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  noDataText: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  actionBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Palette.tealDark,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  actionBtnText: {
    color: Palette.white,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
});
