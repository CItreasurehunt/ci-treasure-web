import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/admin/events";
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
