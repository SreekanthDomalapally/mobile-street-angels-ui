"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/lib/site";
import { FeatureIcon } from "@/components/ui/feature-icon";
import { SectionHeading } from "@/components/ui/section-heading";

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-gray-50 dark:bg-navy">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Features"
          title="Built for real emergencies, real people"
          description="Everything you need to stay connected to people you trust — without subscriptions or ads."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06 }}
              className="rounded-2xl bg-white dark:bg-navy-light border border-navy/8 p-6 hover:border-coral/25 transition-colors"
            >
              <FeatureIcon name={feature.icon} />
              <h3 className="mt-4 font-semibold text-navy dark:text-white">{feature.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
