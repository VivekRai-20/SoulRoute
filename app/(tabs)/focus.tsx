import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Icon, IconName } from '@/components/ui/Icon';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useWellbeing } from '@/context/WellbeingContext';
import { AppIcon } from '@/components/ui/AppIcon';
import { OptimizedTimerRing } from '@/components/ui/OptimizedTimerRing';
import { GradientCard } from '@/components/ui/GradientCard';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';
import { saveBlockedApps, startFocusBlocking, stopFocusBlocking } from '@/services/deviceStats';
import type { FocusSession, AppUsage } from '@/types';

const DURATIONS = [
  { label: '5 min', value: 5, iconName: 'Zap' },
  { label: '25 min', value: 25, iconName: 'Timer' },
  { label: '50 min', value: 50, iconName: 'Flame' },
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

// ─── Sub-component: Memoized App Row ──────────────────────────────────────────

const AppRow = React.memo(({ 
  app, 
  isBlocked, 
  onToggle 
}: { 
  app: { packageName: string; appName: string }; 
  isBlocked: boolean; 
  onToggle: (pkg: string) => void;
}) => (
  <View style={styles.appRow}>
    <AppIcon packageName={app.packageName} size={32} />
    <Text style={styles.appName} numberOfLines={1}>{app.appName}</Text>
    <TouchableOpacity
      style={[
        styles.blockToggle,
        { backgroundColor: isBlocked ? '#FFEBEE' : '#F0FFF4' },
      ]}
      onPress={() => onToggle(app.packageName)}
    >
      <Icon 
        name={isBlocked ? 'ShieldOff' : 'ShieldCheck'} 
        size={14} 
        color={isBlocked ? '#C62828' : '#2E7D32'} 
        strokeWidth={2} 
      />
      <Text style={[styles.blockToggleText, { color: isBlocked ? '#C62828' : '#2E7D32' }]}>
        {isBlocked ? ' Blocked' : ' Allowed'}
      </Text>
    </TouchableOpacity>
  </View>
));

export default function FocusScreen() {
  const { 
    focusMode, 
    setFocusMode, 
    apps, 
    allApps,
    fetchAllApps,
    permissions, 
    openOverlaySettings,
    todayFocusSessions,
    todayFocusMinutes,
    todayFocusCount,
    saveSession,
    addXP,
  } = useWellbeing();

  const [selectedDuration, setSelectedDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [blockedPackages, setBlockedPackages] = useState<Set<string>>(new Set(['com.instagram.android', 'com.whatsapp']));
  const [showAllApps, setShowAllApps] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseScale = useSharedValue(1);

  const totalSeconds = selectedDuration * 60;
  const progress = secondsLeft / totalSeconds;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      pulseScale.value = withRepeat(withSequence(withTiming(1.03, { duration: 1500 }), withTiming(1, { duration: 1500 })), -1);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulseScale.value = withTiming(1);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const completeSession = () => {
    setRunning(false);
    setFocusMode(false);
    if (sessionStartTime) {
      saveSession({
        startTime: sessionStartTime,
        durationMinutes: selectedDuration,
        completed: true,
        blockedApps: Array.from(blockedPackages),
      });
      addXP(5);
    }
    Alert.alert('🎉 Focus Session Complete!', 'Great job!');
  };

  const handleStart = async () => {
    if (secondsLeft === 0) setSecondsLeft(selectedDuration * 60);
    try {
      await saveBlockedApps(Array.from(blockedPackages));
      await startFocusBlocking();
      setSessionStartTime(new Date().toISOString());
      setRunning(true);
      setFocusMode(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to start blocking service.');
    }
  };

  const handlePause = async () => {
    await stopFocusBlocking();
    setRunning(false);
    setFocusMode(false);
  };

  const handleReset = async () => {
    await stopFocusBlocking();
    setRunning(false);
    setFocusMode(false);
    setSecondsLeft(selectedDuration * 60);
  };

  const toggleBlock = useCallback((pkg: string) => {
    setBlockedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  }, []);

  // Header Component for FlatList
  const listHeaderNode = (
    <View>
      <Animated.View entering={FadeInDown.duration(500)}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.title}>Focus Mode</Text>
            <Icon name="Target" size={24} color={Palette.tealDark} />
          </View>
          <Text style={styles.subtitle}>
            {todayFocusCount > 0
              ? `${todayFocusCount} session${todayFocusCount > 1 ? 's' : ''} · ${todayFocusMinutes} min today 🏆`
              : 'Block distractions, stay in flow'}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[
              styles.durationBtn,
              selectedDuration === d.value && styles.durationBtnActive,
              running && styles.durationBtnDisabled,
            ]}
            onPress={() => {
              if (running) return;
              setSelectedDuration(d.value);
              setSecondsLeft(d.value * 60);
            }}
            disabled={running}
          >
            <Icon
              name={d.iconName as IconName}
              size={22}
              color={selectedDuration === d.value ? Palette.tealDark : Palette.grey400}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.durationLabel, selectedDuration === d.value && styles.durationLabelActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={styles.timerWrap}>
        <Animated.View style={[styles.timerOuter, pulseStyle]}>
          <View style={[styles.glassCircle, Shadow.md]}>
            <OptimizedTimerRing progress={progress} running={running} />
            <View style={styles.timerCenter}>
              <Text style={[styles.timerText, { color: running ? Palette.tealDark : Palette.grey600 }]}>
                {pad(Math.floor(secondsLeft / 60))}:{pad(secondsLeft % 60)}
              </Text>
              <Text style={styles.timerStatus}>
                {running ? '● Focusing...' : secondsLeft === 0 ? '✓ Done!' : '● Ready'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <View style={styles.controls}>
        {!running ? (
          <TouchableOpacity style={[styles.startBtn, Shadow.lg]} onPress={handleStart}>
            <Icon name="Play" size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.startBtnText}>{secondsLeft === 0 ? ' Restart' : '  Start Focus'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.pauseBtn, Shadow.md]} onPress={handlePause}>
            <Icon name="Pause" size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.pauseBtnText}>  Pause</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Icon name="RotateCcw" size={20} color={Palette.grey600} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Blocked Apps</Text>
      {permissions.checked && !permissions.overlayAccess && (
        <TouchableOpacity style={styles.overlayWarning} onPress={openOverlaySettings}>
          <Icon name="ShieldAlert" size={20} color="#E65100" />
          <View style={{ flex: 1 }}>
            <Text style={styles.overlayWarningTitle}>Permission Required</Text>
            <Text style={styles.overlayWarningDesc}>'Display over other apps' is needed for blocking. Tap to fix.</Text>
          </View>
          <Icon name="ChevronRight" size={18} color="#E65100" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Footer Component for FlatList
  const listFooterNode = (
    <View style={{ paddingBottom: 40 }}>
      {allApps.length === 0 && !showAllApps && (
        <TouchableOpacity 
          style={styles.seeMoreBtn} 
          onPress={async () => {
            setLoadingAll(true);
            await fetchAllApps();
            setLoadingAll(false);
            setShowAllApps(true);
          }}
        >
          {loadingAll ? (
            <Text style={styles.seeMoreText}>Loading all apps...</Text>
          ) : (
            <>
              <Text style={styles.seeMoreText}>Show all installed apps</Text>
              <Icon name="ChevronDown" size={16} color={Palette.teal} />
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Focus Tips Card */}
      <GradientCard colors={['#A8D5BA', '#C8E6C9']} style={{ marginTop: Spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
          <Icon name="Lightbulb" size={18} color={Palette.tealDark} />
          <Text style={styles.tipTitle}>Focus Tips</Text>
        </View>
        <Text style={styles.tipItem}>• Put your phone face-down during the session</Text>
        <Text style={styles.tipItem}>• Use headphones with calm music or silence</Text>
        <Text style={styles.tipItem}>• Take a 5-min walk after each session</Text>
      </GradientCard>
    </View>
  );



  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Data for FlatList
  const visibleApps = useMemo(() => {
    const usageApps = apps.map(a => ({ packageName: a.packageName, appName: a.appName }));
    if (!showAllApps) return usageApps.slice(0, 10);
    
    // Merge usage apps with all apps to avoid dupes
    const seen = new Set(usageApps.map(a => a.packageName));
    const merged = [...usageApps];
    for (const a of allApps) {
      if (!seen.has(a.packageName)) merged.push(a);
    }
    return merged;
  }, [apps, allApps, showAllApps]);

  const renderApp: ListRenderItem<{packageName: string, appName: string}> = ({ item }) => (
    <AppRow 
      app={item} 
      isBlocked={blockedPackages.has(item.packageName)} 
      onToggle={toggleBlock} 
    />
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#F0FFF4', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <FlatList
        data={visibleApps}
        keyExtractor={(item) => item.packageName}
        renderItem={renderApp}
        ListHeaderComponent={listHeaderNode}
        ListFooterComponent={listFooterNode}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: Palette.grey400, marginTop: 20 }}>No apps found</Text>}
      />
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
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    marginTop: 4,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  durationBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  durationBtnActive: {
    borderColor: Palette.tealDark,
    backgroundColor: '#F0FFF4',
  },
  durationBtnDisabled: {
    opacity: 0.5,
  },
  durationLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Palette.grey400,
  },
  durationLabelActive: {
    color: Palette.tealDark,
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  timerOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.extrabold,
    letterSpacing: 2,
  },
  timerStatus: {
    fontSize: Typography.size.sm,
    color: Palette.grey400,
    marginTop: 4,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  startBtn: {
    flex: 1,
    backgroundColor: Palette.tealDark,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  startBtnText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  pauseBtnText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  resetBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
    marginBottom: Spacing.sm,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F4F1',
  },
  appName: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Palette.grey800,
    fontWeight: '500',
    marginLeft: Spacing.md,
  },
  blockToggle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blockToggleText: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  overlayWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  overlayWarningTitle: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: '#E65100',
  },
  overlayWarningDesc: {
    fontSize: 11,
    color: '#EF6C00',
  },
  tipTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
  },
  tipItem: {
    fontSize: Typography.size.sm,
    color: Palette.tealDark,
    marginTop: 4,
    opacity: 0.8,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.base,
  },
  seeMoreText: {
    color: Palette.teal,
    fontWeight: '600',
  },
  glassCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 200,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});
