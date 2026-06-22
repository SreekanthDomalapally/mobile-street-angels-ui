export const APP_INVITE_URL = 'https://youhooalert.com/invite';

export const APP_INVITE_MESSAGE =
  'Join me on YouHoo Alert — a trusted circle for emergency help. When I send an SOS, you can see where I am and respond quickly.';

export function buildInviteShareMessage(inviterName: string, inviteCode?: string): string {
  const link = inviteCode ? `${APP_INVITE_URL}/${inviteCode}` : 'https://youhooalert.com';
  return `${APP_INVITE_MESSAGE}\n\n${inviterName} invited you.\n${link}`;
}
