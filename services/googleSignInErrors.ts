export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Sign in cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}
