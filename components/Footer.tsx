import Link from "next/link";
import { Logo } from "@/components/Logo";
import { OCCASIONS } from "@/types";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-brand-deeper text-white">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5">
          <Logo markClassName="h-9 w-9" wordClassName="text-xl" />
          <p className="max-w-xs text-sm leading-relaxed text-white/60">
            Premium corporate and casual suits tailored for the modern gentleman.
          </p>
        </div>

        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-brand text-white/40">
            Navigate
          </p>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li>
              <Link href="/" className="inline-block py-1 transition-colors hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/shop" className="inline-block py-1 transition-colors hover:text-white">
                The Collection
              </Link>
            </li>
            <li>
              <Link href="/fit-guide" className="inline-block py-1 transition-colors hover:text-white">
                Fit &amp; Sizing Guide
              </Link>
            </li>
            <li>
              <Link href="/cart" className="inline-block py-1 transition-colors hover:text-white">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="inline-block py-1 transition-colors hover:text-white">
                Checkout
              </Link>
            </li>
            <li>
              <Link href="/account" className="inline-block py-1 transition-colors hover:text-white">
                Account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-brand text-white/40">
            Shop by Occasion
          </p>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            {OCCASIONS.map((occasion) => (
              <li key={occasion}>
                <Link
                  href={`/shop?occasion=${encodeURIComponent(occasion)}`}
                  className="inline-block py-1 transition-colors hover:text-white"
                >
                  {occasion}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-brand text-white/40">
            Concierge
          </p>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li>
              <a href="mailto:concierge@suitsmadesimple.com" className="inline-block py-1 transition-colors hover:text-white">
                concierge@suitsmadesimple.com
              </a>
            </li>
            <li>Private fittings by appointment</li>
            <li>Complimentary courier delivery</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-[0.65rem] uppercase tracking-brand text-white/40 sm:flex-row">
          <span>© {year} Suits Made Simple</span>
          <span>Lagos, Nigeria</span>
        </div>
      </div>
    </footer>
  );
}
