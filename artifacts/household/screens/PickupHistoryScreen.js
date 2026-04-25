/**
 * RecycleRight Pakistan — Pickup History Screen
 *
 * Polish pass:
 *   - Theme consistency: PRIMARY/TEXT/MUTED/BG sourced from
 *     ../../collector/theme.js. Status-badge tints and the #9CA3AF subtle
 *     shade kept as documented hex literals (not in shared theme).
 *   - Skeleton loader: 1.2s shimmer rows on mount via SkeletonBlock.
 *   - Typography audit: header 18pt/700, filter labels 13pt, card text
 *     14pt/600 (title) + 13pt body + 12pt muted, badge 11pt/600.
 *   - Safe area: SafeAreaView from 'react-native-safe-area-context'.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, typography } from '../../collector/theme.js';
import {
  pickupRequests,
  wasteTypes,
} from '../data/householdMockData.js';
import SkeletonBlock from '../components/SkeletonBlock.js';

const PRIMARY = colors.primary;
const TEXT = colors.text;
const MUTED = colors.textMuted;
const SUBTLE = '#9CA3AF'; // not in shared theme — documented exception
const BG = colors.background;
const SURFACE = colors.surface;
const DIVIDER = colors.divider;
const SHADOW = colors.shadow;

const SKELETON_MS = 1200;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'en_route', label: 'En Route' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

// Status-badge palette — not in shared theme — documented exception.
const STATUS_META = {
  pending: { label: 'Pending', bg: '#FEF3C7', fg: '#B45309' },
  accepted: { label: 'Accepted', bg: '#DBEAFE', fg: '#1D4ED8' },
  en_route: { label: 'En Route', bg: '#E8F5EE', fg: PRIMARY },
  completed: { label: 'Completed', bg: '#D1FAE5', fg: '#047857' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', fg: '#B91C1C' },
};

const EMPTY_SUBTEXT = {
  all: 'Your pickup activity will appear here.',
  pending: 'New requests waiting for a collector will appear here.',
  accepted: 'Requests a collector has accepted will appear here.',
  en_route: 'Live pickups on the way will appear here.',
  completed: 'All your completed pickups will appear here.',
  cancelled: 'Cancelled requests will appear here.',
};

export default function PickupHistoryScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  const wasteTypeMap = useMemo(
    () => Object.fromEntries(wasteTypes.map((w) => [w.id, w])),
    [],
  );

  const sorted = useMemo(
    () =>
      [...pickupRequests].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime(),
      ),
    [],
  );

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return sorted;
    return sorted.filter((r) => r.status === activeFilter);
  }, [sorted, activeFilter]);

  const stats = useMemo(() => {
    const completed = sorted.filter((r) => r.status === 'completed');
    return {
      total: sorted.length,
      weight: completed.reduce(
        (sum, r) => sum + (r.estimatedWeight || 0),
        0,
      ),
      points: completed.reduce(
        (sum, r) => sum + (r.pointsEarned || 0),
        0,
      ),
    };
  }, [sorted]);

  const handleCardPress = (request) => {
    if (request.status === 'completed') {
      navigation?.navigate?.('DigitalReceiptScreen', { request });
    } else {
      navigation?.navigate?.('LiveMapTrackingScreen', { request });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SURFACE} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>Pickup History</Text>
        </View>

        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const isActive = item.id === activeFilter;
            return (
              <Pressable
                onPress={() => setActiveFilter(item.id)}
                style={styles.filterTab}
                hitSlop={4}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {isActive ? <View style={styles.filterUnderline} /> : null}
              </Pressable>
            );
          }}
        />

        {activeFilter === 'all' ? (
          <View style={styles.statsRow}>
            {isLoading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <Stat value={String(stats.total)} label="Total Pickups" />
                <Stat
                  value={`${stats.weight.toFixed(1)} kg`}
                  label="Total Weight"
                />
                <Stat
                  value={`${stats.points} pts`}
                  label="Points Earned"
                  valueColor={PRIMARY}
                />
              </>
            )}
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.listContent}>
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <HistoryCard
                request={item}
                wasteType={wasteTypeMap[item.wasteType]}
                onPress={() => handleCardPress(item)}
              />
            )}
            ListEmptyComponent={<EmptyState filterId={activeFilter} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function Stat({ value, label, valueColor }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatSkeleton() {
  return (
    <View style={styles.statItem}>
      <SkeletonBlock width={48} height={16} borderRadius={6} />
      <SkeletonBlock
        width={70}
        height={10}
        borderRadius={5}
        style={{ marginTop: 6 }}
      />
    </View>
  );
}

function HistoryCard({ request, wasteType, onPress }) {
  const showPoints =
    request.status === 'completed' &&
    typeof request.pointsEarned === 'number';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.cardIcon,
          { backgroundColor: wasteType?.colour || colors.border },
        ]}
      >
        <Text style={styles.cardIconText}>{wasteType?.icon || '♻️'}</Text>
      </View>

      <View style={styles.cardCenter}>
        <Text style={styles.cardArea}>{request.area}</Text>
        <Text style={styles.cardSub}>
          {wasteType?.label || request.wasteType} • ~
          {request.estimatedWeight} kg
        </Text>
        <Text style={styles.cardDate}>
          {formatShortDate(request.submittedAt)}
        </Text>
      </View>

      <View style={styles.cardRight}>
        <StatusBadge status={request.status} />
        {showPoints ? (
          <Text style={styles.cardPoints}>+{request.pointsEarned} pts</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function HistoryCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width={44} height={44} borderRadius={10} />
      <View style={[styles.cardCenter, { marginLeft: 12 }]}>
        <SkeletonBlock width={'70%'} height={14} borderRadius={6} />
        <SkeletonBlock
          width={'55%'}
          height={12}
          borderRadius={6}
          style={{ marginTop: 6 }}
        />
        <SkeletonBlock
          width={'40%'}
          height={10}
          borderRadius={5}
          style={{ marginTop: 6 }}
        />
      </View>
      <SkeletonBlock width={64} height={20} borderRadius={999} />
    </View>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status,
    bg: colors.border,
    fg: TEXT,
  };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.fg }]}>
        {meta.label}
      </Text>
    </View>
  );
}

function EmptyState({ filterId }) {
  const labelLookup = {
    all: '',
    pending: 'pending',
    accepted: 'accepted',
    en_route: 'en route',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  const heading =
    filterId === 'all'
      ? 'No pickups yet'
      : `No ${labelLookup[filterId]} pickups`;
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyHeading}>{heading}</Text>
      <Text style={styles.emptySub}>
        {EMPTY_SUBTEXT[filterId] || EMPTY_SUBTEXT.all}
      </Text>
    </View>
  );
}

function formatShortDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return iso;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: SURFACE },

  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: SURFACE,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },

  /* Filter tabs */
  filterRow: {
    paddingHorizontal: 4,
    backgroundColor: SURFACE,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    color: SUBTLE,
    fontFamily: typography.fontFamily,
  },
  filterTextActive: {
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  filterUnderline: {
    marginTop: 6,
    height: 2,
    width: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 1,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },

  /* Card list */
  listContent: {
    paddingTop: 6,
    paddingBottom: 24,
    backgroundColor: BG,
    flexGrow: 1,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 22,
  },
  cardCenter: {
    flex: 1,
    paddingRight: 8,
  },
  cardArea: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  cardSub: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  cardDate: {
    marginTop: 2,
    fontSize: 12,
    color: SUBTLE,
    fontFamily: typography.fontFamily,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardPoints: {
    marginTop: 6,
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Status badge */
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Empty state */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyHeading: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
});
