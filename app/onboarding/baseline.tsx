/**
 * app/onboarding/baseline.tsx
 *
 * Final onboarding screen — name input, goal selection, baseline explanation.
 * Calls finishOnboarding() which persists to AsyncStorage.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

const GOAL_OPTIONS = [
  { hours: 1, label: '1h', icon: '🌿', desc: 'Minimal usage' },
  { hours: 2, label: '2h', icon: '✅', desc: 'WHO recommended' },
  { hours: 3, label: '3h', icon: '⚖️', desc: 'Balanced' },
  { hours: 4, label: '4h', icon: '📱', desc: 'Moderate' },
  { hours: 5, label: '5h+', icon: '⚡', desc: 'Heavy user' },
];

const TIMELINE_STEPS = [
  { day: 'Day 1', label: 'Baseline starts', icon: '📊', color: Palette.tealDark },
  { day: 'Day 7', label: 'Weekly pattern emerges', icon: '📈', color: '#FF9800' },
  { day: 'Day 14', label: 'Personalized insights ready', icon: '🧠', color: '#9C27B0' },
];

export default function BaselineScreen() {
  const { finishOnboarding } = useWellbeing();
  const [name, setName] = useState('');
  const [selectedGoalHours, setSelectedGoalHours] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    const finalName = name.trim() || 'Friend';
    await finishOnboarding(finalName, selectedGoalHours * 3600000);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />

        <KeyboardAvoidingView behavior="position" style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Progress */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
              <View style={styles.progressDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.dot, i <= 2 && styles.dotDone, i === 2 && styles.dotActive]} />
                ))}
              </View>
              <Text style={styles.title}>Set Up Your Profile</Text>
              <Text style={styles.subtitle}>
                Almost done! Tell us a bit about yourself so we can personalise your experience.
              </Text>
            </Animated.View>

            {/* Name input */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)}>
              <Text style={styles.label}>What should we call you?</Text>
              <View style={[styles.inputWrap, Shadow.sm]}>
                <Icon name="User" size={20} color={Palette.grey400} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={Palette.grey400}
                  value={name}
                  onChangeText={setName}
                  maxLength={30}
                  returnKeyType="done"
                />
              </View>
            </Animated.View>

            {/* Goal picker */}
            <Animated.View entering={FadeInDown.duration(500).delay(200)}>
              <Text style={styles.label}>Daily screen time goal</Text>
              <Text style={styles.labelSub}>
                How much daily phone time feels right for you? (WHO recommends ≤2h)
              </Text>
              <View style={styles.goalRow}>
                {GOAL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.hours}
                    style={[styles.goalChip, selectedGoalHours === opt.hours && styles.goalChipActive]}
                    onPress={() => setSelectedGoalHours(opt.hours)}
                  >
                    <Text style={styles.goalIcon}>{opt.icon}</Text>
                    <Text style={[styles.goalLabel, selectedGoalHours === opt.hours && styles.goalLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.goalDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Baseline learning phase */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)}>
              <Text style={styles.label}>Your 14-day learning phase</Text>
              <View style={[styles.timelineCard, Shadow.sm]}>
                <Text style={styles.timelineIntro}>
                  SoulRoute will learn your normal patterns over{' '}
                  <Text style={{ fontWeight: '800', color: Palette.tealDark }}>2 weeks</Text>.
                  Then it can tell you when something is off.
                </Text>
                {TIMELINE_STEPS.map((step, i) => (
                  <View key={step.day} style={styles.timelineRow}>
                    <View style={[styles.timelineDot, { backgroundColor: step.color + '20' }]}>
                      <Text style={styles.timelineEmoji}>{step.icon}</Text>
                    </View>
                    {i < TIMELINE_STEPS.length - 1 && <View style={styles.timelineLine} />}
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={[styles.timelineDay, { color: step.color }]}>{step.day}</Text>
                      <Text style={styles.timelineLabel}>{step.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Sticky CTA */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaLoading]}
            onPress={handleStart}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.ctaText}>Setting up…</Text>
            ) : (
              <>
                <Text style={styles.ctaText}>Start Tracking 🚀</Text>
                <Icon name="ArrowRight" size={20} color="#fff" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0E8D8',
  },
  dotDone: {
    backgroundColor: Palette.tealDark,
  },
  dotActive: {
    width: 24,
    backgroundColor: Palette.teal,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Palette.tealDark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    lineHeight: 22,
  },
  label: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.grey800,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  labelSub: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E0EDE5',
  },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Palette.grey800,
    paddingVertical: Spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  goalChip: {
    flex: 1,
    minWidth: 58,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  goalChipActive: {
    borderColor: Palette.tealDark,
    backgroundColor: '#F0FFF4',
  },
  goalIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.grey400,
  },
  goalLabelActive: {
    color: Palette.tealDark,
  },
  goalDesc: {
    fontSize: 9,
    color: Palette.grey400,
    textAlign: 'center',
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  timelineIntro: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineEmoji: {
    fontSize: 18,
  },
  timelineLine: {
    // handled by gap
  },
  timelineDay: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  timelineLabel: {
    fontSize: Typography.size.xs,
    color: Palette.grey600,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAF9',
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E8F0EA',
  },
  cta: {
    backgroundColor: Palette.tealDark,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  ctaLoading: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
});
