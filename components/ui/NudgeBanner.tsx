/**
 * components/ui/NudgeBanner.tsx
 *
 * Context-aware dismissable nudge banner that slides in from the top.
 * Reanimated strict-mode safe.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

export type NudgeType = 'on_track' | 'over_goal' | 'fatigue_high' | 'fatigue_critical' | 'great_day' | 'night_risk';

const NUDGE_CONFIG: Record<NudgeType, {
  icon: IconName;
  iconColor: string;
  bg: string;
  border: string;
  text: string;
}> = {
  on_track: {
    icon: 'CheckCircle2',
    iconColor: '#2E7D32',
    bg: '#F0FFF4',
    border: '#A8D5BA',
    text: "You're on track today! Keep those habits going 🎯",
  },
  over_goal: {
    icon: 'AlertTriangle',
    iconColor: '#E65100',
    bg: '#FFF3E0',
    border: '#FFAB76',
    text: "You've passed your daily screen goal. Time to wind down 📵",
  },
  fatigue_high: {
    icon: 'Zap',
    iconColor: '#E67E22',
    bg: '#FFFDE7',
    border: '#FFD54F',
    text: 'High fatigue detected. A 10-min break will do wonders ⚡',
  },
  fatigue_critical: {
    icon: 'AlertOctagon',
    iconColor: '#C62828',
    bg: '#FFEBEE',
    border: '#EF9A9A',
    text: 'Digital overload! Step away from screens — seriously 🚨',
  },
  great_day: {
    icon: 'Star',
    iconColor: '#F57F17',
    bg: '#FFFDE7',
    border: '#FFD54F',
    text: 'Excellent day so far! Your lowest screen time this week 🌟',
  },
  night_risk: {
    icon: 'Moon',
    iconColor: '#5E35B1',
    bg: '#EDE7F6',
    border: '#B39DDB',
    text: "It's late. Your sleep matters more than this scroll 🌙",
  },
};

interface Props {
  type: NudgeType;
  onDismiss: () => void;
}

/**
 * Use layout animations (FadeInDown/FadeOutUp) instead of manual
 * useSharedValue to avoid Reanimated strict-mode warnings.
 */
export function NudgeBanner({ type, onDismiss }: Props) {
  const cfg = NUDGE_CONFIG[type];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14).stiffness(120)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }, Shadow.sm]}
    >
      <Icon name={cfg.icon} size={20} color={cfg.iconColor} strokeWidth={2} />
      <Text style={styles.text}>{cfg.text}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Icon name="X" size={18} color={Palette.grey400} strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Derive which nudge to show based on current stats.
 * Returns null if no nudge is warranted.
 */
export function deriveNudgeType(
  fatigueLevel: string,
  screenTimeMs: number,
  goalMs: number
): NudgeType | null {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) return 'night_risk';
  if (fatigueLevel === 'critical') return 'fatigue_critical';
  if (screenTimeMs > goalMs * 1.5) return 'over_goal';
  if (fatigueLevel === 'high') return 'fatigue_high';
  if (screenTimeMs < goalMs * 0.4 && screenTimeMs > 0) return 'great_day';
  if (screenTimeMs > 0 && screenTimeMs <= goalMs) return 'on_track';
  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  text: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Palette.grey800,
    lineHeight: 19,
  },
});
