# Street Angels — mobile-street-angels-ui

**Help is closer than you think.**

A calm, emergency-first React Native app for real-time SOS assistance. Built with Expo, TypeScript, and a dark, reassuring design language inspired by Find My and safety-focused apps — without the noise of social media.

## Tech stack

- **React Native** + **Expo SDK 56**
- **Expo Router** (file-based navigation)
- **NativeWind** (Tailwind CSS)
- **Zustand** (auth, SOS, settings state)
- **TanStack React Query** (API data)
- **React Hook Form** + **Zod**
- **Firebase Auth** (Google / Apple — mock mode for demo)
- **WebSockets** (real-time alert channel)
- **React Native Maps** + **Expo Location**
- **Expo Notifications** (push / emergency channel)

## Getting started

```bash
cd mobile-street-angels-ui
npm install
cp .env.example .env   # optional — app runs with mock data
npx expo start
```

Press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

## Project structure

```
app/                    # Expo Router screens
  (auth)/               # Onboarding, login, permissions
  (tabs)/               # Home, Groups, Activity, Profile
  sos/active.tsx        # Full-screen active SOS
  alert/[id].tsx        # Responder response flow
components/
  ui/                   # Button, Text, GlassCard, Avatar
  sos/                  # SOSButton, countdown, timeline
  home/                 # Status, nearby responders
  map/                  # LiveMap
  groups/ activity/ profile/
stores/                 # Zustand (auth, sos, settings)
services/               # Firebase, API, WebSocket, location, notifications
data/mock.ts            # Sample data for offline demo
constants/theme.ts      # Colors, typography, SOS config
```

## Emergency UX flow

1. **Home** — Select emergency type → **hold SOS** (2s) → **3s countdown** → alert sent
2. **SOS Active** — Live map, responder cards, timeline, cancel / resolve
3. **Responders** — Open alert link → accept, ETA, call, navigate

Accidental activation is reduced via hold-to-activate and a visible countdown.

## Configuration

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | REST API base |
| `EXPO_PUBLIC_WS_URL` | WebSocket endpoint |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase Auth |
| Google Maps API key | `app.json` → `ios.config` / `android.config` |

Without a backend, the app uses **mock data** and graceful API fallbacks.

## Philosophy

- Calm, fast, human, trustworthy
- Large tap targets, one-hand use, dark mode first
- Not a social network — trusted contacts only
- Free to use; optional donations in Profile

## License

See LICENSE file.
