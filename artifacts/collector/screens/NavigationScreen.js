import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../components/Map';

import { colors, spacing, radius, typography } from '../theme';
import { WASTE_TYPES } from '../data/mockData';
import { fetchDrivingRoute } from '../lib/integrations';

const COLLECTOR_START = {
  latitude: 31.5497,
  longitude: 74.3436,
  label: 'Lahore City Centre',
};

const AVERAGE_SPEED_KMPH = 28;

function haversineKm(a, b) {
  if (!a || !b) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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

export default function NavigationScreen({ navigation, route }) {
  const job = (route && route.params && route.params.job) || null;
  const collector = (route && route.params && route.params.collector) || null;

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const liveDotOpacity = useRef(new Animated.Value(1)).current;
  const [routeCoords, setRouteCoords] = useState([]);
  const [serverDistanceKm, setServerDistanceKm] = useState(null);
  const [serverEtaMin, setServerEtaMin] = useState(null);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.4,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const liveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotOpacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(liveDotOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    liveLoop.start();

    return () => {
      pulseLoop.stop();
      liveLoop.stop();
    };
  }, [pulseScale, pulseOpacity, liveDotOpacity]);

  const destination = useMemo(() => {
    if (!job) return null;
    return {
      latitude: job.pickupAddress.latitude,
      longitude: job.pickupAddress.longitude,
    };
  }, [job]);

  const fallbackDistanceKm = useMemo(() => {
    if (!destination) return 0;
    return haversineKm(COLLECTOR_START, destination);
  }, [destination]);

  const distanceKm = typeof serverDistanceKm === 'number' ? serverDistanceKm : fallbackDistanceKm;
  const etaMin =
    typeof serverEtaMin === 'number'
      ? serverEtaMin
      : Math.max(1, Math.round((distanceKm / AVERAGE_SPEED_KMPH) * 60));

  useEffect(() => {
    let mounted = true;
    if (!destination) {
      setRouteCoords([]);
      setServerDistanceKm(null);
      setServerEtaMin(null);
      return () => {
        mounted = false;
      };
    }

    fetchDrivingRoute(COLLECTOR_START, destination)
      .then((route) => {
        if (!mounted) return;
        setRouteCoords(route.coordinates || []);
        setServerDistanceKm(typeof route.distanceKm === 'number' ? route.distanceKm : null);
        setServerEtaMin(typeof route.durationMin === 'number' ? route.durationMin : null);
      })
      .catch(() => {
        if (!mounted) return;
        setRouteCoords([]);
        setServerDistanceKm(null);
        setServerEtaMin(null);
      });

    return () => {
      mounted = false;
    };
  }, [destination]);

  const region = useMemo(() => {
    if (!destination) {
      return {
        latitude: COLLECTOR_START.latitude,
        longitude: COLLECTOR_START.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
    }
    const midLat = (COLLECTOR_START.latitude + destination.latitude) / 2;
    const midLon = (COLLECTOR_START.longitude + destination.longitude) / 2;
    const latDelta =
      Math.abs(COLLECTOR_START.latitude - destination.latitude) * 2.2 + 0.02;
    const lonDelta =
      Math.abs(COLLECTOR_START.longitude - destination.longitude) * 2.2 + 0.02;
    return {
      latitude: midLat,
      longitude: midLon,
      latitudeDelta: Math.max(latDelta, 0.04),
      longitudeDelta: Math.max(lonDelta, 0.04),
    };
  }, [destination]);

  const handleArrived = () => {
    if (!navigation) return;
    if (typeof navigation.navigate === 'function') {
      navigation.navigate('WeightEntryScreen', { job, collector });
    }
  };

  const handleCancel = () => {
    if (!navigation) return;
    if (typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No active trip</Text>
          <Text style={styles.emptySub}>
            Accept a job from the list to start navigating.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const topItem = dominantWasteType(job.items);
  const wasteMeta = topItem ? WASTE_TYPES[topItem.wasteType] : null;
  const totalKg = totalWeight(job.items);

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {destination ? (
          <Polyline
            coordinates={routeCoords.length > 1 ? routeCoords : [COLLECTOR_START, destination]}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        <Marker
          coordinate={{
            latitude: COLLECTOR_START.latitude,
            longitude: COLLECTOR_START.longitude,
          }}
          tracksViewChanges
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.collectorMarkerWrap}>
            <Animated.View
              style={[
                styles.collectorPulse,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <View style={styles.collectorDot}>
              <View style={styles.collectorDotInner} />
            </View>
          </View>
        </Marker>

        {destination ? (
          <Marker
            coordinate={destination}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.destinationMarker}>
              <Text style={styles.destinationMarkerIcon}>{'\u{1F4CD}'}</Text>
            </View>
          </Marker>
        ) : null}
      </MapView>

      <SafeAreaView style={styles.topSafe} edges={['top']} pointerEvents="box-none">
        <View style={styles.topCard}>
          <View style={styles.topRow}>
            <Text style={styles.topLabel}>Navigating to pickup</Text>
            <View style={styles.liveBadge}>
              <Animated.View
                style={[styles.liveDot, { opacity: liveDotOpacity }]}
              />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <Text style={styles.areaName} numberOfLines={1}>
            {job.pickupAddress.area}
          </Text>
          <Text style={styles.etaLine}>
            ~{etaMin} min · {distanceKm.toFixed(1)} km
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView
        style={styles.bottomSafe}
        edges={['bottom']}
        pointerEvents="box-none"
      >
        <View style={styles.bottomCard}>
          <View style={styles.summaryRow}>
            {wasteMeta ? (
              <View
                style={[
                  styles.wasteChip,
                  {
                    backgroundColor: wasteMeta.color + '1A',
                    borderColor: wasteMeta.color,
                  },
                ]}
              >
                <View
                  style={[
                    styles.wasteChipDot,
                    { backgroundColor: wasteMeta.color },
                  ]}
                />
                <Text style={[styles.wasteChipText, { color: wasteMeta.color }]}>
                  {wasteMeta.label}
                </Text>
              </View>
            ) : null}
            <Text style={styles.weightText}>{totalKg} kg estimated</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={handleCancel}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cancel navigation"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.arrivedBtn]}
              onPress={handleArrived}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="I have arrived"
            >
              <Text style={styles.arrivedBtnText}>I've Arrived</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
  topCard: {
    margin: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.successLight,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.4,
    fontFamily: typography.fontFamilyMedium,
  },
  areaName: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  etaLine: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },

  collectorMarkerWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectorPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  collectorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  collectorDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  destinationMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationMarkerIcon: {
    fontSize: 18,
  },

  bottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomCard: {
    margin: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  weightText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMedium,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    height: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBtn: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  arrivedBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
  cancelBtn: {
    flex: 0.4,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  cancelBtnText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
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
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
