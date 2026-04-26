import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import { colors, spacing, radius, typography, shadows } from '../theme';
import { useAuthLogin } from '@workspace/api-client-react';
import { setAuthToken, setAuthUser } from '../lib/authStorage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_PANEL_HEIGHT = SCREEN_HEIGHT * 0.35;

export default function CollectorLoginScreen({ navigation }) {
  const [email, setEmail] = useState('collector1@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthLogin();
  const submitting = login.isPending;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleSignIn = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const result = await login.mutateAsync({
        data: { email: email.trim(), password },
      });

      await setAuthToken(result.token);
      await setAuthUser({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      });

      if (navigation && typeof navigation.reset === 'function') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { collector: result.user } }],
        });
      } else if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('HotspotMapScreen', { collector: result.user });
      }
    } catch (e) {
      setError('Login failed. Please check your email/password and API base URL.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.topPanel}>
        <View style={styles.brandWrap}>
          <Text style={styles.wordmark}>RecycleRight</Text>
          <Text style={styles.subtitle}>Collector Portal</Text>
        </View>
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
          bounces={false}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.helper}>Sign in to see your pickup jobs</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.leftIcon}>{'\u2709'}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@recycleright.pk"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.leftIcon}>{'\u{1F512}'}</Text>
                <TextInput
                  style={[styles.input, styles.inputWithRightAction]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleSignIn}
                  editable={!submitting}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.rightAction}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.rightActionText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.signInButton, !canSubmit && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={!canSubmit}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              {submitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.contactNote}>
              Not a collector yet? Contact your NGO
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  topPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOP_PANEL_HEIGHT,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  brandWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: typography.fontFamilyMedium,
    color: colors.textInverse,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.85,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: TOP_PANEL_HEIGHT - 32,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xxl,
    marginTop: -32,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heading: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
  },
  helper: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 20,
  },
  fieldGroup: {
    marginTop: spacing.xl,
  },
  label: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  leftIcon: {
    fontSize: 16,
    color: colors.textMuted,
    width: 22,
    textAlign: 'center',
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 0,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    fontFamily: typography.fontFamily,
  },
  inputWithRightAction: {
    paddingRight: spacing.sm,
  },
  rightAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rightActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: typography.fontFamilyMedium,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 13,
    fontWeight: '400',
    color: colors.danger,
  },
  signInButton: {
    marginTop: spacing.xxl,
    height: 52,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
  contactNote: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
});
