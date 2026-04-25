import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, radius, typography } from '../theme';
import { WASTE_TYPES } from '../data/mockData';

function dominantWasteType(items = []) {
  if (!items.length) return null;
  return items.reduce(
    (best, cur) =>
      (cur.estimatedWeightKg || 0) > (best.estimatedWeightKg || 0) ? cur : best,
    items[0],
  );
}

function totalEstimatedWeight(items = []) {
  return items.reduce((s, it) => s + (it.estimatedWeightKg || 0), 0);
}

export default function WeightEntryScreen({ navigation, route }) {
  const job = (route && route.params && route.params.job) || null;
  const collector = (route && route.params && route.params.collector) || null;

  const initialDominant = job ? dominantWasteType(job.items) : null;
  const initialEstimated = job ? totalEstimatedWeight(job.items) : 0;

  const [weight, setWeight] = useState(
    initialEstimated > 0 ? String(initialEstimated) : '',
  );
  const [selectedWaste, setSelectedWaste] = useState(
    initialDominant ? initialDominant.wasteType : 'plastic',
  );

  const inputRef = useRef(null);

  const wasteList = useMemo(() => Object.values(WASTE_TYPES), []);

  const handleConfirm = () => {
    if (!navigation) return;
    const parsed = parseFloat(weight);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    if (typeof navigation.navigate === 'function') {
      navigation.navigate('PickupConfirmationScreen', {
        weight: parsed,
        wasteType: selectedWaste,
        job,
        collector,
      });
    }
  };

  const handleWeightChange = (txt) => {
    let cleaned = txt.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    if (cleaned.length > 6) cleaned = cleaned.slice(0, 6);
    setWeight(cleaned);
  };

  const canConfirm = parseFloat(weight) > 0;

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
        <Text style={styles.headerTitle}>Confirm Weight</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.illustrationIcon}>{'\u2696\uFE0F'}</Text>
            </View>
          </View>

          <Text style={styles.label}>Enter collected weight</Text>

          <TouchableOpacity
            style={styles.weightFieldWrap}
            activeOpacity={0.9}
            onPress={() => inputRef.current && inputRef.current.focus()}
          >
            <TextInput
              ref={inputRef}
              style={styles.weightInput}
              value={weight}
              onChangeText={handleWeightChange}
              placeholder="0.0"
              placeholderTextColor={colors.borderStrong}
              keyboardType="decimal-pad"
              maxLength={6}
              selectionColor={colors.primary}
              autoFocus
            />
            <Text style={styles.weightUnit}>kilograms</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Waste type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {wasteList.map((w) => {
              const isActive = selectedWaste === w.id;
              return (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => setSelectedWaste(w.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.chip,
                    isActive
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: isActive ? colors.surface : w.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: isActive ? colors.textInverse : colors.text },
                    ]}
                  >
                    {w.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Photo evidence</Text>
          <TouchableOpacity
            style={styles.photoDropzone}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            <Text style={styles.photoIcon}>{'\u{1F4F7}'}</Text>
            <Text style={styles.photoText}>Tap to add photo (optional)</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !canConfirm && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Confirm pickup"
          >
            <Text style={styles.confirmBtnText}>Confirm Pickup</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  illustrationWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5EE',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationIcon: {
    fontSize: 44,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.fontFamilyMedium,
  },
  weightFieldWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  weightInput: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
    textAlign: 'center',
    minWidth: 160,
    paddingVertical: 0,
  },
  weightUnit: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.4,
    fontFamily: typography.fontFamilyMedium,
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
  chipsRow: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    marginRight: spacing.sm,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  photoDropzone: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  photoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMedium,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
});
