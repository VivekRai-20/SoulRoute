/**
 * app/onboarding/welcome.tsx
 *
 * First onboarding screen — brand intro with animated entrance.
 */

import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, FadeInDown,
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { Palette, Spacing, Typography, Radius } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'Activity', text: 'Track your digital habits passively' },
  { icon: 'Brain', text: 'Detect fatigue before you burn out' },
  { icon: 'Shield', text: 'All data stays on your device' },
];

export default function WelcomeScreen() {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 80 }));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D2B22" />

      {/* Background circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoIcon}>
          <Icon name="Leaf" size={48} color="#FFFFFF" strokeWidth={1.5} />
        </View>
        <Text style={styles.appName}>SoulRoute</Text>
        <Text style={styles.tagline}>Understand your digital self</Text>
      </Animated.View>

      {/* Feature bullets */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <Animated.View
            key={f.icon}
            entering={FadeInDown.duration(500).delay(400 + i * 120)}
            style={styles.featureRow}
          >
            <View style={styles.featureIcon}>
              <Icon name={f.icon as any} size={20} color={Palette.mint} strokeWidth={2} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </Animated.View>
        ))}
      </View>

      {/* CTA */}
      <Animated.View
        entering={FadeInDown.duration(600).delay(800)}
        style={styles.ctaWrap}
      >
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/onboarding/permissions' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Begin Your Journey</Text>
          <Icon name="ArrowRight" size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.privacyNote}>
          🔒 No account required · 100% private
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D2B22',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingTop: height * 0.12,
    paddingBottom: height * 0.07,
  },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#1A3D2E',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#162E22',
    bottom: -width * 0.15,
    left: -width * 0.1,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#1A4D35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
  },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.size.md,
    color: '#A8D5BA',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  features: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(168,213,186,0.15)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(168,213,186,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: '#D4ECD9',
    fontWeight: '500',
  },
  ctaWrap: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  cta: {
    backgroundColor: Palette.tealDark,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.3,
  },
  privacyNote: {
    fontSize: Typography.size.xs,
    color: '#6B8F78',
    textAlign: 'center',
  },
});
