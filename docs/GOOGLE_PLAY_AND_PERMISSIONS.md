# YouHoo Alert — Store & Permissions Guide

Complete reference for publishing **YouHoo Alert** to Google Play (and related iOS setup). Use this when onboarding a teammate or revisiting credentials.

---

## At a glance

| Item | Value |
|------|--------|
| **App name** | YouHoo Alert |
| **Android package** | `com.youhooalert.com` |
| **iOS bundle ID** | `com.youhooalert.com` |
| **EAS project ID** | `d37e827f-a71b-47c3-b0df-a2b912af8063` |
| **Google Cloud project** | `youhooalert` |
| **Service account name** | `eas-play-submit` |
| **Service account email** | `eas-play-submit@youhooalert.iam.gserviceaccount.com` |
| **Local key file** | `./google-service-account.json` (gitignored) |

---

## How the pieces connect

```mermaid
flowchart LR
  subgraph local [Your machine]
    EAS[EAS CLI]
    KEY[google-service-account.json]
  end

  subgraph expo [Expo / EAS]
    BUILD[EAS Build]
    SUBMIT[EAS Submit]
  end

  subgraph google [Google]
    GCP[Google Cloud\nService Account + API]
    PLAY[Google Play Console\nApp listing + permissions]
  end

  EAS --> BUILD
  BUILD --> SUBMIT
  KEY --> SUBMIT
  SUBMIT -->|Play Developer API| GCP
  GCP --> PLAY
  PLAY -->|Release to track| PLAY
```

**Summary:** EAS Build produces an `.aab`. EAS Submit uses the **service account JSON** to call the **Google Play Android Developer API**. Play Console must recognize that service account and grant it **release permissions** on your app.

---

## Part 1 — Google Cloud Console

### 1.1 Create the service account

1. Open [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=youhooalert).
2. Click **Create service account**.
3. **Name:** `eas-play-submit` (display name only).
4. Click **Create and continue** → skip optional roles → **Done**.

**Resulting email (save this):**  
`eas-play-submit@youhooalert.iam.gserviceaccount.com`

### 1.2 Download the JSON key

> Keys are created in **Google Cloud**, not Play Console.

1. Click the service account email in the list.
2. Tab: **Keys** → **Add key** → **Create new key**.
3. Type: **JSON** → **Create**.
4. Save the downloaded file as:

   ```
   mobile-street-angels-ui/google-service-account.json
   ```

5. **Never commit this file.** It is listed in `.gitignore`.

**Verify the JSON contains:**

| Field | Expected |
|-------|----------|
| `project_id` | `youhooalert` |
| `client_email` | `eas-play-submit@youhooalert.iam.gserviceaccount.com` |
| `private_key` | Real `-----BEGIN PRIVATE KEY-----` block (not placeholders) |

### 1.3 Enable the Play Developer API

1. Open [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com?project=youhooalert).
2. Click **Enable**.

Without this API, submit fails with permission or API errors.

---

## Part 2 — Google Play Console

### 2.1 Create the app (one time)

