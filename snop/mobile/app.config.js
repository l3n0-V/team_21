export default {
  name: "SNOP",
  slug: "snop",
  scheme: "snop",
  version: "0.1.0",
  orientation: "portrait",
  // icon: "./assets/images/icon.png",            // <- midlertidig ut
  userInterfaceStyle: "automatic",
  splash: {
    // image: "./assets/images/splash.png",       // <- midlertidig ut
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.team21.snop",
    // Allow HTTP connections for local development/testing
    // IMPORTANT: Remove or restrict this for production deployment!
    infoPlist: {
      NSAppTransportSecurity: {
        // Allow HTTP for localhost and local IP addresses (development/testing)
        NSAllowsLocalNetworking: true,
        // Allow arbitrary HTTP loads (needed for teacher testing on physical devices)
        NSAllowsArbitraryLoads: true
      }
    }
  },
  android: {
    package: "com.team21.snop",
    // adaptiveIcon: {
    //   foregroundImage: "./assets/images/adaptive-icon.png", // <- midlertidig ut
    //   backgroundColor: "#ffffff",
    // },
  },
  web: { bundler: "metro" },
  plugins: ["expo-asset"],
  // API_BASE_URL is now centralized in shared/config/endpoints.js
  extra: {}
};
