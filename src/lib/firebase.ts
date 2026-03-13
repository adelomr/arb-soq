
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDsWvaFXkvlIVAMnpMGxuE8Agde2L2RvVc",
  authDomain: "arb-sooq.firebaseapp.com",
  projectId: "arb-sooq",
  storageBucket: "arb-sooq.firebasestorage.app",
  messagingSenderId: "950242504248",
  appId: "1:950242504248:web:8226bf3510954d301200cd",
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const database = getDatabase(app);
const storage = getStorage(app);

let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
}


export { app, auth, firestore, database, storage, analytics };
