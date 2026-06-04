"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function DownloadSection() {
  const comingSoon = true;

  return (
    <section id="download" className="py-20 sm:py-28 bg-navy text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-coral/10 to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-coral font-semibold text-sm uppercase tracking-widest mb-3">
              Download
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Get YouHooAlert on your phone
            </h2>
            <p className="mt-4 text-white/70 text-lg leading-relaxed max-w-lg">
              Available soon on iOS and Android. Be among the first to know when we launch.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                disabled={comingSoon}
                className="inline-flex items-center gap-3 rounded-xl bg-white/10 border border-white/20 px-5 py-3 opacity-70 cursor-not-allowed"
                aria-disabled
              >
                <span className="text-2xl" aria-hidden>
                  
                </span>
                <span className="text-left">
                  <span className="block text-[10px] uppercase opacity-70">Coming soon on</span>
                  <span className="block font-semibold">App Store</span>
                </span>
              </button>
              <button
                type="button"
                disabled={comingSoon}
                className="inline-flex items-center gap-3 rounded-xl bg-white/10 border border-white/20 px-5 py-3 opacity-70 cursor-not-allowed"
                aria-disabled
              >
                <span className="text-2xl" aria-hidden>
                  ▶
                </span>
                <span className="text-left">
                  <span className="block text-[10px] uppercase opacity-70">Coming soon on</span>
                  <span className="block font-semibold">Google Play</span>
                </span>
              </button>
            </div>
            {comingSoon && (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral/20 text-coral-soft px-4 py-2 text-sm font-semibold">
                Coming Soon — launching shortly
              </p>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative w-56 sm:w-64">
              <div className="rounded-[2.5rem] border-4 border-white/20 bg-navy-light p-3 shadow-2xl">
                <div className="rounded-[2rem] bg-gradient-to-b from-gray-100 to-white dark:from-navy dark:to-navy-light aspect-[9/19] flex flex-col items-center justify-center p-6">
                  <Image src="/logo.png" alt="" width={64} height={64} className="rounded-2xl mb-4" />
                  <p className="font-bold text-navy dark:text-white text-center">YouHooAlert</p>
                  <div className="mt-6 w-full h-12 rounded-full bg-coral/90 flex items-center justify-center">
                    <span className="text-white font-bold">SOS</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-white/30 p-6 bg-white/5 text-center w-40">
              <div className="mx-auto w-28 h-28 bg-white rounded-lg grid grid-cols-4 grid-rows-4 gap-0.5 p-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${i % 3 === 0 ? "bg-navy" : "bg-white"}`}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-white/60">Scan to download</p>
              <p className="text-[10px] text-coral mt-1">QR placeholder</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
