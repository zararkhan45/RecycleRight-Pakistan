/**
 * RecycleRight Pakistan — Household Home Dashboard
 *
 * Polish pass:
 *   - Theme consistency: local PRIMARY/TEXT/MUTED constants now read from
 *     ../../collector/theme.js (single source of truth). Status-badge tints
 *     and the #9CA3AF subtle shade remain as documented hex literals — they
 *     are not present in the shared collector theme.
 *   - Skeleton loader: 1.2s simulated load on mount via SkeletonBlock.
 *   - Empty state: gentle prompt in "Recent Pickups" if pickupRequests
 *     ever resolves to an empty list (defensive — mock data has 8 items).
 *   - Points animation: Green Points number counts up from 0 → real value
 *     over 800ms via Animated.timing + addListener (40pt, weight 800).
 *   - Typography audit: section headings 15pt/600, body 14pt/400, muted
 *     12pt, points figure 40pt/800.
 *   - Safe areas: SafeAreaView from 'react-native-safe-area-context'.
 *
 * Sections (top → bottom):
 *   1. Header (greeting + avatar + bell)
 *   2. Green Points balance card (with tier + animated count-up)
 *   3. Quick Actions row (4 action cards, horizontally scrollable)
 *   4. Active Request banner (only if a pickup is en_route or accepted)
 *   5. Recent Pickups (3 most recent, with empty-state fallback)
 *   6. Environmental Impact summary
 *   + Inline bottom tab bar (Home / Log / History / Profile)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, typography } from '../../collector/theme.js';
import {
  collectorOnRoute,
  greenPointsTiers,
  householdProfile,
  pickupRequests,
  wasteTypes,
} from '../data/householdMockData.js';
import SkeletonBlock from '../components/SkeletonBlock.js';

const PRIMARY = colors.primary;
const PRIMARY_DARK = colors.primaryDark;
const PRIMARY_TINT = colors.primaryLight;
const BG = colors.background;
const TEXT = colors.text;
const MUTED = colors.textMuted;
const SUBTLE = '#9CA3AF'; // not in shared theme — kept as documented exception
const DANGER = colors.danger;
const SURFACE = colors.surface;
const DIVIDER = colors.divider;
const SHADOW = colors.shadow;

const TIER_ICONS = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
};

// Status-badge palette: not in shared theme — documented exception.
const STATUS_META = {
  pending: { label: 'Pending', bg: '#FEF3C7', fg: '#B45309' },
  accepted: { label: 'Accepted', bg: '#DBEAFE', fg: '#1D4ED8' },
  en_route: { label: 'En Route', bg: '#E8F5EE', fg: PRIMARY },
  completed: { label: 'Completed', bg: '#D1FAE5', fg: '#047857' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', fg: '#B91C1C' },
};

const SKELETON_MS = 1200;
const POINTS_ANIM_MS = 800;

export default function HomeDashboardScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  const wasteTypeMap = useMemo(
    () => Object.fromEntries(wasteTypes.map((w) => [w.id, w])),
    [],
  );

  const tierInfo = useMemo(
    () => deriveTier(householdProfile.greenPoints, greenPointsTiers),
    [],
  );

  const activeRequest = useMemo(
    () =>
      pickupRequests.find(
        (r) => r.status === 'en_route' || r.status === 'accepted',
      ),
    [],
  );

  const recentPickups = useMemo(
    () =>
      [...pickupRequests]
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        )
        .slice(0, 3),
    [],
  );

  const impact = useMemo(() => {
    const completed = pickupRequests.filter((r) => r.status === 'completed');
    const totalKg = completed.reduce(
      (sum, r) => sum + (r.estimatedWeight || 0),
      0,
    );
    return {
      kg: totalKg,
      pickups: completed.length,
      points: householdProfile.greenPoints,
    };
  }, []);

  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (isLoading || !activeRequest) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [activeRequest, pulse, isLoading]);

  const go = (screen) => () => navigation?.navigate?.(screen);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SURFACE} />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1 — Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Good morning,</Text>
              {isLoading ? (
                <SkeletonBlock
                  width={140}
                  height={18}
                  borderRadius={6}
                  style={{ marginTop: 4 }}
                />
              ) : (
                <Text style={styles.userName}>{householdProfile.name}</Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {householdProfile.avatarInitials}
                </Text>
              </View>
              <Pressable
                onPress={go('NotificationsScreen')}
                hitSlop={8}
                style={styles.bellWrapper}
              >
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.bellBadge} />
              </Pressable>
            </View>
          </View>

          {/* Section 2 — Green Points Balance Card */}
          {isLoading ? (
            <View style={[styles.pointsCard, styles.pointsCardSkeleton]}>
              <SkeletonBlock
                width={120}
                height={14}
                borderRadius={6}
                style={styles.skeletonOnDark}
              />
              <SkeletonBlock
                width={160}
                height={44}
                borderRadius={8}
                style={[styles.skeletonOnDark, { marginTop: 14 }]}
              />
              <SkeletonBlock
                width={'80%'}
                height={6}
                borderRadius={3}
                style={[styles.skeletonOnDark, { marginTop: 22 }]}
              />
            </View>
          ) : (
            <PointsBalanceCard
              points={householdProfile.greenPoints}
              tierInfo={tierInfo}
            />
          )}

          {/* Section 3 — Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsRow}
          >
            <ActionCard
              icon="♻️"
              label="Log Waste"
              onPress={go('WasteLoggingScreen')}
            />
            <ActionCard
              icon="🚛"
              label="Request Pickup"
              onPress={go('PickupRequestScreen')}
            />
            <ActionCard
              icon="📍"
              label="Track Collector"
              onPress={go('LiveMapTrackingScreen')}
            />
            <ActionCard
              icon="📋"
              label="My History"
              onPress={go('PickupHistoryScreen')}
            />
          </ScrollView>

          {/* Section 4 — Active Request Banner (conditional) */}
          {!isLoading && activeRequest ? (
            <Pressable
              onPress={go('LiveMapTrackingScreen')}
              style={styles.activeBanner}
            >
              <View style={styles.activeBannerLeft}>
                <View style={styles.activeBannerRow}>
                  <Animated.View
                    style={[styles.pulseDot, { opacity: pulse }]}
                  />
                  <Text style={styles.activeBannerTitle}>
                    Collector En Route
                  </Text>
                </View>
                <Text style={styles.activeBannerSub}>
                  {collectorOnRoute.name} • {collectorOnRoute.eta} away
                </Text>
              </View>
              <Text style={styles.activeBannerCta}>Track Now ›</Text>
            </Pressable>
          ) : null}

          {/* Section 5 — Recent Pickups */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleInline}>Recent Pickups</Text>
            {!isLoading && recentPickups.length > 0 ? (
              <Pressable onPress={go('PickupHistoryScreen')} hitSlop={8}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            ) : null}
          </View>

          {isLoading ? (
            <View>
              <PickupCardSkeleton />
              <PickupCardSkeleton />
              <PickupCardSkeleton />
            </View>
          ) : recentPickups.length === 0 ? (
            <RecentPickupsEmpty
              onRequest={go('PickupRequestScreen')}
            />
          ) : (
            recentPickups.map((req) => (
              <PickupStatusCard
                key={req.id}
                request={req}
                wasteType={wasteTypeMap[req.wasteType]}
              />
            ))
          )}

          {/* Section 6 — Environmental Impact */}
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Your Impact</Text>
            <View style={styles.impactRow}>
              <ImpactStat
                value={`${impact.kg.toFixed(1)} kg`}
                label="Waste Recycled"
              />
              <ImpactStat value={`${impact.pickups}`} label="Pickups Done" />
              <ImpactStat
                value={impact.points.toLocaleString('en-US')}
                label="Points Earned"
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom tab bar */}
        <BottomTabBar active="home" navigation={navigation} />
      </SafeAreaView>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Subcomponents                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function PointsBalanceCard({ points, tierInfo }) {
  const { tier, nextTier, progressPct } = tierInfo;

  // Animated count-up: 0 → points over POINTS_ANIM_MS (800ms).
  const animated = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const id = animated.addListener(({ value }) => {
      setDisplayed(Math.round(value));
    });
    Animated.timing(animated, {
      toValue: points,
      duration: POINTS_ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animated.removeListener(id);
  }, [points, animated]);

  const progressLabel = nextTier
    ? `${tier.name} → ${nextTier.name}: ${points.toLocaleString(
        'en-US',
      )} / ${nextTier.minPoints.toLocaleString('en-US')} pts`
    : `${tier.name}: max tier reached (${points.toLocaleString('en-US')} pts)`;

  return (
    <View style={styles.pointsCard}>
      <View style={styles.pointsTopRow}>
        <Text style={styles.pointsHeading}>Your Green Points</Text>
        <View style={styles.tierPill}>
          <Text style={styles.tierPillText}>
            {TIER_ICONS[tier.name] || '🏅'} {tier.name}
          </Text>
        </View>
      </View>

      <Text style={styles.pointsValue}>
        {displayed.toLocaleString('en-US')}
      </Text>
      <Text style={styles.pointsUnit}>points</Text>

      <Text style={styles.progressLabel}>{progressLabel}</Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(2, Math.min(100, progressPct))}%` },
          ]}
        />
      </View>
    </View>
  );
}

function ActionCard({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function PickupStatusCard({ request, wasteType }) {
  const showPoints =
    request.status === 'completed' && typeof request.pointsEarned === 'number';

  return (
    <View style={styles.pickupCard}>
      <View
        style={[
          styles.pickupIcon,
          { backgroundColor: wasteType?.colour || colors.border },
        ]}
      >
        <Text style={styles.pickupIconText}>{wasteType?.icon || '♻️'}</Text>
      </View>

      <View style={styles.pickupCenter}>
        <Text style={styles.pickupArea}>{request.area}</Text>
        <Text style={styles.pickupSub}>
          {wasteType?.label || request.wasteType} • ~
          {request.estimatedWeight} kg
        </Text>
        <Text style={styles.pickupDate}>
          Submitted {formatShortDate(request.submittedAt)}
        </Text>
      </View>

      <View style={styles.pickupRight}>
        <StatusBadge status={request.status} />
        {showPoints ? (
          <Text style={styles.pickupPoints}>+{request.pointsEarned} pts</Text>
        ) : null}
      </View>
    </View>
  );
}

function PickupCardSkeleton() {
  return (
    <View style={styles.pickupCard}>
      <SkeletonBlock width={44} height={44} borderRadius={10} />
      <View style={[styles.pickupCenter, { marginLeft: 12 }]}>
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

function RecentPickupsEmpty({ onRequest }) {
  return (
    <View style={styles.recentEmpty}>
      <Text style={styles.recentEmptyEmoji}>📭</Text>
      <Text style={styles.recentEmptyHeading}>No pickups yet</Text>
      <Text style={styles.recentEmptyBody}>
        Submit your first pickup request to get started.
      </Text>
      <Pressable onPress={onRequest} hitSlop={8} style={styles.recentEmptyLink}>
        <Text style={styles.recentEmptyLinkText}>Request Pickup</Text>
      </Pressable>
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
      <Text style={[styles.badgeText, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

function ImpactStat({ value, label }) {
  return (
    <View style={styles.impactStat}>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function BottomTabBar({ active, navigation }) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home', screen: 'HomeDashboardScreen' },
    { id: 'log', icon: '♻️', label: 'Log', screen: 'WasteLoggingScreen' },
    {
      id: 'history',
      icon: '📋',
      label: 'History',
      screen: 'PickupHistoryScreen',
    },
    { id: 'profile', icon: '👤', label: 'Profile', screen: 'ProfileScreen' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <Pressable
            key={t.id}
            style={styles.tabItem}
            onPress={() => navigation?.navigate?.(t.screen)}
            hitSlop={6}
          >
            <Text
              style={[styles.tabIcon, isActive && styles.tabIconActive]}
            >
              {t.icon}
            </Text>
            <Text
              style={[styles.tabLabel, isActive && styles.tabLabelActive]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function deriveTier(points, tiers) {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let tier = sorted[0];
  for (const t of sorted) {
    if (points >= t.minPoints) tier = t;
  }
  const tierIndex = sorted.findIndex((t) => t.id === tier.id);
  const nextTier = sorted[tierIndex + 1] || null;

  let progressPct = 100;
  if (nextTier) {
    const span = nextTier.minPoints - tier.minPoints;
    const within = points - tier.minPoints;
    progressPct = span > 0 ? (within / span) * 100 : 0;
  }

  return { tier, nextTier, progressPct };
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Styles                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
  },

  /* Header */
  header: {
    backgroundColor: SURFACE,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  userName: {
    marginTop: 2,
    fontSize: 18,
    color: TEXT,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMedium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMedium,
  },
  bellWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 22,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DANGER,
  },

  /* Points Balance Card */
  pointsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    padding: 20,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsCardSkeleton: {
    minHeight: 156,
  },
  skeletonOnDark: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  pointsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsHeading: {
    color: colors.textInverse,
    fontSize: 13,
    opacity: 0.85,
    fontFamily: typography.fontFamily,
  },
  tierPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierPillText: {
    color: colors.textInverse,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  pointsValue: {
    marginTop: 12,
    color: colors.textInverse,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: typography.fontFamilyMedium,
  },
  pointsUnit: {
    color: colors.textInverse,
    fontSize: 14,
    opacity: 0.7,
    marginTop: -2,
    fontFamily: typography.fontFamily,
  },
  progressLabel: {
    marginTop: 16,
    color: colors.textInverse,
    fontSize: 12,
    opacity: 0.85,
    fontFamily: typography.fontFamily,
  },
  progressTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textInverse,
  },

  /* Section titles */
  sectionTitle: {
    marginTop: 20,
    marginHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  sectionTitleRow: {
    marginTop: 20,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleInline: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  seeAll: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Quick Actions */
  actionsRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: SURFACE,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    textAlign: 'center',
  },

  /* Active Request Banner */
  activeBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: PRIMARY_TINT,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeBannerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  activeBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    marginRight: 8,
  },
  activeBannerTitle: {
    color: PRIMARY_DARK,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  activeBannerSub: {
    marginTop: 4,
    color: TEXT,
    fontSize: 13,
    fontFamily: typography.fontFamily,
  },
  activeBannerCta: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Pickup Cards */
  pickupCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pickupIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickupIconText: {
    fontSize: 22,
  },
  pickupCenter: {
    flex: 1,
    paddingRight: 8,
  },
  pickupArea: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  pickupSub: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  pickupDate: {
    marginTop: 2,
    fontSize: 12,
    color: SUBTLE,
    fontFamily: typography.fontFamily,
  },
  pickupRight: {
    alignItems: 'flex-end',
  },
  pickupPoints: {
    marginTop: 6,
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Status Badge */
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

  /* Recent Pickups empty state */
  recentEmpty: {
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  recentEmptyEmoji: {
    fontSize: 32,
  },
  recentEmptyHeading: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
    textAlign: 'center',
  },
  recentEmptyBody: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  recentEmptyLink: {
    marginTop: 10,
  },
  recentEmptyLinkText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Impact Card */
  impactCard: {
    backgroundColor: SURFACE,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  impactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  impactRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  impactStat: {
    flex: 1,
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
    fontFamily: typography.fontFamilyMedium,
  },
  impactLabel: {
    marginTop: 4,
    fontSize: 11,
    color: MUTED,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  },

  /* Bottom tab bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  tabLabelActive: {
    color: PRIMARY,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
