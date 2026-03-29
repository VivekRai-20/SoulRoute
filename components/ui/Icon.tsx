import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import * as LucideIcons from 'lucide-react-native';

export type IconName = keyof typeof LucideIcons;

export interface IconProps {
  /** Map to a specific lucide-react-native icon */
  name: IconName;
  /** Custom color for the icon */
  color?: string;
  /** Size variant or precise number */
  size?: 'small' | 'default' | 'large' | number;
  /** Stroke width. Default is 2 based on design rules. */
  strokeWidth?: number;
  /** Custom styles to apply to the icon wrapper or icon */
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP = {
  small: 16,
  default: 24,
  large: 32,
};

export function Icon({
  name,
  color = '#000',
  size = 'default',
  strokeWidth = 2,
  style,
}: IconProps) {
  const resolvedSize = typeof size === 'number' ? size : SIZE_MAP[size] ?? SIZE_MAP.default;

  // We explicitly type cast because LucideIcons contains non-component exports (like icons)
  // but most root exports correspond to valid functional components.
  const LucideComponent = LucideIcons[name] as React.ElementType;

  if (!LucideComponent) {
    console.warn(`Icon "${name}" not found in lucide-react-native`);
    return <View style={[{ width: resolvedSize, height: resolvedSize }, style]} />;
  }

  return <LucideComponent color={color} size={resolvedSize} strokeWidth={strokeWidth} style={style} />;
}
