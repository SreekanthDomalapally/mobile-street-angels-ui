import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "YouHooAlert privacy policy — how we handle your data during emergencies.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-navy pt-24 pb-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 prose prose-navy dark:prose-invert">
        <Link href="/" className="text-coral text-sm font-medium no-underline hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold mt-6">Privacy Policy</h1>
        <p className="text-muted">Last updated: {new Date().toLocaleDateString("en-US")}</p>
        <p>
          YouHooAlert is built with privacy first. Location and alert data are shared only
          with contacts you choose during active emergencies. We do not sell personal data.
        </p>
        <p>
          Full policy content will be published before public launch. Contact us with
          questions at{" "}
          <a href="mailto:privacy@youhooalert.com" className="text-coral">
            privacy@youhooalert.com
          </a>
          .
        </p>
      </article>
    </main>
  );
}
