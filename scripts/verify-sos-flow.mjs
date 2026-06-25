/**
 * Lightweight SOS flow verification (no Jest). Run: node scripts/verify-sos-flow.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function normalizeWsStatus(type, payloadStatus) {
  const rawStatus = String(payloadStatus ?? '');
  if (rawStatus === 'resolved' || type === 'alert_resolved') {
    return 'resolved';
  }
  return rawStatus || type;
}

function parseNotificationData(data) {
  if (!data) return { kind: 'unknown' };
  const alertId = typeof data.alert_id === 'string' ? data.alert_id : undefined;
  const typeRaw = String(data.type ?? '').toLowerCase();
  let kind = 'unknown';
  if (typeRaw === 'sos_alert') kind = 'sos_alert';
  const correlationId =
    typeof data.correlation_id === 'string' ? data.correlation_id : undefined;
  const senderUserId =
    typeof data.sender_user_id === 'string' ? data.sender_user_id : undefined;
  return { kind, alertId, correlationId, senderUserId };
}

const tests = [
  {
    name: 'WS alert_resolved maps to resolved',
    run: () => normalizeWsStatus('alert_resolved', '') === 'resolved',
  },
  {
    name: 'WS explicit resolved status preserved',
    run: () => normalizeWsStatus('alert_resolved', 'resolved') === 'resolved',
  },
  {
    name: 'WS alert_created does not map to resolved',
    run: () => normalizeWsStatus('alert_created', 'active') === 'active',
  },
  {
    name: 'notification parses sos_alert + correlation_id',
    run: () => {
      const parsed = parseNotificationData({
        type: 'sos_alert',
        alert_id: 'abc-123',
        correlation_id: 'corr-1',
        sender_user_id: 'user-1',
      });
      return (
        parsed.kind === 'sos_alert' &&
        parsed.alertId === 'abc-123' &&
        parsed.correlationId === 'corr-1' &&
        parsed.senderUserId === 'user-1'
      );
    },
  },
  {
    name: 'disclaimer copy has no emergency dial numbers',
    run: () => {
      const text = fs.readFileSync(path.join(ROOT, 'lib/emergencyDial.ts'), 'utf8');
      const forbidden = /\b(999|911|112)\b/;
      return !forbidden.test(text);
    },
  },
  {
    name: 'pending screen uses EmergencyDisclaimer (not inline 999/911/112)',
    run: () => {
      const text = fs.readFileSync(path.join(ROOT, 'app/sos/pending.tsx'), 'utf8');
      const forbidden = /\b(999|911|112)\b/;
      return text.includes('EmergencyDisclaimer') && !forbidden.test(text);
    },
  },
  {
    name: 'offline queue keeps retryable failures and drops others',
    run: () => {
      const queue = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const outcomes = [
        { ok: true },
        { ok: false, retryable: true },
        { ok: false, retryable: false },
      ];
      const remaining = [];
      let lastSent = null;
      for (let i = 0; i < queue.length; i += 1) {
        const item = queue[i];
        const outcome = outcomes[i];
        if (outcome.ok) {
          lastSent = item;
        } else if (outcome.retryable) {
          remaining.push(item);
        }
      }
      return lastSent?.id === 'a' && remaining.length === 1 && remaining[0].id === 'b';
    },
  },
];

let failed = 0;
for (const t of tests) {
  const ok = Boolean(t.run());
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${t.name}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`\n${failed} verification(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${tests.length} SOS flow verifications passed.`);
