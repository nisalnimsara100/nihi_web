import { HeroArt } from "@/components/hero-art";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="m-3 hidden flex-col justify-between rounded-[36px] bg-lime p-10 text-on-lime lg:flex">
        <Logo />
        <HeroArt className="max-w-md" />
        <p className="font-display text-6xl leading-[0.92] font-black tracking-tight uppercase font-stretch-condensed">
          Take control of every rupee
        </p>
      </aside>
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Logo className="mb-8 lg:hidden" />
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
