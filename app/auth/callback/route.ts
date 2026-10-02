import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Google OAuth redirect target. Supabase hands back a `code`, which is
 * exchanged here for a session stored in cookies.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const redirectTo = next.startsWith("/") ? next : "/account";
  const response = NextResponse.redirect(`${origin}${redirectTo}`);

  const cookieStore = cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return response;
}
