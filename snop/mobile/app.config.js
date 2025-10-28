export default {
  name: "SNOP",
  slug: "snop",
  scheme: "snop",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  web: {
    bundler: "metro",
  },
  plugins: ["expo-asset"], // 👈 keep this
  extra: {
    API_BASE_URL: "http://192.168.1.23:8000", // 👈 your LAN IP (only one "extra")
  },
};
