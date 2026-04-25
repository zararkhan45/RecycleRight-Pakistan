/**
 * RecycleRight Pakistan — Live Map Tracking Screen
 *
 * Full-screen map with animated collector → household routing. The
 * collector marker creeps toward the household every 3s and a soft pulse
 * ring breathes around it while the trip is in progress. Floating cards
 * sit above the map for the live status header and the action drawer.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapView, { Marker, Polyline } from '../../collector/components/Map';
import { typography } from '../../collector/theme.js';
import {
  collectorOnRoute,
  pickupRequests,
  wasteTypes,
} from '../data/householdMockData.js';

const PRIMARY = '#1E9B6B';
const PRIMARY_DARK = '#17784F';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const DANGER = '#EF4444';

const HOME_LAT = 31.4697;
const HOME_LNG = 74.4054;

const STEP = 0.0005;
const ARRIVAL = 0.001;
const TICK_MS = 3000;

export default function LiveMapTrackingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [collectorLat, setCollectorLat] = useState(collectorOnRoute.currentLat);
  const [collectorLng, setCollectorLng] = useState(collectorOnRoute.currentLng);

  const wasteTypeMap = useMemo(
    () => Object.fromEntries(wasteTypes.map((w) => [w.id, w])),
    [],
  );

  const activeRequest = useMemo(
    () =>
      pickupRequests.find(
        (r) => r.status === 'en_route' || r.status === 'accepted',
      ),
    [],
  );
  const activeWasteType = activeRequest
    ? wasteTypeMap[activeRequest.wasteType]
    : null;

  /* Collector → home creep simulation */
  useEffect(() => {
    const id = setInterval(() => {
      setCollectorLat((curLat) => {
        setCollectorLng((curLng) => {
          const dLat = HOME_LAT - curLat;
          const dLng = HOME_LNG - curLng;
          const dist = Math.hypot(dLat, dLng);
          if (dist < ARRIVAL) {
            clearInterval(id);
            return curLng;
          }
          const ratio = STEP / dist;
          return curLng + dLng * ratio;
        });
        const dLat = HOME_LAT - curLat;
        const dLng = HOME_LNG - curLng;
        const dist = Math.hypot(dLat, dLng);
        if (dist < ARRIVAL) return curLat;
        const ratio = STEP / dist;
        return curLat + dLat * ratio;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  /* Map region centred on midpoint of both markers */
  const region = useMemo(() => {
    const midLat = (collectorLat + HOME_LAT) / 2;
    const midLng = (collectorLng + HOME_LNG) / 2;
    const latSpan = Math.abs(collectorLat - HOME_LAT);
    const lngSpan = Math.abs(collectorLng - HOME_LNG);
    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(0.01, latSpan * 2.4),
      longitudeDelta: Math.max(0.01, lngSpan * 2.4),
    };
  }, [collectorLat, collectorLng]);

  /* Animations: collector ring + top-card dot */
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;
  const headerDot = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const ring = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 2,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    const dot = Animated.loop(
      Animated.sequence([
        Animated.timing(headerDot, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(headerDot, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    ring.start();
    dot.start();
    return () => {
      ring.stop();
      dot.stop();
    };
  }, [headerDot, ringOpacity, ringScale]);

  const handleCall = () => {
    Alert.alert(`Calling ${collectorOnRoute.name}...`);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Pickup',
      'Cancel this pickup request? This cannot be undone.',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () =>
            navigation?.navigate?.('HomeDashboardScreen'),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <MapView
        style={StyleSheet.absoluteFill}
        region={region}
        showsUserLocation={false}
      >
        {/* Dashed route */}
        <Polyline
          coordinates={[
            { latitude: collectorLat, longitude: collectorLng },
            { latitude: HOME_LAT, longitude: HOME_LNG },
          ]}
          strokeColor={PRIMARY}
          strokeWidth={3}
          lineDashPattern={[8, 4]}
        />

        {/* Household marker */}
        <Marker
          coordinate={{ latitude: HOME_LAT, longitude: HOME_LNG }}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.markerStack}>
            <View style={styles.homeMarker}>
              <Text style={styles.homeMarkerIcon}>🏠</Text>
            </View>
            <View style={styles.markerLabelWrap}>
              <Text style={styles.markerLabel}>Your Location</Text>
            </View>
          </View>
        </Marker>

        {/* Collector marker w/ pulse ring */}
        <Marker
          coordinate={{ latitude: collectorLat, longitude: collectorLng }}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.markerStack}>
            <View style={styles.collectorMarkerWrap}>
              <Animated.View
                style={[
                  styles.collectorRing,
                  {
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                  },
                ]}
              />
              <View style={styles.collectorMarker}>
                <Text style={styles.collectorMarkerIcon}>🚛</Text>
              </View>
            </View>
            <View style={styles.markerLabelWrap}>
              <Text style={styles.markerLabel}>Collector</Text>
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Floating top card */}
      <View
        style={[
          styles.topCard,
          { marginTop: insets.top + 12 },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow}>
          <View style={styles.liveLeft}>
            <Animated.View
              style={[styles.headerDot, { opacity: headerDot }]}
            />
            <Text style={styles.liveLabel}>Live Tracking</Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        <Text style={styles.collectorName}>{collectorOnRoute.name}</Text>

        <View style={styles.etaRow}>
          <Text style={styles.etaText}>⏱ {collectorOnRoute.eta} away</Text>
          <Text style={styles.ratingText}>⭐ {collectorOnRoute.rating}</Text>
        </View>
      </View>

      {/* Floating bottom card */}
      <View
        style={[
          styles.bottomCard,
          { marginBottom: insets.bottom + 12 + TAB_BAR_HEIGHT },
        ]}
      >
        <View style={styles.vehicleRow}>
          <Text style={styles.vehicleText}>
            {collectorOnRoute.vehicleType} • {collectorOnRoute.licensePlate}
          </Text>
          <TouchableOpacity
            onPress={handleCall}
            style={styles.callButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Call ${collectorOnRoute.name}`}
          >
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        {activeRequest ? (
          <View style={styles.requestSummary}>
            <View
              style={[
                styles.wasteChip,
                {
                  backgroundColor: activeWasteType?.colour || '#E5E7EB',
                },
              ]}
            >
              <Text style={styles.wasteChipIcon}>
                {activeWasteType?.icon || '♻️'}
              </Text>
              <Text style={styles.wasteChipText}>
                {activeWasteType?.label || activeRequest.wasteType}
              </Text>
            </View>
            <Text style={styles.weightText}>
              ~{activeRequest.estimatedWeight} kg
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.cancelButtonPressed,
          ]}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </Pressable>
      </View>

      {/* Bottom tab bar */}
      <View
        style={[styles.tabBarOuter, { paddingBottom: insets.bottom }]}
      >
        <BottomTabBar active="home" navigation={navigation} />
      </View>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Bottom Tab Bar (household variant)                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const TAB_BAR_HEIGHT = 56;

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
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
              {t.icon}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Styles                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },

  /* Markers */
  markerStack: {
    alignItems: 'center',
  },
  homeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  homeMarkerIcon: {
    fontSize: 16,
  },
  collectorMarkerWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectorRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    opacity: 0.6,
  },
  collectorMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  collectorMarkerIcon: {
    fontSize: 18,
  },
  markerLabelWrap: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  markerLabel: {
    fontSize: 11,
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Top card */
  topCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 12,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    marginRight: 8,
  },
  liveLabel: {
    fontSize: 12,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  liveBadge: {
    backgroundColor: DANGER,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyMedium,
  },
  collectorName: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  etaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etaText: {
    fontSize: 14,
    color: TEXT,
    fontFamily: typography.fontFamily,
  },
  ratingText: {
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },

  /* Bottom card */
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleText: {
    flex: 1,
    fontSize: 13,
    color: MUTED,
    paddingRight: 8,
    fontFamily: typography.fontFamily,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    fontSize: 18,
  },
  requestSummary: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wasteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  wasteChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  wasteChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  weightText: {
    fontSize: 13,
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  cancelButton: {
    marginTop: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: '#FEF2F2',
  },
  cancelButtonText: {
    color: DANGER,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Bottom tab bar */
  tabBarOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF1F3',
    height: TAB_BAR_HEIGHT,
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
