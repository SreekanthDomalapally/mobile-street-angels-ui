import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Linked EAS project: @sreekanth.domalapally/mobile-youhoo-alert */
const EAS_PROJECT_ID = 'd37e827f-a71b-47c3-b0df-a2b912af8063';

const GOOGLE_SERVICES_FILE =
  process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';

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

  return {
    ...baseConfig,
    android: {
      ...baseConfig.android,
      googleServicesFile: GOOGLE_SERVICES_FILE,
    },
    extra: {
      ...baseConfig.extra,
      eas: {
        ...easExtra,
        projectId: EAS_PROJECT_ID,
      },
    },
  } satisfies ExpoConfig;
};
