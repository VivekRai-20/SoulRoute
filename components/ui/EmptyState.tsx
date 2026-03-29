import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Radius, Shadow, Spacing, Typography } from '@/constants/Theme';
import { Icon, IconName } from '@/components/ui/Icon';

interface EmptyStateProps {
  iconName?: IconName;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function EmptyState({ iconName = 'Box', title, subtitle, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, Shadow.sm, style]}>
      <Icon name={iconName} size={48} color="#2D6A4F" style={{ marginBottom: Spacing.md }} />
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
