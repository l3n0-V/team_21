import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration (from firebase_config.py in backend)
const firebaseConfig = {
  apiKey: "AIzaSyAKF663iLJDW4p5luNm0_avaS0Apeo-5Ow",
  authDomain: "snop-b76ac.firebaseapp.com",
  projectId: "snop-b76ac",
  storageBucket: "snop-b76ac.appspot.com",
  messagingSenderId: "211954707057",
  appId: "1:211954707057:web:a52a9afc2133aeb60789d0",
  measurementId: "G-WW0ZQGB68L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