1. [Play Console](https://play.google.com/console) → **Create app**.
2. **Package name:** `com.youhooalert.com` — must match `app.json` exactly. **Cannot be changed later.**
3. Complete required setup tasks as Play prompts you.

### 2.2 Invite the service account

> Play Console does **not** create JSON keys. It only **authorizes** the Cloud service account.

1. Open [Users and permissions](https://play.google.com/console/users-and-permissions).
2. Click **Invite new users**.
3. **Email:** `eas-play-submit@youhooalert.iam.gserviceaccount.com`
4. Under **App permissions**, select **YouHoo Alert** (`com.youhooalert.com`).
5. Grant the permissions below → **Invite user**.

No email acceptance is required for service accounts. Changes can take **15 minutes to 24 hours** to propagate.

### 2.3 Service account permissions (Google Play)

Use these for **EAS Submit** to the **internal testing** track (current `eas.json` config).

#### Required (minimum for automated upload)

| Permission | Why |
|------------|-----|
| **View app information and download bulk reports (read-only)** | Read app metadata |
| **Release apps to testing tracks** | Upload to internal / closed / open testing |
| **Manage testing tracks** | Create and update testing releases |

#### Recommended (production path)

| Permission | Why |
|------------|-----|
| **Release to production, exclude devices, and use Play App Signing** | Promote to production later |
| **Manage store presence** | Update listing via API (optional) |

#### Not needed for basic EAS submit

| Permission | Notes |
|------------|-------|
| View financial data | Only for billing / subscriptions API |
| Manage orders and subscriptions | In-app purchases only |
| Reply to reviews | Unrelated to uploads |

#### Account-level alternative

Instead of per-app permissions, you can grant **Admin** or **Release manager** at **Account permissions** for the service account. Per-app permissions are safer for production teams.

### 2.4 First upload (Google limitation)

Google requires **at least one manual upload** before the API works reliably for some new apps.

1. Run `npm run eas:build:android`.
2. Download the `.aab` from [expo.dev](https://expo.dev).
3. Play Console → **Testing → Internal testing** → **Create new release** → upload `.aab`.
4. After that succeeds, `npm run eas:submit:android` usually works.

### 2.5 Store listing & policy (required before public release)

These are separate from API permissions but **required** to publish beyond internal testing.

| Task | Where in Play Console | Notes |
|------|------------------------|-------|
| **Store listing** | Grow → Store presence → Main store listing | Title, descriptions, screenshots, icon |
| **Privacy policy URL** | App content → Privacy policy | e.g. `https://youhooalert.com/privacy` |
| **Data safety** | App content → Data safety | Declare location, identifiers, etc. |
| **Content rating** | App content → Content rating | Questionnaire |
| **Target audience** | App content → Target audience | Age groups |
| **App access** | App content → App access | Test credentials if login required |
| **Ads declaration** | App content | Whether app contains ads |

---

## Part 3 — EAS / Expo configuration

### 3.1 Files in this repo

| File | Purpose |
|------|---------|
| `app.json` | Package name, permissions, icons |
| `eas.json` | Build profiles + submit config |
| `google-service-account.json` | Play API credentials (local, secret) |
| `google-service-account.json.example` | Template only — safe to commit |

### 3.2 Submit profile (`eas.json`)

```json
"submit": {
  "production": {
    "android": {
      "track": "internal",
      "releaseStatus": "draft",
      "serviceAccountKeyPath": "./google-service-account.json"
    }
  }
}
```

| Setting | Meaning |
|---------|---------|
| `track: internal` | Uploads to **Internal testing** |
| `releaseStatus: draft` | Creates a draft release; you review in Play Console before rollout |
| `serviceAccountKeyPath` | Path to JSON key on your machine |

To submit to **production** later, change `track` to `"production"` and ensure the service account has production release permission.

### 3.3 Alternative: upload key to Expo dashboard

Instead of a local file:

1. [expo.dev](https://expo.dev) → project → **Credentials** → **Android**.
2. **Service Credentials** → **Add a Google Service Account Key**.
3. Upload the same JSON file.

Or via CLI:

```bash
npx eas credentials
# Android → production → Google Service Account
```

### 3.4 Build & submit commands

```bash
# Internal / QA (APK)
npm run eas:build:preview

# Store build (.aab)
npm run eas:build:android

# Submit latest production build to Play (internal track)
npm run eas:submit:android
```

---

## Part 4 — App permissions (device / runtime)

These are declared in `app.json` and shown to users on install.

### Android

| Permission | Purpose |
|------------|---------|
| `ACCESS_FINE_LOCATION` | Live location during SOS alerts |
| `ACCESS_COARSE_LOCATION` | Approximate location fallback |
| `VIBRATE` | Haptic feedback for SOS |
| `RECEIVE_BOOT_COMPLETED` | Restore notification listeners after reboot |

### iOS (`Info.plist` via Expo)

| Key | Purpose |
|-----|---------|
| `NSLocationWhenInUseUsageDescription` | Location during active alerts |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | Background location when alert active |
| Background modes: `location`, `remote-notification` | SOS + push while alerting |

Align **Data safety** and **App Privacy** forms with these declarations.

---

## Part 5 — Push notifications (FCM)

Store submit and **push** can use the same service account **if** it has the right roles — or use separate accounts.

### Android (FCM v1)

1. Create / use a Firebase project linked to `com.youhooalert.com`.
2. Upload FCM credentials via EAS:

   ```bash
   npx eas credentials
   # Android → Push Notifications (FCM V1)
   ```

3. Docs: [Expo FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)

### iOS (APNs)

1. Configure via `npx eas credentials` → iOS → Push Key.
2. Required for production push on iPhone.

---

## Part 6 — Environment secrets (EAS)

Set in [expo.dev](https://expo.dev) → project → **Secrets**, or local `.env` for development.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_EAS_PROJECT_ID` | EAS project link |
| `EXPO_PUBLIC_API_URL` | Backend REST API |
| `EXPO_PUBLIC_WS_URL` | WebSocket for live alerts |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase auth (Google sign-in) |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` | Maps on Android |
| `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` | Maps on iOS |

Restrict Maps API keys to package `com.youhooalert.com` (Android) and bundle `com.youhooalert.com` (iOS).

---

## Part 7 — Apple App Store (when ready)

| Item | Status in repo |
|------|----------------|
| Bundle ID | `com.youhooalert.com` in `app.json` |
| Apple Team ID | Replace `YOUR_APPLE_TEAM_ID` in `eas.json` |
| App Store Connect app | Create manually |
| Build | `npm run eas:build:ios` |
| Submit | `npm run eas:submit:ios` |

---

## Troubleshooting

| Error | Likely cause | Fix |
|-------|--------------|-----|
| **Package not found: com.youhooalert.com** | App not created in Play Console | Create app with that exact package name |
| **Caller does not have permission** | Service account not invited or missing release permissions | Users and permissions → invite `eas-play-submit@...` → grant testing release permissions |
| **Invalid credentials / auth error** | Placeholder or wrong JSON file | Replace with downloaded key from Google Cloud |
| **API not enabled** | Play Developer API off | Enable in Google Cloud |
| Submit works but no release visible | Draft status | Play Console → Internal testing → review draft release |
| Permissions just changed | Google propagation delay | Wait up to 24 hours, retry |

---

## Security checklist

- [ ] `google-service-account.json` is **not** in git
- [ ] JSON key stored only in secure locations (project root locally, Expo Credentials, password manager backup)
- [ ] Service account has **minimum** permissions needed (app-scoped, not account Admin unless required)
- [ ] Rotate key if exposed: Google Cloud → Keys → delete old key → create new → update EAS
- [ ] Maps / Firebase keys restricted by app ID in Google Cloud Console

---

## Quick checklist (print-friendly)

### Google Cloud
- [ ] Service account `eas-play-submit` exists
- [ ] JSON key downloaded → `google-service-account.json`
- [ ] Google Play Android Developer API **enabled**

### Google Play Console
- [ ] App created with package `com.youhooalert.com`
- [ ] `eas-play-submit@youhooalert.iam.gserviceaccount.com` invited
- [ ] Release + testing permissions on that app
- [ ] First `.aab` uploaded (manual OK)
- [ ] Store listing, privacy policy, data safety, content rating (for public release)

### EAS
- [ ] `eas.json` → `serviceAccountKeyPath` set
- [ ] Production build succeeded
- [ ] `npm run eas:submit:android` succeeded

---

## References

- [Expo — Submit to Google Play](https://docs.expo.dev/submit/android/)
- [Expo — Google service account (fyi)](https://github.com/expo/fyi/blob/main/creating-google-service-account.md)
- [Google Play Developer API — Getting started](https://developers.google.com/android-publisher/getting_started)
- [Play Console — Users and permissions](https://play.google.com/console/users-and-permissions)

---

*Last updated for YouHoo Alert EAS project `mobile-youhoo-alert`.*
