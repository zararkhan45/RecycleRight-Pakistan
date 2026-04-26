import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/Map';

import { colors, spacing, radius, typography } from '../theme';
import {
  WASTE_TYPES,
  JOB_STATUSES,
  collectorProfile,
} from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import { useAcceptPickup } from '@workspace/api-client-react';

function timeAgo(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.max(1, Math.round((now - then) / 60000));
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} hr ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD} day${diffD === 1 ? '' : 's'} ago`;
}

function formatItems(items = []) {
  if (!items.length) return '—';
  return items
    .map((it) => {
      const meta = WASTE_TYPES[it.wasteType];
      const label = meta ? meta.label : it.wasteType;
      return `${label} · ${it.estimatedWeightKg} kg`;
    })
    .join('\n');
}

function totalWeight(items = []) {
  return items.reduce((s, it) => s + (it.estimatedWeightKg || 0), 0);
}

export default function JobDetailScreen({ navigation, route }) {
  const initialJob = (route && route.params && route.params.job) || null;
  const collector =
    (route && route.params && route.params.collector) || collectorProfile;

  const [job, setJob] = useState(initialJob);
  const [toastMessage, setToastMessage] = useState('');
  const acceptMutation = useAcceptPickup();

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!toastMessage) return undefined;
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslate, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslate, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setToastMessage(''));
    }, 1600);

    return () => clearTimeout(timeout);
  }, [toastMessage, toastOpacity, toastTranslate]);

  const wasteSummary = useMemo(() => formatItems(job ? job.items : []), [job]);
  const totalKg = useMemo(() => totalWeight(job ? job.items : []), [job]);

  if (!job) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation && navigation.goBack && navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Job not found</Text>
          <Text style={styles.emptySub}>
            Pick a job from the list to see its details here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAccepted =
    job.status === JOB_STATUSES.ACCEPTED || job.status === JOB_STATUSES.EN_ROUTE;
  const isCompleted = job.status === JOB_STATUSES.COMPLETED;
  const isCancelled = job.status === JOB_STATUSES.CANCELLED;

  const handleAccept = () => {
    if (!job) return;
    acceptMutation
      .mutateAsync({ id: job.pickupId })
      .then(() => {
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: JOB_STATUSES.ACCEPTED,
                acceptedAt: new Date().toISOString(),
              }
            : prev,
        );
        setToastMessage('Job accepted! Navigate to household.');
        setTimeout(() => {
          if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('NavigationScreen', { job, collector });
          }
        }, 700);
      })
      .catch(() => {
        setToastMessage('Failed to accept job.');
      });
  };

  const handleCancelAcceptance = () => {
    setJob((prev) =>
      prev ? { ...prev, status: JOB_STATUSES.PENDING, acceptedAt: undefined } : prev,
    );
    setToastMessage('Acceptance cancelled.');
  };

  const region = {
    latitude: job.pickupAddress.latitude,
    longitude: job.pickupAddress.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation && navigation.goBack && navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            pointerEvents="none"
            toolbarEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: job.pickupAddress.latitude,
                longitude: job.pickupAddress.longitude,
              }}
              tracksViewChanges={false}
            >
              <View style={styles.pinHousehold}>
                <Text style={styles.pinHouseholdText}>{'\u{1F3E0}'}</Text>
              </View>
            </Marker>
            {collector && collector.homeBase ? (
              <Marker
                coordinate={{
                  latitude: collector.homeBase.latitude,
                  longitude: collector.homeBase.longitude,
                }}
                tracksViewChanges={false}
              >
                <View style={styles.pinCollector}>
                  <Text style={styles.pinCollectorText}>{'\u{1F69B}'}</Text>
                </View>
              </Marker>
            ) : null}
          </MapView>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Waste Type</Text>
              <Text style={styles.metaValue} numberOfLines={3}>
                {wasteSummary}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Weight Estimate</Text>
              <Text style={styles.metaValue}>{totalKg} kg</Text>
            </View>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Area</Text>
              <Text style={styles.metaValue} numberOfLines={2}>
                {job.pickupAddress.area}, {job.pickupAddress.city}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Distance</Text>
              <Text style={styles.metaValue}>
                {job.distanceKm.toFixed(1)} km
              </Text>
            </View>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Posted</Text>
              <Text style={styles.metaValue}>{timeAgo(job.requestedAt)}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={styles.metaBadgeWrap}>
                <StatusBadge status={job.status} />
              </View>
            </View>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Customer</Text>
              <Text style={styles.metaValue}>{job.customer.name}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>You'll Earn</Text>
              <Text style={[styles.metaValue, styles.earnings]}>
                PKR {job.estimatedEarningsPKR.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Household Notes</Text>
          <Text style={styles.notesBody}>
            {job.notes && job.notes.length > 0
              ? job.notes
              : 'No specific instructions from the household.'}
          </Text>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.sectionTitle}>Pickup Address</Text>
          <Text style={styles.addressLine}>{job.pickupAddress.label}</Text>
        </View>

        <View style={styles.actionWrap}>
          {isCompleted ? (
            <View style={[styles.actionBtn, styles.completedBtn]}>
              <Text style={styles.completedBtnText}>Completed</Text>
            </View>
          ) : isCancelled ? (
            <View style={[styles.actionBtn, styles.completedBtn]}>
              <Text style={styles.completedBtnText}>Cancelled</Text>
            </View>
          ) : isAccepted ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={handleCancelAcceptance}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel Acceptance</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.acceptBtnText}>Accept This Job</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {toastMessage ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslate }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  headerRight: {
    width: 32,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  mapCard: {
    height: 200,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.lg,
  },
  map: {
    flex: 1,
  },
  pinHousehold: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHouseholdText: {
    fontSize: 16,
  },
  pinCollector: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCollectorText: {
    fontSize: 14,
  },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaCell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: typography.fontFamilyMedium,
  },
  metaValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
    lineHeight: 19,
  },
  metaBadgeWrap: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  earnings: {
    color: colors.primary,
  },
  metaDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamilyMedium,
  },
  notesBody: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addressLine: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
    fontFamily: typography.fontFamilyMedium,
  },
  actionWrap: {
    marginTop: spacing.sm,
  },
  actionBtn: {
    height: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  cancelBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
  completedBtn: {
    backgroundColor: colors.surfaceAlt,
  },
  completedBtnText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  emptyWrap: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  emptySub: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  toast: {
    position: 'absolute',
    top: spacing.huge + spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: typography.fontFamilyMedium,
  },
});
