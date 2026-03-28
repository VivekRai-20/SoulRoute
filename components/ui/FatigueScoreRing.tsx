import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import type { FatigueLevel } from '@/types';
import { Typography } from '@/constants/Theme';

const SIZE = 180;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LEVEL_COLORS: Record<FatigueLevel, string> = {
  low: '#4CAF50',
  medium: '#FFC107',
  high: '#FF9800',
  critical: '#F44336',
};

const LEVEL_LABELS: Record<FatigueLevel, string> = {
  low: 'Low Fatigue',
  medium: 'Moderate',
  high: 'High Fatigue',
  critical: 'Critical!',
};

interface FatigueScoreRingProps {
  score: number; // 0–100
  level: FatigueLevel;
}

export function FatigueScoreRing({ score, level }: FatigueScoreRingProps) {
  const color = LEVEL_COLORS[level];
  const label = LEVEL_LABELS[level];

  // Animated arc width using translation trick (SVG not available without expo-svg)
  // We use a View-based arc approximation with rotation

  const arcProgress = useSharedValue(0);

  useEffect(() => {
    arcProgress.value = withDelay(
      200,
      withTiming(score / 100, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
  }, [score]);

  const arcStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arcProgress.value * 270 - 135}deg` }],
  }));

  // Track arc (fill arc simulated via clipped View rotation)
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arcProgress.value * 270 - 135}deg` }],
    opacity: withTiming(arcProgress.value > 0 ? 1 : 0, { duration: 300 }),
  }));

  const scoreAnim = useSharedValue(0);
  useEffect(() => {
    scoreAnim.value = withDelay(
      300,
      withTiming(score, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
  }, [score]);

  return (
    <View style={styles.container}>
      {/* Background ring */}
      <View style={[styles.ring, { borderColor: '#E0E0E0' }]}>
        {/* Colored fill ring */}
        <View
          style={[
            styles.fillRing,
            {
              borderColor: color,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            },
          ]}
        />
        {/* Center content */}
        <View style={styles.center}>
          <Text style={[styles.scoreNum, { color }]}>{score}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
          <View style={[styles.badge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fillRing: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: '#4CAF50',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#9AB0A8',
    fontWeight: '500',
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
