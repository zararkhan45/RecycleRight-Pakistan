/**
 * RecycleRight Pakistan — Household Home Dashboard
 *
 * Tab-level home screen. Pulls everything from householdMockData.js and
 * shares its visual language with the Collector app via collector/theme.js.
 *
 * Sections (top → bottom):
 *   1. Header (greeting + avatar + bell)
 *   2. Green Points balance card (with tier + progress to next tier)
 *   3. Quick Actions row (4 action cards, horizontally scrollable)
 *   4. Active Request banner (only if a pickup is en_route or accepted)
 *   5. Recent Pickups (3 most recent)
 *   6. Environmental Impact summary
 *   + Inline bottom tab bar (Home / Log / History / Profile)
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, typography } from '../../collector/theme.js';
import {
  collectorOnRoute,
  greenPointsTiers,
  householdProfile,
  pickupRequests,
  wasteTypes,
} from '../data/householdMockData.js';

const PRIMARY = '#1E9B6B';
const PRIMARY_DARK = '#17784F';
const PRIMARY_TINT = '#E8F5EE';
const BG = '#F8FAFB';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const SUBTLE = '#9CA3AF';
const DANGER = '#EF4444';

const TIER_ICONS = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
};

const STATUS_META = {
  pending: { label: 'Pending', bg: '#FEF3C7', fg: '#B45309' },
  accepted: { label: 'Accepted', bg: '#DBEAFE', fg: '#1D4ED8' },
  en_route: { label: 'En Route', bg: '#E8F5EE', fg: PRIMARY },
  completed: { label: 'Completed', bg: '#D1FAE5', fg: '#047857' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', fg: '#B91C1C' },
};

export default function HomeDashboardScreen({ navigation }) {
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
    if (!activeRequest) return undefined;
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
  }, [activeRequest, pulse]);

  const go = (screen) => () => navigation?.navigate?.(screen);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1 — Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>{householdProfile.name}</Text>
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
          <PointsBalanceCard
            points={householdProfile.greenPoints}
            tierInfo={tierInfo}
          />

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
          {activeRequest ? (
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
            <Pressable onPress={go('PickupHistoryScreen')} hitSlop={8}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          {recentPickups.map((req) => (
            <PickupStatusCard
              key={req.id}
              request={req}
              wasteType={wasteTypeMap[req.wasteType]}
            />
          ))}

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

      <Text style={styles.pointsValue}>{points.toLocaleString('en-US')}</Text>
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
          { backgroundColor: wasteType?.colour || '#E5E7EB' },
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

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status,
    bg: '#E5E7EB',
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  userName: {
    marginTop: 2,
    fontSize: 16,
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
    color: '#FFFFFF',
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsHeading: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  pointsValue: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: typography.fontFamilyMedium,
  },
  pointsUnit: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
    marginTop: -2,
    fontFamily: typography.fontFamily,
  },
  progressLabel: {
    marginTop: 16,
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
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
    color: PRIMARY,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
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

  /* Impact Card */
  impactCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF1F3',
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
