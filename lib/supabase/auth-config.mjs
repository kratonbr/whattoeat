export function getSupabaseAuthConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    const error = new Error("Supabase server environment variables are not configured.");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }

  return { supabaseUrl, publishableKey };
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
