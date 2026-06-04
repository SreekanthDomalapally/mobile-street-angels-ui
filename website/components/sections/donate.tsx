"use client";

import { motion } from "framer-motion";
import { DONATION_AMOUNTS } from "@/lib/site";
import { SectionHeading } from "@/components/ui/section-heading";

export function DonateSection() {
  return (
    <section id="donate" className="py-20 sm:py-28 bg-gray-50 dark:bg-navy">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <SectionHeading
          eyebrow="Donate"
          title="Support The Mission"
          description="YouHooAlert is free for everyone. Optional donations help maintain infrastructure, improve reliability, and keep the platform available for people in need."
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-4"
        >
          {DONATION_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              className="min-w-[4.5rem] rounded-full border-2 border-navy/15 bg-white dark:bg-navy-light px-6 py-3 font-bold text-navy dark:text-white hover:border-coral hover:text-coral transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
              aria-label={`Donate ${amount} dollars`}
            >
              ${amount}
            </button>
          ))}
          <button
            type="button"
            className="rounded-full border-2 border-coral bg-coral px-6 py-3 font-bold text-white hover:bg-coral-soft transition-colors"
            aria-label="Donate custom amount"
          >
            Custom Amount
          </button>
        </motion.div>
        <p className="text-sm text-muted">
          Stripe-ready layout — payment integration coming soon. Thank you for supporting
          community safety.
        </p>
      </div>
    </section>
  );
}
