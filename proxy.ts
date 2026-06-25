import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase();
}

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isForbiddenPage = request.nextUrl.pathname === "/admin/forbidden";
  const adminEmail = getAdminEmail();
  const userEmail = user?.email?.trim().toLowerCase() ?? null;
  const isAdmin = Boolean(adminEmail && userEmail === adminEmail);

  if (!user && !isLoginPage) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && !isAdmin && !isForbiddenPage) {
    return NextResponse.redirect(new URL("/admin/forbidden", request.url));
  }

  if (user && isAdmin && isLoginPage) {
    return NextResponse.redirect(new URL("/admin/events", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
