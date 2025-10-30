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
  ios: { supportsTablet: true },
  android: {
    // adaptiveIcon: {
    //   foregroundImage: "./assets/images/adaptive-icon.png", // <- midlertidig ut
    //   backgroundColor: "#ffffff",
    // },
  },
  web: { bundler: "metro" },
  plugins: ["expo-asset"],
  extra: { API_BASE_URL: "http://127.0.0.1:8000" }
};
