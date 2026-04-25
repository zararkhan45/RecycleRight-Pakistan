import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { typography } from '../theme';

const VARIANTS = {
  pending: {
    background: '#FEF3C7',
    text: '#92400E',
    label: 'Pending',
  },
  accepted: {
    background: '#D1FAE5',
    text: '#065F46',
    label: 'Accepted',
  },
  en_route: {
    background: '#DBEAFE',
    text: '#1E3A8A',
    label: 'En Route',
  },
  completed: {
    background: '#E5E7EB',
    text: '#374151',
    label: 'Completed',
  },
  missed: {
    background: '#FEE2E2',
    text: '#991B1B',
    label: 'Missed',
  },
  cancelled: {
    background: '#FEE2E2',
    text: '#991B1B',
    label: 'Cancelled',
  },
};

export default function StatusBadge({ status, label }) {
  const key = (status || '').toLowerCase();
  const variant = VARIANTS[key] || VARIANTS.pending;
  const text = label || variant.label;

  return (
    <View style={[styles.pill, { backgroundColor: variant.background }]}>
      <Text style={[styles.text, { color: variant.text }]}>{text}</Text>
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
    letterSpacing: 0.3,
    fontFamily: typography ? typography.fontFamilyMedium : undefined,
  },
});
