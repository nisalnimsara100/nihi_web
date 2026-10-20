"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db, run } from "@/lib/db";
import { clearViewCookie, getViewCookie, setViewCookie } from "@/lib/session";
import { fromZodError, type ActionState } from "./state";

const inviteSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
});

/** Invites an email to view your data. Inviting the same email again issues a new link. */
export async function invitePartner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { email } = parsed.data;

  const me = await run(db().from("User").select("email").eq("id", userId).single());
  if (me.email === email) {
    return { fieldErrors: { email: ["That's your own email"] } };
  }

  // A fresh token also revokes any link sent before; the partner, if accepted, keeps access.
  await run(
    db()
      .from("PartnerShare")
      .upsert({ ownerId: userId, email, token: randomBytes(24).toString("base64url") }, { onConflict: "ownerId,email" }),
  );

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Owner revokes a partner's access, or cancels a pending invite. */
export async function removeShare(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  await run(db().from("PartnerShare").delete().eq("id", id).eq("ownerId", userId));
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Partner gives up access to someone's data. */
export async function leaveShare(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const removed = await run(
    db().from("PartnerShare").delete().eq("id", id).eq("partnerId", userId).select("ownerId"),
  );
  const viewing = await getViewCookie();
  if (removed.some((share) => share.ownerId === viewing)) {
    await clearViewCookie();
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Accepts an invite link. The signed-in account must use the invited email:
 * the token proves the owner sent the link, the email proves it reached the
 * right person.
 */
export async function acceptInvite(token: string): Promise<ActionState> {
  const userId = await requireUserId();
  const [share, me] = await Promise.all([
    run(db().from("PartnerShare").select("id, ownerId, email, partnerId").eq("token", token).maybeSingle()),
    run(db().from("User").select("email").eq("id", userId).single()),
  ]);
  if (!share) {
    return { error: "This invite is no longer valid." };
  }
  if (share.ownerId === userId) {
    return { error: "This is your own invite. Send the link to your partner." };
  }
  if (share.email !== me.email) {
    return { error: `This invite is for ${share.email}. Sign in with that email to accept it.` };
  }
  if (share.partnerId && share.partnerId !== userId) {
    return { error: "This invite has already been used." };
  }

  await run(
    db()
      .from("PartnerShare")
      .update({ partnerId: userId, acceptedAt: new Date().toISOString() })
      .eq("id", share.id),
  );
  await setViewCookie(share.ownerId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Switches to viewing an owner who shared with you. */
export async function viewAs(ownerId: string): Promise<ActionState> {
  const userId = await requireUserId();
  const share = await run(
    db()
      .from("PartnerShare")
      .select("id")
      .eq("ownerId", ownerId)
      .eq("partnerId", userId)
      .not("acceptedAt", "is", null)
      .maybeSingle(),
  );
  if (!share) {
    return { error: "You no longer have access to this account." };
  }
  await setViewCookie(ownerId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Goes back to your own data. */
export async function stopViewing() {
  await requireUserId();
  await clearViewCookie();
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
