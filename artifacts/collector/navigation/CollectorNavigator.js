import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors, spacing, radius, typography } from '../theme';
import { collectorProfile } from '../data/mockData';

import CollectorLoginScreen from '../screens/CollectorLoginScreen';
import HotspotMapScreen from '../screens/HotspotMapScreen';
import JobListScreen from '../screens/JobListScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import NavigationScreen from '../screens/NavigationScreen';
import WeightEntryScreen from '../screens/WeightEntryScreen';
import PickupConfirmationScreen from '../screens/PickupConfirmationScreen';
import EarningsDashboardScreen from '../screens/EarningsDashboardScreen';

import BottomTabBar from '../components/BottomTabBar';

const Stack = createNativeStackNavigator();

function ProfileScreen({ navigation, collector }) {
  const profile = collector || collectorProfile;
  const verified = profile && profile.verified;

  return (
    <SafeAreaView style={profileStyles.root} edges={['top']}>
      <View style={profileStyles.header}>
        <Text style={profileStyles.headerTitle}>Profile</Text>
      </View>

      <View style={profileStyles.body}>
        <View style={profileStyles.avatar}>
          <Text style={profileStyles.avatarText}>
            {(profile.name || 'C').charAt(0)}
          </Text>
        </View>
        <Text style={profileStyles.name}>{profile.name}</Text>
        <Text style={profileStyles.city}>{profile.city || 'Lahore'}</Text>

        {verified ? (
          <View style={profileStyles.verifiedPill}>
            <Text style={profileStyles.verifiedDot}>{'\u2713'}</Text>
            <Text style={profileStyles.verifiedText}>Verified Collector</Text>
          </View>
        ) : null}

        <View style={profileStyles.metaCard}>
          <View style={profileStyles.metaRow}>
            <Text style={profileStyles.metaLabel}>Phone</Text>
            <Text style={profileStyles.metaValue}>{profile.phone || '—'}</Text>
          </View>
          <View style={profileStyles.divider} />
          <View style={profileStyles.metaRow}>
            <Text style={profileStyles.metaLabel}>Vehicle</Text>
            <Text style={profileStyles.metaValue}>
              {profile.vehicle ? profile.vehicle.type : '—'}
            </Text>
          </View>
          <View style={profileStyles.divider} />
          <View style={profileStyles.metaRow}>
            <Text style={profileStyles.metaLabel}>Lifetime Pickups</Text>
            <Text style={profileStyles.metaValue}>
              {profile.totalPickups || 0}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={profileStyles.logoutBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (navigation && typeof navigation.reset === 'function') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={profileStyles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MainTabs({ navigation, route }) {
  const collector =
    (route && route.params && route.params.collector) || collectorProfile;
  const [activeTab, setActiveTab] = useState('map');

  const renderActive = () => {
    const passNavigation = navigation;
    const passRoute = { params: { collector } };

    switch (activeTab) {
      case 'jobs':
        return (
          <JobListScreen navigation={passNavigation} route={passRoute} />
        );
      case 'earnings':
        return (
          <EarningsDashboardScreen
            navigation={passNavigation}
            route={passRoute}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            navigation={passNavigation}
            route={passRoute}
            collector={collector}
          />
        );
      case 'map':
      default:
        return (
          <HotspotMapScreen
            navigation={passNavigation}
            route={passRoute}
          />
        );
    }
  };

  return (
    <View style={styles.tabRoot}>
      <View style={styles.tabBody}>{renderActive()}</View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

export default function CollectorNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Login" component={CollectorLoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />

        <Stack.Screen
          name="HotspotMapScreen"
          component={MainTabs}
          options={{ animation: 'fade' }}
        />

        <Stack.Screen
          name="JobDetailScreen"
          component={JobDetailScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="NavigationScreen"
          component={NavigationScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="WeightEntryScreen"
          component={WeightEntryScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="PickupConfirmationScreen"
          component={PickupConfirmationScreen}
          options={{ presentation: 'modal', animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBody: {
    flex: 1,
  },
});

const profileStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E8F5EE',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontFamilyMedium,
  },
  name: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  city: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMedium,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: spacing.sm,
  },
  verifiedDot: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  verifiedText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: typography.fontFamilyMedium,
  },
  metaCard: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilyMedium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  logoutBtn: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.2,
  },
});
