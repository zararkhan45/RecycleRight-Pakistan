/**
 * RecycleRight Pakistan — Household Navigator
 *
 * Stack-based navigator with a custom tab container at "Main". The tab
 * bar drives the home/history/profile content, while "Log Waste" pushes
 * WasteLoggingScreen onto the stack rather than swapping tab content.
 *
 * Tab-screen names (HomeDashboardScreen, PickupHistoryScreen,
 * ProfileScreen) are also registered as Stack screens that re-mount the
 * tab container on the right tab — this lets stack screens that call
 * `navigation.navigate('HomeDashboardScreen')` Just Work.
 */

import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { typography } from '../../collector/theme.js';

import BottomTabBar from '../components/BottomTabBar';
import HeaderBar from '../components/HeaderBar';
import PointsBalanceCard from '../components/PointsBalanceCard';

import HouseholdRegistrationScreen from '../screens/HouseholdRegistrationScreen';
import HouseholdLoginScreen from '../screens/HouseholdLoginScreen';
import HomeDashboardScreen from '../screens/HomeDashboardScreen';
import WasteLoggingScreen from '../screens/WasteLoggingScreen';
import PickupRequestScreen from '../screens/PickupRequestScreen';
import LiveMapTrackingScreen from '../screens/LiveMapTrackingScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import PickupHistoryScreen from '../screens/PickupHistoryScreen';
import DigitalReceiptScreen from '../screens/DigitalReceiptScreen';

import {
  householdProfile,
  greenPointsTiers,
} from '../data/householdMockData.js';

const PRIMARY = '#1E9B6B';
const PRIMARY_DARK = '#17784F';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const BG = '#F8FAFB';
const SUCCESS = '#10B981';
const DANGER = '#EF4444';

const Stack = createNativeStackNavigator();

/* ----- Inline Profile placeholder ----- */
function ProfileScreen({ navigation }) {
  const profile = householdProfile;
  const initials = (profile.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentTier =
    [...greenPointsTiers]
      .reverse()
      .find((t) => profile.points >= t.minPoints) || greenPointsTiers[0];
  const nextTier = greenPointsTiers.find(
    (t) => t.minPoints > profile.points,
  );

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          navigation?.reset?.({
            index: 0,
            routes: [{ name: 'HouseholdLoginScreen' }],
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={profileStyles.root} edges={['top']}>
      <View style={profileStyles.header}>
        <Text style={profileStyles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={profileStyles.body}>
        <View style={profileStyles.avatar}>
          <Text style={profileStyles.avatarText}>{initials}</Text>
        </View>
        <Text style={profileStyles.name}>{profile.name}</Text>
        <Text style={profileStyles.city}>{profile.city || 'Lahore'}</Text>

        {profile.verified ? (
          <View style={profileStyles.verifiedPill}>
            <Text style={profileStyles.verifiedText}>{'\u2713 Verified'}</Text>
          </View>
        ) : null}

        <View style={profileStyles.pointsCardWrap}>
          <PointsBalanceCard
            points={profile.points}
            tier={currentTier?.name || 'Bronze'}
            nextTierPoints={nextTier?.minPoints}
            nextTierName={nextTier?.name}
          />
        </View>

        <View style={profileStyles.metaCard}>
          <ProfileRow label="Phone" value={profile.phone || '—'} />
          <View style={profileStyles.divider} />
          <ProfileRow label="Address" value={profile.address || '—'} />
          <View style={profileStyles.divider} />
          <ProfileRow
            label="Lifetime Pickups"
            value={String(profile.totalPickups ?? 0)}
          />
          <View style={profileStyles.divider} />
          <ProfileRow
            label="kg Recycled"
            value={`${(profile.totalKgRecycled ?? 0).toFixed(1)} kg`}
          />
        </View>

        <TouchableOpacity
          style={profileStyles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={profileStyles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }) {
  return (
    <View style={profileStyles.metaRow}>
      <Text style={profileStyles.metaLabel}>{label}</Text>
      <Text style={profileStyles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/* ----- Tab container ----- */
function MainTabs({ navigation, route }) {
  const initialTab =
    (route && route.params && route.params.initialTab) || 'home';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId) => {
    if (tabId === 'log') {
      navigation?.navigate?.('WasteLoggingScreen');
      return;
    }
    setActiveTab(tabId);
  };

  const renderActive = () => {
    const passNavigation = navigation;
    const passRoute = { params: {} };

    switch (activeTab) {
      case 'history':
        return (
          <PickupHistoryScreen
            navigation={passNavigation}
            route={passRoute}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            navigation={passNavigation}
            route={passRoute}
          />
        );
      case 'home':
      default:
        return (
          <HomeDashboardScreen
            navigation={passNavigation}
            route={passRoute}
          />
        );
    }
  };

  return (
    <View style={styles.tabRoot}>
      <View style={styles.tabContent}>{renderActive()}</View>
      <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </View>
  );
}

/* ----- Wrappers so existing navigate() targets resolve ----- */
const HomeDashboardRoute = (props) => (
  <MainTabs
    {...props}
    route={{ ...props.route, params: { initialTab: 'home' } }}
  />
);
const PickupHistoryRoute = (props) => (
  <MainTabs
    {...props}
    route={{ ...props.route, params: { initialTab: 'history' } }}
  />
);
const ProfileTabRoute = (props) => (
  <MainTabs
    {...props}
    route={{ ...props.route, params: { initialTab: 'profile' } }}
  />
);

/* ----- Root navigator ----- */
export default function HouseholdNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HouseholdLoginScreen"
        screenOptions={{ headerShown: false }}
      >
        {/* Auth */}
        <Stack.Screen
          name="HouseholdLoginScreen"
          component={HouseholdLoginScreen}
        />
        <Stack.Screen
          name="HouseholdRegistrationScreen"
          component={HouseholdRegistrationScreen}
        />

        {/* Tab container */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Tab-name aliases — render Main on the requested tab */}
        <Stack.Screen
          name="HomeDashboardScreen"
          component={HomeDashboardRoute}
        />
        <Stack.Screen
          name="PickupHistoryScreen"
          component={PickupHistoryRoute}
        />
        <Stack.Screen name="ProfileScreen" component={ProfileTabRoute} />

        {/* Pushed/modal stack screens */}
        <Stack.Screen
          name="WasteLoggingScreen"
          component={WasteLoggingScreen}
        />
        <Stack.Screen
          name="PickupRequestScreen"
          component={PickupRequestScreen}
        />
        <Stack.Screen
          name="LiveMapTrackingScreen"
          component={LiveMapTrackingScreen}
        />
        <Stack.Screen
          name="PhotoUploadScreen"
          component={PhotoUploadScreen}
        />
        <Stack.Screen
          name="DigitalReceiptScreen"
          component={DigitalReceiptScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* ----- Styles ----- */
const styles = StyleSheet.create({
  tabRoot: {
    flex: 1,
    backgroundColor: BG,
  },
  tabContent: {
    flex: 1,
  },
});

const profileStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  body: {
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMedium,
  },
  name: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  city: {
    marginTop: 2,
    fontSize: 14,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },
  verifiedPill: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: SUCCESS,
    fontFamily: typography.fontFamilyMedium,
  },
  pointsCardWrap: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  metaCard: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  metaLabel: {
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
    flex: 1,
    paddingRight: 12,
  },
  metaValue: {
    fontSize: 13,
    color: TEXT,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
    flex: 1.4,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  logoutBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: DANGER,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: DANGER,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});
