import { useQuery } from '@tanstack/react-query';
import { fetchEmergencyTypes, fetchSkills } from '@/services/api/catalog';
import { emergencyTypes as localTypes } from '@/data/mock';
import type { EmergencyTypeMeta } from '@/types';

const HOUR = 1000 * 60 * 60;

/** Local fallback so the SOS screen always has types, even offline / first load. */
export const fallbackEmergencyTypes: EmergencyTypeMeta[] = localTypes.map((t, index) => ({
  code: t.id,
  name: t.label,
  icon: t.icon,
  description: t.description,
  severity: t.severity,
  sortOrder: index,
}));

export function useEmergencyTypes() {
  return useQuery({
    queryKey: ['emergency-types'],
    queryFn: fetchEmergencyTypes,
    staleTime: HOUR,
    retry: 1,
    placeholderData: fallbackEmergencyTypes,
  });
}

export function useSkillCatalog() {
  return useQuery({
    queryKey: ['skills-catalog'],
    queryFn: fetchSkills,
    staleTime: HOUR,
    retry: 1,
  });
}
