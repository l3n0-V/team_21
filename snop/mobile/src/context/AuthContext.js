import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform, AppState } from "react-native";
import { auth } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { api } from "../services/api";

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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  // Function to refresh the token
  const refreshToken = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Force token refresh (true parameter)
        const newToken = await currentUser.getIdToken(true);
        setToken(newToken);
        await storage.setItem("token", newToken);
        console.log('✅ Token refreshed successfully');
        return newToken;
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        // If refresh fails, sign out the user
        await signOut();
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in - force token refresh on startup to ensure it's valid
        console.log('🔄 Refreshing token on startup...');
        const idToken = await firebaseUser.getIdToken(true);
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
        };

        setUser(userData);
        setToken(idToken);

        // Store in secure storage
        await storage.setItem("token", idToken);
        await storage.setItem("user", JSON.stringify(userData));
      } else {
        // User is signed out
        setUser(null);
        setToken(null);
        await storage.deleteItem("token");
        await storage.deleteItem("user");
      }
      setReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Set up automatic token refresh every 45 minutes
  // (Firebase tokens expire after 1 hour, so refresh before expiration)
  useEffect(() => {
    if (!user) return;

    const REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes in milliseconds

    console.log('🔄 Setting up automatic token refresh (every 45 minutes)');
    const intervalId = setInterval(() => {
      console.log('⏰ Auto-refreshing token...');
      refreshToken();
    }, REFRESH_INTERVAL);

    return () => {
      console.log('🛑 Clearing token refresh interval');
      clearInterval(intervalId);
    };
  }, [user]);

  // Refresh token when app resumes from background
  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App resumed, checking token...');
        // Check if token needs refresh (decode and check expiration)
        if (token) {
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const expiresAt = tokenPayload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            // Refresh if token expires in less than 5 minutes
            if (timeUntilExpiry < 5 * 60 * 1000) {
              console.log('🔄 Token expiring soon, refreshing...');
              await refreshToken();
            } else {
              console.log(`✅ Token still valid (expires in ${Math.floor(timeUntilExpiry / 60000)} minutes)`);
            }
          } catch (e) {
            console.error('❌ Error checking token expiration:', e);
            // If we can't decode token, try to refresh it anyway
            await refreshToken();
          }
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [user, token]);

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      return { ok: true, user: userCredential.user, token: idToken };
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = "Kunne ikke logge inn";

      if (error.code === 'auth/invalid-email') {
        errorMessage = "Ugyldig e-postadresse";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "Ingen bruker funnet med denne e-posten";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Feil passord";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Ugyldig e-post eller passord";
      }

      return { ok: false, error: errorMessage };
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      return { ok: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = "Kunne ikke opprette konto";

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "E-postadressen er allerede i bruk";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Ugyldig e-postadresse";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Passordet er for svakt";
      }

      return { ok: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      await storage.deleteItem("token");
      await storage.deleteItem("user");
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = { user, token, ready, signIn, signUp, signOut, setUser, refreshToken };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
