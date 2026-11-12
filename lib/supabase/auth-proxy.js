import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getAuthCookieOptions, getSupabaseAuthConfig } from "./auth-config.mjs";

export async function refreshSupabaseAuthSession(request) {
  let response = NextResponse.next({ request });

  try {
    const { supabaseUrl, publishableKey } = getSupabaseAuthConfig();
    const supabase = createServerClient(supabaseUrl, publishableKey, {
      cookieOptions: getAuthCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              ...getAuthCookieOptions(),
            });
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    });

    // Refresh tokens when needed. Authorization is always checked again in the
    // protected server layout or Route Handler, never inferred from Proxy.
    await supabase.auth.getClaims();
  } catch {
    // Missing local configuration should not break public pages or the login UI.
  }

  return response;
}
