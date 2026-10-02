import type { Product, ProductCategory, ProductVariant } from "@/types";
import {
  type CatalogFilters,
  localFeaturedProducts,
  localProductBySlug,
  localProducts,
  localRelatedProducts,
  normalizeImages,
} from "@/lib/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Public catalog queries.
 *
 * When Supabase is not configured, each function serves the read-only local
 * catalog so the storefront renders its full collection. Once Supabase is
 * connected, the database is the single source of truth.
 */

export async function getProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return localProducts(filters);

  let query = supabase
    .from("products")
    .select("*")
    .order("price_cents", { ascending: true });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.colour) query = query.eq("colour", filters.colour);
  if (filters.occasion) query = query.contains("occasions", [filters.occasion]);

  const { data, error } = await query;
  if (error) {
    console.error("[products] failed to load catalog:", error.message);
    return [];
  }

  return (data ?? []).map(withGallery) as Product[];
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return localFeaturedProducts(limit);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("price_cents", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[products] failed to load featured products:", error.message);
    return [];
  }

  return (data ?? []).map(withGallery) as Product[];
}

export async function getProductBySlug(
  slug: string
): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return localProductBySlug(slug);

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[products] failed to load product:", error.message);
    return null;
  }
  if (!product) return null;

  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .order("size", { ascending: true });

  if (variantError) {
    console.error("[products] failed to load variants:", variantError.message);
  }

  return {
    product: withGallery(product) as Product,
    variants: (variants ?? []) as ProductVariant[],
  };
}

/** Guarantees `images` is populated, so every render has a full gallery. */
function withGallery(row: unknown): Product {
  const product = row as Product;
  return { ...product, images: normalizeImages(product) };
}

export async function getRelatedProducts(
  category: ProductCategory,
  excludeSlug: string,
  limit = 3
): Promise<Product[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return localRelatedProducts(category, excludeSlug, limit);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .neq("slug", excludeSlug)
    .limit(limit);

  if (error) {
    console.error("[products] failed to load related products:", error.message);
    return [];
  }

  return (data ?? []).map(withGallery) as Product[];
}
