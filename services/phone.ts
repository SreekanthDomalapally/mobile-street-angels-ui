import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhoneE164(phone: string, defaultCountry: string = 'IE'): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  try {
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry as 'IE');
    if (!parsed?.isValid()) return null;
    return parsed.format('E.164');
  } catch {
    return null;
  }
}

export function formatPhoneForDisplay(phone: string, defaultCountry: string = 'IE'): string {
  const e164 = normalizePhoneE164(phone, defaultCountry);
  if (!e164) return phone;
  try {
    const parsed = parsePhoneNumberFromString(e164);
    return parsed?.formatInternational() ?? e164;
  } catch {
    return e164;
  }
}
