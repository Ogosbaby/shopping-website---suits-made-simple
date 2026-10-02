import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center py-24 text-center sm:py-32">
      <LogoMark className="h-12 w-12 text-brand" />
      <p className="label-caps mt-8">404</p>
      <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">This page is not in the collection.</h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-brand-light">
        The page you are looking for may have been moved or is no longer available.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/shop" className="btn-primary">
          Browse the collection
        </Link>
        <Link href="/" className="btn-outline">
          Return home
        </Link>
      </div>
    </div>
  );
}
