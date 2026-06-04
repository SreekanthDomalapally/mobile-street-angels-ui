"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeroIllustration } from "@/components/hero-illustration";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white dark:from-navy dark:via-navy-light/30 dark:to-navy pointer-events-none" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-coral/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-coral font-semibold text-sm uppercase tracking-widest mb-4"
          >
            You are never alone
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight text-navy dark:text-white"
          >
            When Every Second Matters, Help Is Just One Tap Away.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-muted leading-relaxed max-w-xl"
          >
            YouHooAlert instantly notifies trusted contacts, shares your live location,
            and helps nearby people respond when you need assistance.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Button href="#download">Download App</Button>
            <Button href="#how-it-works" variant="outline">
              Learn More
            </Button>
          </motion.div>
        </div>
        <HeroIllustration />
      </div>
    </section>
  );
}
