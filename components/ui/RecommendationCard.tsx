/**
 * components/ui/RecommendationCard.tsx
 *
 * Swipeable recommendation card with severity badge, dismiss, and accept actions.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeOutLeft, FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import type { Recommendation } from '@/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

const SEVERITY_CONFIG = {
  low: {
    bg: '#F0FFF4',
    border: '#A8D5BA',
    badge: '#2E7D32',
    badgeBg: '#E8F5E9',
    label: 'Tip',
    dot: '#4CAF50',
  },
  medium: {
    bg: '#FFFDE7',
    border: '#FFD54F',
    badge: '#F57F17',
    badgeBg: '#FFF9C4',
    label: 'Warning',
    dot: '#FF9800',
  },
  high: {
    bg: '#FFF3E0',
    border: '#FFAB76',
    badge: '#BF360C',
    badgeBg: '#FFCCBC',
    label: 'Alert',
    dot: '#F44336',
  },
};

interface Props {
  recommendation: Recommendation;
  onDismiss: (id: string) => void;
  onAccept?: (id: string) => void;
  compact?: boolean;
}

export function RecommendationCard({ recommendation, onDismiss, onAccept, compact }: Props) {
  const cfg = SEVERITY_CONFIG[recommendation.severity];

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      exiting={FadeOutLeft.duration(300)}
      style={[
        styles.card,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        Shadow.sm,
      ]}
    >
      <View style={styles.topRow}>
        {/* Severity badge */}
        <View style={[styles.badge, { backgroundColor: cfg.badgeBg }]}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.badgeText, { color: cfg.badge }]}>{cfg.label}</Text>
        </View>

        {/* Dismiss */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => onDismiss(recommendation.id)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Icon name="X" size={16} color={Palette.grey400} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.badgeBg }]}>
          <Icon
            name={recommendation.iconName as IconName}
            size={22}
            color={cfg.badge}
            strokeWidth={2}
          />
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.title} numberOfLines={compact ? 1 : undefined}>
            {recommendation.title}
          </Text>
          {!compact && (
            <Text style={styles.description}>{recommendation.description}</Text>
          )}
        </View>
      </View>

      {!compact && recommendation.actionLabel && onAccept && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: cfg.badge }]}
          onPress={() => onAccept(recommendation.id)}
        >
          <Icon name="Check" size={14} color="#fff" strokeWidth={2.5} />
          <Text style={styles.actionText}>{recommendation.actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dismissBtn: {
    padding: 4,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.grey800,
    marginBottom: 4,
  },
  description: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  actionText: {
    color: '#fff',
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
});
