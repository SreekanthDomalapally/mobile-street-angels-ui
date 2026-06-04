import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import type { User } from '@/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'street-angels-demo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

let app: FirebaseApp;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  return app ?? getApps()[0];
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
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
