/**
 * components/ui/OptimizedTimerRing.tsx
 *
 * A high-performance SVG timer ring using Reanimated for smooth animations.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { Palette, Typography } from '@/constants/Theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  running?: boolean;
}

export const OptimizedTimerRing: React.FC<Props> = ({
  progress,
  size = 240,
  strokeWidth = 12,
  running = false,
}) => {
  const R = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * R;

  const animatedProps = useAnimatedProps(() => {
    // We expect progress to be handled by the parent's shared value or mapped prop
    return {
      strokeDashoffset: circumference * (1 - progress),
    };
  }, [progress, circumference]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          stroke="#EEF5F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={R}
          stroke={running ? Palette.tealDark : Palette.mint}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
});
