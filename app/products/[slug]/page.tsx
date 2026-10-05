import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { PurchasePanel } from "@/components/PurchasePanel";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { CATEGORY_LABELS } from "@/types";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getProductBySlug(params.slug);
  return {
    title: data?.product.name ?? "Product",
    description: data?.product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getProductBySlug(params.slug);
  if (!data) notFound();

  const { product, variants } = data;
  const related = await getRelatedProducts(product.category, product.slug, 3);
  const details = Array.isArray(product.details) ? product.details : [];

  return (
    <div className="shell py-12 sm:py-16">
      <nav className="text-[0.68rem] uppercase tracking-brand text-brand-soft" aria-label="Breadcrumb">
        <Link href="/shop" className="transition-colors hover:text-brand">
          Collection
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-light">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="border border-line bg-surface shadow-card lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={product.images ?? [product.image]} name={product.name} />
        </div>

        <div>
          <p className="label-caps">{CATEGORY_LABELS[product.category]}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-lg font-medium text-brand">{formatMoney(product.price_cents)}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.66rem] uppercase tracking-brand text-brand-soft">
            <span>{product.colour}</span>
            {product.occasions?.map((occasion) => (
              <span key={occasion} className="border border-line px-2.5 py-1">
                {occasion}
              </span>
            ))}
          </div>
          <p className="mt-6 text-base leading-relaxed text-brand-light">{product.description}</p>

          {details.length > 0 ? (
            <ul className="mt-8 space-y-3 border-t border-line pt-8">
              {details.map((detail) => (
                <li key={detail} className="flex items-start gap-3 text-sm text-brand-light">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-brand" aria-hidden="true" />
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10 border-t border-line pt-10">
            <PurchasePanel productId={product.id} priceCents={product.price_cents} variants={variants} />
          </div>

          <div className="mt-10 grid gap-3 text-sm text-brand-light">
            <p>Complimentary courier delivery on every order.</p>
            <p>Standard pieces ship within 48 hours; bespoke tailoring within 14 days.</p>
            <p>
              Unsure of your measurements? See the{" "}
              <Link href="/fit-guide" className="font-medium text-brand underline underline-offset-4">
                fit and sizing guide
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24">
          <h2 className="section-title">You may also consider</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
