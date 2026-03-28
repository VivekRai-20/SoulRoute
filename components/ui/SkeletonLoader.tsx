import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Radius } from '@/constants/Theme';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = Radius.sm,
  style,
}: SkeletonBoxProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBox width="60%" height={18} style={{ marginBottom: 10 }} />
      <SkeletonBox width="100%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonBox width="80%" height={14} />
    </View>
  );
}

export function SkeletonStatGrid() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statCell}>
          <SkeletonBox width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
          <SkeletonBox width={60} height={16} style={{ marginBottom: 4 }} />
          <SkeletonBox width={80} height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#C8E6C9',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 12,
  },
});
