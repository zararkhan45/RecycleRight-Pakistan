/**
 * RecycleRight Pakistan — Household Login Screen
 *
 * Mirrors the Collector login layout: green hero panel up top, white card
 * with the login form floating over it. No backend wiring — pressing
 * "Sign In" hands the mock householdProfile straight to the dashboard.
 */

import React, { useState } from 'react';
import {
  Alert,
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

import { colors, typography } from '../../collector/theme.js';
import { householdProfile } from '../data/householdMockData.js';

const PRIMARY = '#1E9B6B';
const PANEL_BG = '#F8FAFB';

export default function HouseholdLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSignIn = () => {
    if (!canSubmit) return;
    navigation?.navigate?.('HomeDashboardScreen', {
      householdProfile: {
        ...householdProfile,
        email: email || householdProfile.email,
      },
    });
  };

  const handleForgotPassword = () => {
    Alert.alert('Password reset is not available in the demo.');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            <Text style={styles.cardHeading}>Welcome back</Text>
            <Text style={styles.cardSubtext}>
              Sign in to manage your pickups
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.toggleHit}
                >
                  <Text style={styles.toggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleSignIn}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                !canSubmit && styles.primaryButtonDisabled,
                pressed && canSubmit && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerMuted}>Don&apos;t have an account? </Text>
              <Pressable
                onPress={() =>
                  navigation?.navigate?.('HouseholdRegistrationScreen')
                }
                hitSlop={8}
              >
                <Text style={styles.footerAction}>Register</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleForgotPassword}
              hitSlop={8}
              style={styles.forgotRow}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    minHeight: '100%',
  },
  headerPanel: {
    backgroundColor: PRIMARY,
    paddingTop: 72,
    paddingBottom: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    fontFamily: typography.fontFamilyMedium,
  },
  brandSubtitle: {
    marginTop: 6,
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginTop: -36,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: typography.fontFamilyMedium,
  },
  cardSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
    fontFamily: typography.fontFamily,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontFamily: typography.fontFamily,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 14,
    fontFamily: typography.fontFamily,
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
    backgroundColor: '#17784F',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerMuted: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: typography.fontFamily,
  },
  footerAction: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
  forgotRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: typography.fontFamily,
  },
});
