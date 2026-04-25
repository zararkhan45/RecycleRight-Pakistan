/**
 * RecycleRight Pakistan — Pickup Request Screen
 *
 * Confirms the pickup details: location, preferred date, time window, and
 * special instructions. Submission flashes a brief success state on the
 * button and then bounces the user back to the dashboard.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import HeaderBar from '../../collector/components/HeaderBar';
import MapView, { Marker } from '../../collector/components/Map';
import { typography } from '../../collector/theme.js';
import { householdProfile } from '../data/householdMockData.js';

const PRIMARY = '#1E9B6B';
const PRIMARY_DARK = '#17784F';
const BG = '#F8FAFB';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const SUBTLE = '#9CA3AF';
const BORDER = '#E5E7EB';

const HOME_LAT = 31.4697;
const HOME_LNG = 74.4054;

const TIME_OPTIONS = [
  { id: 'morning', label: 'Morning', range: '8am – 12pm' },
  { id: 'afternoon', label: 'Afternoon', range: '12pm – 5pm' },
  { id: 'evening', label: 'Evening', range: '5pm – 8pm' },
];

const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBREV = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function PickupRequestScreen({ navigation, route }) {
  const passed = route?.params || {};
  const wasteType = passed.wasteType || null;
  const weight = typeof passed.weight === 'number' ? passed.weight : 0;

  const dates = useMemo(() => buildNextDays(5), []);
  const [selectedDateIso, setSelectedDateIso] = useState(dates[0].iso);
  const [timeId, setTimeId] = useState('morning');
  const [instructions, setInstructions] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedDate = useMemo(
    () => dates.find((d) => d.iso === selectedDateIso) || dates[0],
    [dates, selectedDateIso],
  );
  const selectedTime = useMemo(
    () => TIME_OPTIONS.find((t) => t.id === timeId) || TIME_OPTIONS[0],
    [timeId],
  );

  const handleEdit = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation?.navigate?.('WasteLoggingScreen');
  };

  const handleChangeLocation = () => {
    Alert.alert('Location editing is not available in the demo.');
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    setTimeout(() => {
      navigation?.navigate?.('HomeDashboardScreen');
    }, 800);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderBar
        title="Request Pickup"
        showBack
        onBack={handleEdit}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: wasteType?.colour || '#E5E7EB' },
            ]}
          >
            <Text style={styles.summaryIconText}>
              {wasteType?.icon || '♻️'}
            </Text>
          </View>
          <View style={styles.summaryCenter}>
            <Text style={styles.summaryLabel}>
              {wasteType?.label || 'Waste'}
            </Text>
            <Text style={styles.summarySub}>
              ~{weight ? weight : '0'} kg estimated
            </Text>
          </View>
          <Pressable onPress={handleEdit} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>

        {/* Pickup Location */}
        <Text style={styles.sectionTitle}>Pickup Location</Text>
        <View style={styles.mapWrap} pointerEvents="none">
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: HOME_LAT,
              longitude: HOME_LNG,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Marker
              coordinate={{ latitude: HOME_LAT, longitude: HOME_LNG }}
              title={householdProfile.name}
            />
          </MapView>
        </View>
        <View style={styles.addressRow}>
          <Text style={styles.addressText}>{householdProfile.address}</Text>
          <Pressable onPress={handleChangeLocation} hitSlop={6}>
            <Text style={styles.changeLocationLink}>Change Location</Text>
          </Pressable>
        </View>

        {/* Preferred Date */}
        <Text style={styles.sectionTitle}>Preferred Pickup Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {dates.map((d) => {
            const isSelected = d.iso === selectedDateIso;
            return (
              <Pressable
                key={d.iso}
                onPress={() => setSelectedDateIso(d.iso)}
                style={({ pressed }) => [
                  styles.dateChip,
                  isSelected && styles.dateChipSelected,
                  pressed && styles.dateChipPressed,
                ]}
              >
                <Text
                  style={[
                    styles.dateDay,
                    isSelected && styles.dateDaySelected,
                  ]}
                >
                  {d.day}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dateNumSelected,
                  ]}
                >
                  {d.dayOfMonth}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Time Preference */}
        <Text style={styles.sectionTitle}>Time Preference</Text>
        <View style={styles.timeList}>
          {TIME_OPTIONS.map((t) => {
            const isSelected = t.id === timeId;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTimeId(t.id)}
                style={({ pressed }) => [
                  styles.timeRow,
                  pressed && styles.timeRowPressed,
                ]}
              >
                <View style={styles.radioOuter}>
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.timeLabel}>
                  {t.label}{' '}
                  <Text style={styles.timeRange}>({t.range})</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Special Instructions */}
        <Text style={styles.sectionTitle}>Special Instructions</Text>
        <View style={styles.notesWrap}>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="E.g. Ring the gate buzzer twice."
            placeholderTextColor="#9CA3AF"
            multiline
            style={styles.notesInput}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.orderCard}>
          <Text style={styles.orderTitle}>Order Summary</Text>
          <SummaryRow
            label="Waste Type"
            value={wasteType?.label || '—'}
          />
          <SummaryRow
            label="Estimated Weight"
            value={weight ? `${weight} kg` : '—'}
          />
          <SummaryRow
            label="Location"
            value={extractArea(householdProfile.address)}
          />
          <SummaryRow label="Date" value={selectedDate.long} />
          <SummaryRow
            label="Time"
            value={`${selectedTime.label} (${selectedTime.range})`}
          />
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitted}
          style={({ pressed }) => [
            styles.submitButton,
            submitted && styles.submitButtonSuccess,
            pressed && !submitted && styles.submitButtonPressed,
          ]}
        >
          <Text style={styles.submitButtonText}>
            {submitted ? '✓ Request Submitted!' : 'Submit Pickup Request'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <Text style={styles.summaryRowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function buildNextDays(count) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      day: DAY_ABBREV[d.getDay()],
      dayOfMonth: d.getDate(),
      long: `${DAY_ABBREV[d.getDay()]}, ${d.getDate()} ${MONTH_ABBREV[d.getMonth()]}`,
    });
  }
  return out;
}

