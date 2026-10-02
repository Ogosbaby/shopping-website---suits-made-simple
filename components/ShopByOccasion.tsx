import Link from "next/link";
import { OCCASIONS, OCCASION_COPY, type Occasion } from "@/types";

/** Lifestyle frame that best illustrates each occasion. */
const OCCASION_IMAGES: Record<Occasion, string> = {
  "The Boardroom": "/products/boardroom-navy-life.jpg",
  "Sunday Service": "/products/shepherds-grey-life.jpg",
  "Black Tie": "/products/ambassador-midnight-life.jpg",
  "Officiating a Wedding": "/products/sabbath-ivory-life.jpg",
  "Conferences & Retreats": "/products/retreat-knit-life.jpg",
};

export function ShopByOccasion() {
  return (
    <section className="shell py-20 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="label-caps">Shop by Occasion</p>
          <h2 className="section-title mt-3">Dressed for the moment</h2>
          <p className="mt-5 text-base leading-relaxed text-brand-light">
            From the pulpit to the boardroom to the receiving line — find the piece the day asks for.
          </p>
        </div>
        <Link
          href="/shop"
          className="text-[0.7rem] font-semibold uppercase tracking-brand text-brand transition-colors hover:text-ink"
        >
          All pieces →
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {OCCASIONS.map((occasion, index) => (
          <Link
            key={occasion}
            href={`/shop?occasion=${encodeURIComponent(occasion)}`}
            className={`group relative block overflow-hidden border border-line bg-brand-deeper shadow-card transition-shadow duration-300 hover:shadow-lift ${
              index === 0 ? "sm:col-span-2 lg:col-span-1" : ""
            }`}
          >
            <div className="aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={OCCASION_IMAGES[occasion]}
                alt=""
                className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deeper/90 via-brand-deeper/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="font-display text-lg text-white">{occasion}</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/70">
                {OCCASION_COPY[occasion]}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
