import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "nihi_session";
// The owner a partner is currently viewing. It only names the owner: every
// request checks the PartnerShare row again, see getViewer in auth.ts.
const VIEW_COOKIE_NAME = "nihi_view";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  // A new sign-in starts on the user's own account, not whoever the last user was viewing.
  (await cookies()).delete(VIEW_COOKIE_NAME);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.delete(VIEW_COOKIE_NAME);
}

/** Sets the owner a partner is viewing. */
export async function setViewCookie(ownerId: string) {
  (await cookies()).set(VIEW_COOKIE_NAME, ownerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getViewCookie(): Promise<string | null> {
  return (await cookies()).get(VIEW_COOKIE_NAME)?.value ?? null;
}

export async function clearViewCookie() {
  (await cookies()).delete(VIEW_COOKIE_NAME);
}
