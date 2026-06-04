import { SITE_URL } from "./site";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "YouHooAlert",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    slogan: "Helping People Help People.",
    description:
      "Community-driven emergency assistance app that helps people alert trusted contacts and share live location during emergencies.",
    sameAs: [
      "https://www.linkedin.com/company/youhooalert",
      "https://www.facebook.com/youhooalert",
      "https://www.instagram.com/youhooalert",
    ],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "YouHooAlert",
    url: SITE_URL,
    description:
      "Emergency app for SOS alerts, live location sharing, and trusted community responses.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function mobileAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "YouHooAlert",
    operatingSystem: "iOS, Android",
    applicationCategory: "HealthApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Personal safety and emergency alert app with live location sharing for trusted contacts.",
  };
}
