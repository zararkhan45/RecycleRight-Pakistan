/**
 * RecycleRight Pakistan — Waste Type Chip
 *
 * Selectable tile used in WasteLoggingScreen's grid. Shows the waste-type
 * emoji on a coloured square with the label and per-kg point rate
 * underneath. Active state swaps to the primary green border + tint.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { typography } from '../../collector/theme.js';

const PRIMARY = '#1E9B6B';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

export default function WasteTypeChip({ wasteType, selected, onPress }) {
  if (!wasteType) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={`Waste type ${wasteType.label}`}
    >
      <View
        style={[
          styles.iconTile,
          { backgroundColor: wasteType.colour || '#F3F4F6' },
        ]}
      >
        <Text style={styles.iconEmoji}>{wasteType.icon || '♻️'}</Text>
      </View>

      <Text
        style={[styles.label, selected && styles.labelSelected]}
        numberOfLines={1}
      >
        {wasteType.label}
      </Text>

      {typeof wasteType.pointsPerKg === 'number' ? (
        <Text style={styles.subLabel}>{wasteType.pointsPerKg} pts/kg</Text>
      ) : null}

      {selected ? (
        <View style={styles.checkBadge}>
          <Text style={styles.checkBadgeText}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: '31%',
    aspectRatio: 0.95,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  chipSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#F0FAF4',
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
    fontFamily: typography.fontFamilyMedium,
  },
  labelSelected: {
    color: PRIMARY,
  },
  subLabel: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMedium,
  },
});
