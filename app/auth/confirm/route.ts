import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Only allow site-relative redirect targets (a single leading slash, not "//host").
// Fallback is the organizer dashboard — the general case. Admin login passes an
// explicit next=/admin/events; if that's ever dropped, /dashboard is a safe landing
// (it has an Admin link) rather than a forbidden dead-end for non-admins.
function safeNext(value: string | null) {
  return value && /^\/(?!\/)/.test(value) ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = safeNext(requestUrl.searchParams.get("next"));
  const redirectTo = new URL(next, request.url);

  const response = NextResponse.redirect(redirectTo);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const code = requestUrl.searchParams.get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return response;
  }

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    return response;
  }

  const fallback = new URL("/admin/login", request.url);
  fallback.searchParams.set("error", "Magic link confirmation failed.");
  return NextResponse.redirect(fallback);
}
