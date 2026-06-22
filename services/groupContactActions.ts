import { APP_INVITE_MESSAGE } from '@/constants/invites';
import { assignInviteToGroups } from '@/services/api/contacts';
import { ApiError } from '@/services/api/client';
import { inviteToGroup } from '@/services/api/groups';
import type { CircleContact } from '@/types';
import { Share } from 'react-native';

export async function sendGroupInvites(
  email: string,
  groupIds: string[],
  existingGroupIds: string[] = []
) {
  const toInvite = groupIds.filter((groupId) => !existingGroupIds.includes(groupId));
  if (toInvite.length === 0) return;

  try {
    await assignInviteToGroups(email, toInvite);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await Promise.all(toInvite.map((groupId) => inviteToGroup(groupId, email)));
      return;
    }
    throw err;
  }
}

export async function shareInstallInvite(contact: Pick<CircleContact, 'displayName' | 'phone'>) {
  const message = `${APP_INVITE_MESSAGE}\n\n${contact.displayName}, join my group on YouHoo Alert.`;
  await Share.share({
    message,
    title: 'Invite to YouHoo Alert',
  });
}

export async function addContactToGroup(email: string, groupId: string) {
  await sendGroupInvites(email.toLowerCase(), [groupId]);
}

export async function inviteContactToGroup(
  contact: Pick<CircleContact, 'displayName' | 'email' | 'phone'>,
  groupId: string
) {
  if (contact.email) {
    await sendGroupInvites(contact.email.toLowerCase(), [groupId]);
    return;
  }
  await shareInstallInvite(contact);
}
