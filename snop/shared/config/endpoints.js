// shared/config/endpoints.js
import { Platform } from 'react-native';

export const USE_MOCK = false; // Set to false to use real backend API

// Platform-aware API base URL configuration
// This ensures the app can connect to Flask backend on all platforms
const getApiBaseUrl = () => {
  // Get configurable port (default: 5000)
  const port = process.env.EXPO_PUBLIC_API_PORT || '5000';

  // Get protocol (default: http, can be https for production)
  const protocol = process.env.EXPO_PUBLIC_API_PROTOCOL || 'http';

  // For web platform, use localhost
  if (Platform.OS === 'web') {
    return `${protocol}://localhost:${port}`;
  }

  // For iOS simulator, localhost works fine
  if (Platform.OS === 'ios' && __DEV__) {
    return `${protocol}://localhost:${port}`;
  }

  // For Android emulator, use special alias 10.0.2.2 (points to host machine)
  if (Platform.OS === 'android' && __DEV__) {
    return `${protocol}://10.0.2.2:${port}`;
  }

  // For physical devices (both iOS and Android), you MUST set this environment variable
  // to your computer's local IP address on the same WiFi network
  // Example: EXPO_PUBLIC_API_HOST=192.168.1.100
  const hostIp = process.env.EXPO_PUBLIC_API_HOST;

  if (hostIp) {
    return `${protocol}://${hostIp}:${port}`;
  }

  // Fallback: This will likely fail on physical devices, but provides a clear error
  console.warn(
    '⚠️  Running on physical device without EXPO_PUBLIC_API_HOST set!\n' +
    'Please set EXPO_PUBLIC_API_HOST to your computer\'s local IP in .env file.\n' +
    'Example: EXPO_PUBLIC_API_HOST=192.168.1.100\n' +
    'Falling back to localhost (this will likely fail)...'
  );
  return `${protocol}://localhost:${port}`;
};

export const API_BASE_URL = getApiBaseUrl();
