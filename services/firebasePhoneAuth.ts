import {
  getAuth as getNativeAuth,
  signInWithPhoneNumber as nativeSignInWithPhoneNumber,
} from '@react-native-firebase/auth';
import {
  loginWithFirebaseToken,
  startPhoneLogin,
  verifyPhoneLogin,
  type FirebaseLoginResponse,
} from '@/services/api/auth';

type PhoneConfirmation = {
  confirm: (code: string) => Promise<unknown>;
};

export type PhoneSignInSession = {
  phoneE164: string;
  countryCode: string;
  useBackendOtp: boolean;
  confirmation?: PhoneConfirmation;
  devOtp?: string | null;
};

/** Production/preview EAS builds with EXPO_PUBLIC_USE_FIREBASE_PHONE=true send SMS via Firebase. */
export function isFirebasePhoneAuthEnabled(): boolean {
  return process.env.EXPO_PUBLIC_USE_FIREBASE_PHONE === 'true' && !__DEV__;
}

function mapFirebasePhoneError(error: unknown): Error {
  const code = (error as { code?: string })?.code ?? '';
  if (code === 'auth/invalid-phone-number') {
    return new Error('Enter a valid mobile number.');
  }
  if (code === 'auth/too-many-requests') {
    return new Error('Too many attempts. Try again in a few minutes.');
  }
  if (code === 'auth/quota-exceeded') {
    return new Error('SMS quota exceeded. Try again later.');
  }
  if (code === 'auth/captcha-check-failed') {
    return new Error('Phone verification failed. Update the app and try again.');
  }
  if (error instanceof Error && error.message) {
    return error;
  }
  return new Error('Could not send verification code.');
}

export async function startPhoneSignIn(
  phoneE164: string,
  countryCode: string
): Promise<PhoneSignInSession> {
  if (isFirebasePhoneAuthEnabled()) {
    try {
      const confirmation = await nativeSignInWithPhoneNumber(getNativeAuth(), phoneE164);
      return {
        phoneE164,
        countryCode,
        useBackendOtp: false,
        confirmation,
      };
    } catch (error) {
      throw mapFirebasePhoneError(error);
    }
  }

  const response = await startPhoneLogin(phoneE164, countryCode);
  return {
    phoneE164,
    countryCode,
    useBackendOtp: true,
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

  if (!session.confirmation) {
    throw new Error('Phone verification session expired. Request a new code.');
  }

  try {
    await session.confirmation.confirm(otp);
  } catch (error) {
    const code = (error as { code?: string })?.code ?? '';
    if (code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code.');
    }
    if (code === 'auth/code-expired') {
      throw new Error('Verification code expired. Request a new one.');
    }
    throw mapFirebasePhoneError(error);
  }

  const user = getNativeAuth().currentUser;
  if (!user) {
    throw new Error('Firebase did not return a signed-in user.');
  }

  const firebaseIdToken = await user.getIdToken(true);
  return loginWithFirebaseToken(firebaseIdToken);
}

export async function resendPhoneSignIn(session: PhoneSignInSession): Promise<PhoneSignInSession> {
  return startPhoneSignIn(session.phoneE164, session.countryCode);
}
