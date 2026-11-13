import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { io } from "next/cache";
import { getAuthCookieOptions } from "@/lib/supabase/auth-config.mjs";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { isAdminUser } from "../../domain/access.mjs";

export const ADMIN_RECOVERY_COOKIE = "wte_admin_recovery";
const RECOVERY_WINDOW_SECONDS = 15 * 60;

function isTemporaryAuthFailure(error) {
  return Boolean(error && (error.name === "AuthRetryableFetchError" || error.status === 0 || error.status >= 500));
}

function getRecoverySecret() {
  const secret = process.env.ADMIN_RECOVERY_COOKIE_SECRET;
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) return null;
  return secret;
}

function getSessionId(accessToken) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

function signatureFor(encodedPayload, secret) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createRecoveryCapability({ userId, sessionId }) {
  const secret = getRecoverySecret();
  if (!secret || !userId || !sessionId) return null;

  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    sid: sessionId,
    exp: Math.floor(Date.now() / 1000) + RECOVERY_WINDOW_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  })).toString("base64url");

  return `${payload}.${signatureFor(payload, secret)}`;
}

function isRecoveryCapabilityValid(value, { userId, sessionId }) {
  const secret = getRecoverySecret();
  if (!secret || typeof value !== "string") return false;
  const [encodedPayload, suppliedSignature, extra] = value.split(".");
  if (!encodedPayload || !suppliedSignature || extra !== undefined) return false;

  const expectedSignature = Buffer.from(signatureFor(encodedPayload, secret));
  const actualSignature = Buffer.from(suppliedSignature);
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return payload.sub === userId
      && payload.sid === sessionId
      && Number.isInteger(payload.exp)
      && payload.exp > Math.floor(Date.now() / 1000)
      && typeof payload.nonce === "string";
  } catch {
    return false;
  }
}

export function setRecoveryCapabilityCookie(cookieStore, value) {
  cookieStore.set(ADMIN_RECOVERY_COOKIE, value, {
    ...getAuthCookieOptions(),
    maxAge: RECOVERY_WINDOW_SECONDS,
  });
}

export async function clearRecoveryCapabilityCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_RECOVERY_COOKIE, "", {
    ...getAuthCookieOptions(),
    maxAge: 0,
  });
}

export async function requireAdminRecoverySession() {
  let supabase;
  try {
    await io();
    supabase = await createSupabaseAuthServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      const failure = new Error("RECOVERY_SESSION_UNAVAILABLE");
      failure.status = isTemporaryAuthFailure(userError) ? 503 : 401;
      throw failure;
    }

    const user = userData?.user;
    if (!user) {
      const failure = new Error("RECOVERY_SESSION_REQUIRED");
      failure.status = 401;
      throw failure;
    }
    if (!isAdminUser(user)) {
      const failure = new Error("ADMIN_ACCESS_REQUIRED");
      failure.status = 403;
      throw failure;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (sessionError && isTemporaryAuthFailure(sessionError)) {
      const failure = new Error("RECOVERY_SESSION_UNAVAILABLE");
      failure.status = 503;
      throw failure;
    }
    if (sessionError || !session || session.user?.id !== user.id) {
      const failure = new Error("RECOVERY_SESSION_REQUIRED");
      failure.status = 401;
      throw failure;
    }

    const sessionId = getSessionId(session.access_token);
    const cookieStore = await cookies();
    const capability = cookieStore.get(ADMIN_RECOVERY_COOKIE)?.value;
    if (!sessionId || !isRecoveryCapabilityValid(capability, { userId: user.id, sessionId })) {
      const failure = new Error("RECOVERY_SESSION_REQUIRED");
      failure.status = 401;
      throw failure;
    }

    return user;
  } catch (error) {
    if ([401, 403, 503].includes(error?.status)) throw error;
    const failure = new Error("RECOVERY_SESSION_UNAVAILABLE");
    failure.status = 503;
    throw failure;
  }
}

export function createRecoveryCapabilityForSession({ user, accessToken }) {
  if (!isAdminUser(user)) return null;
  const sessionId = getSessionId(accessToken);
  return sessionId ? createRecoveryCapability({ userId: user.id, sessionId }) : null;
}

export async function readRecoveryCookieStore() {
  return cookies();
}
