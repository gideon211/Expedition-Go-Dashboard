import { initializeApp } from "firebase/app";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

export default app;