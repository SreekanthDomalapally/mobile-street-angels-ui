# YouHoo Alert — mobile-street-angels-ui

**Assistance when you need it most.**

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

## Publishing to Google Play & App Store

Store releases use **EAS Build** (production `.aab` / `.ipa`), not Expo Go.

### 1. One-time setup

1. Create accounts: [Google Play Console](https://play.google.com/console) ($25 one-time), [Apple Developer](https://developer.apple.com/programs/) (~$99/year).
2. Install CLI and link the project:

   ```bash
   npm install
   npx eas login
   npm run eas:init
   ```

   Copy the **project ID** from the Expo dashboard into `.env`:

   ```bash
   EXPO_PUBLIC_EAS_PROJECT_ID=your-uuid-from-eas-init
   ```

3. Edit `eas.json` → `submit.production.ios.appleTeamId` with your Apple Team ID.
4. For Android submit, add a [Google Play service account](https://docs.expo.dev/submit/android/#creating-a-google-service-account) and set `submit.production.android.serviceAccountKeyPath` in `eas.json` (do not commit the JSON key).
5. Configure [push credentials](https://docs.expo.dev/push-notifications/push-notifications-setup/) (FCM + APNs) before relying on notifications in production.

**App IDs in `app.json`:** `com.streetangels.app` (Android package + iOS bundle). Change these before your first store upload if you want a YouHoo-specific ID (e.g. `com.youhoo.alert`).

### 2. Build for stores

```bash
# Test build for team devices (APK / internal)
npm run eas:build:preview

# Store builds
npm run eas:build:android   # .aab for Play Store
npm run eas:build:ios       # .ipa for App Store
```

### 3. Submit

Create the app listings in Play Console and App Store Connect first, then:

```bash
npm run eas:submit:android
npm run eas:submit:ios
```

Or upload builds manually from the [Expo dashboard](https://expo.dev).

Docs: [Submit to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/) · [EAS Build](https://docs.expo.dev/build/introduction/)

## Philosophy

- Calm, fast, human, trustworthy
- Large tap targets, one-hand use, dark mode first
- Not a social network — trusted contacts only
- Free to use; optional donations in Profile

## License

See LICENSE file.
