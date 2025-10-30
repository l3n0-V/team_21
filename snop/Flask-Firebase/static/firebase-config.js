import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth,
         GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// My web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKF663iLJDW4p5luNm0_avaS0Apeo-5Ow",
  authDomain: "snop-b76ac.firebaseapp.com",
  projectId: "snop-b76ac",
  storageBucket: "snop-b76ac.firebasestorage.app",
  messagingSenderId: "211954707057",
  appId: "1:211954707057:web:a52a9afc2133aeb60789d0",
  measurementId: "G-WW0ZQGB68L"
};

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const db = getFirestore(app);

export { auth, provider, db };