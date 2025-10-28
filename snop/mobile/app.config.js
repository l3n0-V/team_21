export default {
  name: "SNOP",
  slug: "snop",
  scheme: "snop",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  splash: { image: "./assets/images/splash.png", resizeMode: "contain", backgroundColor: "#ffffff" },
  ios: { supportsTablet: true },
  android: { adaptiveIcon: { foregroundImage: "./assets/images/adaptive-icon.png", backgroundColor: "#ffffff" } },
  web: { bundler: "metro" },
  extra: {
    API_BASE_URL: "http://127.0.0.1:8000" // change to LAN IP for device ⇄ local backend
  }
};
