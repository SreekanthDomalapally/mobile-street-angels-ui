import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Linked EAS project: @sreekanth.domalapally/mobile-youhoo-alert */
const EAS_PROJECT_ID = 'd37e827f-a71b-47c3-b0df-a2b912af8063';

/**
 * Extends app.json. Override via EXPO_PUBLIC_EAS_PROJECT_ID in .env if needed.
 * @see https://docs.expo.dev/build/setup/
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    eas: {
      ...(typeof config.extra?.eas === 'object' ? config.extra.eas : {}),
      projectId: EAS_PROJECT_ID,
    },
  },
});
