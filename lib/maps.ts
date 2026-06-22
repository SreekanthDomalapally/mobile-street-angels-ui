import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function readAndroidMapsKey(): string | undefined {
  const fromConfig = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  if (typeof fromConfig === 'string' && fromConfig.length > 0) {
    return fromConfig;
  }

  return undefined;
}

function readIosMapsKey(): string | undefined {
  const fromConfig = Constants.expoConfig?.ios?.config?.googleMapsApiKey;
  if (typeof fromConfig === 'string' && fromConfig.length > 0) {
    return fromConfig;
  }

  return undefined;
}

/** Whether it is safe to mount react-native-maps MapView on this device/build. */
export function isNativeMapSupported(): boolean {
  if (Platform.OS === 'web') return false;
  if (isRunningInExpoGo()) return true;

  if (Platform.OS === 'android') {
    // Android requires a Maps SDK key embedded in the native binary at build time.
    return Boolean(readAndroidMapsKey());
  }

  return true;
}

export function getAndroidMapsApiKey(): string | undefined {
  return readAndroidMapsKey();
}

export function getIosMapsApiKey(): string | undefined {
  return readIosMapsKey();
}
