// Firebase is currently disabled in favor of LocalStorage for immediate usage.
// To restore Firebase:
// 1. Uncomment the code below
// 2. Add your API keys
// 3. Update App.tsx and Auth.tsx to use firebase imports instead of services/storage

/*
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
*/

export const auth = {};
export const db = {};
export const googleProvider = {};