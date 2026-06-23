export const APP_INVITE_URL = 'https://youhooalert.com/invite';
export const APP_STORE_FALLBACK_URL = 'https://youhooalert.com';

export interface InviteShareOptions {
  inviterName: string;
  inviteeName?: string;
  groupNames?: string[];
  inviteCode?: string;
  inviteUrl?: string;
}

export function buildInviteLink(inviteCode?: string): string {
  if (inviteCode) {
    return `${APP_INVITE_URL}/${inviteCode}`;
  }
  return APP_STORE_FALLBACK_URL;
}

/** WhatsApp-friendly invite copy with optional group name and invite code. */
export function buildInviteShareMessage(options: InviteShareOptions): string {
  const {
    inviterName,
    inviteeName,
    groupNames = [],
    inviteCode,
    inviteUrl,
  } = options;

  const link = inviteUrl ?? buildInviteLink(inviteCode);
  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi,';
  const uniqueGroups = [...new Set(groupNames.map((name) => name.trim()).filter(Boolean))];

  let groupLine: string;
  if (uniqueGroups.length === 1) {
    groupLine = `${inviterName} invited you to join the *${uniqueGroups[0]}* circle on YouHoo Alert.`;
  } else if (uniqueGroups.length > 1) {
    groupLine = `${inviterName} invited you to join these circles on YouHoo Alert: ${uniqueGroups.join(', ')}.`;
  } else {
    groupLine = `${inviterName} invited you to YouHoo Alert.`;
  }

  const lines = [
    greeting,
    '',
    groupLine,
    '',
    'YouHoo Alert is a private safety app — when someone sends SOS, your trusted circle can see where they are and respond quickly.',
    '',
    'To join:',
    '1. Tap the link below',
    '2. Install the app and sign in with *this phone number*',
    '3. Open Groups and accept the invitation',
  ];

  if (inviteCode) {
    lines.push('', `Invite code: ${inviteCode}`);
  }

  lines.push('', link, '', 'Your contacts stay private. We never sell location data.');

  return lines.join('\n');
}

/** @deprecated Use buildInviteShareMessage with InviteShareOptions */
export function buildLegacyInviteShareMessage(inviterName: string, inviteCode?: string): string {
  return buildInviteShareMessage({ inviterName, inviteCode });
}
