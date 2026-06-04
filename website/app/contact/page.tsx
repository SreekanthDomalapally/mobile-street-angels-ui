import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the YouHooAlert team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-navy pt-24 pb-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
        <Link href="/" className="text-coral text-sm font-medium hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold mt-6 text-navy dark:text-white">Contact</h1>
        <p className="mt-4 text-muted leading-relaxed">
          We would love to hear from you — partnerships, feedback, or support.
        </p>
        <a
          href="mailto:hello@youhooalert.com"
          className="inline-block mt-8 text-lg font-semibold text-coral hover:underline"
        >
          hello@youhooalert.com
        </a>
      </div>
    </main>
  );
}
