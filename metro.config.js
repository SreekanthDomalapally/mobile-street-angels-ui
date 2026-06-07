const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const initializeCore = require.resolve('react-native/Libraries/Core/InitializeCore');
const upstreamGetModulesRunBeforeMainModule =
  config.serializer?.getModulesRunBeforeMainModule;

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: (entryPoint) => {
    const upstream = upstreamGetModulesRunBeforeMainModule?.(entryPoint) ?? [];
    const isWebEntry =
      typeof entryPoint === 'string' &&
      (entryPoint.includes('.web.') || entryPoint.endsWith('index.web.js'));
    if (isWebEntry) {
      return upstream;
    }
    return [...new Set([initializeCore, ...upstream])];
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
