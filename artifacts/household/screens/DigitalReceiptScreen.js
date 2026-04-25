/**
 * RecycleRight Pakistan — Digital Receipt Screen
 *
 * Stack-pushed screen reached after tapping a completed pickup. Renders a
 * printable-style receipt card with a slide-up + fade-in entry animation
 * and two follow-up actions (download / back).
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import HeaderBar from '../../collector/components/HeaderBar';
import { typography } from '../../collector/theme.js';
import {
  householdProfile,
  pickupRequests,
  wasteTypes,
} from '../data/householdMockData.js';

const PRIMARY = '#1E9B6B';
const PRIMARY_DARK = '#17784F';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const SUBTLE = '#9CA3AF';
const BORDER = '#E5E7EB';
const BG = '#F8FAFB';
const SUCCESS = '#10B981';

export default function DigitalReceiptScreen({ navigation, route }) {
  /* Receipt source — passed in from history, otherwise pick the most
     recently completed mock entry as a sensible fallback. */
  const passed = route?.params?.request || null;
  const fallback = useMemo(
    () =>
      [...pickupRequests]
        .filter((r) => r.status === 'completed')
        .sort(
          (a, b) =>
            new Date(b.completedAt || 0).getTime() -
            new Date(a.completedAt || 0).getTime(),
        )[0] || pickupRequests[0],
    [],
  );
  const request = passed || fallback;

  const wasteType = useMemo(
    () => wasteTypes.find((w) => w.id === request.wasteType) || null,
    [request],
  );

  /* Slide-up + fade-in for the card */
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const completedDate = formatLongDate(request.completedAt || request.scheduledDate);
  const completedTime = formatTime(request.completedAt || request.scheduledDate);

  const handleBack = () =>
    navigation?.canGoBack?.()
      ? navigation.goBack()
      : navigation?.navigate?.('PickupHistoryScreen');

  const handleDownload = () => {
    Alert.alert('Receipt download is not available in the demo.');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderBar title="Digital Receipt" showBack onBack={handleBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.receiptCard,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.topStrip} />

          <View style={styles.receiptInner}>
            <Text style={styles.brand}>RecycleRight</Text>
            <Text style={styles.brandSub}>Official Pickup Receipt</Text>

            <Text style={styles.receiptId}>Receipt #{request.receiptId || '—'}</Text>
            <Text style={styles.receiptDate}>
              {completedDate} • {completedTime}
            </Text>

            <DashedDivider />

            <ReceiptRow label="Household Name" value={householdProfile.name} />
            <ReceiptRow label="Address" value={householdProfile.address} />
            <ReceiptRow
              label="Waste Type"
              value={wasteType?.label || request.wasteType}
            />
            <ReceiptRow
              label="Weight"
              value={`${request.estimatedWeight} kg`}
            />
            <ReceiptRow
              label="Collector"
              value={request.collectorName || '—'}
            />
            <ReceiptRow label="Pickup Date" value={completedDate} />
            <ReceiptRow
              label="Status"
              value="Completed ✓"
              valueColor={SUCCESS}
            />

            <DashedDivider />

            <View style={styles.pointsBlock}>
              <Text style={styles.pointsLabel}>🌱 Green Points Earned</Text>
              <Text style={styles.pointsValue}>
                +{request.pointsEarned ?? 0} pts
              </Text>
              <Text style={styles.pointsFooter}>Added to your balance</Text>
            </View>
          </View>
        </Animated.View>

        <Pressable
          onPress={handleDownload}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Download Receipt</Text>
        </Pressable>

        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && styles.outlineButtonPressed,
          ]}
        >
          <Text style={styles.outlineButtonText}>Back to History</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ReceiptRow({ label, value, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          valueColor && { color: valueColor },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function DashedDivider() {
  return <View style={styles.dashedDivider} />;
}

function formatLongDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return iso || '—';
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  /* Receipt card */
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  topStrip: {
    height: 8,
    backgroundColor: PRIMARY,
  },
  receiptInner: {
    padding: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY,
    textAlign: 'center',
    fontFamily: typography.fontFamilyMedium,
  },
  brandSub: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  receiptId: {
    marginTop: 12,
    fontSize: 12,
    color: SUBTLE,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  receiptDate: {
    marginTop: 2,
    fontSize: 12,
    color: SUBTLE,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },

  dashedDivider: {
    marginVertical: 16,
    height: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: BORDER,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 14,
    color: MUTED,
    fontFamily: typography.fontFamily,
    flex: 1,
    paddingRight: 12,
  },
  rowValue: {
    fontSize: 14,
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    flex: 1.4,
    textAlign: 'right',
  },

  pointsBlock: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  pointsValue: {
    marginTop: 6,
    fontSize: 36,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: -0.5,
    fontFamily: typography.fontFamilyMedium,
  },
  pointsFooter: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },

  /* Buttons */
  primaryButton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 52,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: PRIMARY_DARK,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  outlineButton: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 52,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonPressed: {
    backgroundColor: '#E8F5EE',
  },
  outlineButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
