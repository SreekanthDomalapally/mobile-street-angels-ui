const ONE_HOUR_MS = 60 * 60 * 1000;

export function temporaryGroupExpiryIso(): string {
  return new Date(Date.now() + ONE_HOUR_MS).toISOString();
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

/** Clock time plus relative label — used on active SOS timelines. */
export function formatSosEventTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return formatRelativeTime(isoDate);

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const relative = formatRelativeTime(isoDate);

  if (relative === time || relative.includes('/')) {
    return relative;
  }

  return `${time} · ${relative}`;
}

/** When an SOS is live — e.g. "4:41 PM · 12m ago". */
export function formatSosStartedAt(isoDate: string): string {
  return formatSosEventTime(isoDate);
}

export function formatEta(minutes?: number): string {
  if (minutes == null) return 'Calculating…';
  if (minutes < 1) return 'Arriving now';
  return `${minutes} min`;
}

export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function getResponderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    notified: 'Notified',
    viewing: 'Viewing alert',
    en_route: 'On the way',
    arrived: 'Arrived',
    completed: 'Completed',
  };
  return labels[status] ?? status;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
