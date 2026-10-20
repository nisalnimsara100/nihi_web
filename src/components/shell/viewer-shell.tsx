import { stopViewing, viewAs } from "@/actions/sharing";
import { Plus } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { db, run } from "@/lib/db";
import { BottomNav } from "./bottom-nav";
import { ProfileDock } from "./profile-dock";
import { getT } from "@/lib/i18n/server";

// App shell pieces that depend on whose data is on screen. They are async server
// components, so the layout wraps each one in <Suspense>.

/** The "New transaction" button. Partners viewing someone else can't add anything. */
export async function NewTransactionButton() {
  const t = await getT();
  const { readOnly } = await getViewer();
  if (readOnly) return null;
  return (
    <ButtonLink href="/transactions/new" className="w-full">
      <Plus className="size-4" aria-hidden />
      {t("New transaction")}
    </ButtonLink>
  );
}

export async function AppBottomNav() {
  const { readOnly } = await getViewer();
  return <BottomNav readOnly={readOnly} />;
}

/**
 * Profile switcher, once someone has shared their finances with you: a floating pill above the
 * bottom menu that opens a sheet to switch between your account and the shared ones. It takes no
 * room in the page layout; see ProfileDock.
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

  return (
    <ProfileDock
      me={{ id: user.id, name: user.name }}
      shared={shares.map((s) => ({ id: s.ownerId, name: s.owner?.name ?? "Partner" }))}
      viewingId={readOnly ? owner.id : null}
      switchTo={switchTo}
    />
  );
}
