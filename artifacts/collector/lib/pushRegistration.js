import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerDeviceToken } from './integrations';

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function registerPushTokenWithBackend() {
  await ensureAndroidChannel();

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;
  if (finalStatus !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    finalStatus = asked.status;
  }

  if (finalStatus !== 'granted') return null;

  const pushToken = await Notifications.getDevicePushTokenAsync();
  const token = typeof pushToken?.data === 'string' ? pushToken.data : null;
  if (!token) return null;

  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  await registerDeviceToken({ token, platform });
  return token;
}
