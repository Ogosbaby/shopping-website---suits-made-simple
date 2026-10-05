"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem, Measurements, SizeType } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AddToCartInput {
  productId: string;
  sizeType: SizeType;
  standardSize?: string;
  measurements?: Measurements;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  loading: boolean;
  configured: boolean;
  error: string | null;
  addItem: (input: AddToCartInput) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = (await response.json()) as {
        items?: CartItem[];
        configured?: boolean;
        error?: string;
      };
      if (!mounted.current) return;
      if (!response.ok || data.error) {
        setError(data.error ?? "Unable to load your cart.");
      } else {
        setItems(data.items ?? []);
        setError(null);
      }
      setConfigured(data.configured !== false);
    } catch {
      if (mounted.current) setError("Unable to load your cart.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // When a shopper signs in on this device, fold their guest cart into the
  // account, then reload so the account's items (from every device) appear.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN") return;
      void (async () => {
        try {
          await fetch("/api/auth/migrate", { method: "POST" });
        } catch {
          // The cart route adopts guest lines on read, so a failed migrate is recoverable.
        }
        await refresh();
      })();
    });

    return () => listener.subscription.unsubscribe();
  }, [refresh]);

  const addItem = useCallback(
    async (input: AddToCartInput): Promise<boolean> => {
      setError(null);
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await response.json()) as { item?: CartItem; error?: string };

        if (!response.ok || data.error) {
          setError(data.error ?? "Unable to add that to your cart.");
          return false;
        }

        const item = data.item;
        if (item) {
          setItems((current) => {
            const existing = current.find((line) => line.id === item.id);
            if (existing) {
              return current.map((line) =>
                line.id === item.id ? { ...item, product: line.product ?? item.product } : line
              );
            }
            return [...current, item];
          });
        }
        return true;
      } catch {
        setError("Unable to add that to your cart.");
        return false;
      }
    },
    []
  );

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setItems((current) =>
      current.map((line) => (line.id === itemId ? { ...line, quantity } : line))
    );
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Unable to update your cart.");
        await refresh();
      }
    } catch {
      setError("Unable to update your cart.");
      await refresh();
    }
  }, [refresh]);

  const removeItem = useCallback(async (itemId: string) => {
    setItems((current) => current.filter((line) => line.id !== itemId));
    try {
      const response = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Unable to update your cart.");
        await refresh();
      }
    } catch {
      setError("Unable to update your cart.");
      await refresh();
    }
  }, [refresh]);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotalCents = items.reduce(
      (sum, line) => sum + (line.product?.price_cents ?? 0) * line.quantity,
      0
    );

    return {
      items,
      count,
      subtotalCents,
      loading,
      configured,
      error,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refresh,
    };
  }, [items, loading, configured, error, addItem, updateQuantity, removeItem, clear, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
