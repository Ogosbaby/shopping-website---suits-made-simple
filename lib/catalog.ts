import type { Colour, Occasion, Product, ProductCategory, ProductVariant } from "@/types";
import { STANDARD_SIZES } from "@/types";

/**
 * Local catalog mirror of supabase/seed.sql.
 *
 * Used as a read-only fallback when Supabase is not configured, so the
 * storefront renders its full collection (and imagery) without a database.
 * Once Supabase is connected, the database remains the single source of truth.
 */

type CatalogEntry = Omit<Product, "id" | "created_at">;

const CATALOG: CatalogEntry[] = [
  {
    slug: "the-executive-charcoal",
    name: "The Executive Charcoal",
    category: "corporate",
    description:
      "A two-piece in deep charcoal wool. Structured shoulders, a clean drape, and a silhouette built for the boardroom.",
    details: [
      "Super 120s wool",
      "Half-canvassed construction",
      "Notch lapel, two-button front",
      "Double vented back",
    ],
    price_cents: 28_900_000, // ₦289,000
    image: "/products/executive-charcoal.jpg",
    images: [
      "/products/executive-charcoal.jpg",
      "/products/executive-charcoal-alt.jpg",
      "/products/executive-charcoal-life.jpg",
      "/products/executive-charcoal-detail.jpg",
    ],
    colour: "Charcoal",
    occasions: ["The Boardroom", "Sunday Service"],
    featured: true,
  },
  {
    slug: "the-boardroom-navy",
    name: "The Boardroom Navy",
    category: "corporate",
    description:
      "A three-piece in midnight navy. Composed, authoritative, and correct in every room it enters.",
    details: [
      "Super 130s wool",
      "Three-piece with waistcoat",
      "Peak lapel option",
      "Full satin lining",
    ],
    price_cents: 38_500_000, // ₦385,000
    image: "/products/boardroom-navy.jpg",
    images: [
      "/products/boardroom-navy.jpg",
      "/products/boardroom-navy-alt.jpg",
      "/products/boardroom-navy-life.jpg",
      "/products/boardroom-navy-detail.jpg",
    ],
    colour: "Navy",
    occasions: ["The Boardroom", "Conferences & Retreats"],
    featured: true,
  },
  {
    slug: "the-ambassador-midnight",
    name: "The Ambassador Midnight",
    category: "corporate",
    description:
      "An evening tuxedo in midnight black. Satin lapels, a quiet sheen, and presence without effort.",
    details: [
      "Midnight black wool",
      "Satin shawl lapel",
      "Covered buttons",
      "Tailored trouser with braid",
    ],
    price_cents: 46_500_000, // ₦465,000
    image: "/products/ambassador-midnight.jpg",
    images: [
      "/products/ambassador-midnight.jpg",
      "/products/ambassador-midnight-alt.jpg",
      "/products/ambassador-midnight-life.jpg",
      "/products/ambassador-midnight-detail.jpg",
    ],
    colour: "Black",
    occasions: ["Black Tie", "Officiating a Wedding"],
    featured: false,
  },
  {
    slug: "the-chancellor-pinstripe",
    name: "The Chancellor Pinstripe",
    category: "corporate",
    description:
      "A pinstripe two-piece for men who prefer to be remembered. Crisp lines, deliberate presence.",
    details: ["Chalk pinstripe wool", "Roped shoulder", "Ticket pocket", "Pick-stitched edges"],
    price_cents: 33_500_000, // ₦335,000
    image: "/products/chancellor-pinstripe.jpg",
    images: [
      "/products/chancellor-pinstripe.jpg",
      "/products/chancellor-pinstripe-alt.jpg",
      "/products/chancellor-pinstripe-life.jpg",
      "/products/chancellor-pinstripe-detail.jpg",
    ],
    colour: "Grey",
    occasions: ["The Boardroom", "Sunday Service"],
    featured: true,
  },
  {
    slug: "the-shepherds-grey",
    name: "The Shepherd's Grey",
    category: "premium_casual",
    description:
      "A soft-shouldered grey blazer. Tailored enough for the pulpit, relaxed enough for the week.",
    details: ["Wool-linen blend", "Unstructured shoulder", "Patch pockets", "Half lined"],
    price_cents: 19_800_000, // ₦198,000
    image: "/products/shepherds-grey.jpg",
    images: [
      "/products/shepherds-grey.jpg",
      "/products/shepherds-grey-alt.jpg",
      "/products/shepherds-grey-life.jpg",
      "/products/shepherds-grey-detail.jpg",
    ],
    colour: "Grey",
    occasions: ["Sunday Service", "Conferences & Retreats"],
    featured: false,
  },
  {
    slug: "the-vineyard-linen",
    name: "The Vineyard Linen",
    category: "premium_casual",
    description:
      "A breathable linen suit in warm sand. Made for long services, late afternoons, and open air.",
    details: ["Pure Irish linen", "Unlined jacket", "Natural shoulder", "Soft-roll lapel"],
    price_cents: 24_500_000, // ₦245,000
    image: "/products/vineyard-linen.jpg",
    images: [
      "/products/vineyard-linen.jpg",
      "/products/vineyard-linen-alt.jpg",
      "/products/vineyard-linen-life.jpg",
      "/products/vineyard-linen-detail.jpg",
    ],
    colour: "Sand",
    occasions: ["Sunday Service", "Officiating a Wedding"],
    featured: true,
  },
  {
    slug: "the-retreat-knit",
    name: "The Retreat Knit",
    category: "premium_casual",
    description:
      "A knitted blazer in muted sage. Effortless structure, quiet comfort, considered detail.",
    details: ["Italian knit jersey", "Two-button front", "Four-way stretch", "Machine washable"],
    price_cents: 21_500_000, // ₦215,000
    image: "/products/retreat-knit.jpg",
    images: [
      "/products/retreat-knit.jpg",
      "/products/retreat-knit-alt.jpg",
      "/products/retreat-knit-life.jpg",
      "/products/retreat-knit-detail.jpg",
    ],
    colour: "Sage",
    occasions: ["Conferences & Retreats", "Sunday Service"],
    featured: false,
  },
  {
    slug: "the-sabbath-ivory",
    name: "The Sabbath Ivory",
    category: "premium_casual",
    description:
      "An ivory dinner jacket for evening occasions. Understated, ceremonial, and impeccably cut.",
    details: ["Ivory wool-silk blend", "Shawl collar", "Covered buttons", "Contrast satin trim"],
    price_cents: 29_500_000, // ₦295,000
    image: "/products/sabbath-ivory.jpg",
    images: [
      "/products/sabbath-ivory.jpg",
      "/products/sabbath-ivory-alt.jpg",
      "/products/sabbath-ivory-life.jpg",
      "/products/sabbath-ivory-detail.jpg",
    ],
    colour: "Ivory",
    occasions: ["Officiating a Wedding", "Black Tie"],
    featured: false,
  },
];

