import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK_USER);  // Changed from null - using mock user for testing
  const [token, setToken] = useState(MOCK_TOKEN);  // Changed from null - using mock token for testing
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync("token");
      const u = await SecureStore.getItemAsync("user");
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
      setReady(true);
    })();
  }, []);

  const signIn = async (email, password) => {
    // Placeholder: call backend when ready
    const resp = await api.auth.login({ email, password });
    if (resp?.token) {
      setToken(resp.token);
      setUser(resp.user);
      await SecureStore.setItemAsync("token", resp.token);
      await SecureStore.setItemAsync("user", JSON.stringify(resp.user));
    }
    return resp;
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
  };

  const value = { user, token, ready, signIn, signOut, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
