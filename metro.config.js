const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Lisätään .wasm tuettujen tiedostomuotojen listalle
config.resolver.assetExts.push("wasm");

module.exports = config;
