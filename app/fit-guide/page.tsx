import type { Metadata } from "next";
import Link from "next/link";
import { MeasureInteractiveGuide } from "@/components/MeasureInteractiveGuide";
import { STANDARD_SIZES } from "@/types";

export const metadata: Metadata = {
  title: "Fit & Sizing Guide",
  description:
    "Take a standard off-the-rack size or send six measurements for made-to-measure tailoring. Chest, waist, sleeve, jacket and trouser guidance from Suits Made Simple.",
};

/** Chest/waist ranges in inches for each standard size. */
const SIZE_CHART: Record<string, { chest: string; waist: string; sleeve: string; length: string }> = {
  "38R": { chest: "38–39", waist: "32–33", sleeve: "24.5", length: "29.5" },
  "40R": { chest: "40–41", waist: "34–35", sleeve: "25", length: "30" },
  "42R": { chest: "42–43", waist: "36–37", sleeve: "25.5", length: "30.5" },
  "44R": { chest: "44–45", waist: "38–39", sleeve: "26", length: "31" },
  "46L": { chest: "46–47", waist: "40–42", sleeve: "26.5", length: "32" },
  "48L": { chest: "48–50", waist: "42–44", sleeve: "26.8", length: "32.5" },
  "50L": { chest: "50–52", waist: "44–46", sleeve: "27", length: "33" },
};

export default function FitGuidePage() {
  return (
    <div className="py-14 sm:py-20">
      {/* Intro */}
      <section className="shell grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="label-caps">Fit &amp; Sizing</p>
          <h1 className="section-title mt-3">The right fit, without the fitting room</h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-light">
            Two ways to order: a standard off-the-rack size, or bespoke made-to-measure tailoring crafted
            from six measurements you take at home.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">
              Shop the collection
            </Link>
            <a href="#how-to-measure" className="btn-outline">
              How to measure
            </a>
          </div>
        </div>

        <div className="overflow-hidden border border-line bg-mist shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/fit-guide-black-model.jpg"
            alt="Distinguished gentleman wearing a bespoke tailored SMS suit"
            className="aspect-[4/5] w-full object-cover object-top"
          />
        </div>
      </section>

      {/* The six measurements, on the suit itself */}
      <section id="how-to-measure" className="mt-20 border-t border-line bg-surface sm:mt-24">
        <div className="shell py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="label-caps">Option B — Made to measure</p>
            <h2 className="section-title mt-3">Where we measure</h2>
            <p className="mt-5 text-base leading-relaxed text-brand-light">
              Six numbers taken over a shirt and trousers. Tap any pin on the model or select a step below to inspect where each measurement is taken.
            </p>
          </div>

          <MeasureInteractiveGuide />
        </div>
      </section>

      {/* Option A — standard sizing */}
      <section className="border-y border-line bg-mist">
        <div className="shell grid gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_minmax(0,320px)] lg:gap-16">
          {/* min-w-0 lets the size-chart table scroll instead of widening the column. */}
          <div className="min-w-0">
            <p className="label-caps">Option A — Off the rack</p>
            <h2 className="section-title mt-3">Standard sizing</h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-brand-light">
              Choose the size closest to your chest measurement.{" "}
              <strong className="font-medium text-ink">R</strong> is a regular length,{" "}
              <strong className="font-medium text-ink">L</strong> a long. Between two sizes, take the
              larger.
            </p>

            <div className="mt-8 overflow-x-auto border border-line bg-surface shadow-card">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-mist">
                    <th scope="col" className="px-6 py-4 text-[0.64rem] font-semibold uppercase tracking-brand text-brand-light">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-4 text-[0.64rem] font-semibold uppercase tracking-brand text-brand-light">
                      Chest
                    </th>
                    <th scope="col" className="px-6 py-4 text-[0.64rem] font-semibold uppercase tracking-brand text-brand-light">
                      Waist
                    </th>
                    <th scope="col" className="px-6 py-4 text-[0.64rem] font-semibold uppercase tracking-brand text-brand-light">
                      Sleeve
                    </th>
                    <th scope="col" className="px-6 py-4 text-[0.64rem] font-semibold uppercase tracking-brand text-brand-light">
                      Jacket length
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STANDARD_SIZES.map((size) => {
                    const row = SIZE_CHART[size];
                    return (
                      <tr key={size} className="border-b border-line last:border-b-0">
                        <th scope="row" className="px-6 py-4 font-display text-base font-normal text-ink">
                          {size}
                        </th>
                        <td className="px-6 py-4 text-brand-light">{row.chest}</td>
                        <td className="px-6 py-4 text-brand-light">{row.waist}</td>
                        <td className="px-6 py-4 text-brand-light">{row.sleeve}</td>
                        <td className="px-6 py-4 text-brand-light">{row.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-brand-light">
              Measurements in inches. Trouser lengths are cut long and finished to your stated inseam
              at no extra cost.
            </p>
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/shepherds-grey.jpg"
                alt="The Shepherd's Grey worn off the rack"
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="overflow-hidden border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/sabbath-ivory-life.jpg"
                alt="The Sabbath Ivory at an evening occasion"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Fit guarantee */}
      <section className="shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="grid grid-cols-2 gap-5">
            <div className="overflow-hidden border border-line bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/boardroom-navy-alt.jpg"
                alt="The Boardroom Navy"
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="overflow-hidden border border-line bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/vineyard-linen-alt.jpg"
                alt="The Vineyard Linen"
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="label-caps">Fit guarantee</p>
            <h2 className="section-title mt-3">Alterations, handled</h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-brand-light">
              If a standard size needs adjusting, we arrange the alteration. If a made-to-measure piece
              is not right, we recut it.
            </p>
            <ul className="mt-8 space-y-3 text-sm leading-relaxed text-brand-light">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand" aria-hidden="true" />
                Have someone else hold the tape where you can.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand" aria-hidden="true" />
                Wear the shirt and shoes you intend to pair with the suit.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand" aria-hidden="true" />
                Round to the nearest half inch and add nothing for comfort.
              </li>
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">
                Shop the collection
              </Link>
              <a href="mailto:concierge@suitsmadesimple.com" className="btn-outline">
                Ask the concierge
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
