import { authenticatedRequest } from './client';

export interface PhoneInviteResponse {
  id: string;
  invite_code: string;
  invite_url: string;
  invited_phone_last4: string;
  status: string;
  expires_at?: string | null;
}

export async function createPhoneInvite(params: {
  phoneNumber: string;
  displayName?: string;
  groupId?: string;
  countryCode?: string;
}): Promise<PhoneInviteResponse> {
  return authenticatedRequest<PhoneInviteResponse>('/invites', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: params.phoneNumber,
      display_name: params.displayName,
      group_id: params.groupId,
      country_code: params.countryCode ?? 'IE',
    }),
  });
}
