import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

import { colors, typography } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_MARGIN = 16;

function formatCurrency(value) {
  if (typeof value !== 'number') return '0';
  return value.toLocaleString('en-PK');
}

export default function EarningsSummaryCard({
  label = 'This Week',
  amount = 0,
  currency = 'PKR',
  stats = [],
}) {
  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <View style={styles.gradientOverlayTop} />
        <View style={styles.gradientOverlayBottom} />
        <View style={styles.softGlow} />

        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>{currency}</Text>
            <Text style={styles.amount}>{formatCurrency(amount)}</Text>
          </View>

          {stats.length > 0 ? (
            <View style={styles.statsRow}>
              {stats.map((s, idx) => (
                <React.Fragment key={`${s.label}-${idx}`}>
                  {idx > 0 ? <View style={styles.statDivider} /> : null}
                  <View style={styles.statCell}>
                    <View style={styles.statLine}>
                      {s.icon ? (
                        <Text style={styles.statIcon}>{s.icon}</Text>
                      ) : null}
                      <Text style={styles.statValue} numberOfLines={1}>
                        {s.value}
                      </Text>
                    </View>
                    <Text style={styles.statLabel} numberOfLines={1}>
                      {s.label}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: HORIZONTAL_MARGIN,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  gradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  gradientOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },
  softGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    position: 'relative',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
    letterSpacing: 0.4,
    fontFamily: typography ? typography.fontFamilyMedium : undefined,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  currency: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.85,
    marginRight: 6,
    marginBottom: 4,
    fontFamily: typography ? typography.fontFamilyMedium : undefined,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
    fontFamily: typography ? typography.fontFamilyMedium : undefined,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 13,
    color: '#FFFFFF',
    marginRight: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: typography ? typography.fontFamilyMedium : undefined,
  },
  statLabel: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
    letterSpacing: 0.3,
    fontFamily: typography ? typography.fontFamilyMedium : undefined,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
