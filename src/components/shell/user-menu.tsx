import Link from "next/link";
import { SignOut } from "@/components/icons";
import { logout } from "@/actions/auth";
import { getViewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n/server";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-on-primary-soft",
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}

export async function SidebarUser() {
  const t = await getT();
  const { user, owner, readOnly } = await getViewer();
  return (
    <div className="flex items-center gap-2">
      <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1.5 hover:bg-muted">
        <Avatar name={user.name} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-ink-soft">
            {readOnly ? `Viewing ${owner.name}` : user.email}
          </span>
        </span>
      </Link>
      <form action={logout}>
        <button
          type="submit"
          aria-label={t("Sign out")}
          className="rounded-xl p-2.5 text-ink-soft hover:bg-muted hover:text-ink"
        >
          <SignOut className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
