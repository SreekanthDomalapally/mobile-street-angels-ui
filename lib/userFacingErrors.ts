import { APP_NAME } from '@/constants/branding';

const LEGACY_BRAND_RE = /street[-_\s]?angels[^\s.]*/gi;

/** Keep API/network errors user-friendly — no legacy repo names or raw backend URLs. */
export function toUserFacingErrorMessage(message: string): string {
  let result = message.trim();

  if (LEGACY_BRAND_RE.test(result)) {
    result = result.replace(LEGACY_BRAND_RE, APP_NAME);
  }

  result = result.replace(/https?:\/\/[^\s]+/g, (url) => {
    if (/street-angels|railway\.app/i.test(url)) {
      return `${APP_NAME}`;
    }
    return url;
  });

  return result.replace(/\s{2,}/g, ' ').trim();
}

export const SERVICE_UNAVAILABLE_MESSAGE = `${APP_NAME} is temporarily unavailable. Please try again in a moment.`;

export const NETWORK_UNAVAILABLE_MESSAGE = `Cannot reach ${APP_NAME} right now. Check your internet connection and try again.`;
