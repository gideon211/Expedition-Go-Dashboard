import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import config from "@/config";

const firebaseConfig = {
  apiKey: config.auth.firebase.apiKey,
  authDomain: config.auth.firebase.authDomain,
  projectId: config.auth.firebase.projectId,
  appId: config.auth.firebase.appId,
  messagingSenderId: config.auth.firebase.messagingSenderId,
};

// Only initialize if not already initialized to avoid duplicate app errors
let app;
let auth;

try {
  const existing = getApps();
  app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn("Firebase initialization failed:", err);
  auth = null;
}

export {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

export default app;