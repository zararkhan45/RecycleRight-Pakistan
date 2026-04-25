/**
 * RecycleRight Pakistan — Household Registration Screen
 *
 * Polish pass:
 *   - Theme consistency: PRIMARY/PANEL_BG and all hex literals in styles
 *     now sourced from ../../collector/theme.js. Subtle placeholder shade
 *     (#9CA3AF) kept as documented exception.
 *   - Keyboard avoidance: behavior is now
 *     `Platform.OS === 'ios' ? 'padding' : 'height'`.
 *   - Haptics: medium impact pulse on a successful "Create Account" press
 *     (wrapped in try/catch — silently no-ops on platforms without the
 *     module, e.g. web).
 *
 * Sign-up form for new household users. No backend wiring — on a successful
 * (locally-validated) submission we navigate into the dashboard with the
 * mock householdProfile attached.
 */

import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, typography } from '../../collector/theme.js';
import { householdProfile } from '../data/householdMockData.js';

const PRIMARY = colors.primary;
const PRIMARY_DARK = colors.primaryDark;
const PANEL_BG = colors.background;
const SURFACE = colors.surface;
const TEXT = colors.text;
const MUTED = colors.textMuted;
const BORDER = colors.border;
const DANGER = colors.danger;
const SHADOW = colors.shadow;
const SUBTLE = '#9CA3AF'; // not in shared theme — documented exception

export default function HouseholdRegistrationScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirmPassword,
    [password, confirmPassword],
  );

  const allFilled =
    fullName.trim() &&
    email.trim() &&
    phone.trim() &&
    address.trim() &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const canSubmit = Boolean(allFilled && passwordsMatch);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Haptics unavailable (web/unsupported device) — fail silently.
    }
    navigation?.navigate?.('HomeDashboardScreen', {
      householdProfile: {
        ...householdProfile,
        name: fullName || householdProfile.name,
        email: email || householdProfile.email,
        phone: phone || householdProfile.phone,
        address: address || householdProfile.address,
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerPanel}>
            <Text style={styles.brand}>RecycleRight</Text>
            <Text style={styles.brandSubtitle}>Household Portal</Text>
          </View>

          <View style={styles.card}>
            <Field
              label="Full Name"
              icon="👤"
              placeholder="Fatima Malik"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Field
              label="Email"
              icon="✉️"
              placeholder="you@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              label="Phone"
              icon="📱"
              placeholder="0300-1234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Field
              label="Address"
              icon="📍"
              placeholder="House No., Street, Area, Lahore"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />

            <Field
              label="Password"
              icon="🔒"
              placeholder="Choose a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightAccessory={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.toggleHit}
                >
                  <Text style={styles.toggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              }
            />

            <Field
              label="Confirm Password"
              icon="🔒"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => setConfirmTouched(true)}
              secureTextEntry={!showConfirm}
              rightAccessory={
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                  style={styles.toggleHit}
                >
                  <Text style={styles.toggleText}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              }
              errorText={
                confirmTouched && confirmPassword.length > 0 && !passwordsMatch
                  ? 'Passwords do not match'
                  : null
              }
            />

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                !canSubmit && styles.primaryButtonDisabled,
                pressed && canSubmit && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerMuted}>Already have an account? </Text>
              <Pressable
                onPress={() => navigation?.navigate?.('HouseholdLoginScreen')}
                hitSlop={8}
              >
                <Text style={styles.footerAction}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  icon,
  rightAccessory,
  errorText,
  multiline,
  numberOfLines,
  ...inputProps
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
          errorText && styles.inputWrapperError,
        ]}
      >
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          {...inputProps}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
          ]}
          placeholderTextColor={SUBTLE}
        />
        {rightAccessory ? (
          <View style={styles.rightAccessory}>{rightAccessory}</View>
        ) : null}
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PANEL_BG,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: 32,
  },
  headerPanel: {
    backgroundColor: PRIMARY,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  brand: {
    color: colors.textInverse,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    fontFamily: typography.fontFamilyMedium,
  },
  brandSubtitle: {
    marginTop: 6,
    color: colors.textInverse,
    opacity: 0.85,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  card: {
    backgroundColor: SURFACE,
    marginTop: -32,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 6,
    fontFamily: typography.fontFamily,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 48,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputWrapperError: {
    borderColor: DANGER,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: Platform.OS === 'android' ? 2 : 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 14,
    fontFamily: typography.fontFamily,
  },
  inputMultiline: {
    minHeight: 56,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  rightAccessory: {
    marginLeft: 8,
  },
  toggleHit: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  toggleText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  errorText: {
    marginTop: 6,
    color: DANGER,
    fontSize: 12,
    fontFamily: typography.fontFamily,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonPressed: {
    backgroundColor: PRIMARY_DARK,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerMuted: {
    color: MUTED,
    fontSize: 14,
    fontFamily: typography.fontFamily,
  },
  footerAction: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
