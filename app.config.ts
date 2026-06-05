import type { ConfigContext, ExpoConfig } from 'expo/config';
import { readGoogleWebClientId } from './lib/googleServicesConfig';

/** Linked EAS project: @sreekanth.domalapally/mobile-youhoo-alert */
const EAS_PROJECT_ID = 'd37e827f-a71b-47c3-b0df-a2b912af8063';

const GOOGLE_SERVICES_FILE =
  process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';

const GOOGLE_SERVICE_INFO_PLIST =
  process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist';

/**
 * Extends app.json. Override via EXPO_PUBLIC_EAS_PROJECT_ID in .env if needed.
 * @see https://docs.expo.dev/build/setup/
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const baseConfig = config as ExpoConfig;
  const easExtra =
    typeof baseConfig.extra?.eas === 'object' && baseConfig.extra.eas !== null
      ? baseConfig.extra.eas
      : {};

  const androidMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ??
    baseConfig.android?.config?.googleMaps?.apiKey;
  const iosMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ??
    baseConfig.ios?.config?.googleMapsApiKey;

  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    readGoogleWebClientId(GOOGLE_SERVICES_FILE);

  return {
    ...baseConfig,
    ios: {
      ...baseConfig.ios,
      googleServicesFile: GOOGLE_SERVICE_INFO_PLIST,
      config: {
        ...baseConfig.ios?.config,
        ...(iosMapsKey ? { googleMapsApiKey: iosMapsKey } : {}),
      },
    },
    android: {
      ...baseConfig.android,
      googleServicesFile: GOOGLE_SERVICES_FILE,
      config: {
        ...baseConfig.android?.config,
        googleMaps: {
          ...baseConfig.android?.config?.googleMaps,
          ...(androidMapsKey ? { apiKey: androidMapsKey } : {}),
        },
      },
    },
    extra: {
      ...baseConfig.extra,
      googleWebClientId,
      eas: {
        ...easExtra,
        projectId: EAS_PROJECT_ID,
      },
    },
  } satisfies ExpoConfig;
};
