import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "YouHooAlert terms of service.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-navy pt-24 pb-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href="/" className="text-coral text-sm font-medium hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold mt-6 text-navy dark:text-white">Terms of Service</h1>
        <p className="mt-4 text-muted leading-relaxed">
          YouHooAlert is a community assistance tool, not a replacement for emergency services.
          Always call local emergency numbers when in immediate danger.
        </p>
        <p className="mt-4 text-muted leading-relaxed">
          Complete terms will be published before launch. Questions:{" "}
          <a href="mailto:legal@youhooalert.com" className="text-coral">
            legal@youhooalert.com
          </a>
          .
        </p>
      </article>
    </main>
  );
}
