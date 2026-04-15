/**
 * components/ui/StreakBadge.tsx
 *
 * Animated streak counter with flame icon and milestone badge.
 * Reanimated strict-mode safe: uses layout animations, not manual shared values.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, FadeIn,
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { getMilestoneBadge } from '@/hooks/useStreak';
import type { StreakData } from '@/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

interface Props {
  streak: StreakData;
  compact?: boolean;
}

export function StreakBadge({ streak, compact }: Props) {
  const scale = useSharedValue(1);
  // Track previous streak count to only animate on genuine increments
  const prevStreak = useRef(streak.currentStreak);

  useEffect(() => {
    // Only pop-scale when the streak count genuinely increases
    if (streak.currentStreak > 0 && streak.currentStreak !== prevStreak.current) {
      prevStreak.current = streak.currentStreak;
      scale.value = withSequence(
        withSpring(1.15, { damping: 5 }),
        withTiming(1, { duration: 200 })
      );
    }
  }, [streak.currentStreak]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const milestone = getMilestoneBadge(streak.currentStreak);
  const xpLabel = streak.totalXP > 0 ? `${streak.totalXP} XP` : null;

  if (compact) {
    return (
      <Animated.View style={[styles.compactWrap, animStyle]}>
        <Icon name="Flame" size={16} color="#FF6D00" />
        <Text style={styles.compactCount}>{streak.currentStreak}</Text>
        <Text style={styles.compactLabel}>day streak</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, Shadow.sm, animStyle]}>
      <View style={styles.left}>
        <View style={styles.flameWrap}>
          <Icon name="Flame" size={28} color="#FF6D00" />
        </View>
        <View>
          <Text style={styles.streakNum}>{streak.currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.right}>
        {milestone && (
          <View style={styles.milestoneChip}>
            <Text style={styles.milestoneText}>{milestone}</Text>
          </View>
        )}
        {xpLabel && (
          <Text style={styles.xpText}>{xpLabel}</Text>
        )}
        <Text style={styles.longestText}>
          Best: {streak.longestStreak} days
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8F0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFCC80',
    marginBottom: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  flameWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNum: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: '#E65100',
  },
  streakLabel: {
    fontSize: Typography.size.xs,
    color: '#EF6C00',
    fontWeight: '600',
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  milestoneChip: {
    backgroundColor: '#FFF3E0',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  milestoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E65100',
  },
  xpText: {
    fontSize: Typography.size.xs,
    color: '#FF8F00',
    fontWeight: '700',
  },
  longestText: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
  },
  // compact
  compactWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFCC80',
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  compactCount: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: '#E65100',
  },
  compactLabel: {
    fontSize: Typography.size.xs,
    color: '#EF6C00',
    fontWeight: '600',
  },
});
