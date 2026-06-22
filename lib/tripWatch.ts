export const TRIP_DURATION_OPTIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
] as const;

export type TripDurationMinutes = (typeof TRIP_DURATION_OPTIONS)[number]['minutes'];

export function tripExpiryIso(durationMinutes: TripDurationMinutes): string {
  return new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
}

export function formatTripTimeRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min left`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m left` : `${hours}h left`;
}

export function isTripExpired(expiresAt: string): boolean {
  return Date.now() >= new Date(expiresAt).getTime();
}
