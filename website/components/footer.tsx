import Image from "next/image";
import Link from "next/link";

const social = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/youhooalert" },
  { label: "Facebook", href: "https://www.facebook.com/youhooalert" },
  { label: "Instagram", href: "https://www.instagram.com/youhooalert" },
];

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl" />
              <span className="text-xl font-bold">YouHooAlert</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Helping People Help People.
            </p>
            <p className="mt-2 text-coral font-medium text-sm">You are never alone.</p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div>
              <p className="font-semibold text-sm mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/privacy" className="hover:text-coral">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-coral">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-coral">Contact</Link></li>
                <li><Link href="#donate" className="hover:text-coral">Donate</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Social</p>
              <ul className="space-y-2 text-sm text-white/70">
                {social.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-coral">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/50">
          © {new Date().getFullYear()} YouHooAlert. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
