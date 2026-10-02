import { Suspense } from "react";
import { LoginClient } from "@/components/LoginClient";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="shell py-24 text-center text-sm text-brand-soft">Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}
