import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { useWellbeing } from '@/context/WellbeingContext';
import { GradientCard } from '@/components/ui/GradientCard';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';
import { getAppLogo, saveBlockedApps, startFocusBlocking, stopFocusBlocking } from '@/services/deviceStats';

const DURATIONS = [
  { label: '5 min', value: 5, iconName: 'Zap' },
  { label: '25 min', value: 25, iconName: 'Timer' },
  { label: '50 min', value: 50, iconName: 'Flame' },
];

// We'll use real apps now, but here's a fallback list for safety
const FALLBACK_APPS = [
  { appName: 'WhatsApp', packageName: 'com.whatsapp' },
  { appName: 'Instagram', packageName: 'com.instagram.android' },
  { appName: 'YouTube', packageName: 'com.google.android.youtube' },
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function FocusScreen() {
  const { 
    focusMode, 
    setFocusMode, 
    apps, 
    allApps,
    permissions, 
    openOverlaySettings 
  } = useWellbeing();
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  
  // New: real app state
  const [blockedPackages, setBlockedPackages] = useState<Set<string>>(new Set(['com.instagram.android', 'com.whatsapp']));
  const [iconCache, setIconCache] = useState<Record<string, string>>({});
  const [showAllApps, setShowAllApps] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ring animation (0–1 progress)
  const ringProgress = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const totalSeconds = selectedDuration * 60;

  // Countdown logic
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setFocusMode(false);
            setCompleted((c) => c + 1);
            ringProgress.value = withTiming(1, { duration: 400 });
            Alert.alert('🎉 Focus Session Complete!', 'Great job! Take a short break.');
            return 0;
          }
          ringProgress.value = withTiming((prev - 1) / totalSeconds, { duration: 900 });
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Pulse animation while running
  useEffect(() => {
    if (running) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1200 }),
          withTiming(0.1, { duration: 1200 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [running]);

  // Memoize the full list of apps (Usage apps + All installed apps without duplicates)
  const fullAppList = React.useMemo(() => {
    const usagePackages = new Set(apps.map(a => a.packageName));
    const list = [...apps];
    
    // Add apps from allApps that aren't in apps
    for (const a of allApps) {
      if (!usagePackages.has(a.packageName)) {
        list.push({
          packageName: a.packageName,
          appName: a.appName,
          category: 'Other' as any,
          totalTimeInForeground: 0,
          percentage: 0,
          iconColor: '#94A3B8',
        });
      }
    }
    return list;
  }, [apps, allApps]);

  // Fetch icons for apps as they appear
  useEffect(() => {
    const fetchIcons = async () => {
      // Fetch icons for visible apps (either top 10 or all if expanded)
      const visibleApps = showAllApps ? fullAppList : apps.slice(0, 10);
      for (const app of visibleApps) {
        if (!iconCache[app.packageName]) {
          const base64 = await getAppLogo(app.packageName);
          if (base64) {
            setIconCache(prev => ({ ...prev, [app.packageName]: base64 }));
          }
        }
      }
    };
    if (fullAppList.length > 0) fetchIcons();
  }, [fullAppList, apps, showAllApps]);

  const handleStart = async () => {
    if (secondsLeft === 0) {
      setSecondsLeft(selectedDuration * 60);
      ringProgress.value = 1;
    }

    try {
      // Save blocked list to native first
      await saveBlockedApps(Array.from(blockedPackages));
      // Start background tracker
      await startFocusBlocking();
      
      setRunning(true);
      setFocusMode(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to start blocking service. Please check permissions.');
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
    ringProgress.value = withTiming(1, { duration: 400 });
  };

  const handleDurationChange = (mins: number) => {
    if (running) return;
    setSelectedDuration(mins);
    setSecondsLeft(mins * 60);
    ringProgress.value = 1;
  };

  const toggleBlockPackage = (pkg: string) => {
    setBlockedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  };

  const ringStyle = useAnimatedStyle(() => {
    const deg = interpolate(ringProgress.value, [0, 1], [0, 360]);
    return {};
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = secondsLeft / totalSeconds;

  // Circle ring metrics
  const SIZE = 240;
  const R = 110;
  const circumference = 2 * Math.PI * R;
  const ringColor = running ? Palette.tealDark : Palette.grey400;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Palette.bgLight} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.title}>Focus Mode</Text>
              <Icon name="Target" size={24} color={Palette.tealDark} />
            </View>
            <Text style={styles.subtitle}>
              {completed > 0
                ? `${completed} session${completed > 1 ? 's' : ''} completed today 🏆`
                : 'Block distractions, stay in flow'}
            </Text>
          </View>
        </Animated.View>

        {/* Duration picker */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[
                  styles.durationBtn,
                  selectedDuration === d.value && styles.durationBtnActive,
                  running && styles.durationBtnDisabled,
                ]}
                onPress={() => handleDurationChange(d.value)}
                disabled={running}
              >
                <Icon
                  name={d.iconName as IconName}
                  size={22}
                  color={selectedDuration === d.value ? Palette.tealDark : Palette.grey400}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={[
                    styles.durationLabel,
                    selectedDuration === d.value && styles.durationLabelActive,
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Timer Ring */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.timerWrap}
        >
          {/* Glow behind ring */}
          <Animated.View style={[styles.glow, glowStyle]} />

          <Animated.View style={[styles.timerOuter, pulseStyle]}>
            {/* Background circle */}
            <View
              style={[
                styles.ringBg,
                {
                  borderColor: '#D0E8D8',
                  width: SIZE,
                  height: SIZE,
                  borderRadius: SIZE / 2,
                },
              ]}
            />

            {/* Progress arc (simulated via border trick) */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  width: SIZE,
                  height: SIZE,
                  borderRadius: SIZE / 2,
                  borderWidth: 12,
                  borderColor: 'transparent',
                  borderTopColor: running ? Palette.tealDark : Palette.mint,
                  borderRightColor:
                    progress > 0.25
                      ? running ? Palette.tealDark : Palette.mint
                      : 'transparent',
                  borderBottomColor:
                    progress > 0.5
                      ? running ? Palette.tealDark : Palette.mint
                      : 'transparent',
                  borderLeftColor:
                    progress > 0.75
                      ? running ? Palette.tealDark : Palette.mint
                      : 'transparent',
                  transform: [{ rotate: '-90deg' }],
                },
              ]}
            />

            {/* Timer text */}
            <View style={styles.timerCenter}>
              <Text style={[styles.timerText, { color: running ? Palette.tealDark : Palette.grey600 }]}>
                {pad(minutes)}:{pad(seconds)}
              </Text>
              <Text style={styles.timerStatus}>
                {running ? '● Focusing...' : secondsLeft === 0 ? '✓ Done!' : '● Ready'}
              </Text>
              {running && (
                <Text style={styles.timerMotivation}>
                  {Math.floor((1 - progress) * 100)}% complete
                </Text>
              )}
            </View>
          </Animated.View>
        </Animated.View>

        {/* Controls */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.controls}>
          {!running ? (
            <TouchableOpacity
              style={[styles.startBtn, Shadow.lg]}
              onPress={handleStart}
            >
              <Icon name="Play" size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.startBtnText}>
                {secondsLeft === 0 ? ' Restart' : '  Start Focus'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.pauseBtn, Shadow.md]}
              onPress={handlePause}
            >
              <Icon name="Pause" size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.pauseBtnText}>  Pause</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
          >
            <Icon name="RotateCcw" size={20} color={Palette.grey600} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Blocked Apps Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <Text style={styles.sectionTitle}>Blocked Apps</Text>
          <Text style={styles.sectionSub}>
            Select apps to block during focus sessions
          </Text>

          {permissions.checked && !permissions.overlayAccess && (
            <TouchableOpacity 
              style={styles.overlayWarning} 
              onPress={openOverlaySettings}
              activeOpacity={0.7}
            >
              <Icon name="ShieldAlert" size={20} color="#E65100" />
              <View style={{ flex: 1 }}>
                <Text style={styles.overlayWarningTitle}>Permission Required</Text>
                <Text style={styles.overlayWarningDesc}>
                  'Display over other apps' is needed for blocking to work. Tap to fix.
                </Text>
              </View>
              <Icon name="ChevronRight" size={18} color="#E65100" />
            </TouchableOpacity>
          )}

          <View style={[styles.blockedCard, Shadow.sm]}>
            {(fullAppList.length > 0 
              ? (showAllApps ? fullAppList : apps.slice(0, 10)) 
              : FALLBACK_APPS
            ).map((app) => {
              const isBlocked = blockedPackages.has(app.packageName);
              const iconBase64 = iconCache[app.packageName];

              return (
                <View key={app.packageName} style={styles.appRow}>
                  <View style={styles.appIconContainer}>
                    {iconBase64 ? (
                      <Image 
                        source={{ uri: `data:image/png;base64,${iconBase64}` }} 
                        style={styles.realAppIcon}
                      />
                    ) : (
                      <Icon name="Smartphone" size={20} color={Palette.grey400} />
                    )}
                  </View>
                  <Text style={styles.appName} numberOfLines={1}>{app.appName}</Text>
                  <TouchableOpacity
                    style={[
                      styles.blockToggle,
                      { backgroundColor: isBlocked ? '#FFEBEE' : '#F0FFF4' },
                    ]}
                    onPress={() => toggleBlockPackage(app.packageName)}
                  >
                    {isBlocked ? (
                      <Icon name="ShieldOff" size={14} color="#C62828" strokeWidth={2} />
                    ) : (
                      <Icon name="ShieldCheck" size={14} color="#2E7D32" strokeWidth={2} />
                    )}
                    <Text
                      style={[
                        styles.blockToggleText,
                        { color: isBlocked ? '#C62828' : '#2E7D32' },
                      ]}
                    >
                      {isBlocked ? ' Blocked' : ' Allowed'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          
          {fullAppList.length > 10 && (
            <TouchableOpacity 
              style={styles.seeMoreBtn} 
              onPress={() => setShowAllApps(!showAllApps)}
            >
              <Text style={styles.seeMoreText}>
                {showAllApps ? 'See Less' : `See More (${fullAppList.length - 10} more)`}
              </Text>
              <Icon name={showAllApps ? 'ChevronUp' : 'ChevronDown'} size={16} color={Palette.teal} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <GradientCard
            colors={['#A8D5BA', '#C8E6C9']}
            style={{ marginTop: Spacing.md }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
              <Icon name="Lightbulb" size={18} color={Palette.tealDark} />
              <Text style={[styles.tipTitle, { marginBottom: 0 }]}>Focus Tips</Text>
            </View>
            {[
              'Put your phone face-down during the session',
              'Use headphones with calm music or silence',
              'Take a 5-min walk after each session',
              'Hydrate — keep water at your desk',
            ].map((tip, i) => (
              <Text key={i} style={styles.tipItem}>
                • {tip}
              </Text>
            ))}
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
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Palette.mint,
  },
  timerOuter: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringBg: {
    position: 'absolute',
    borderWidth: 12,
  },
  timerCenter: {
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
  timerMotivation: {
    fontSize: Typography.size.xs,
    color: Palette.teal,
    marginTop: 4,
    fontWeight: '600',
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
    letterSpacing: 0.5,
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
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    marginBottom: Spacing.sm,
  },
  blockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
  },
  appName: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Palette.grey800,
    fontWeight: '500',
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
  appIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  realAppIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  overlayWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  overlayWarningTitle: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 2,
  },
  overlayWarningDesc: {
    fontSize: 11,
    color: '#EF6C00',
    lineHeight: 14,
  },
  tipTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.tealDark,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    fontSize: Typography.size.sm,
    color: Palette.tealDark,
    lineHeight: 22,
    opacity: 0.85,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.base,
    marginTop: Spacing.xs,
  },
  seeMoreText: {
    color: Palette.teal,
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
});
