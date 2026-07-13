const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname),
};

// Force Babel to transform these packages so private class fields (#field)
// are downleveled to syntax that Expo Go SDK 54's Hermes can parse.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|expo|@expo|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|@react-navigation|zustand|date-fns).*/)' ,
];

module.exports = config;
