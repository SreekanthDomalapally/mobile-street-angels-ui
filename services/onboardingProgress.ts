import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_SYNCED_KEY = 'youhoo-contacts-synced';
const TRUSTED_MIN_MET_KEY = 'youhoo-trusted-min-met';

export async function getContactsSynced(): Promise<boolean> {
  const value = await AsyncStorage.getItem(CONTACTS_SYNCED_KEY);
  return value === 'true';
}

export async function setContactsSynced(synced: boolean): Promise<void> {
  await AsyncStorage.setItem(CONTACTS_SYNCED_KEY, synced ? 'true' : 'false');
}

export async function getTrustedMinimumMet(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TRUSTED_MIN_MET_KEY);
  return value === 'true';
}

export async function setTrustedMinimumMet(met: boolean): Promise<void> {
  await AsyncStorage.setItem(TRUSTED_MIN_MET_KEY, met ? 'true' : 'false');
}

export async function clearOnboardingProgress(): Promise<void> {
  await AsyncStorage.multiRemove([CONTACTS_SYNCED_KEY, TRUSTED_MIN_MET_KEY]);
}
