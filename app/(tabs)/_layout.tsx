import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { Palette } from '@/constants/Theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4EBE7',
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 64 : 82,
          paddingBottom: Platform.OS === 'android' ? 8 : 24,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: Palette.tealDark,
        tabBarInactiveTintColor: Palette.grey400,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Sleep',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌙" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      {/* Hide legacy explore tab */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: Palette.mintLight + '60',
  },
  emoji: {
    fontSize: 20,
  },
});
