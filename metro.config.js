const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Lisätään .wasm tuettujen tiedostomuotojen listalle
config.resolver.assetExts.push("wasm");

module.exports = config;