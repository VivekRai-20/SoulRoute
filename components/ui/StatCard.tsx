import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import { Shadow, Radius, Spacing, Typography } from '@/constants/Theme';

interface StatCardProps {
  /** A Lucide icon component name, e.g. "Smartphone" */
  iconName?: IconName;
  /** Fallback emoji if no Icon component provided */
  emoji?: string;
  value: string;
  label: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export function StatCard({
  iconName,
  emoji,
  value,
  label,
  color = '#2D6A4F',
  bgColor = '#F0FFF4',
  style,
}: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bgColor }, Shadow.sm, style]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        {iconName ? (
          <Icon name={iconName} size={22} color={color} strokeWidth={2} />
        ) : (
          <Text style={{ fontSize: 20 }}>{emoji ?? '📊'}</Text>
        )}
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  label: {
    fontSize: Typography.size.xs,
    color: '#6BAB8A',
    fontWeight: Typography.weight.medium,
    textAlign: 'center',
    lineHeight: 14,
  },
});
