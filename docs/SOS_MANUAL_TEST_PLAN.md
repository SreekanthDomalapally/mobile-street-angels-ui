# SOS Manual Test Plan — Diya Scenario

## Prerequisites

- Railway API + notification worker running with `REDIS_URL`, `PUSH_ENABLED=true`
- `GET /health/notifications` returns healthy queue/worker status
- Migrations `011` and `012` applied (`alembic upgrade head`)
- Two physical devices or dev builds with Expo push tokens for **Sree** and **Sanjana**

## Setup

1. Create group **Diya Circle** with Diya as owner
2. Add **Sree** and **Sanjana** as accepted `group_members`
3. Invite **Sushma** (keep invite `pending` — do not accept)
4. Phone-invite **Arihanth** without registering an account
5. Ensure **Sreedhar** is not in the group
6. Run `python scripts/seed_sos_scenario.py` to verify setup

## Execute

1. **Diya**: Personal Safety → hold SOS → countdown → send
2. Confirm mobile logs: `SOS_TRIGGERED`, `ALERT_CREATED`
3. Confirm Railway logs (grep by `alert_id` or `correlation_id`):
   - `SOS_TRIGGERED`
   - `RECIPIENTS_SELECTED` (`recipient_count: 2`, ids = Sree + Sanjana)
   - `NOTIFICATION_QUEUED`
   - `NOTIFICATION_SENT`
4. **Sree** and **Sanjana**: receive push, tap, open `/alert/[id]`
5. Mobile logs: `NOTIFICATION_OPENED` on each device
6. **Sree**: tap **I can help**
7. **Sanjana**: tap **On my way**
8. **Diya** active screen: both responders visible with distance/ETA
9. **Diya**: **I'm safe — end alert** → confirm dialog → resolve
10. Responder screens return home (WebSocket `resolved` or poll)

## Pass criteria

| User | Expected |
|------|----------|
| Sree | Receives push, can respond |
| Sanjana | Receives push, can respond |
| Sushma | No push (pending invite) |
| Arihanth | No push (not registered) |
| Sreedhar | No push (not in group) |

## Debug tools

In `__DEV__` builds: Profile → **SOS debug tools** (`/debug/sos`)
