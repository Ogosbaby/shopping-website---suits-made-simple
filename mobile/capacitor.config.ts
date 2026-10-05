import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Suits Made Simple — Android shell.
 *
 * The storefront stays the single source of truth (Next.js + Supabase on
 * Vercel); the app loads it in a native WebView so the web and mobile clients
 * share one database, one cart and one account.
 */
const config: CapacitorConfig = {
  appId: "com.suitsmadesimple.app",
  appName: "Suits Made Simple",
  webDir: "www",
  server: {
    androidScheme: "https",
    // The storefront, auth provider, and Paystack checkout all open inside
    // the WebView rather than launching an external browser.  The splash
    // screen (www/index.html) handles the initial redirect to the live URL.
    allowNavigation: [
      "shopping-website-suits-made-simple.vercel.app",
      "*.supabase.co",
      "*.paystack.co",
      "checkout.paystack.com",
      "accounts.google.com",
    ],
  },
  android: {
    backgroundColor: "#212832",
    allowMixedContent: false,
  },
};

export default config;
