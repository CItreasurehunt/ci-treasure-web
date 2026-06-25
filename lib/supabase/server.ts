import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Server Components may not allow setting cookies directly.
            }
          },
        },
      }
    )
  } catch {
    // If cookies are unavailable (e.g. during static generation), return a static client
    const { createClient: createStaticClient } = await import('./static')
    return createStaticClient()
  }
}
