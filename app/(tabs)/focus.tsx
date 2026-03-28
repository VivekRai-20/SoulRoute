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
} from 'react-native';
import { Play, Pause, RotateCcw, Timer, ShieldOff, ShieldCheck } from 'lucide-react-native';
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

const DURATIONS = [
  { label: '5 min', value: 5, emoji: '⚡' },
  { label: '25 min', value: 25, emoji: '🍅' },
  { label: '50 min', value: 50, emoji: '🔥' },
];

const BLOCKED_APPS_MOCK = [
  { appName: 'Instagram', icon: '📸', blocked: true },
  { appName: 'Twitter/X', icon: '🐦', blocked: true },
  { appName: 'YouTube', icon: '▶️', blocked: true },
  { appName: 'TikTok', icon: '🎵', blocked: false },
  { appName: 'Reddit', icon: '🤖', blocked: false },
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function FocusScreen() {
  const { focusMode, setFocusMode } = useWellbeing();
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [blockedApps, setBlockedApps] = useState(BLOCKED_APPS_MOCK);

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

  const handleStart = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(selectedDuration * 60);
      ringProgress.value = 1;
    }
    setRunning(true);
    setFocusMode(true);
  };

  const handlePause = () => {
    setRunning(false);
    setFocusMode(false);
  };

  const handleReset = () => {
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

  const toggleBlockApp = (index: number) => {
    setBlockedApps((prev) =>
      prev.map((app, i) => (i === index ? { ...app, blocked: !app.blocked } : app))
    );
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
            <Text style={styles.title}>Focus Mode 🎯</Text>
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
                <Text style={styles.durationEmoji}>{d.emoji}</Text>
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
              <Play size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.startBtnText}>
                {secondsLeft === 0 ? ' Restart' : '  Start Focus'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.pauseBtn, Shadow.md]}
              onPress={handlePause}
            >
              <Pause size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.pauseBtnText}>  Pause</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
          >
            <RotateCcw size={20} color={Palette.grey600} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Blocked Apps Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <Text style={styles.sectionTitle}>App Blocking (Mock)</Text>
          <Text style={styles.sectionSub}>
            Toggle apps to block during focus sessions
          </Text>

          <View style={[styles.blockedCard, Shadow.sm]}>
            {blockedApps.map((app, index) => (
              <View key={app.appName} style={styles.appRow}>
                <Text style={styles.appIcon}>{app.icon}</Text>
                <Text style={styles.appName}>{app.appName}</Text>
                <TouchableOpacity
                  style={[
                    styles.blockToggle,
                    { backgroundColor: app.blocked ? '#FFEBEE' : '#F0FFF4' },
                  ]}
                  onPress={() => toggleBlockApp(index)}
                >
                  {app.blocked ? (
                    <ShieldOff size={14} color="#C62828" strokeWidth={2} />
                  ) : (
                    <ShieldCheck size={14} color="#2E7D32" strokeWidth={2} />
                  )}
                  <Text
                    style={[
                      styles.blockToggleText,
                      { color: app.blocked ? '#C62828' : '#2E7D32' },
                    ]}
                  >
                    {app.blocked ? ' Blocked' : ' Allowed'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <GradientCard
            colors={['#A8D5BA', '#C8E6C9']}
            style={{ marginTop: Spacing.md }}
          >
            <Text style={styles.tipTitle}>💡 Focus Tips</Text>
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
  durationEmoji: {
    fontSize: 22,
    marginBottom: 4,
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
  appIcon: {
    fontSize: 22,
    marginRight: Spacing.md,
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
});
