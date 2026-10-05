"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";

interface MobileProductFeedProps {
  products: Product[];
}

type Tab = "all" | "corporate" | "premium_casual" | "featured";

export function MobileProductFeed({ products }: MobileProductFeedProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const filtered = products.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "featured") return p.featured;
    return p.category === activeTab;
  });

  return (
    <div className="bg-white dark:bg-[#12161C] md:hidden">
      {/* ── Jumia-style Sticky/Scrollable Filter Tabs ── */}
      <div className="sticky top-14 z-30 flex items-center gap-2 border-b border-line dark:border-[#2C3746] bg-white/95 dark:bg-[#18202A]/95 px-3 py-2.5 backdrop-blur overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            activeTab === "all"
              ? "bg-brand dark:bg-amber-600 text-white shadow-sm"
              : "bg-mist dark:bg-[#242E3B] text-brand-light dark:text-gray-300 hover:bg-mist/80"
          }`}
        >
          All Suits ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("corporate")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            activeTab === "corporate"
              ? "bg-brand dark:bg-amber-600 text-white shadow-sm"
              : "bg-mist dark:bg-[#242E3B] text-brand-light dark:text-gray-300 hover:bg-mist/80"
          }`}
        >
          Corporate
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("premium_casual")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            activeTab === "premium_casual"
              ? "bg-brand dark:bg-amber-600 text-white shadow-sm"
              : "bg-mist dark:bg-[#242E3B] text-brand-light dark:text-gray-300 hover:bg-mist/80"
          }`}
        >
          Casual & Linen
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("featured")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            activeTab === "featured"
              ? "bg-amber-600 dark:bg-amber-500 text-white dark:text-gray-950 shadow-sm"
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
          }`}
        >
          ⚡ Top Deals
        </button>
      </div>

      {/* ── 2-Column Jumia Grid ── */}
      <div className="grid grid-cols-2 gap-0.5 bg-line dark:bg-[#2C3746]">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-sm text-brand-soft dark:text-gray-400">
          No suits match this category right now.
        </div>
      )}
    </div>
  );
}
