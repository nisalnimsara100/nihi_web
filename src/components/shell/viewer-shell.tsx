import { stopViewing, viewAs } from "@/actions/sharing";
import { Plus } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { db, run } from "@/lib/db";
import { BottomNav } from "./bottom-nav";

// App shell pieces that depend on whose data is on screen. They are async server
// components, so the layout wraps each one in <Suspense>.

/** The "New transaction" button. Partners viewing someone else can't add anything. */
export async function NewTransactionButton() {
  const { readOnly } = await getViewer();
  if (readOnly) return null;
  return (
    <ButtonLink href="/transactions/new" className="w-full">
      <Plus className="size-4" aria-hidden />
      New transaction
    </ButtonLink>
  );
}

export async function AppBottomNav() {
  const { readOnly } = await getViewer();
  return <BottomNav readOnly={readOnly} />;
}

/**
 * Profile switcher at the top of every page, once someone has shared their
 * finances with you: "My account" plus one chip per owner. While viewing an
 * owner it also says the view is read-only.
 */
export async function ProfileSwitcher() {
  const { user, owner, readOnly } = await getViewer();
  const shares = await run(
    db()
      .from("PartnerShare")
      .select("ownerId, owner:User!PartnerShare_ownerId_fkey(name)")
      .eq("partnerId", user.id)
      .not("acceptedAt", "is", null)
      .order("acceptedAt"),
  );
  if (shares.length === 0 && !readOnly) return null;

  async function switchTo(formData: FormData) {
    "use server";
    const ownerId = String(formData.get("ownerId") ?? "");
    if (ownerId === "me") await stopViewing();
    else await viewAs(ownerId);
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors",
      active ? "bg-primary text-on-primary" : "text-on-primary-soft hover:bg-surface/70",
    );

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-primary-soft px-3 py-2.5">
      <form action={switchTo} className="flex flex-wrap items-center gap-1" aria-label="Switch profile">
        <button type="submit" name="ownerId" value="me" aria-pressed={!readOnly} className={chip(!readOnly)}>
          My account
        </button>
        {shares.map((share) => (
          <button
            key={share.ownerId}
            type="submit"
            name="ownerId"
            value={share.ownerId}
            aria-pressed={readOnly && owner.id === share.ownerId}
            className={chip(readOnly && owner.id === share.ownerId)}
          >
            {share.owner?.name ?? "Partner"}
          </button>
        ))}
      </form>
      {readOnly ? (
        <p role="status" className="text-sm text-on-primary-soft">
          Viewing <span className="font-semibold">{owner.name}</span>&apos;s finances · read-only
        </p>
      ) : null}
    </div>
  );
}
