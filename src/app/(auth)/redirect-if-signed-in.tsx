import { redirect } from "next/navigation";
import { db, run } from "@/lib/db";
import { safeNext } from "@/lib/next-path";
import { getSessionUserId } from "@/lib/session";

/** Sends visitors who already have a valid session straight to the dashboard. */
export async function RedirectIfSignedIn({ next }: { next?: string }) {
  const userId = await getSessionUserId();
  // Check the user still exists, or a stale cookie would bounce between /login and /dashboard.
  if (userId && (await run(db().from("User").select("id").eq("id", userId).maybeSingle()))) {
    redirect(safeNext(next));
  }
  return null;
}
