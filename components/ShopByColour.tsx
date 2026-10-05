import Link from "next/link";
import { COLOURS, COLOUR_SWATCHES } from "@/types";
import { getProducts } from "@/lib/products";

export async function ShopByColour() {
  const products = await getProducts();
  const counts = products.reduce<Record<string, number>>((accumulator, product) => {
    accumulator[product.colour] = (accumulator[product.colour] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <section className="border-y border-line bg-mist">
      <div className="shell py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="label-caps">Shop by Colour</p>
          <h2 className="section-title mt-3">A palette of authority</h2>
          <p className="mt-5 text-base leading-relaxed text-brand-light">
            Charcoal and navy for the week. Sand and ivory for the occasions that call for light.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4 lg:grid-cols-7">
          {COLOURS.map((colour) => (
            <li key={colour} className="bg-surface">
              <Link
                href={`/shop?colour=${encodeURIComponent(colour)}`}
                className="group flex h-full flex-col items-center gap-4 px-4 py-8 text-center transition-colors hover:bg-paper"
              >
                <span
                  className="h-11 w-11 rounded-full ring-1 ring-inset ring-black/10 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: COLOUR_SWATCHES[colour] }}
                  aria-hidden="true"
                />
                <span className="text-[0.62rem] font-semibold uppercase tracking-brand text-ink">
                  {colour}
                </span>
                <span className="text-[0.62rem] uppercase tracking-brand text-brand-soft">
                  {counts[colour] ?? 0} {counts[colour] === 1 ? "piece" : "pieces"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
