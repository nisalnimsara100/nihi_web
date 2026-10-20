import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { BottomNavLinks } from "@/components/shell/bottom-nav";
import { SidebarNav, SidebarNavLinks } from "@/components/shell/sidebar-nav";
import { SidebarUser } from "@/components/shell/user-menu";
import { AppBottomNav, NewTransactionButton, ProfileSwitcher } from "@/components/shell/viewer-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-6 pt-6 pb-5">
          <Logo href="/dashboard" />
        </div>
        <div className="px-4">
          <Suspense fallback={<div className="h-11" />}>
            <NewTransactionButton />
          </Suspense>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto px-3">
          <Suspense fallback={<SidebarNavLinks pathname="" />}>
            <SidebarNav />
          </Suspense>
        </div>
        <div className="border-t border-line p-3">
          <Suspense fallback={<div className="h-12" />}>
            <SidebarUser />
          </Suspense>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32 sm:px-6 lg:px-8 lg:pt-10 lg:pb-12">
          {children}
        </div>
      </main>
      <Suspense>
        <ProfileSwitcher />
      </Suspense>

      <Suspense fallback={<BottomNavLinks pathname="" />}>
        <AppBottomNav />
      </Suspense>
    </div>
  );
}
