import Link from "next/link";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { HowItWorks } from "@/components/HowItWorks";
import { ShopByColour } from "@/components/ShopByColour";
import { ShopByOccasion } from "@/components/ShopByOccasion";
import { LogoMark } from "@/components/Logo";
import { ProductCard } from "@/components/ProductCard";
import { AppOnlySection } from "@/components/AppOnlySection";
import { MobileShopSections } from "@/components/MobileShopSections";
import { MobileProductFeed } from "@/components/MobileProductFeed";
import { ViewMoreGate } from "@/components/ViewMoreGate";
import { getFeaturedProducts, getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const PILLARS = [
  {
    title: "Premium Fabrics",
    copy: "Super 120s wools, Irish linens, and silk blends from heritage mills.",
  },
  {
    title: "Timeless Tailoring",
    copy: "Classic silhouettes cut with modern precision and a flawless drape.",
  },
  {
    title: "Engineered Comfort",
    copy: "Composed for the pulpit and the boardroom alike.",
  },
];

/** Editorial frames of the collection being worn. */
const EDITORIAL = [
  { src: "/products/executive-charcoal-life.jpg", caption: "The Executive Charcoal" },
  { src: "/products/boardroom-navy-life.jpg", caption: "The Boardroom Navy" },
  { src: "/products/vineyard-linen-life.jpg", caption: "The Vineyard Linen" },
];

export default async function HomePage() {
  const [featured, allProducts] = await Promise.all([
    getFeaturedProducts(4),
    getProducts(),
  ]);

  /** The full editorial web layout — shown on all web viewports (mobile, tablet, desktop). */
  const webLayout = (
    <>
      <HeroSlideshow />

      {/* Featured collection */}
      <section className="shell py-16 sm:py-20 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps">The Collection</p>
            <h2 className="section-title mt-3">Selected pieces</h2>
          </div>
        </div>

        {featured.length > 0 ? (
          /* Relative wrapper so the gradient + button can overlay the bottom of the grid */
          <div className="relative mt-10">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {/* Gradient fade + floating 'View More' / sign-in gate */}
            <ViewMoreGate />
          </div>
        ) : (
          <div className="mt-12 border border-line bg-surface p-10 text-center shadow-card">
            <p className="font-display text-xl text-ink">The collection is being prepared.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-light">
              Connect the store to its database and run <code className="text-brand">supabase/seed.sql</code>{" "}
              to publish the collection.
            </p>
          </div>
        )}
      </section>

      {/* Editorial frames */}
      <section className="shell pb-16 sm:pb-20 lg:pb-24">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {EDITORIAL.map((frame, index) => (
            <figure
              key={frame.src}
              className={`relative overflow-hidden border border-line bg-mist ${
                index === 0 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.src}
                  alt={frame.caption}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-deeper/80 to-transparent px-5 py-4 text-[0.6rem] font-semibold uppercase tracking-brand text-white/85">
                {frame.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <HowItWorks />
      <ShopByOccasion />
      <ShopByColour />

      {/* About — The SMS Standard */}
      <section id="about" className="border-y border-line bg-surface">
        <div className="shell grid gap-14 py-16 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:py-24">
          <div>
            <p className="label-caps">About Us</p>
            <h2 className="section-title mt-3 max-w-md">The SMS Standard</h2>
            <div className="mt-10 space-y-8">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="border-l border-line pl-6">
                  <p className="font-display text-base text-ink">{pillar.title}</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-light">
                    {pillar.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="overflow-hidden border border-line bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/chancellor-pinstripe-life.jpg"
                alt="A gentleman wearing The Chancellor Pinstripe"
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="font-display text-xl leading-relaxed text-ink sm:text-2xl sm:leading-relaxed">
                Crafting distinction for the men a congregation looks to.
              </p>
              <p className="mt-6 text-base leading-relaxed text-brand-light">
                Premium fabrics, timeless tailoring, and a fit that holds through the longest of days.
              </p>
              <div className="mt-8">
                <Link href="/shop" className="btn-primary">
                  Explore the collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing band */}
      <section className="bg-brand-deeper text-white">
        <div className="shell flex flex-col items-center gap-8 py-16 text-center">
          <LogoMark className="h-10 w-10" />
          <p className="max-w-2xl font-display text-2xl leading-snug sm:text-3xl">
            Standard sizing or bespoke tailoring — the fit is always yours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-light">
              Begin your order
            </Link>
            <Link href="/fit-guide" className="btn-outline-light">
              Find your fit
            </Link>
          </div>
        </div>
      </section>
    </>
  );

  /** The Jumia-style app layout — only shown inside the Capacitor shell. */
  const appLayout = (
    <>
      <MobileShopSections />
      <MobileProductFeed products={allProducts.length > 0 ? allProducts : featured} />

      {/* Closing CTA strip */}
      <div className="bg-brand-deeper py-10 text-center">
        <LogoMark className="mx-auto h-8 w-8 text-white/70" />
        <p className="mt-4 px-6 font-display text-lg leading-snug text-white">
          Standard sizing or bespoke tailoring — the fit is always yours.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 px-6">
          <Link href="/shop" className="btn-light w-full max-w-xs">
            Shop the collection
          </Link>
          <Link href="/fit-guide" className="btn-outline-light w-full max-w-xs">
            Find your fit
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <AppOnlySection webFallback={webLayout}>
      {appLayout}
    </AppOnlySection>
  );
}
