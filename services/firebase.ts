import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  type Auth,
} from 'firebase/auth';
import type { User } from '@/types';

/**
 * Defaults from google-services.json (com.youhooalert.com).
 * Public client config — safe to embed; override via EXPO_PUBLIC_FIREBASE_* in EAS.
 */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBeD_i69yZneRY4eJQo492SNVlYTm2jGrE',
  authDomain: 'youhoo-alert-app.firebaseapp.com',
  projectId: 'youhoo-alert-app',
  storageBucket: 'youhoo-alert-app.firebasestorage.app',
  messagingSenderId: '1065150630879',
  appId: '1:1065150630879:android:83296463ab35f7f73f526a',
} as const;

function buildFirebaseConfig() {
  return {
    apiKey:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
      DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId:
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? DEFAULT_FIREBASE_CONFIG.appId,
  };
}

let app: FirebaseApp;
let auth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(buildFirebaseConfig());
  }
  return app ?? getApps()[0];
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const firebaseApp = getFirebaseApp();
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function mapFirebaseUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    displayName: fbUser.displayName ?? 'User',
    email: fbUser.email ?? '',
    photoURL: fbUser.photoURL ?? undefined,
    avatarUrl: fbUser.photoURL ?? undefined,
  };
}

export async function signInWithGoogleMock(): Promise<User> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    id: 'demo-user-1',
    displayName: 'Alex Rivera',
    email: 'alex@example.com',
    avatarUrl: undefined,
  };
}

export async function signInWithAppleMock(): Promise<User> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    id: 'demo-user-1',
    displayName: 'Alex Rivera',
    email: 'alex@icloud.com',
  };
}

export async function signInWithGoogle(idToken: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return mapFirebaseUser(result.user);
}

export async function signInWithApple(idToken: string, nonce: string): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken, rawNonce: nonce });
  const result = await signInWithCredential(auth, credential);
  return mapFirebaseUser(result.user);
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (fbUser) => {
    callback(fbUser ? mapFirebaseUser(fbUser) : null);
  });
}
