/**
 * app/onboarding/permissions.tsx
 *
 * Permission explanation screen — explains each Android permission
 * and lets the user grant them before continuing.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { Palette, Spacing, Typography, Radius, Shadow } from '@/constants/Theme';

interface PermissionItem {
  key: 'usage' | 'notification' | 'overlay';
  icon: IconName;
  title: string;
  description: string;
  why: string;
  onGrant: () => void;
}

export default function PermissionsScreen() {
  const {
    permissions,
    openUsageSettings,
    openNotificationSettings,
    openOverlaySettings,
    refreshAll,
  } = useWellbeing();

  const [checking, setChecking] = useState(false);

  const permissionItems: PermissionItem[] = [
    {
      key: 'usage',
      icon: 'Smartphone',
      title: 'Usage Access',
      description: 'See which apps you use and for how long each day.',
      why: 'Core to fatigue detection — without this, we can\'t track screen time.',
      onGrant: openUsageSettings,
    },
    {
      key: 'notification',
      icon: 'Bell',
      title: 'Notification Access',
      description: 'Count how many notifications arrive per app.',
      why: 'Notification overload is a key digital stress signal.',
      onGrant: openNotificationSettings,
    },
    {
      key: 'overlay',
      icon: 'Layers',
      title: 'Display Over Apps',
      description: 'Show a reminder when you open a blocked app during Focus mode.',
      why: 'Required to show the focus overlay during Pomodoro sessions.',
      onGrant: openOverlaySettings,
    },
  ];

  const granted = {
    usage: permissions.usageAccess,
    notification: permissions.notificationAccess,
    overlay: permissions.overlayAccess,
  };

  const allGranted = granted.usage && granted.notification && granted.overlay;
  const atLeastOne = granted.usage || granted.notification || granted.overlay;

  const handleContinue = async () => {
    setChecking(true);
    await refreshAll(); // re-check permissions after user returns
    setChecking(false);
    router.push('/onboarding/baseline' as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={styles.progressDots}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>
          SoulRoute needs a few permissions to passively detect digital fatigue.
          All data stays on your device.
        </Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {permissionItems.map((item, i) => {
          const isGranted = granted[item.key];
          return (
            <Animated.View
              key={item.key}
              entering={FadeInDown.duration(500).delay(100 + i * 120)}
            >
              <View style={[styles.card, Shadow.sm, isGranted && styles.cardGranted]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, isGranted && styles.iconWrapGranted]}>
                    <Icon
                      name={item.icon}
                      size={22}
                      color={isGranted ? '#2E7D32' : Palette.tealDark}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  </View>
                  {isGranted ? (
                    <View style={styles.grantedBadge}>
                      <Icon name="Check" size={14} color="#2E7D32" strokeWidth={2.5} />
                      <Text style={styles.grantedText}>Granted</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.grantBtn}
                      onPress={item.onGrant}
                    >
                      <Text style={styles.grantBtnText}>Grant</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.whyWrap}>
                  <Icon name="Info" size={13} color={Palette.grey400} strokeWidth={2} />
                  <Text style={styles.whyText}>{item.why}</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <View style={styles.privacyCard}>
            <Icon name="Lock" size={18} color={Palette.tealDark} strokeWidth={2} />
            <Text style={styles.privacyText}>
              No data is ever sent to a server. Everything is processed locally and can be
              deleted at any time from Settings.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, !atLeastOne && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={checking}
        >
          <Text style={styles.ctaText}>
            {allGranted ? 'Continue →' : atLeastOne ? 'Continue Anyway →' : 'Skip for now →'}
          </Text>
        </TouchableOpacity>
        {!allGranted && (
          <Text style={styles.skipNote}>
            You can grant permissions later in Settings → Profile
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0E8D8',
  },
  dotDone: {
    backgroundColor: Palette.tealDark,
  },
  dotActive: {
    backgroundColor: Palette.teal,
    width: 24,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Palette.tealDark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Palette.grey600,
    lineHeight: 22,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  cardGranted: {
    borderWidth: 1.5,
    borderColor: '#A8D5BA',
    backgroundColor: '#F8FFF9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapGranted: {
    backgroundColor: '#E8F5E9',
  },
  cardTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Palette.grey800,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: Typography.size.xs,
    color: Palette.grey600,
    lineHeight: 17,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  grantedText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  grantBtn: {
    backgroundColor: Palette.tealDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  grantBtnText: {
    color: '#fff',
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  whyWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F5F9F6',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  whyText: {
    flex: 1,
    fontSize: 11,
    color: Palette.grey600,
    lineHeight: 16,
  },
  privacyCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: '#F0FFF4',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#A8D5BA',
  },
  privacyText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Palette.tealDark,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  cta: {
    backgroundColor: Palette.tealDark,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: Palette.grey400,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  skipNote: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    textAlign: 'center',
  },
});
