import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { api } from "../services/api";

// To do: Replace with real Firebase Authentication
// Currently using mock user for testing audio upload and backend integration
// This allows testing of:
// - Audio upload to Firebase Storage (needs uid for path)
// - Backend pronunciation scoring (needs token for auth)
// - Integration testing without full auth flow
const MOCK_USER = {
  uid: 'test-user-001',
  email: 'test@snop.app',
  displayName: 'Test User'
};

const MOCK_TOKEN = 'mock-token-for-testing';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Helper functions for web platform (SecureStore doesn't work on web)
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK_USER);  // Changed from null - using mock user for testing
  const [token, setToken] = useState(MOCK_TOKEN);  // Changed from null - using mock token for testing
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await storage.getItem("token");
        const u = await storage.getItem("user");
        if (t && u) {
          setToken(t);
          setUser(JSON.parse(u));
        }
      } catch (error) {
        console.log('Error loading stored auth:', error);
      }
      setReady(true);
    })();
  }, []);

  const signIn = async (email, password) => {
    // Placeholder: call backend when ready
    // Note: api.auth.login is not yet implemented
    console.log('signIn called with:', email);
    const resp = { token: MOCK_TOKEN, user: MOCK_USER }; // Mock response for now
    if (resp?.token) {
      setToken(resp.token);
      setUser(resp.user);
      await storage.setItem("token", resp.token);
      await storage.setItem("user", JSON.stringify(resp.user));
    }
    return resp;
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    await storage.deleteItem("token");
    await storage.deleteItem("user");
  };

  const value = { user, token, ready, signIn, signOut, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
