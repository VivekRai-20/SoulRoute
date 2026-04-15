/**
 * components/ui/AppIcon.tsx
 *
 * A performant app icon component that fetches and caches Base64 icons from the native module.
 */

import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from './Icon';
import { useAppIcons } from '@/hooks/useAppIcons';
import { Palette } from '@/constants/Theme';

interface AppIconProps {
  packageName: string;
  size?: number;
  color?: string;
  fallbackIcon?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  packageName,
  size = 32,
  color = Palette.grey400,
  fallbackIcon = 'Smartphone',
}) => {
  const { getIcon, getCachedIcon } = useAppIcons();
  const [iconUri, setIconUri] = useState<string | null>(getCachedIcon(packageName));
  const [loading, setLoading] = useState(!iconUri);

  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      // Don't re-fetch if we already have it from cache
      if (iconUri) return;
      
      const base64 = await getIcon(packageName);
      if (mounted && base64) {
        setIconUri(base64);
        setLoading(false);
      } else if (mounted) {
        setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [packageName, getIcon, iconUri]);

  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size * 0.25 }
  ];

  if (loading) {
    return (
      <View style={[containerStyle, styles.loading]}>
        <ActivityIndicator size="small" color={Palette.teal} />
      </View>
    );
  }

  if (iconUri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: `data:image/png;base64,${iconUri}` }}
          style={styles.image}
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, styles.fallback]}>
      <Icon name={fallbackIcon as any} size={size * 0.6} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loading: {
    backgroundColor: '#F0F4F1',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  fallback: {
    backgroundColor: '#EEF2F0',
  },
});
