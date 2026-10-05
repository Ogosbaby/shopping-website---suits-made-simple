"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";

export function ClearCartOnSuccess() {
  const { clear, refresh } = useCart();

  useEffect(() => {
    clear();
    void refresh();
  }, [clear, refresh]);

  return null;
}
