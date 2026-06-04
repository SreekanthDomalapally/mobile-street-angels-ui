# YouHooAlert Marketing Website

Static, mobile-first landing site for **YouHooAlert** — no API integrations.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Static export (`output: "export"`)

## Run locally

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000

## Build static site

```bash
npm run build
```

Output in `out/` — deploy to any static host (Vercel, Netlify, etc.).

## Brand assets

Logo and favicon from `../assets/images/YouHooAlert.png`, copied to `public/logo.png` and `app/icon.png`.

## Note

The Expo mobile app in the parent folder is separate. This `website/` project is the public marketing site only.
