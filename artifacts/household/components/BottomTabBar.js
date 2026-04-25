/**
 * RecycleRight Pakistan — Household Bottom Tab Bar
 *
 * Four tabs (Home / Log Waste / History / Profile). The middle "Log Waste"
 * tab is rendered as a primary floating action button rather than a flat
 * tab — pressing it should push WasteLoggingScreen onto the stack instead
 * of toggling tab state. The parent decides this via `onTabChange('log')`.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { typography } from '../../collector/theme.js';

const PRIMARY = '#1E9B6B';
const INACTIVE = '#9CA3AF';

export const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'log', label: 'Log Waste', icon: '♻️' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export default function BottomTabBar({ activeTab, onTabChange }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const isPrimary = tab.id === 'log';

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange?.(tab.id)}
            style={styles.tab}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            {isPrimary ? (
              <View style={styles.primaryFab}>
                <Text style={styles.primaryFabIcon}>{tab.icon}</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.icon,
                  isActive && styles.iconActive,
                ]}
              >
                {tab.icon}
              </Text>
            )}
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                isPrimary && styles.primaryLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  icon: {
    fontSize: 22,
    color: INACTIVE,
    opacity: 0.7,
  },
  iconActive: {
    color: PRIMARY,
    opacity: 1,
  },
  label: {
    marginTop: 3,
    fontSize: 10,
    color: INACTIVE,
    fontFamily: typography.fontFamily,
  },
  labelActive: {
    color: PRIMARY,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  primaryFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryFabIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  primaryLabel: {
    marginTop: 4,
    color: PRIMARY,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
