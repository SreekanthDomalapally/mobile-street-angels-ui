import { useFonts } from 'expo-font';

/**
 * Preload icon fonts once at startup so @expo/vector-icons does not race
 * dozens of concurrent loadAsync calls (which can yield empty font files on Android).
 */
export function useAppFonts() {
  const [loaded, error] = useFonts({
    ionicons: require('../assets/fonts/Ionicons.ttf'),
  });

  return { fontsLoaded: loaded, fontError: error };
}
