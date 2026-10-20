import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isBlockedDemo } from "./demo";
import { db, run } from "./db";
import { getSessionUserId, getViewCookie } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
};

/** Returns the signed-in user, or redirects to /login. Deduped per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }
  const user = await run(
    db().from("User").select("id, name, email, defaultCurrency").eq("id", userId).maybeSingle(),
  );
  // The demo account never works on the live site, even with an old session cookie.
  if (!user || isBlockedDemo(user.email)) {
    redirect("/login");
  }
  return user;
});

export type Viewer = {
  /** The signed-in user. */
  user: CurrentUser;
  /** Whose data the pages show: the user, or an owner who shared with them. */
  owner: CurrentUser;
  /** True while viewing someone else's data. Pages hide every edit control. */
  readOnly: boolean;
};

/**
 * The signed-in user plus whose data to show. A partner switches to an owner
 * with the view cookie; the share is checked on every request, so revoking
 * access takes effect at once. Deduped per request.
 *
 * Writes never use this: Server Actions scope everything to requireUserId(),
 * so a partner can't change the owner's data even with a crafted request.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const user = await getCurrentUser();
  const ownerId = await getViewCookie();
  if (!ownerId || ownerId === user.id) {
    return { user, owner: user, readOnly: false };
  }
  const share = await run(
    db()
      .from("PartnerShare")
      .select("owner:User!PartnerShare_ownerId_fkey(id, name, email, defaultCurrency)")
      .eq("ownerId", ownerId)
      .eq("partnerId", user.id)
      .not("acceptedAt", "is", null)
      .maybeSingle(),
  );
  if (!share?.owner) {
    return { user, owner: user, readOnly: false };
  }
  return { user, owner: share.owner, readOnly: true };
});

/** For create and edit pages: partners viewing someone else go back to the dashboard. */
export async function requireOwnView(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer.readOnly) {
    redirect("/dashboard");
  }
  return viewer;
}

/** For Server Actions: every action re-checks the session itself. */
export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
