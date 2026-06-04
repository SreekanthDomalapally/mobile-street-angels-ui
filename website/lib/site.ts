export const SITE_URL = "https://youhooalert.com";

export const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#mission", label: "Mission" },
  { href: "#donate", label: "Donate" },
  { href: "#download", label: "Download App" },
] as const;

export const FEATURES = [
  { title: "Live Location Sharing", icon: "map" },
  { title: "Instant SOS Alerts", icon: "sos" },
  { title: "Trusted Groups", icon: "group" },
  { title: "Real-Time Responses", icon: "pulse" },
  { title: "Google Sign-In", icon: "google" },
  { title: "Privacy First", icon: "shield" },
  { title: "Community Driven", icon: "heart" },
  { title: "No Subscription Required", icon: "free" },
] as const;

export const FAQ_ITEMS = [
  {
    q: "How does YouHooAlert work?",
    a: "Press SOS during an emergency. YouHooAlert instantly notifies your trusted contacts and shares your live location so they can respond quickly.",
  },
  {
    q: "Who receives my SOS alert?",
    a: "Only people you add to your trusted groups. You control who can see your alerts and location.",
  },
  {
    q: "Do I need a subscription?",
    a: "No. YouHooAlert is free for everyone. There are no premium tiers or hidden paywalls.",
  },
  {
    q: "Is my location private?",
    a: "Your location is shared only during an active emergency with the contacts you choose. We design for privacy first.",
  },
  {
    q: "Can I create emergency groups?",
    a: "Yes. Create groups for family, friends, neighbors, or community responders so the right people are notified together.",
  },
  {
    q: "How do donations help?",
    a: "Optional donations support servers, reliability improvements, and keeping the platform available for people who need it.",
  },
] as const;

export const DONATION_AMOUNTS = [2, 5, 10] as const;
