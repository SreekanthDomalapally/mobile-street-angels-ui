import type { EmergencyType, EmergencyTypeMeta, Skill } from '@/types';
import { authenticatedRequest } from './client';

interface ApiEmergencyType {
  code: string;
  name: string;
  icon: string;
  description: string;
  severity: number;
  default_radius_km: number;
  sort_order: number;
}

interface ApiSkill {
  code: string;
  name: string;
  category: string;
  sort_order: number;
}

export async function fetchEmergencyTypes(): Promise<EmergencyTypeMeta[]> {
  const items = await authenticatedRequest<ApiEmergencyType[]>('/emergency-types');
  return items.map((item) => ({
    code: item.code as EmergencyType,
    name: item.name,
    icon: item.icon,
    description: item.description,
    severity: item.severity,
    sortOrder: item.sort_order,
  }));
}

export async function fetchSkills(): Promise<Skill[]> {
  const items = await authenticatedRequest<ApiSkill[]>('/skills');
  return items.map((item) => ({
    code: item.code,
    name: item.name,
    category: item.category,
    sortOrder: item.sort_order,
  }));
}
