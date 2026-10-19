import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSessionUserId } from "./session";

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
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, defaultCurrency: true },
  });
  if (!user) {
    redirect("/login");
  }
  return user;
});

/** For Server Actions: every action re-checks the session itself. */
export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
