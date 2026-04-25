import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { colors, spacing, radius, typography } from '../theme';
import { WASTE_TYPES, JOB_STATUSES } from '../data/mockData';
import StatusBadge from './StatusBadge';

const WASTE_GLYPH = {
  plastic: '\u{1F37C}',
  paper: '\u{1F4F0}',
  metal: '\u{1F528}',
  glass: '\u{1F37E}',
};

function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMin = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (diffMin < 60) return `Posted ${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Posted ${diffH} hr ago`;
  const diffD = Math.round(diffH / 24);
  return `Posted ${diffD} day${diffD === 1 ? '' : 's'} ago`;
}

function dominantWasteType(items = []) {
  if (!items.length) return null;
  return items.reduce(
    (best, cur) =>
      (cur.estimatedWeightKg || 0) > (best.estimatedWeightKg || 0) ? cur : best,
    items[0],
  );
}

function totalWeight(items = []) {
  return items.reduce((s, it) => s + (it.estimatedWeightKg || 0), 0);
}

export default function JobCard({
  job,
  onPress,
  variant = 'default',
  showChevron = true,
  rightLabel,
  rightLabelColor,
}) {
  const isCompact = variant === 'compact';

  const dominant = useMemo(() => dominantWasteType(job.items), [job]);
  const totalKg = useMemo(() => totalWeight(job.items), [job]);
  const wasteMeta = dominant ? WASTE_TYPES[dominant.wasteType] : null;
  const wasteColor = wasteMeta ? wasteMeta.color : colors.borderStrong;
  const wasteLabel = wasteMeta ? wasteMeta.label : 'Mixed';
  const wasteGlyph = dominant ? WASTE_GLYPH[dominant.wasteType] : '\u267B\uFE0F';

  const showStatusBadge = !rightLabel;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompact && styles.cardCompact,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Job in ${job.pickupAddress.area}`}
    >
      <View
        style={[
          styles.iconBox,
          isCompact && styles.iconBoxCompact,
          { backgroundColor: wasteColor + '1F', borderColor: wasteColor + '55' },
        ]}
      >
        <Text style={[styles.iconGlyph, isCompact && styles.iconGlyphCompact]}>
          {wasteGlyph}
        </Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.area} numberOfLines={1}>
          {job.pickupAddress.area}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {wasteLabel} · {totalKg} kg
        </Text>
        {!isCompact ? (
          <Text style={styles.time}>{timeAgo(job.requestedAt)}</Text>
        ) : (
          <Text style={styles.timeCompact} numberOfLines={1}>
            {job.pickupAddress.city || 'Lahore'}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {rightLabel ? (
          <Text
            style={[
              styles.rightLabel,
              { color: rightLabelColor || colors.primary },
            ]}
            numberOfLines={1}
          >
            {rightLabel}
          </Text>
        ) : null}

        {showStatusBadge ? (
          <View style={styles.badgeWrap}>
            <StatusBadge status={job.status || JOB_STATUSES.PENDING} />
          </View>
        ) : null}

        {showChevron ? <Text style={styles.chevron}>{'\u203A'}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 0,
    marginHorizontal: 0,
    elevation: 1,
    shadowOpacity: 0.04,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: spacing.md,
  },
  iconBoxCompact: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  iconGlyph: {
    fontSize: 20,
  },
  iconGlyphCompact: {
    fontSize: 16,
  },
  middle: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  area: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  detail: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  time: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  timeCompact: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMedium,
  },
  badgeWrap: {
    marginBottom: 4,
  },
  chevron: {
    marginTop: 4,
    fontSize: 22,
    color: '#C7CDD3',
    lineHeight: 22,
  },
});
