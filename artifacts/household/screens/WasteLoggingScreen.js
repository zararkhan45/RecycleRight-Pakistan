/**
 * RecycleRight Pakistan — Waste Logging Screen
 *
 * Lets a household user describe what they want collected: type, weight,
 * and optional notes. Live-calculates the Green Points reward and hands
 * the selection off to the Pickup Request flow.
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import HeaderBar from '../../collector/components/HeaderBar';
import { typography } from '../../collector/theme.js';
import { wasteTypes } from '../data/householdMockData.js';

const PRIMARY = '#1E9B6B';
const BG = '#F8FAFB';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const QUICK_WEIGHTS = ['1', '2', '5', '10'];

export default function WasteLoggingScreen({ navigation }) {
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const selectedType = useMemo(
    () => wasteTypes.find((w) => w.id === selectedTypeId) || null,
    [selectedTypeId],
  );

  const weightNum = useMemo(() => {
    const n = parseFloat(weight);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [weight]);

  const estimatedPoints = useMemo(() => {
    if (!selectedType || weightNum <= 0) return 0;
    return Math.round(selectedType.pointsPerKg * weightNum);
  }, [selectedType, weightNum]);

  const canContinue = Boolean(selectedType) && weightNum > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    navigation?.navigate?.('PickupRequestScreen', {
      wasteType: selectedType,
      weight: weightNum,
      notes: notes.trim(),
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderBar
        title="Log Your Waste"
        showBack
        onBack={() =>
          navigation?.canGoBack?.()
            ? navigation.goBack()
            : navigation?.navigate?.('HomeDashboardScreen')
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Waste Type */}
        <Text style={styles.sectionTitle}>Select Waste Type</Text>
        <View style={styles.chipGrid}>
          {wasteTypes.map((wt) => {
            const isSelected = wt.id === selectedTypeId;
            return (
              <Pressable
                key={wt.id}
                onPress={() => setSelectedTypeId(wt.id)}
                style={({ pressed }) => [
                  styles.typeChip,
                  isSelected && {
                    backgroundColor: wt.colour,
                    borderColor: wt.colour,
                  },
                  pressed && styles.typeChipPressed,
                ]}
              >
                <Text style={styles.typeChipIcon}>{wt.icon}</Text>
                <Text
                  style={[
                    styles.typeChipLabel,
                    isSelected && styles.typeChipLabelSelected,
                  ]}
                >
                  {wt.label}
                </Text>
                <Text
                  style={[
                    styles.typeChipRate,
                    isSelected && styles.typeChipRateSelected,
                  ]}
                >
                  {wt.pointsPerKg} pts/kg
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Weight */}
        <Text style={styles.sectionTitle}>Estimated Weight (kg)</Text>
        <View style={styles.weightRow}>
          <View style={styles.weightInputWrap}>
            <TextInput
              value={weight}
              onChangeText={(text) =>
                setWeight(text.replace(/[^0-9.]/g, ''))
              }
              placeholder="0.0"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={styles.weightInput}
            />
          </View>
          <Text style={styles.weightUnit}>kg</Text>
        </View>

        <View style={styles.quickWeightRow}>
          {QUICK_WEIGHTS.map((w) => (
            <Pressable
              key={w}
              onPress={() => setWeight(w)}
              style={({ pressed }) => [
                styles.quickWeightChip,
                pressed && styles.quickWeightChipPressed,
                weight === w && styles.quickWeightChipActive,
              ]}
            >
              <Text
                style={[
                  styles.quickWeightText,
                  weight === w && styles.quickWeightTextActive,
                ]}
              >
                {w} kg
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <View style={styles.notesWrap}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="E.g. Bags are ready at the gate."
            placeholderTextColor="#9CA3AF"
            multiline
            style={styles.notesInput}
            textAlignVertical="top"
          />
        </View>

        {/* Points Preview */}
        <View style={styles.pointsPreview}>
          {selectedType && weightNum > 0 ? (
            <Text style={styles.pointsPreviewText}>
              🌱 Estimated:{' '}
              <Text style={styles.pointsPreviewHighlight}>
                +{estimatedPoints} Green Points
              </Text>
            </Text>
          ) : (
            <Text style={styles.pointsPreviewMuted}>
              🌱 Select waste type and weight to see points
            </Text>
          )}
        </View>

        {/* Continue */}
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
            pressed && canContinue && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>
            Continue to Request Pickup
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const CHIP_W = 100;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    marginTop: 20,
    marginHorizontal: 16,
    fontFamily: typography.fontFamilyMedium,
  },

  /* Waste-type grid */
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  typeChip: {
    width: CHIP_W,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeChipPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  typeChipIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  typeChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
    fontFamily: typography.fontFamilyMedium,
  },
  typeChipLabelSelected: {
    color: '#FFFFFF',
  },
  typeChipRate: {
    marginTop: 1,
    fontSize: 10,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  typeChipRateSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },

  /* Weight input */
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 16,
  },
  weightInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  weightInput: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    paddingVertical: 14,
    fontFamily: typography.fontFamilyMedium,
  },
  weightUnit: {
    fontSize: 16,
    color: MUTED,
    marginLeft: 12,
    fontFamily: typography.fontFamily,
  },

  /* Quick weight chips */
  quickWeightRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 16,
    flexWrap: 'wrap',
  },
  quickWeightChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  quickWeightChipPressed: {
    opacity: 0.85,
  },
  quickWeightChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  quickWeightText: {
    fontSize: 13,
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  quickWeightTextActive: {
    color: '#FFFFFF',
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

  /* Points preview */
  pointsPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsPreviewText: {
    fontSize: 14,
    color: TEXT,
    fontFamily: typography.fontFamily,
  },
  pointsPreviewHighlight: {
    color: PRIMARY,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMedium,
  },
  pointsPreviewMuted: {
    fontSize: 14,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },

  /* Continue button */
  continueButton: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonPressed: {
    backgroundColor: '#17784F',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
