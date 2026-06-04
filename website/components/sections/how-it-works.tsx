"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    step: "01",
    title: "Press SOS",
    description: "Hold the button when you need help. Designed to be fast and discreet.",
  },
  {
    step: "02",
    title: "Contacts notified instantly",
    description: "Trusted contacts receive your alert and live location immediately.",
  },
  {
    step: "03",
    title: "Community responds",
    description: "Nearby trusted people can accept and coordinate help in real time.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white dark:bg-navy-light/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How It Works"
          title="Three steps to get help fast"
          description="Simple, calm, and built for moments when every second counts."
        />
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((item, i) => (
            <motion.article
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="relative rounded-2xl border border-navy/8 bg-gray-50 dark:bg-navy p-8 shadow-sm hover:shadow-md hover:border-coral/20 transition-all"
            >
              <span className="text-4xl font-black text-coral/30">{item.step}</span>
              <h3 className="mt-4 text-xl font-bold text-navy dark:text-white">{item.title}</h3>
              <p className="mt-3 text-muted leading-relaxed">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
