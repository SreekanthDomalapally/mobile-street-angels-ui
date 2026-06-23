import { buildInviteShareMessage } from '@/constants/invites';
import { assignInviteToGroups } from '@/services/api/contacts';
import { createPhoneInvite } from '@/services/api/invites';
import { ApiError } from '@/services/api/client';
import { inviteToGroup } from '@/services/api/groups';
import { normalizePhoneE164 } from '@/services/phone';
import type { CircleContact } from '@/types';
import { Share } from 'react-native';

export interface ShareInstallInviteParams {
  contact: Pick<CircleContact, 'displayName' | 'phone'>;
  inviterName?: string;
  groupNames?: string[];
  inviteCode?: string;
  inviteUrl?: string;
}

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
      await Promise.all(toInvite.map((groupId) => inviteToGroup(groupId, { inviteeEmail: email })));
      return;
    }
    throw err;
  }
}

export async function sendGroupInvitesByPhone(
  phoneE164: string,
  groupIds: string[],
  countryCode = 'IE'
) {
  const normalized = normalizePhoneE164(phoneE164, countryCode);
  if (!normalized) {
    throw new Error('Enter a valid mobile number.');
  }

  try {
    await assignInviteToGroupsByPhone(normalized, groupIds, countryCode);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await Promise.all(
        groupIds.map((groupId) => inviteToGroup(groupId, { inviteePhone: normalized, countryCode }))
      );
      return;
    }
    throw err;
  }
}

async function assignInviteToGroupsByPhone(
  phoneE164: string,
  groupIds: string[],
  countryCode: string
) {
  const { authenticatedRequest } = await import('@/services/api/client');
  await authenticatedRequest('/contacts/invites/groups', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneE164,
      country_code: countryCode,
      group_ids: groupIds,
    }),
  });
}

export async function inviteExistingUserToGroup(userId: string, groupId: string) {
  await inviteToGroup(groupId, { userId });
}

export async function shareInstallInvite(params: ShareInstallInviteParams) {
  const inviterName = params.inviterName?.trim() || 'A friend';
  const message = buildInviteShareMessage({
    inviterName,
    inviteeName: params.contact.displayName,
    groupNames: params.groupNames,
    inviteCode: params.inviteCode,
    inviteUrl: params.inviteUrl,
  });

  await Share.share({
    message,
    title: 'Invite to YouHoo Alert',
  });
}

export async function createPhoneInvitesAndShare(params: {
  contact: Pick<CircleContact, 'displayName' | 'phone'>;
  inviterName: string;
  groupIds: string[];
  groupNames?: string[];
  countryCode?: string;
}) {
  const phoneE164 = params.contact.phone
    ? normalizePhoneE164(params.contact.phone, params.countryCode ?? 'IE')
    : null;
  if (!phoneE164) {
    throw new Error('Add a phone number to send an invite.');
  }

  let inviteCode: string | undefined;
  let inviteUrl: string | undefined;

  for (const groupId of params.groupIds) {
    try {
      const invite = await createPhoneInvite({
        phoneNumber: phoneE164,
        displayName: params.contact.displayName,
        groupId,
        countryCode: params.countryCode ?? 'IE',
      });
      inviteCode = invite.invite_code;
      inviteUrl = invite.invite_url;
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.message.toLowerCase().includes('group invitation has been sent')
      ) {
        continue;
      }
      throw err;
    }
  }

  await shareInstallInvite({
    contact: params.contact,
    inviterName: params.inviterName,
    groupNames: params.groupNames,
    inviteCode,
    inviteUrl,
  });
}

export async function addContactToGroup(email: string, groupId: string) {
  await sendGroupInvites(email.toLowerCase(), [groupId]);
}

export async function inviteContactToGroup(
  contact: Pick<CircleContact, 'displayName' | 'email' | 'phone' | 'userId'>,
  groupId: string,
  options: { countryCode?: string; inviterName?: string; groupName?: string } = {}
) {
  const inviterName = options.inviterName ?? 'A friend';
  const groupNames = options.groupName ? [options.groupName] : undefined;

  if (contact.userId) {
    await inviteExistingUserToGroup(contact.userId, groupId);
    return;
  }

  const phoneE164 = contact.phone ? normalizePhoneE164(contact.phone, options.countryCode ?? 'IE') : null;

  if (phoneE164) {
    await createPhoneInvitesAndShare({
      contact,
      inviterName,
      groupIds: [groupId],
      groupNames,
      countryCode: options.countryCode ?? 'IE',
    });
    return;
  }

  if (contact.email) {
    await sendGroupInvites(contact.email.toLowerCase(), [groupId]);
    await shareInstallInvite({
      contact,
      inviterName,
      groupNames,
    });
    return;
  }

  throw new Error('Add a phone number to invite this contact.');
}
