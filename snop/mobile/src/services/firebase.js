import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration (from firebase_config.py in backend)
const firebaseConfig = {
  apiKey: "AIzaSyAKF663iLJDW4p5luNm0_avaS0Apeo-5Ow",
  authDomain: "snop-b76ac.firebaseapp.com",
  projectId: "snop-b76ac",
  storageBucket: "snop-b76ac.appspot.com",  // Using standard Firebase Storage bucket format
  messagingSenderId: "211954707057",
  appId: "1:211954707057:web:a52a9afc2133aeb60789d0",
  measurementId: "G-WW0ZQGB68L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const storage = getStorage(app);
export const auth = getAuth(app);

// Sign in anonymously to enable Firebase Storage uploads
// This creates an anonymous user session that Firebase Storage can verify
let isSigningIn = false;
export const ensureAuth = async () => {
  if (auth.currentUser) {
    console.log('Firebase Auth: Already signed in as', auth.currentUser.uid);
    return auth.currentUser;
  }

  if (isSigningIn) {
    // Wait for existing sign-in to complete
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      });
    });
  }

  isSigningIn = true;
  try {
    console.log('Firebase Auth: Signing in anonymously...');
    const result = await signInAnonymously(auth);
    console.log('Firebase Auth: Anonymous sign-in successful, uid:', result.user.uid);
    isSigningIn = false;
    return result.user;
  } catch (error) {
    console.error('Firebase Auth: Anonymous sign-in failed:', error);
    isSigningIn = false;
    throw error;
  }
};

// Auto-sign in on app start
ensureAuth().catch(err => console.warn('Auto sign-in failed:', err.message));

export default app;
