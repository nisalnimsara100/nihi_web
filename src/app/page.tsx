import { ArrowLeftRight, ChartColumn, ShieldCheck, Shapes, Smartphone, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { PhoneMock } from "@/components/phone-mock";
import { ButtonLink } from "@/components/ui";

const FEATURES = [
  { icon: Wallet, title: "All your accounts", text: "Cash, bank, savings, cards and investments, each with a live balance." },
  { icon: ArrowLeftRight, title: "Fast entry", text: "Log income, expenses and transfers in a few taps, with categories and tags." },
  { icon: ChartColumn, title: "Clear statistics", text: "See where the money goes by category and how each month compares." },
  { icon: Shapes, title: "Your own categories", text: "Pick names, colors and icons that match how you think about money." },
  { icon: Smartphone, title: "Works everywhere", text: "One responsive app for phone, tablet and desktop. No install needed." },
  { icon: ShieldCheck, title: "Private by default", text: "Your data lives in your own database. Self-host it anywhere Node runs." },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm" className="hidden sm:inline-flex">
            Get started
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-2 lg:pt-12 lg:pb-24">
          <PhoneMock className="lg:order-2" />
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Manage and Organize Your Finance
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-pretty text-ink-soft lg:mx-0">
              Keep every account, expense and rupee in one place. Save more, and plan the month ahead.
            </p>
            <div className="mt-8 flex justify-center gap-1.5 lg:justify-start" aria-hidden>
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
              <span className="h-2 w-6 rounded-full bg-primary" />
              <span className="size-2 rounded-full bg-line" />
            </div>
            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 lg:mx-0">
              <ButtonLink href="/signup" size="lg">
                Get Started
              </ButtonLink>
              <ButtonLink href="/login" variant="ghost" size="lg">
                I already have an account
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="bg-muted py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Everything you need, nothing you don&apos;t</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-3xl bg-surface p-5 ring-1 ring-line/70">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-on-primary-soft">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-soft sm:px-6">NiHi · Personal finance tracker</footer>
    </div>
  );
}