function extractArea(address) {
  if (!address) return '—';
  const parts = address.split(',').map((s) => s.trim());
  if (parts.length >= 3) return parts.slice(-3, -1).join(', ');
  return address;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  /* Summary */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryIconText: {
    fontSize: 22,
  },
  summaryCenter: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  summarySub: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  editLink: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    marginTop: 20,
    marginHorizontal: 16,
    fontFamily: typography.fontFamilyMedium,
  },

  /* Map */
  mapWrap: {
    height: 160,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  addressRow: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
    paddingRight: 12,
    fontFamily: typography.fontFamily,
  },
  changeLocationLink: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Date row */
  dateRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  dateChip: {
    width: 64,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateChipSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  dateChipPressed: {
    opacity: 0.85,
  },
  dateDay: {
    fontSize: 11,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  dateDaySelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dateNum: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  dateNumSelected: {
    color: '#FFFFFF',
  },

  /* Time list */
  timeList: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeRowPressed: {
    opacity: 0.7,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY,
  },
  timeLabel: {
    fontSize: 14,
    color: TEXT,
    fontFamily: typography.fontFamily,
  },
  timeRange: {
    color: MUTED,
    fontSize: 13,
  },

  /* Notes */
  notesWrap: {
    marginTop: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    height: 80,
    padding: 12,
    fontSize: 14,
    color: TEXT,
    fontFamily: typography.fontFamily,
  },

  /* Order Summary */
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 8,
    fontFamily: typography.fontFamilyMedium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F6',
  },
  summaryRowLabel: {
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  summaryRowValue: {
    fontSize: 13,
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    maxWidth: '60%',
    textAlign: 'right',
  },

  /* Submit */
  submitButton: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    backgroundColor: PRIMARY_DARK,
  },
  submitButtonSuccess: {
    backgroundColor: PRIMARY_DARK,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
