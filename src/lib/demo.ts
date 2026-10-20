/**
 * The sample account that `npm run db:seed` creates. It exists for local
 * development only: local and production share one database, so production
 * refuses this email at sign-in instead of relying on the row being absent.
 */
export const DEMO_EMAIL = "demo@nihi.app";

/** True when this email must not be used on the live site. */
export function isBlockedDemo(email: string): boolean {
  return process.env.VERCEL_ENV === "production" && email.trim().toLowerCase() === DEMO_EMAIL;
}
