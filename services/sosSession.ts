import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_ALERT_KEY = 'street-angels-active-sos-id';

export async function persistActiveAlertId(alertId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_ALERT_KEY, alertId);
}

export async function getPersistedActiveAlertId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_ALERT_KEY);
}

export async function clearPersistedActiveAlert(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_ALERT_KEY);
}
