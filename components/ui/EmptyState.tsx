import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Radius, Shadow, Spacing, Typography } from '@/constants/Theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function EmptyState({ icon = '🌿', title, subtitle, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, Shadow.sm, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
    backgroundColor: '#F0FFF4',
    borderRadius: Radius.lg,
    marginVertical: Spacing.base,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: '#2D6A4F',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: '#6BAB8A',
    textAlign: 'center',
    lineHeight: 20,
  },
});
