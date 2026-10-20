"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db, run } from "@/lib/db";
import { flash } from "@/lib/flash";
import { mailConfigured, sendMail } from "@/lib/mail";
import { getOrigin } from "@/lib/site";
import { clearViewCookie, getViewCookie, setViewCookie } from "@/lib/session";
import { fromZodError, type ActionState } from "./state";

const inviteSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
});

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Emails the invite link. Returns an error message when it could not be sent, otherwise null. */
async function emailInvite(ownerName: string, to: string, token: string): Promise<string | null> {
  if (!mailConfigured()) return "Email sending isn't set up on this site yet.";
  const link = `${await getOrigin()}/invite/${token}`;
  const subject = `${ownerName} invited you to view their finances on NiHi`;
  const text = [
    `Hi,`,
    ``,
    `${ownerName} invited you to view their finances on NiHi. You can look at everything but change nothing.`,
    ``,
    `Open this link, sign in (or create an account) with this email address (${to}), then confirm to connect:`,
    link,
    ``,
    `If you weren't expecting this, you can ignore the email.`,
  ].join("\n");
  const html = `<p>Hi,</p><p><b>${escapeHtml(ownerName)}</b> invited you to view their finances on NiHi. You can look at everything but change nothing.</p><p>Tap the button, sign in (or create an account) with this email address (${escapeHtml(to)}), then confirm to connect.</p><p><a href="${link}" style="display:inline-block;background:#4744f7;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:14px">Connect with ${escapeHtml(ownerName)}</a></p><p style="color:#6e6e73;font-size:13px">Or paste this link into your browser: ${link}</p><p style="color:#6e6e73">If you weren't expecting this, you can ignore the email.</p>`;
  try {
    await sendMail({ to, subject, text, html });
    return null;
  } catch (error) {
    console.error("Invite email failed:", error);
    return "The email couldn't be sent.";
  }
}

/** Invites an email to view your data. Inviting the same email again issues a new link. */
export async function invitePartner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { email } = parsed.data;

  const me = await run(db().from("User").select("email, name").eq("id", userId).single());
  if (me.email === email) {
    return { fieldErrors: { email: ["That's your own email"] } };
  }

  // A fresh token also revokes any link sent before; the partner, if accepted, keeps access.
  const token = randomBytes(24).toString("base64url");
  await run(db().from("PartnerShare").upsert({ ownerId: userId, email, token }, { onConflict: "ownerId,email" }));

  const failure = await emailInvite(me.name, email, token);
  revalidatePath("/", "layout");
  return failure
    ? { ok: true, message: "Invite created", detail: `${failure} Use "Send via Gmail" or copy the link and send it to ${email}.` }
    : { ok: true, message: "Invite sent", detail: `We emailed ${email}. They sign in with that email to accept.` };
}

/** Emails a pending invite again, with the same link. */
export async function resendInvite(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const [share, me] = await Promise.all([
    run(db().from("PartnerShare").select("email, token, acceptedAt").eq("id", id).eq("ownerId", userId).maybeSingle()),
    run(db().from("User").select("name").eq("id", userId).single()),
  ]);
  if (!share || share.acceptedAt) {
    return { error: "This invite is no longer pending." };
  }
  const failure = await emailInvite(me.name, share.email, share.token);
  return failure ? { error: failure } : { ok: true, message: "Invite sent again", detail: share.email };
}

/** Owner revokes a partner's access, or cancels a pending invite. */
export async function removeShare(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const removed = await run(
    db().from("PartnerShare").delete().eq("id", id).eq("ownerId", userId).select("email, acceptedAt"),
  );
  revalidatePath("/", "layout");
  const [share] = removed;
  return {
    ok: true,
    message: share?.acceptedAt ? "Access removed" : "Invite cancelled",
    detail: share?.email,
  };
}

/** Partner gives up access to someone's data. */
export async function leaveShare(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const removed = await run(
    db()
      .from("PartnerShare")
      .delete()
      .eq("id", id)
      .eq("partnerId", userId)
      .select("ownerId, owner:User!PartnerShare_ownerId_fkey(name)"),
  );
  const viewing = await getViewCookie();
  if (removed.some((share) => share.ownerId === viewing)) {
    await clearViewCookie();
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "You left the account", detail: removed[0]?.owner?.name };
}

/**
 * Accepts an invite link. The signed-in account must use the invited email:
 * the token proves the owner sent the link, the email proves it reached the
 * right person.
 */
export async function acceptInvite(token: string): Promise<ActionState> {
  const userId = await requireUserId();
  const [share, me] = await Promise.all([
    run(
      db()
        .from("PartnerShare")
        .select("id, ownerId, email, partnerId, owner:User!PartnerShare_ownerId_fkey(name)")
        .eq("token", token)
        .maybeSingle(),
    ),
    run(db().from("User").select("email").eq("id", userId).single()),
  ]);
  // Failures can't go back to a form, so they toast on the invite page.
  const fail = async (title: string, description?: string): Promise<never> => {
    await flash({ type: "error", title, description });
    redirect(`/invite/${token}`);
  };
  if (!share) {
    return fail("This invite is no longer valid");
  }
  if (share.ownerId === userId) {
    return fail("This is your own invite", "Send the link to your partner.");
  }
  if (share.email !== me.email) {
    return fail("This invite is for another email", `Sign in as ${share.email} to accept it.`);
  }
  if (share.partnerId && share.partnerId !== userId) {
    return fail("This invite has already been used");
  }

  await run(
    db()
      .from("PartnerShare")
      .update({ partnerId: userId, acceptedAt: new Date().toISOString() })
      .eq("id", share.id),
  );
  await setViewCookie(share.ownerId);
  await flash({
    type: "success",
    title: "You're connected",
    description: `You can now view ${share.owner?.name ?? "their"} finances. Switch any time from the bar at the top.`,
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Switches to viewing an owner who shared with you. */
export async function viewAs(ownerId: string): Promise<ActionState> {
  const userId = await requireUserId();
  const share = await run(
    db()
      .from("PartnerShare")
      .select("id, owner:User!PartnerShare_ownerId_fkey(name)")
      .eq("ownerId", ownerId)
      .eq("partnerId", userId)
      .not("acceptedAt", "is", null)
      .maybeSingle(),
  );
  if (!share) {
    await flash({ type: "error", title: "No access", description: "You no longer have access to this account." });
    redirect("/dashboard");
  }
  await setViewCookie(ownerId);
  await flash({
    type: "info",
    title: `Viewing ${share.owner?.name ?? "their"} finances`,
    description: "Read-only: nothing here can be changed.",
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Goes back to your own data. */
export async function stopViewing() {
  await requireUserId();
  await clearViewCookie();
  await flash({ type: "success", title: "Back to your account" });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
