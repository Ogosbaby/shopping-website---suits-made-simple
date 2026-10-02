import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { ShopFilters } from "@/components/ShopFilters";
import { getProducts } from "@/lib/products";
import { isColour, isOccasion, type ProductCategory } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Corporate and premium casual suits for pastors and gentlemen over forty, available in standard off-the-rack sizing or made to measure.",
};

function parseCategory(value: string | undefined): ProductCategory | undefined {
  return value === "corporate" || value === "premium_casual" ? value : undefined;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; colour?: string; occasion?: string };
}) {
  const category = parseCategory(searchParams.category);
  const colour = isColour(searchParams.colour) ? searchParams.colour : undefined;
  const occasion = isOccasion(searchParams.occasion) ? searchParams.occasion : undefined;

  const products = await getProducts({ category, colour, occasion });

  return (
    <div className="shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">The Collection</h1>
        <p className="text-[0.6rem] uppercase tracking-brand text-brand-soft">
          Standard sizing or made to measure
        </p>
      </header>

      <div className="mt-6">
        <ShopFilters count={products.length} category={category} colour={colour} occasion={occasion} />
      </div>

      {products.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-12 border border-line bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl text-ink">Nothing matches that combination.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-light">
            Clear a filter, or speak with the concierge about a bespoke commission.
          </p>
          <div className="mt-8">
            <Link href="/shop" className="btn-primary">
              Reset the collection
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
