import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

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
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-bold text-on-lime",
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}

export async function SidebarUser() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-2">
      <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-3 rounded-full p-1 hover:bg-white/10">
        <Avatar name={user.name} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-on-forest/60">{user.email}</span>
        </span>
      </Link>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Sign out"
          className="rounded-full p-2.5 text-on-forest/70 hover:bg-white/10 hover:text-on-forest"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
