import { Logo } from "@/components/logo";
import { PhoneMock } from "@/components/phone-mock";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="m-3 hidden flex-col items-center justify-center gap-10 overflow-hidden rounded-[36px] bg-primary-soft p-10 lg:flex">
        <PhoneMock />
        <div className="max-w-sm text-center">
          <p className="text-3xl font-semibold tracking-tight">Manage and organize your finance</p>
          <p className="mt-3 text-ink-soft">Track every rupee across your accounts, then plan the month ahead.</p>
        </div>
      </aside>
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Logo className="mb-8 lg:hidden" />
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
