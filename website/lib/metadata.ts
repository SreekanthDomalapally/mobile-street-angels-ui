import type { Metadata } from "next";
import { SITE_URL } from "./site";

const keywords = [
  "emergency app",
  "SOS app",
  "location sharing",
  "personal safety app",
  "emergency alert app",
  "family safety app",
  "community safety",
  "YouHooAlert",
];

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "YouHooAlert — Emergency Help When Every Second Matters",
    template: "%s | YouHooAlert",
  },
  description:
    "YouHooAlert instantly notifies trusted contacts, shares your live location, and helps nearby people respond when you need assistance. Free, community-driven, privacy-first.",
  keywords,
  authors: [{ name: "YouHooAlert" }],
  creator: "YouHooAlert",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "YouHooAlert",
    title: "YouHooAlert — You Are Never Alone",
    description:
      "Community-driven emergency assistance. One tap SOS, live location, trusted contacts.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "YouHooAlert" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouHooAlert — Emergency Help One Tap Away",
    description:
      "Notify trusted contacts and share live location during emergencies. Free for everyone.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};
