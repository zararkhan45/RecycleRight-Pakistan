import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/Map';

import { colors, spacing, radius, typography, shadows } from '../theme';
import { useListNearbyJobs } from '@workspace/api-client-react';
import { backendJobToUi, JOB_STATUSES } from '../lib/jobAdapter';
import { WASTE_TYPES, collectorProfile } from '../data/mockData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 280;

const LAHORE_REGION = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
  return items.reduce((sum, it) => sum + (it.estimatedWeightKg || 0), 0);
}

export default function HotspotMapScreen({ navigation, route }) {
  const collector = (route && route.params && route.params.collector) || collectorProfile;

  const [activeTab, setActiveTab] = useState('map');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const sheetTranslate = useRef(new Animated.Value(SHEET_HEIGHT + 100)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const jobsQuery = useListNearbyJobs({ lat: 33.6844, lng: 73.0479, radiusKm: 5 });

  const pendingJobs = useMemo(
    () => {
      const raw = jobsQuery.data || [];
      return raw.map(backendJobToUi).filter((j) => j.status === JOB_STATUSES.PENDING);
    },
    [jobsQuery.data],
  );

  useEffect(() => {
    if (selectedJob) {
      Animated.parallel([
        Animated.timing(sheetTranslate, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetTranslate, {
          toValue: SHEET_HEIGHT + 100,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedJob, sheetTranslate, backdropOpacity]);

  const handleMarkerPress = (job) => setSelectedJob(job);
  const handleDismissSheet = () => setSelectedJob(null);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (!navigation) return;
    if (tab === 'jobs') navigation.navigate('JobListScreen', { collector });
    else if (tab === 'earnings') navigation.navigate('EarningsDashboardScreen', { collector });
    else if (tab === 'profile') navigation.navigate('ProfileScreen', { collector });
  };

  const handleAccept = () => {
    if (!selectedJob || !navigation) return;
    const job = selectedJob;
    setSelectedJob(null);
    navigation.navigate('JobDetailScreen', { job, collector });
  };

  const handleViewDetails = () => {
    if (!selectedJob || !navigation) return;
    const job = selectedJob;
    setSelectedJob(null);
    navigation.navigate('JobDetailScreen', { job, collector, mode: 'preview' });
  };

  const firstName = (collector && collector.name ? collector.name.split(' ')[0] : 'Collector');

  const sheetJob = selectedJob;
  const sheetItem = sheetJob ? dominantWasteType(sheetJob.items) : null;
  const sheetWaste = sheetItem ? WASTE_TYPES[sheetItem.wasteType] : null;
  const sheetTotalKg = sheetJob ? totalWeight(sheetJob.items) : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={LAHORE_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {pendingJobs.map((job) => {
          const top = dominantWasteType(job.items);
          const wasteMeta = top ? WASTE_TYPES[top.wasteType] : null;
          return (
            <Marker
              key={job.id}
              coordinate={{
                latitude: job.pickupAddress.latitude,
                longitude: job.pickupAddress.longitude,
              }}
              onPress={() => handleMarkerPress(job)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerWrap}>
                <View style={styles.markerCircle}>
                  <Text style={styles.markerIcon}>{'\u{1F69B}'}</Text>
                </View>
                {wasteMeta ? (
                  <View
                    style={[
                      styles.markerLabel,
                      { borderColor: wasteMeta.color },
                    ]}
                  >
                    <Text style={styles.markerLabelText}>{wasteMeta.label}</Text>
                  </View>
                ) : null}
                <View style={styles.markerTail} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.topSafe} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.greeting} numberOfLines={1}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={styles.topBarSub} numberOfLines={1}>
              {pendingJobs.length} pickups nearby in {collector.city || 'Lahore'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.statusBadge,
              isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline,
            ]}
            onPress={() => setIsOnline((v) => !v)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? colors.success : colors.textMuted },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? colors.success : colors.textMuted },
              ]}
            >
              {isOnline ? 'Active' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {sheetJob ? (
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents={sheetJob ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleDismissSheet}
          />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: sheetTranslate }] },
        ]}
      >
        <View style={styles.sheetHandle} />
        {sheetJob ? (
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeaderRow}>
              {sheetWaste ? (
                <View
                  style={[
                    styles.wasteChip,
                    { backgroundColor: sheetWaste.color + '1A', borderColor: sheetWaste.color },
                  ]}
                >
                  <View
                    style={[styles.wasteChipDot, { backgroundColor: sheetWaste.color }]}
                  />
                  <Text style={[styles.wasteChipText, { color: sheetWaste.color }]}>
                    {sheetWaste.label}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.distanceText}>
                ~{sheetJob.distanceKm.toFixed(1)} km away
              </Text>
            </View>

            <Text style={styles.areaName} numberOfLines={1}>
              {sheetJob.pickupAddress.area}, {sheetJob.pickupAddress.city}
            </Text>
            <Text style={styles.areaSub} numberOfLines={1}>
              {sheetJob.pickupAddress.label}
            </Text>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{sheetTotalKg} kg</Text>
                <Text style={styles.metricLabel}>Estimated weight</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  PKR {sheetJob.estimatedEarningsPKR.toLocaleString()}
                </Text>
                <Text style={styles.metricLabel}>You'll earn</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{sheetJob.estimatedDurationMin} min</Text>
                <Text style={styles.metricLabel}>Drive time</Text>
              </View>
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline]}
                activeOpacity={0.85}
                onPress={handleViewDetails}
              >
                <Text style={styles.btnOutlineText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                activeOpacity={0.85}
                onPress={handleAccept}
              >
                <Text style={styles.btnPrimaryText}>Accept Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  topSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    margin: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  topBarLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  topBarSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeOnline: {
    backgroundColor: colors.successLight,
    borderColor: colors.successLight,
  },
  statusBadgeOffline: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  markerWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  markerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 20,
    color: colors.textInverse,
  },
  markerLabel: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  markerTail: {
    width: 2,
    height: 6,
    backgroundColor: colors.primary,
    marginTop: 2,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wasteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  wasteChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  wasteChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMedium,
  },
  areaName: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  areaSub: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },
  sheetActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  btnOutlineText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
