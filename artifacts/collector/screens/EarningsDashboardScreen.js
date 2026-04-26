import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, radius, typography } from '../theme';
import {
  collectorProfile,
  earningsHistory,
  pickupJobs,
  JOB_STATUSES,
  WASTE_TYPES,
} from '../data/mockData';
import EarningsSummaryCard from '../components/EarningsSummaryCard';
import JobCard from '../components/JobCard';
import { useGetMyEarnings } from '@workspace/api-client-react';

const WEEK_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_BAR_HEIGHT = 100;

function dayShort(day) {
  return day ? day.slice(0, 3) : '';
}

function formatCurrency(value) {
  if (typeof value !== 'number') return '0';
  return value.toLocaleString('en-PK');
}

function pickupEarnings(job) {
  if (!job) return 0;
  if (typeof job.actualEarningsPKR === 'number') return job.actualEarningsPKR;
  if (typeof job.estimatedEarningsPKR === 'number') return job.estimatedEarningsPKR;
  return 0;
}

export default function EarningsDashboardScreen({ navigation }) {
  const earningsQuery = useGetMyEarnings({ range: 'weekly' });

  const summaryCards = useMemo(() => {
    const weekKg = earningsHistory.reduce((s, d) => s + (d.totalKg || 0), 0);
    const weekPickups = earningsHistory.reduce(
      (s, d) => s + (d.pickups || 0),
      0,
    );
    const pointsWeek = earningsQuery.data ? earningsQuery.data.pointsTotal : 0;
    const completedWeek = earningsQuery.data ? earningsQuery.data.pickupsCompleted : 0;
    return [
      {
        id: 'week',
        label: 'This Week',
        amount: pointsWeek,
        currency: 'pts',
        stats: [
          { icon: '\u{1F4E6}', value: completedWeek || weekPickups, label: 'Pickups' },
          { icon: '\u2696\uFE0F', value: `${weekKg.toFixed(1)} kg`, label: 'Collected' },
          {
            icon: '\u2B50',
            value: collectorProfile.rating.toFixed(1),
            label: 'Rating',
          },
        ],
      },
      {
        id: 'month',
        label: 'This Month',
        amount: collectorProfile.earnings.month,
        currency: collectorProfile.earnings.currency,
        stats: [
          {
            icon: '\u{1F4B0}',
            value: `PKR ${formatCurrency(collectorProfile.earnings.pendingPayout)}`,
            label: 'Pending',
          },
          {
            icon: '\u{1F4C8}',
            value: collectorProfile.totalPickups,
            label: 'Lifetime',
          },
          {
            icon: '\u2B50',
            value: `${collectorProfile.totalRatings}+`,
            label: 'Reviews',
          },
        ],
      },
    ];
  }, [earningsQuery.data]);

  const orderedHistory = useMemo(() => {
    const byDay = new Map(earningsHistory.map((d) => [dayShort(d.day), d]));
    return WEEK_ORDER.map(
      (day) =>
        byDay.get(day) || {
          day,
          earningsPKR: 0,
          pickups: 0,
          totalKg: 0,
        },
    );
  }, []);

  const maxEarnings = useMemo(
    () => Math.max(1, ...orderedHistory.map((d) => d.earningsPKR || 0)),
    [orderedHistory],
  );

  const recentPickups = useMemo(() => {
    return pickupJobs
      .filter((j) => j.status === JOB_STATUSES.COMPLETED)
      .slice(-5)
      .reverse();
  }, []);

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Earnings',
      'Withdrawal requests are processed within 24 hours.',
      [{ text: 'OK', style: 'default' }],
    );
  };

  const handleJobPress = (job) => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('JobDetailScreen', { job });
    }
  };

  const renderSummary = ({ item }) => (
    <EarningsSummaryCard
      label={item.label}
      amount={item.amount}
      currency={item.currency}
      stats={item.stats}
    />
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FlatList
          data={summaryCards}
          keyExtractor={(item) => item.id}
          renderItem={renderSummary}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={undefined}
          decelerationRate="fast"
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
            <Text style={styles.sectionMeta}>
              {earningsQuery.data ? `${earningsQuery.data.pointsTotal} pts total` : '—'}
            </Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartArea}>
              {orderedHistory.map((d) => {
                const ratio = (d.earningsPKR || 0) / maxEarnings;
                const h = Math.max(4, Math.round(ratio * MAX_BAR_HEIGHT));
                const isPeak = (d.earningsPKR || 0) === maxEarnings;
                return (
                  <View key={d.day} style={styles.barColumn}>
                    <Text style={styles.barValue}>
                      {d.earningsPKR
                        ? d.earningsPKR >= 1000
                          ? `${(d.earningsPKR / 1000).toFixed(1)}k`
                          : `${d.earningsPKR}`
                        : '—'}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height: h },
                          isPeak && styles.barPeak,
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Pickups</Text>
            <Text style={styles.sectionMeta}>Last {recentPickups.length}</Text>
          </View>

          {recentPickups.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No completed pickups yet</Text>
              <Text style={styles.emptySub}>
                Once you finish a pickup, it will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={recentPickups}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <JobCard
                  job={item}
                  variant="compact"
                  showChevron={false}
                  rightLabel={`+PKR ${formatCurrency(pickupEarnings(item))}`}
                  rightLabelColor={colors.primary}
                  onPress={() => handleJobPress(item)}
                />
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemGap} />}
            />
          )}
        </View>

        <View style={styles.withdrawWrap}>
          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={handleWithdraw}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Withdraw earnings"
          >
            <Text style={styles.withdrawBtnText}>Withdraw Earnings</Text>
          </TouchableOpacity>
          <Text style={styles.withdrawHint}>
            Available balance: PKR{' '}
            {formatCurrency(collectorProfile.earnings.pendingPayout)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge + spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMedium,
  },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: MAX_BAR_HEIGHT + 44,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
    fontFamily: typography.fontFamilyMedium,
  },
  barTrack: {
    height: MAX_BAR_HEIGHT,
    width: 28,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 28,
    borderRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  barPeak: {
    opacity: 1,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMedium,
  },

  itemGap: {
    height: spacing.xs,
  },

  emptyWrap: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  emptySub: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  withdrawWrap: {
    marginTop: spacing.xl,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  withdrawBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
  withdrawHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMedium,
  },
});
