import type { ResponderProfile, SkillLevel, UserSkill } from '@/types';
import { authenticatedRequest } from './client';

interface ApiUserSkill {
  skill_code: string;
  name: string;
  category: string;
  level: string;
  verified: boolean;
}

function mapUserSkill(item: ApiUserSkill): UserSkill {
  return {
    skillCode: item.skill_code,
    name: item.name,
    category: item.category,
    level: item.level as SkillLevel,
    verified: item.verified,
  };
}

interface ApiMeProfile {
  certifications?: string[];
  languages?: string[];
  vehicle_available?: boolean;
  medical_background?: string | null;
  available_for_emergencies?: boolean;
  location_visibility?: string;
}

export async function fetchMyProfile(): Promise<ResponderProfile> {
  const me = await authenticatedRequest<ApiMeProfile>('/users/me');
  return {
    certifications: me.certifications ?? [],
    languages: me.languages ?? [],
    vehicleAvailable: Boolean(me.vehicle_available),
    medicalBackground: me.medical_background ?? undefined,
    availableForEmergencies: me.available_for_emergencies ?? true,
    locationVisibility: me.location_visibility ?? 'groups',
  };
}

export async function fetchMySkills(): Promise<UserSkill[]> {
  const items = await authenticatedRequest<ApiUserSkill[]>('/users/me/skills');
  return items.map(mapUserSkill);
}

export interface UserSkillInput {
  skillCode: string;
  level?: SkillLevel;
}

export async function setMySkills(skills: UserSkillInput[]): Promise<UserSkill[]> {
  const items = await authenticatedRequest<ApiUserSkill[]>('/users/me/skills', {
    method: 'PUT',
    body: JSON.stringify({
      skills: skills.map((s) => ({ skill_code: s.skillCode, level: s.level ?? 'basic' })),
    }),
  });
  return items.map(mapUserSkill);
}

export async function updateMyLocation(latitude: number, longitude: number): Promise<void> {
  await authenticatedRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ last_known_latitude: latitude, last_known_longitude: longitude }),
  });
}

export async function updateResponderProfile(
  updates: Partial<ResponderProfile>
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.certifications !== undefined) body.certifications = updates.certifications;
  if (updates.languages !== undefined) body.languages = updates.languages;
  if (updates.vehicleAvailable !== undefined) body.vehicle_available = updates.vehicleAvailable;
  if (updates.medicalBackground !== undefined) body.medical_background = updates.medicalBackground;
  if (updates.availableForEmergencies !== undefined)
    body.available_for_emergencies = updates.availableForEmergencies;
  if (updates.locationVisibility !== undefined)
    body.location_visibility = updates.locationVisibility;

  await authenticatedRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
