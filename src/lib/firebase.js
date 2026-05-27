import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

let app;
let auth;
let googleProvider;

try {
  const existing = getApps();
  app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (err) {
  console.warn("Firebase initialization failed:", err);
  auth = null;
  googleProvider = null;
}

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

export default app;