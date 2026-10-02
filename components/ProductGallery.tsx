"use client";

import { useState } from "react";

const VIEW_LABELS = ["Portrait", "Alternate", "Lifestyle", "Fabric"];

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});

  const gallery = images.length > 0 ? images : [];
  if (gallery.length === 0) {
    return <div className="aspect-[4/5] bg-mist" />;
  }

  return (
    <div>
      <div className="aspect-[4/5] overflow-hidden bg-mist">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gallery[active]}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setBroken((prev) => ({ ...prev, [active]: true }))}
        />
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-4 gap-px border-t border-line bg-line">
          {gallery.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View ${VIEW_LABELS[index] ?? `image ${index + 1}`}`}
              aria-current={index === active}
              className={`group relative aspect-square overflow-hidden bg-mist transition-opacity ${
                index === active ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
            >
              {broken[index] ? (
                <span className="flex h-full w-full items-center justify-center text-[0.6rem] uppercase tracking-brand text-brand-soft">
                  n/a
                </span>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => setBroken((prev) => ({ ...prev, [index]: true }))}
                />
              )}
              {index === active ? (
                <span className="absolute inset-0 ring-1 ring-inset ring-brand" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
