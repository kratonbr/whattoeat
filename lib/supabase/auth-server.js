import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthCookieOptions, getSupabaseAuthConfig } from "./auth-config.mjs";

export async function createSupabaseAuthServerClient() {
  const { supabaseUrl, publishableKey } = getSupabaseAuthConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, publishableKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...getAuthCookieOptions(),
            });
          });
        } catch {
          // Server Components can read cookies but cannot mutate the response.
          // Proxy refreshes sessions before protected pages render.
        }
      },
    },
  });
}
