import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
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

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const idToken = await firebaseUser.getIdToken();
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

  const value = { user, token, ready, signIn, signUp, signOut, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
