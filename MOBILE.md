# Suits Made Simple — Android app

The storefront ships as an Android app. It keeps the exact SMS theme — the same Cinzel / Inter
typography, the same `#3B4654` palette — and layers a Jumia-style mobile shopping layout on top:
a bottom tab bar, a prominent search field, a sticky add-to-cart bar, and full-bleed product
cards. The SMS tuxedo mark is both the **launcher icon** and the **splash screen**.

## Contents

1. [How it works](#how-it-works)
2. [Before you build: deploy the web changes](#before-you-build-deploy-the-web-changes)
3. [Build the APK](#build-the-apk)
4. [Regenerate the icon and splash](#regenerate-the-icon-and-splash)
5. [Video demo script](#video-demo-script)
6. [Troubleshooting](#troubleshooting)

## How it works

```
┌────────────────────────────┐        ┌──────────────────────────────┐
│  Browser (web storefront)  │        │  Android app (Capacitor)      │
│  Next.js on Vercel         │        │  native WebView → same site   │
└─────────────┬──────────────┘        └──────────────┬───────────────┘
              │           same account, same cart    │
              └──────────────────┬───────────────────┘
                                 ▼
                    Supabase Postgres + Auth
              cart_items keyed by user_id when signed in
```

The app is a thin native shell (`mobile/`) around the **live storefront**. Nothing is duplicated:
the web app remains the single source of truth, so a change deployed to Vercel is instantly in the
app. That is what makes the cross-device cart work — both clients read and write the same
`cart_items` rows.

Cart resolution in `app/api/cart/route.ts`:

| State            | Cart scope                                    |
| ---------------- | --------------------------------------------- |
| Signed out       | `sms_cart_id` cookie (guest, 60 days)         |
| Signed in        | `user_id` — every device, same account        |

When a shopper signs in, any guest lines on that device are adopted into their account (the cart
route does this on read, and `components/CartProvider.tsx` also calls `/api/auth/migrate` on
`SIGNED_IN`).

### Why email + password sign-in

Google blocks OAuth inside Android WebViews (`disallowed user agent`). `/login` therefore offers
**email + password sign-in and registration**, with Google kept for the web. This is also the more
Jumia-like pattern.

## Before you build: deploy the web changes

> **The APK loads the live URL.** The mobile features and the cart-sync fix only appear once the
> updated Next.js app is deployed to Vercel. Deploy first, then build (or rebuild) the APK.

```bash
npx vercel            # preview deployment
npx vercel --prod     # production deployment
```

Make sure the Vercel project has the same environment variables as `.env.local`
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).

The URL the app loads is set in `mobile/capacitor.config.ts`:

```ts
server: {
  url: "https://shopping-website-suits-made-simple.vercel.app/",
}
```

## Build the APK

**Prerequisites**

- Node 18+
- JDK 21 (Android Studio's bundled JBR works)
- Android SDK with build-tools 34 and platform 34 (via Android Studio)

**Build**

```bash
cd mobile
npm install

# Point Gradle at your SDK once (adjust the path to your machine):
#   mobile/android/local.properties →  sdk.dir=/path/to/Android/Sdk

export JAVA_HOME="/path/to/Android Studio/jbr"   # Windows: /c/Program Files/Android/Android Studio/jbr
npm run build:apk
```

The debug APK lands at:

```
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a device with `adb install -r <path>` (enable *Install unknown apps* if you copy the
file across manually), or upload it to Google Drive and share the link.

`npm run sync` (`cap sync android`) re-copies `mobile/www` and the Capacitor config into the
Android project after a config change — run it before rebuilding if you edited
`capacitor.config.ts`.

## Regenerate the icon and splash

The icon and splash are rendered from the same tuxedo mark used in the header, so they can never
drift from the brand. From the repository root:

```bash
node scripts/generate-app-assets.mjs      # writes mobile/resources/*.png
cd mobile && npm run assets               # generates Android mipmaps + splash drawables
```

| Source                        | Used for                          |
| ----------------------------- | --------------------------------- |
| `mobile/resources/icon-only.png` | legacy launcher icon           |
| `mobile/resources/icon-foreground.png` / `icon-background.png` | adaptive icon layers |
| `mobile/resources/splash.png` | launch splash screen              |

## Video demo script

One continuous recording. Have the Android device handy and a browser window open on the
deployed site.

| # | Where  | Do this                                                              | Should show |
|---|--------|----------------------------------------------------------------------|-------------|
| 1 | Web    | `/login` → **Register** a brand-new account (email + password) → confirm/continue | Signed in, redirected to `/account` |
| 2 | Web    | Open any suit → choose a size → **Add to cart**                       | Header cart badge increments |
| 3 | Mobile | Launch the **Suits Made Simple** app → splash with the SMS logo → sign in with the *same* account | App opens on the storefront, bottom tab bar visible |
| 4 | Mobile | Tap **Cart** in the bottom bar                                        | The web-added suit is already there — cart synced from web → mobile |
| 5 | Mobile | Open another suit → **Add to cart**                                   | Cart badge increments in the app |
| 6 | Web    | Refresh the browser → open `/cart`                                    | The mobile-added suit is there too — mobile → web sync |

Tips

- Sign in on the web **before** recording step 1 to keep the take short, or start the recording
  already on the register form.
- Give the WebView a moment on first launch (cold start loads the live site).
- Both steps 4 and 6 are the money shots — hold on the cart for a beat so the sync is obvious.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| App shows "We could not reach the store" | The live URL is unreachable, or `server.url` in `capacitor.config.ts` is wrong. Check the device's connection and redeploy. |
| Cart is empty in the app | The cart-sync fix is not deployed yet — deploy the web app, then rebuild/open the app. Confirm you are signed in to the same account on both. |
| Blank screen after sign-in | Google OAuth opened — use email + password instead (Google blocks WebView OAuth). |
| `JAVA_HOME is not set` | Export the Android Studio JBR path before `npm run build:apk` (see above). |
| `SDK location not found` | Set `sdk.dir` in `mobile/android/local.properties`. |
| Icon still the default robot | Re-run `node scripts/generate-app-assets.mjs`, then `npm run assets` in `mobile/`, then rebuild. |
