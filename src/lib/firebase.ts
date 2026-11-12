import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

function cleanEnv(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

const apiKey = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const authDomain = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
const databaseURL = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
const projectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const storageBucket = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
const messagingSenderId = cleanEnv(
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
);
const appId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

const firebaseConfig = {
  apiKey,
  authDomain: authDomain || (projectId ? `${projectId}.firebaseapp.com` : ""),
  databaseURL:
    databaseURL ||
    (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : ""),
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

export const isFirebaseAuthConfigured = Boolean(apiKey && projectId);

export const isFirebaseConfigured = Boolean(
  apiKey &&
    projectId &&
    firebaseConfig.databaseURL &&
    firebaseConfig.databaseURL.startsWith("https://")
);

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseAuthConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (err) {
    console.warn("Erro ao inicializar Firebase Auth:", err);
  }

  if (app && isFirebaseConfigured) {
    try {
      db = getDatabase(app);
    } catch (err) {
      console.warn("Erro ao inicializar Firebase Realtime Database:", err);
    }
  }
}

export { app, db, auth, googleProvider };
