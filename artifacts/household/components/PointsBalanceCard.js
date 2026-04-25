/**
 * RecycleRight Pakistan — Points Balance Card
 *
 * Reusable green hero card that surfaces the user's Green Points balance,
 * tier, and progress toward the next tier. Originally extracted from
 * HomeDashboardScreen so it can be reused on the Profile tab.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { typography } from '../../collector/theme.js';

const PRIMARY = '#1E9B6B';
const PRIMARY_DARK = '#17784F';

export default function PointsBalanceCard({
  points = 0,
  tier = 'Bronze',
  nextTierPoints,
  nextTierName,
}) {
  const remaining = useMemo(() => {
    if (typeof nextTierPoints !== 'number') return 0;
    return Math.max(nextTierPoints - points, 0);
  }, [points, nextTierPoints]);

  const progress = useMemo(() => {
    if (typeof nextTierPoints !== 'number' || nextTierPoints <= 0) return 1;
    const ratio = points / nextTierPoints;
    return Math.max(0, Math.min(ratio, 1));
  }, [points, nextTierPoints]);

  const showProgress =
    typeof nextTierPoints === 'number' && Boolean(nextTierName);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.label}>🌱 Green Points</Text>
          <Text style={styles.points}>{points.toLocaleString()}</Text>
        </View>
        <View style={styles.tierBadge}>
          <Text style={styles.tierBadgeText}>{tier}</Text>
        </View>
      </View>

      {showProgress ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {remaining > 0
              ? `${remaining} pts to ${nextTierName}`
              : `You've reached ${nextTierName}!`}
          </Text>
        </View>
      ) : (
        <View style={styles.progressBlock}>
          <Text style={styles.progressCaption}>
            You've reached the highest tier — well done!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    padding: 18,
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: typography.fontFamily,
  },
  points: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: typography.fontFamilyMedium,
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tierBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.3,
  },
  progressBlock: {
    marginTop: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  progressCaption: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: typography.fontFamily,
  },
});
