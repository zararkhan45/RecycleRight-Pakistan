import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '../theme';

export const TABS = [
  { id: 'map', label: 'Map', icon: '\u{1F5FA}\uFE0F' },
  { id: 'jobs', label: 'Jobs', icon: '\u{1F4CB}' },
  { id: 'earnings', label: 'Earnings', icon: '\u{1F4B0}' },
  { id: 'profile', label: 'Profile', icon: '\u{1F464}' },
];

export default function BottomTabBar({ activeTab = 'map', onTabChange }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const tint = isActive ? colors.primary : '#9CA3AF';
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            activeOpacity={0.75}
            onPress={() => onTabChange && onTabChange(tab.id)}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} tab`}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.icon, { color: tint }]}>{tab.icon}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: tint,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive ? <View style={styles.activeDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface || '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: typography ? typography.fontFamilyMedium : undefined,
    letterSpacing: 0.2,
  },
  activeDot: {
    marginTop: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
