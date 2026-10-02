export type SizeType = "standard" | "custom";

export type ProductCategory = "corporate" | "premium_casual";

export interface Measurements {
  neck: string;
  chest: string;
  waist: string;
  jacket_length: string;
  sleeve_length: string;
  trouser_length: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  details: string[];
  price_cents: number;
  /** Primary image, used for every thumbnail in the catalogue. */
  image: string;
  /** Full gallery — primary first, then alternate, lifestyle and detail frames. */
  images: string[];
  colour: Colour;
  occasions: Occasion[];
  featured: boolean;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  stock: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  user_id: string | null;
  product_id: string;
  variant_id: string | null;
  size_type: SizeType;
  standard_size: string | null;
  measurements: Measurements | null;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  /** pending_payment → paid (Paystack), or confirmed when paying offline. */
  status: string;
  /** Paystack reference for the successful attempt, if any. */
  payment_reference: string | null;
  paid_at: string | null;
  /** The cart that produced this order, cleared once payment clears. */
  cart_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  size_type: SizeType;
  standard_size: string | null;
  measurements: Measurements | null;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
}

export const MEASUREMENT_FIELDS: { key: keyof Measurements; label: string }[] = [
  { key: "neck", label: "Neck" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "jacket_length", label: "Jacket Length" },
  { key: "sleeve_length", label: "Sleeve Length" },
  { key: "trouser_length", label: "Trouser Length" },
];

export const STANDARD_SIZES = ["38R", "40R", "42R", "44R", "46L", "48L", "50L"];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  corporate: "Corporate",
  premium_casual: "Premium Casual",
};

/** How the collection is organised for browsing. */
export const COLOURS = [
  "Charcoal",
  "Navy",
  "Black",
  "Grey",
  "Sand",
  "Sage",
  "Ivory",
] as const;

export type Colour = (typeof COLOURS)[number];

/** Swatch values for the shop-by-colour tiles. */
export const COLOUR_SWATCHES: Record<Colour, string> = {
  Charcoal: "#3A3A3C",
  Navy: "#1E2A44",
  Black: "#141414",
  Grey: "#8A9098",
  Sand: "#C6B49B",
  Sage: "#8C9A85",
  Ivory: "#EFE9DC",
};

export const OCCASIONS = [
  "Sunday Service",
  "The Boardroom",
  "Black Tie",
  "Officiating a Wedding",
  "Conferences & Retreats",
] as const;

export type Occasion = (typeof OCCASIONS)[number];

export const OCCASION_COPY: Record<Occasion, string> = {
  "Sunday Service": "Composed pieces for the pulpit, from first light to the last amen.",
  "The Boardroom": "Authority without noise. Cut to be taken seriously.",
  "Black Tie": "Evening formality, handled with quiet confidence.",
  "Officiating a Wedding": "Present, dignified, and never the subject of the photograph.",
  "Conferences & Retreats": "Long days, changing rooms, and a suit that keeps its shape.",
};

export function isColour(value: string | undefined): value is Colour {
  return !!value && (COLOURS as readonly string[]).includes(value);
}

export function isOccasion(value: string | undefined): value is Occasion {
  return !!value && (OCCASIONS as readonly string[]).includes(value);
}
