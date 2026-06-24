import { Linking, Platform } from 'react-native';

/** Open the app's system settings page so the user can re-enable permissions. */
export async function openAppSettings(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
      return true;
    }
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}
