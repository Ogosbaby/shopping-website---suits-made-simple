import Link from "next/link";

/**
 * The SMS tuxedo mark, rendered in `currentColor` so it adapts to any surface.
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M38 16 L50 26 L62 16"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M38 17 L14 25 L30 42 L44 33 Z" fill="currentColor" />
      <path d="M62 17 L86 25 L70 42 L56 33 Z" fill="currentColor" />
      <path d="M50 22 L56.5 28.5 L50 35 L43.5 28.5 Z" fill="currentColor" />
      <path d="M45.5 31.5 L54.5 31.5 L58 62 L50 74 L42 62 Z" fill="currentColor" />
      <circle cx="50" cy="82" r="3" fill="currentColor" />
    </svg>
  );
}

/**
 * Full lockup: tuxedo mark with the SMS wordmark, matching the brand logo.
 */
export function Logo({
  className = "",
  markClassName = "h-10 w-10",
  wordClassName = "text-2xl",
  showTagline = true,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  showTagline?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label="Suits Made Simple — home"
    >
      <LogoMark className={`${markClassName} shrink-0 transition-transform duration-300 group-hover:scale-105`} />
      <span className="flex flex-col leading-none">
        <span className={`font-display font-semibold tracking-[0.18em] ${wordClassName}`}>SMS</span>
        {showTagline ? (
          <span className="mt-1 text-[0.55rem] font-medium uppercase tracking-brand opacity-70">
            Suits Made Simple
          </span>
        ) : null}
      </span>
    </Link>
  );
}
