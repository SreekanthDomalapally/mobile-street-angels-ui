import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { siteMetadata } from "@/lib/metadata";
import {
  mobileAppJsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/lib/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [organizationJsonLd(), webSiteJsonLd(), mobileAppJsonLd()];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
