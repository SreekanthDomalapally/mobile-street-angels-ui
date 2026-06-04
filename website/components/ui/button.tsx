import Link from "next/link";

type Variant = "primary" | "secondary" | "outline" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-coral text-white hover:bg-coral-soft shadow-lg shadow-coral/25",
  secondary:
    "bg-navy text-white hover:bg-navy-light dark:bg-white dark:text-navy dark:hover:bg-gray-100",
  outline:
    "border-2 border-navy/20 text-navy hover:border-coral hover:text-coral dark:border-white/20 dark:text-gray-800",
  ghost: "text-navy hover:text-coral dark:text-gray-800",
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

  const classes = `${base} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
