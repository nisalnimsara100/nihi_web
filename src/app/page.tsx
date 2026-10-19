import { ArrowLeftRight, ChartColumn, ShieldCheck, Smartphone, Tags, Wallet } from "lucide-react";
import { HeroArt } from "@/components/hero-art";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";

const FEATURES = [
  { icon: Wallet, title: "All your accounts", text: "Cash, bank, savings, credit cards and investments, each with a live balance." },
  { icon: ArrowLeftRight, title: "Fast entry", text: "Log income, expenses and transfers in a few taps, with categories and tags." },
  { icon: ChartColumn, title: "Clear statistics", text: "See where the money goes by category and how each month compares." },
  { icon: Tags, title: "Your own labels", text: "Make categories and tags that match how you think about money." },
  { icon: Smartphone, title: "Works everywhere", text: "One responsive app for phone, tablet and desktop. No install needed." },
  { icon: ShieldCheck, title: "Private by default", text: "Your data lives in your own database. Self-host it anywhere Node runs." },
];

const PREVIEW_ROWS = [
  { name: "Groceries", meta: "Today · Wallet", amount: "-Rs. 4,280.00", initial: "G" },
  { name: "Salary", meta: "Yesterday · Main bank", amount: "+Rs. 250,000.00", initial: "S", income: true },
  { name: "Transport", meta: "Oct 18 · Credit card", amount: "-Rs. 850.00", initial: "T" },
];

const headline = "font-display font-black uppercase leading-[0.92] tracking-tight font-stretch-condensed";

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Get started
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-2 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pt-10 lg:pb-24">
          <HeroArt className="max-w-75 lg:order-2 lg:max-w-md" />
          <div className="text-center lg:text-left">
            <h1 className={`${headline} text-5xl text-headline sm:text-6xl lg:text-7xl`}>
              Experience the new way to track money
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg text-pretty text-ink-soft lg:mx-0">
              NiHi keeps your accounts, spending and income in one calm place. See your month at a glance and plan the
              next one.
            </p>
            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 lg:mx-0">
              <ButtonLink href="/signup" size="lg" className="tracking-wide uppercase">
                Create account
              </ButtonLink>
              <ButtonLink href="/login" variant="lime" size="lg" className="tracking-wide uppercase">
                Log in
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="bg-forest py-16 text-on-forest sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className={`${headline} text-4xl text-lime sm:text-5xl`}>Your money, one glance</h2>
              <p className="mt-4 max-w-md text-on-forest/75">
                Total balance up top, quick actions underneath, and every transaction in a clean list. Built for the phone
                in your hand and the screen on your desk.
              </p>
            </div>

            <div className="mx-auto w-full max-w-sm rounded-[36px] bg-surface p-4 text-ink shadow-2xl" aria-label="Preview of the NiHi home screen">
              <div className="rounded-[26px] bg-lime p-5 text-on-lime">
                <p className="text-sm font-semibold">Total Balance</p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums">Rs. 1,250,800.50</p>
                <p className="mt-6 text-xs font-medium text-on-lime/75">4 accounts</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["Expense", "Income", "Transfer"].map((label) => (
                  <span key={label} className="rounded-full bg-forest py-2.5 text-center text-xs font-semibold text-on-forest">
                    {label}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {PREVIEW_ROWS.map((row) => (
                  <li key={row.name} className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-2.5">
                    <span className="flex size-10 items-center justify-center rounded-full bg-forest font-bold text-lime" aria-hidden>
                      {row.initial}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{row.name}</span>
                      <span className="block text-xs text-ink-soft">{row.meta}</span>
                    </span>
                    <span className={row.income ? "text-sm font-bold text-income tabular-nums" : "text-sm font-bold tabular-nums"}>
                      {row.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className={`${headline} text-4xl text-headline sm:text-5xl`}>Everything you need</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[28px] bg-surface p-5 ring-1 ring-line/60">
                  <span className="flex size-11 items-center justify-center rounded-full bg-forest text-lime">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-ink-soft sm:px-6">NiHi · Personal finance tracker</footer>
    </div>
  );
}
