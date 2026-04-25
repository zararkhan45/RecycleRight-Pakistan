/**
 * RecycleRight Pakistan — Status Badge
 *
 * Tiny pill that visualises a pickup-request status. Used in history rows
 * and request summaries.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { typography } from '../../collector/theme.js';

const STATUS_MAP = {
  pending: { label: 'Pending', bg: '#FEF3C7', fg: '#92400E' },
  accepted: { label: 'Accepted', bg: '#DBEAFE', fg: '#1E40AF' },
  en_route: { label: 'En Route 🚛', bg: '#D1FAE5', fg: '#065F46' },
  completed: { label: 'Completed ✓', bg: '#E5E7EB', fg: '#374151' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', fg: '#991B1B' },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_MAP[status] || {
    label: status || 'Unknown',
    bg: '#E5E7EB',
    fg: '#374151',
  };

  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
