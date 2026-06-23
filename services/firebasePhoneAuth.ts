import {
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase';
import {
  loginWithFirebaseToken,
  startPhoneLogin,
  verifyPhoneLogin,
  type FirebaseLoginResponse,
} from '@/services/api/auth';

export type PhoneSignInSession = {
  phoneE164: string;
  countryCode: string;
  useBackendOtp: boolean;
  verificationId?: string;
  confirmation?: ConfirmationResult;
  devOtp?: string | null;
};

const useFirebasePhone =
  process.env.EXPO_PUBLIC_USE_FIREBASE_PHONE === 'true' && !__DEV__;

export async function startPhoneSignIn(
  phoneE164: string,
  countryCode: string
): Promise<PhoneSignInSession> {
  if (useFirebasePhone) {
    try {
      const auth = getFirebaseAuth();
      const confirmation = await signInWithPhoneNumber(auth, phoneE164);
      return {
        phoneE164,
        countryCode,
        useBackendOtp: false,
        confirmation,
        verificationId: confirmation.verificationId,
      };
    } catch (error) {
      console.warn('[phoneAuth] Firebase phone sign-in failed, using backend OTP:', error);
    }
  }

  const response = await startPhoneLogin(phoneE164, countryCode);
  return {
    phoneE164,
    countryCode,
    useBackendOtp: true,
    verificationId: response.session_id,
    devOtp: response.dev_otp,
  };
}

export async function confirmPhoneSignIn(
  session: PhoneSignInSession,
  otp: string
): Promise<FirebaseLoginResponse> {
  if (session.useBackendOtp) {
    return verifyPhoneLogin(session.phoneE164, otp, session.countryCode);
  }

  const auth = getFirebaseAuth();
  if (session.confirmation) {
    await session.confirmation.confirm(otp);
  } else if (session.verificationId) {
    const credential = PhoneAuthProvider.credential(session.verificationId, otp);
    await signInWithCredential(auth, credential);
  } else {
    throw new Error('Phone verification session expired. Request a new code.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Firebase did not return a signed-in user.');
  }

  const firebaseIdToken = await user.getIdToken(true);
  return loginWithFirebaseToken(firebaseIdToken);
}

export async function resendPhoneSignIn(session: PhoneSignInSession): Promise<PhoneSignInSession> {
  return startPhoneSignIn(session.phoneE164, session.countryCode);
}
