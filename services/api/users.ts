import { authenticatedRequest } from './client';

export interface UserLookupMatch {
  email: string;
  user_id: string;
  full_name: string;
}

export async function lookupUsersByEmail(emails: string[]): Promise<UserLookupMatch[]> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (unique.length === 0) return [];

  const response = await authenticatedRequest<{ matches: UserLookupMatch[] }>('/users/lookup', {
    method: 'POST',
    body: JSON.stringify({ emails: unique }),
  });

  return response.matches;
}
