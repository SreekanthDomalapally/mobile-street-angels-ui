const marks = new Map<string, number>();
const APP_START = Date.now();

export type PerfMark =
  | 'app_start'
  | 'home_ready'
  | 'sos_press'
  | 'alert_created'
  | 'alert_screen_ready'
  | 'groups_load'
  | 'contacts_sync';

export function markPerf(name: PerfMark, detail?: Record<string, unknown>): void {
  const now = Date.now();
  marks.set(name, now);

  if (__DEV__) {
    const sinceStart = now - APP_START;
    const prev = [...marks.entries()]
      .filter(([key]) => key !== name)
      .sort((a, b) => a[1] - b[1])
      .at(-1);
    const delta = prev ? now - prev[1] : sinceStart;
    console.log(`[perf] ${name} +${delta}ms (total ${sinceStart}ms)`, detail ?? '');
  }
}

export function getPerfMark(name: PerfMark): number | undefined {
  return marks.get(name);
}

markPerf('app_start');
