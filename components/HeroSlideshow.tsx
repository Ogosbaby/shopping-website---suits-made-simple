"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/**
 * The SMS hero: a full-bleed rotation of model portraits behind the house
 * wordmark. Copy is kept to the wordmark and two calls to action, centred as a
 * single block so nothing overlaps at any width.
 */

interface Slide {
  src: string;
}

const SLIDES: Slide[] = [
  { src: "/hero/hero-1.jpg" },
  { src: "/hero/hero-2.jpg" },
  { src: "/hero/hero-3.jpg" },
  { src: "/hero/hero-4.jpg" },
  { src: "/hero/hero-5.jpg" },
];

const INTERVAL_MS = 6500;

const WORDMARK = ["SUITS MADE", "SIMPLE"];

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const next = (index + 1) % SLIDES.length;

  return (
    <section
      className="relative isolate overflow-hidden bg-taupe"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured looks"
    >
      {/* Rotating model portraits */}
      <div className="absolute inset-0" aria-hidden="true">
        {SLIDES.map((slide, slideIndex) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
              slideIndex === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {failed[slideIndex] ? (
              <div className="h-full w-full bg-taupe-dark" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={slide.src}
                alt=""
                className="h-full w-full object-cover object-[center_28%]"
                onError={() => setFailed((prev) => ({ ...prev, [slideIndex]: true }))}
                fetchPriority={slideIndex === 0 ? "high" : "low"}
                loading={slideIndex === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}
        {/* Warm neutral wash so the wordmark reads on every frame. */}
        <div className="absolute inset-0 bg-taupe/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deeper/80 via-brand-deeper/20 to-brand-deeper/35" />
      </div>

      {/* Wordmark and calls to action, centred as one block */}
      <div className="relative flex min-h-[86vh] flex-col items-center justify-center px-5 py-28 text-center sm:px-8">
        <h1 className="font-display text-[13vw] leading-[0.9] tracking-[0.02em] text-white sm:text-[12vw] lg:text-[9.5rem]">
          {WORDMARK.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <div className="mt-10 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:mt-12 sm:w-auto sm:max-w-none sm:flex-row">
          <Link href="/shop" className="btn-light w-full sm:w-auto">
            Shop the collection
          </Link>
          <Link href="/fit-guide" className="btn-outline-light w-full sm:w-auto">
            Find your fit
          </Link>
        </div>
      </div>

      {/* Slide counter and a preview of the next look */}
      <div className="absolute inset-x-0 bottom-6 flex items-center justify-between px-5 sm:px-8">
        <span className="font-display text-xs tracking-[0.3em] text-white/60">
          {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="group hidden items-center gap-3 border border-white/25 bg-white/10 p-1.5 pr-4 text-left backdrop-blur-sm transition-colors hover:border-white/50 sm:flex"
          aria-label="Show the next look"
        >
          <span className="block h-14 w-11 overflow-hidden bg-taupe-dark">
            {failed[next] ? null : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={SLIDES[next].src}
                alt=""
                className="h-full w-full object-cover object-[center_25%] transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            )}
          </span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-brand text-white/70">
            Next
          </span>
        </button>
      </div>
    </section>
  );
}
