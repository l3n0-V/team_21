import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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
