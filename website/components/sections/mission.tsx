"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/section-heading";

export function MissionSection() {
  return (
    <section id="mission" className="py-20 sm:py-28 bg-white dark:bg-navy-light/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <SectionHeading
            align="left"
            eyebrow="Our Mission"
            title="Technology Should Help People Help People."
          />
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5 text-muted text-lg leading-relaxed"
          >
            <p>
              YouHooAlert was created with a simple belief: when someone needs help,
              connecting them to trusted people quickly can make all the difference.
            </p>
            <ul className="space-y-3">
              {["No ads.", "No premium barriers.", "No hidden features."].map((line) => (
                <li key={line} className="flex items-center gap-3 text-navy dark:text-white font-medium">
                  <span className="h-2 w-2 rounded-full bg-coral shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="text-navy dark:text-white font-semibold">
              Just a platform designed to help people when they need it most.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
