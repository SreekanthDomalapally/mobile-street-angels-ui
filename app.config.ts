import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Linked EAS project: @sreekanth.domalapally/mobile-street-angels-ui */
const EAS_PROJECT_ID = '0fd5577a-0d0c-467f-9b22-5ef58edabe36';

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
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? EAS_PROJECT_ID,
    },
  },
});
