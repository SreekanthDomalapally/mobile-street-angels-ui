"use client";

import { motion } from "framer-motion";

export function HeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative w-full max-w-md mx-auto"
      aria-hidden
    >
      <div className="relative rounded-3xl bg-gradient-to-br from-navy to-navy-light p-6 shadow-2xl shadow-navy/30">
        <div className="rounded-2xl bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-medium">YouHooAlert</span>
            <span className="flex h-2 w-2 rounded-full bg-coral animate-pulse" />
          </div>

          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-coral flex items-center justify-center shadow-lg shadow-coral/40">
                <span className="text-white font-black text-xl tracking-tight">SOS</span>
              </div>
              <div className="absolute -inset-3 rounded-full border-2 border-coral/40 animate-ping" />
            </div>
          </div>

          <p className="text-center text-white/80 text-sm">Hold to send alert</p>
        </div>

        <div className="absolute -right-4 top-8 w-36 rounded-xl bg-white dark:bg-gray-100 p-3 shadow-xl">
          <p className="text-[10px] font-bold text-coral uppercase">Alert sent</p>
          <p className="text-xs text-navy mt-1 font-medium">Sarah · 0.4 mi</p>
          <p className="text-xs text-navy mt-0.5 font-medium">James · 1.2 mi</p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full w-2/3 bg-coral rounded-full" />
          </div>
        </div>

        <div className="absolute -left-2 bottom-12 w-32 rounded-xl bg-white/95 dark:bg-gray-100 p-3 shadow-lg">
          <p className="text-[10px] text-muted">Live location</p>
          <div className="mt-2 h-16 rounded-lg bg-gradient-to-br from-coral/20 to-navy/10 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-coral border-2 border-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
