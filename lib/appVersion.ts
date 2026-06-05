import Constants from 'expo-constants';

export function getAppVersionLabel(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    Constants.nativeBuildVersion;

  return build ? `${version} (${build})` : version;
}