/** Stable, slug-derived identity for catalog entries without a database row. */
export function fallbackId(slug: string): string {
  return `local:${slug}`;
}

export const LOCAL_CATALOG: Product[] = CATALOG.map((entry) => ({
  ...entry,
  id: fallbackId(entry.slug),
}));

export interface CatalogFilters {
  category?: ProductCategory;
  colour?: Colour;
  occasion?: Occasion;
  /** Free-text search across name, description, colour and occasion. */
  q?: string;
}

function matches(product: Product, filters: CatalogFilters): boolean {
  if (filters.category && product.category !== filters.category) return false;
  if (filters.colour && product.colour !== filters.colour) return false;
  if (filters.occasion && !product.occasions.includes(filters.occasion)) return false;
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    const haystack = [product.name, product.description, product.colour, ...product.occasions]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function localProducts(filters: CatalogFilters = {}): Product[] {
  const list = LOCAL_CATALOG.filter((product) => matches(product, filters));
  return [...list].sort((a, b) => a.price_cents - b.price_cents);
}

/** Products sharing a colour, for the colour tiles. */
export function localColourCount(colour: Colour): number {
  return LOCAL_CATALOG.filter((product) => product.colour === colour).length;
}

export function localFeaturedProducts(limit = 4): Product[] {
  return LOCAL_CATALOG.filter((product) => product.featured)
    .sort((a, b) => b.price_cents - a.price_cents)
    .slice(0, limit);
}

export function localProductBySlug(
  slug: string
): { product: Product; variants: ProductVariant[] } | null {
  const product = LOCAL_CATALOG.find((entry) => entry.slug === slug);
  if (!product) return null;

  const variants: ProductVariant[] = STANDARD_SIZES.map((size) => ({
    id: `${product.id}:${size}`,
    product_id: product.id,
    size,
    stock: 12,
  }));

  return { product, variants };
}

export function localRelatedProducts(
  category: ProductCategory,
  excludeSlug: string,
  limit = 3
): Product[] {
  return LOCAL_CATALOG.filter(
    (product) => product.category === category && product.slug !== excludeSlug
  ).slice(0, limit);
}

const GALLERY_SUFFIXES = ["", "-alt", "-life", "-detail"];

/**
 * Gallery paths for a product row. Databases seeded before the `images` column
 * existed (or with an empty array) fall back to the naming convention, then to
 * the single cover image.
 */
export function normalizeImages(product: Product): string[] {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images;
  if (!product.image) return [];
  return GALLERY_SUFFIXES.map((suffix) =>
    suffix ? product.image.replace(/\.jpg$/, `${suffix}.jpg`) : product.image
  );
}
