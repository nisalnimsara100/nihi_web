import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { BottomNav, BottomNavLinks } from "@/components/shell/bottom-nav";
import { SidebarNav, SidebarNavLinks } from "@/components/shell/sidebar-nav";
import { SidebarUser } from "@/components/shell/user-menu";
import { ButtonLink } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-3 left-3 z-30 hidden w-64 flex-col rounded-[32px] bg-forest text-on-forest lg:flex">
        <div className="px-6 pt-6 pb-5">
          <Logo href="/dashboard" tone="lime" />
        </div>
        <div className="px-4">
          <ButtonLink href="/transactions/new" variant="lime" className="w-full">
            <Plus className="size-4" aria-hidden />
            New transaction
          </ButtonLink>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto px-3">
          <Suspense fallback={<SidebarNavLinks pathname="" />}>
            <SidebarNav />
          </Suspense>
        </div>
        <div className="m-3 rounded-[24px] bg-white/5 p-2">
          <Suspense fallback={<div className="h-12" />}>
            <SidebarUser />
          </Suspense>
        </div>
      </aside>

      <main className="lg:pl-[17.5rem]">
        <div className="mx-auto max-w-6xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32 sm:px-6 lg:px-8 lg:pt-10 lg:pb-12">
          {children}
        </div>
      </main>

      <Suspense fallback={<BottomNavLinks pathname="" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
