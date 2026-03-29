import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/Theme';

interface PermissionPromptProps {
  type: 'usage' | 'notification' | 'both';
  onGrantUsage: () => void;
  onGrantNotification: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function PermissionPrompt({
  type,
  onGrantUsage,
  onGrantNotification,
  style,
  compact = false,
}: PermissionPromptProps) {
  const showUsage = type === 'usage' || type === 'both';
  const showNotif = type === 'notification' || type === 'both';

  if (compact) {
    return (
      <View style={[styles.compactBanner, style]}>
        <Icon name="Info" size={16} color={Palette.amber} />
        <Text style={styles.compactText}>
          Using demo data.{' '}
          {showUsage && (
            <Text style={styles.compactLink} onPress={onGrantUsage}>
              Grant Usage Access
            </Text>
          )}
          {showUsage && showNotif && ' · '}
          {showNotif && (
            <Text style={styles.compactLink} onPress={onGrantNotification}>
              Grant Notifications
            </Text>
          )}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, Shadow.md, style]}>
      <View style={styles.headerRow}>
        <Icon name="ShieldAlert" size={28} color={Palette.amber} />
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.title}>Permissions Needed</Text>
          <Text style={styles.subtitle}>
            Grant access to see your real device data instead of demo data
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {showUsage && (
        <TouchableOpacity style={styles.permRow} onPress={onGrantUsage}>
          <View style={[styles.iconWrap, { backgroundColor: '#E8F5E9' }]}>
            <Icon name="Database" size={20} color="#2E7D32" />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.permTitle}>Usage Access</Text>
            <Text style={styles.permDesc}>
              Allows SoulRoute to read screen time and app usage statistics
            </Text>
          </View>
          <Icon name="ChevronRight" size={18} color={Palette.grey400} />
        </TouchableOpacity>
      )}

      {showUsage && showNotif && <View style={styles.divider} />}

      {showNotif && (
        <TouchableOpacity style={styles.permRow} onPress={onGrantNotification}>
          <View style={[styles.iconWrap, { backgroundColor: '#E3F2FD' }]}>
            <Icon name="Bell" size={20} color="#1565C0" />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.permTitle}>Notification Access</Text>
            <Text style={styles.permDesc}>
              Allows SoulRoute to count notifications received per app
            </Text>
          </View>
          <Icon name="ChevronRight" size={18} color={Palette.grey400} />
        </TouchableOpacity>
      )}

      <View style={[styles.note, { marginTop: Spacing.md }]}>
        <Icon name="Info" size={13} color={Palette.grey400} />
        <Text style={styles.noteText}>
          These are special Android permissions — tapping will open System Settings where you enable them manually.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: Palette.amber,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Palette.grey800,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.size.xs,
    color: Palette.grey600,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.grey100,
    marginVertical: Spacing.sm,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Palette.grey800,
    marginBottom: 2,
  },
  permDesc: {
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    lineHeight: 16,
    paddingRight: Spacing.sm,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.grey100,
  },
  noteText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Palette.grey400,
    lineHeight: 16,
  },
  // ─── Compact banner ──────────────────────────────
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFDE7',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  compactText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: '#5D4037',
    lineHeight: 17,
  },
  compactLink: {
    color: Palette.tealDark,
    fontWeight: Typography.weight.bold,
    textDecorationLine: 'underline',
  },
});
