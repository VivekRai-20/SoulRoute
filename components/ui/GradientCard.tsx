import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Radius, Shadow } from '@/constants/Theme';

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: [string, string];
  padding?: number;
}

/**
 * Card with a soft gradient-like background using two-stop color overlay.
 * We simulate gradients without expo-linear-gradient for dependency simplicity.
 */
export function GradientCard({
  children,
  style,
  colors = ['#A8D5BA', '#C8E6C9'],
  padding = 16,
}: GradientCardProps) {
  return (
    <View
      style={[
        styles.outer,
        { backgroundColor: colors[0] },
        Shadow.md,
        style,
      ]}
    >
      {/* Subtle inner highlight to simulate gradient */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: Radius.lg,
            backgroundColor: colors[1],
            opacity: 0.45,
          },
        ]}
        pointerEvents="none"
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
});
