import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, radius, typography } from '../theme';
import { WASTE_TYPES } from '../data/mockData';
import { useCompletePickup } from '@workspace/api-client-react';

const POINTS_PER_KG = {
  plastic: 10,
  metal: 8,
  paper: 5,
  glass: 6,
};

function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${hh}:${mm} ${ampm}`;
}

export default function PickupConfirmationScreen({ navigation, route }) {
  const params = (route && route.params) || {};
  const weight = typeof params.weight === 'number' ? params.weight : 0;
  const wasteType = params.wasteType || 'plastic';
  const job = params.job || null;
  const pickupId = params.pickupId || (job && job.pickupId) || null;

  const completePickup = useCompletePickup();
  const [receiptPoints, setReceiptPoints] = useState(null);

  const wasteMeta = WASTE_TYPES[wasteType];
  const wasteLabel = wasteMeta ? wasteMeta.label : wasteType;
  const areaName = job
    ? `${job.pickupAddress.area}, ${job.pickupAddress.city}`
    : '—';

  const pointsAwarded = useMemo(() => {
    if (typeof receiptPoints === 'number') return receiptPoints;
    const rate = POINTS_PER_KG[wasteType] ?? 0;
    return Math.round(weight * rate);
  }, [receiptPoints, weight, wasteType]);

  const timeString = useMemo(() => formatTime(new Date()), []);

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!pickupId) return;
    completePickup
      .mutateAsync({ id: pickupId })
      .then((result) => {
        if (result && result.receipt && typeof result.receipt.pointsAwarded === 'number') {
          setReceiptPoints(result.receipt.pointsAwarded);
        }
      })
      .catch(() => {});

    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        delay: 220,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        delay: 220,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkScale, checkOpacity, contentOpacity, contentTranslate]);

  const handleViewEarnings = () => {
    if (!navigation) return;
    if (typeof navigation.navigate === 'function') {
      navigation.navigate('EarningsDashboardScreen');
    }
  };

  const handleBackToMap = () => {
    if (!navigation) return;
    if (typeof navigation.reset === 'function') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'HotspotMapScreen' }],
      });
      return;
    }
    if (typeof navigation.popToTop === 'function') {
      navigation.popToTop();
      return;
    }
    if (typeof navigation.navigate === 'function') {
      navigation.navigate('HotspotMapScreen');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View
          style={[
            styles.checkCircle,
            {
              transform: [{ scale: checkScale }],
              opacity: checkOpacity,
            },
          ]}
        >
          <Text style={styles.checkText}>{'\u2713'}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
            },
          ]}
        >
          <Text style={styles.heading}>Pickup Confirmed!</Text>
          <Text style={styles.subtitle}>
            Green Points have been credited to the household.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.receipt,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
            },
          ]}
        >
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Waste Type</Text>
            <View style={styles.receiptValueRow}>
              {wasteMeta ? (
                <View
                  style={[styles.wasteDot, { backgroundColor: wasteMeta.color }]}
                />
              ) : null}
              <Text style={styles.receiptValue}>{wasteLabel}</Text>
            </View>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Weight Collected</Text>
            <Text style={styles.receiptValue}>{weight.toFixed(1)} kg</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Household Area</Text>
            <Text style={styles.receiptValue} numberOfLines={1}>
              {areaName}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Time</Text>
            <Text style={styles.receiptValue}>{timeString}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.pointsLabel}>Points Awarded to Household</Text>
            <Text style={styles.pointsValue}>+{pointsAwarded} pts</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.btn, styles.primaryBtn]}
          onPress={handleViewEarnings}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="View earnings"
        >
          <Text style={styles.primaryBtnText}>View Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.outlineBtn]}
          onPress={handleBackToMap}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Back to map"
        >
          <Text style={styles.outlineBtnText}>Back to Map</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  checkText: {
    color: colors.textInverse,
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  textBlock: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  receipt: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24 - spacing.xxl,
    marginTop: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  receiptLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    flex: 1,
    paddingRight: spacing.md,
  },
  receiptValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
    textAlign: 'right',
    flexShrink: 1,
  },
  wasteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  pointsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    paddingRight: spacing.md,
    fontFamily: typography.fontFamilyMedium,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontFamilyMedium,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  btn: {
    height: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
  outlineBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  outlineBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
