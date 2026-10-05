import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Choose your piece",
    copy: "Select from the Corporate and Premium Casual collections — every cut, every colour, in one place.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
        <rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 18h32" stroke="currentColor" strokeWidth="2" />
        <path d="M16 10v8M32 10v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 26h16M16 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Set your fit",
    copy: "Take a standard off-the-rack size, or send six measurements and we tailor the piece to you.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
        <path d="M10 38L38 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 38l4-1-1 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M38 10l-4 1 1-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 31l2-2M22 26l2-2M27 21l2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Wear it with confidence",
    copy: "We finish, press, and deliver to your door. Every order is confirmed in writing.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
        <path d="M24 8L14 13v10c0 7 4.5 13.5 10 16 5.5-2.5 10-9 10-16V13L24 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-line bg-surface">
      <div className="shell py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="label-caps">How It Works</p>
          <h2 className="section-title mt-3">Three steps to a proper fit</h2>
          <p className="mt-5 text-base leading-relaxed text-brand-light">
            No fitting rooms, no guesswork. Order in minutes and let the measurements do the work.
          </p>
        </div>

        {/* Step cards */}
        <div className="mt-12 grid gap-6 sm:gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="group relative flex flex-col gap-5 border border-line bg-paper p-8 transition-shadow duration-300 hover:shadow-lift"
            >
              {/* Step number — large decorative */}
              <span className="font-display text-5xl font-semibold leading-none text-brand/[0.12] select-none">
                {step.number}
              </span>

              {/* Icon */}
              <span className="text-brand dark:text-amber-400 -mt-2">
                {step.icon}
              </span>

              {/* Content */}
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-light">
                  {step.copy}
                </p>
              </div>

              {/* Connector arrow (between cards on desktop) */}
              {index < STEPS.length - 1 && (
                <span
                  className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 md:block"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-line">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/shop" className="btn-primary">
            Start with a suit
          </Link>
          <Link href="/fit-guide" className="btn-outline">
            Learn how we measure
          </Link>
        </div>
      </div>
    </section>
  );
}
