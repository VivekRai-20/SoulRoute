/**
 * components/ui/FatigueScoreRing.tsx
 *
 * SVG arc-based animated fatigue ring.
 * Uses react-native-svg + react-native-reanimated for smooth fill animation.
 *
 * Reanimated strict-mode safe: all .value writes are inside useEffect.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Typography } from '@/constants/Theme';
import type { FatigueLevel } from '@/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LEVEL_COLORS: Record<FatigueLevel, { stroke: string; text: string; label: string }> = {
  low:      { stroke: '#4CAF50', text: '#2E7D32', label: 'Low' },
  medium:   { stroke: '#FF9800', text: '#E65100', label: 'Moderate' },
  high:     { stroke: '#FF5722', text: '#BF360C', label: 'High' },
  critical: { stroke: '#F44336', text: '#B71C1C', label: 'Critical' },
};

interface Props {
  score: number;       // 0–100
  level: FatigueLevel;
  size?: number;
}

export function FatigueScoreRing({ score, level, size = 120 }: Props) {
  const cfg = LEVEL_COLORS[level];
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;

  // Start at 0, animate to score/100
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E0EDE5"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={cfg.stroke}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Label inside ring — use FadeIn layout animation instead of shared value scale */}
      <Animated.View style={styles.center} entering={FadeIn.duration(600).delay(300)}>
        <Text style={[styles.score, { color: cfg.text }]}>{score}</Text>
        <Text style={[styles.level, { color: cfg.stroke }]}>{cfg.label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  score: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    lineHeight: 30,
  },
  level: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
