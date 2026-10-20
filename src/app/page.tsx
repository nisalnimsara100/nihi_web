import { Instrument_Serif } from "next/font/google";
import {
  ArrowUpRight,
  Banknote,
  ChartColumn,
  ChartLine,
  Check,
  ChevronDown,
  CreditCard,
  Globe,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { DashboardMock } from "@/components/landing/dashboard-mock";
import { HeroBackdrop } from "@/components/landing/hero-backdrop";
import { InView } from "@/components/landing/in-view";
import {
  AccountsVisual,
  LabelsVisual,
  SearchVisual,
  StatsVisual,
  TransferVisual,
} from "@/components/landing/feature-visuals";
import { Logo, LogoMark } from "@/components/logo";
import { PhoneMock } from "@/components/phone-mock";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";

// Italic display serif for the accent words in headings (font-serif).
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: "italic",
  subsets: ["latin"],
});

const REPO_URL = "https://github.com/nisalnimsara100/nihi_web";

const NAV = [
  { href: "#why", label: "Why NiHi" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

const ACCOUNT_KINDS = [
  { icon: Banknote, label: "Cash" },
  { icon: Landmark, label: "Bank accounts" },
  { icon: PiggyBank, label: "Savings" },
  { icon: CreditCard, label: "Credit cards" },
  { icon: ChartLine, label: "Investments" },
  { icon: Globe, label: "Any currency" },
];

const WHY = [
  {
    icon: Wallet,
    title: "Every account together",
    text: "Cash, bank, savings, cards and investments, each with its own currency and a live balance.",
    figure: "6",
    label: "account types",
  },
  {
    icon: ChartColumn,
    title: "Trends you can read",
    text: "Month and year views, a 12-month income vs expense trend, and where the money went by category.",
    figure: "12",
    label: "months at a glance",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    text: "No ads, no bank logins. Your data lives in your own database, and you can self-host it anywhere.",
    figure: "100%",
    label: "your data",
  },
];

const STEPS = [
  { title: "Create your account", text: "Sign up with an email and pick your main currency. It takes under a minute." },
  { title: "Add your accounts", text: "Cash in your wallet, your bank, savings and cards, each with a starting balance." },
  { title: "Log as you go", text: "Add expenses, income and transfers in a few taps. NiHi does the maths for you." },
];

const FAQ = [
  {
    q: "Is NiHi free?",
    a: "Yes. NiHi is open source under the MIT license. There is no paid plan and nothing is locked behind one.",
  },
  {
    q: "Where is my data stored?",
    a: "In the database of the server that runs NiHi. Self-host it and your data never leaves your machine. Passwords are hashed and sessions use a signed, httpOnly cookie.",
  },
  {
    q: "Does it connect to my bank?",
    a: "No. You add transactions yourself, which keeps your bank login out of it and makes you notice where the money goes.",
  },
  {
    q: "Can I use more than one currency?",
    a: "Yes. Each account has its own currency, and a transfer between currencies records the amount that left and the amount that arrived. Set your main currency in Settings.",
  },
  {
    q: "Can I change the categories?",
    a: "Yes. You start with a sensible set of income and expense categories, then rename them and pick your own colors and icons. Tags work across categories.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. NiHi is one responsive web app: a sidebar on desktop, and a bottom tab bar with a quick-add button on phones and tablets.",
  },
];

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { href: "#why", label: "Why NiHi" },
      { href: "#features", label: "Features" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Sign up" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: REPO_URL, label: "Source code" },
      { href: `${REPO_URL}/blob/main/LICENSE`, label: "MIT license" },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className={cn(instrument.variable, "relative min-h-dvh overflow-x-clip bg-muted")}>
      <HeroBackdrop />
      <header className="sticky top-3 z-40 px-4 pt-3 sm:px-6">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between rounded-2xl bg-surface/80 pr-2 pl-4 shadow-sm ring-1 ring-line/70 backdrop-blur-lg">
          <Logo className="[&_svg]:size-8" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ButtonLink href="/login" variant="ghost" size="sm" className="rounded-xl">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" size="sm" className="rounded-xl">
              Get started
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="relative px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-soft shadow-sm ring-1 ring-line/70">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              Free and open source personal finance
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Know where every{" "}
              <span className="font-serif font-normal tracking-normal text-primary italic">rupee</span> goes
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-ink-soft">
              NiHi keeps your cash, bank, savings and card accounts in one place, so you can log spending in seconds
              and see each month clearly.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Get started free <ArrowUpRight className="size-5" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg" className="bg-surface ring-1 ring-line">
                I already have an account
              </ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl sm:mt-20">
            <PhoneMock className="md:hidden" />
            <div className="hidden md:block">
              <DashboardMock />
              {/* Let the bottom of the dashboard melt into the page, under the phone. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-muted/0 to-muted" />
              <PhoneMock
                insights={false}
                className="absolute -right-6 -bottom-16 w-72.5 origin-bottom-right scale-[0.7] lg:-right-14"
              />
            </div>
          </div>
        </section>

        <section className="px-4 pt-10 pb-20 sm:px-6">
          <p className="text-center text-sm font-medium text-ink-soft">Track every kind of account</p>
          <ul className="mx-auto mt-5 flex max-w-5xl flex-wrap justify-center gap-x-8 gap-y-4">
            {ACCOUNT_KINDS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-lg font-semibold text-ink-faint">
                <Icon className="size-5" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section id="why" className="relative isolate scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <Glow className="top-1/3 left-1/2 h-72 w-[80%] max-w-5xl -translate-x-1/2" />
          <SectionHeading eyebrow="Why NiHi">
            Money tracking that stays <Accent>out of your way</Accent>
          </SectionHeading>
          <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
            {WHY.map(({ icon: Icon, title, text, figure, label }) => (
              <div key={title} className="reveal rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line/70">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-on-primary-soft">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-pretty text-ink-soft">{text}</p>
                <div className="mt-6 flex items-baseline gap-2 border-t border-dashed border-line pt-5">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">{figure}</span>
                  <span className="text-sm text-ink-soft">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="relative isolate scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <Glow className="top-1/4 -right-[30rem] size-[56rem]" />
          <SectionHeading
            eyebrow="Features"
            text="Small, focused tools that cover the whole picture without turning money into a chore."
          >
            Everything you need, nothing you don&apos;t
          </SectionHeading>
          <div className="mx-auto mt-12 grid max-w-6xl gap-4 lg:grid-cols-5">
            <FeatureCard
              className="lg:col-span-2"
              title="All your accounts, one balance"
              text="See your net worth across every wallet, bank and card, updated with each transaction."
            >
              <AccountsVisual />
            </FeatureCard>
            <FeatureCard
              className="lg:col-span-3"
              title="Statistics that make sense"
              text="Compare income and spending month by month, and spot the category that grew."
            >
              <StatsVisual />
            </FeatureCard>
          </div>
          <div className="mx-auto mt-4 grid max-w-6xl gap-4 md:grid-cols-3">
            <FeatureCard
              title="Transfers across currencies"
              text="Move money between accounts, even in different currencies, and keep both balances right."
            >
              <TransferVisual />
            </FeatureCard>
            <FeatureCard
              title="Your categories, your tags"
              text="Start with a sensible set, then pick names, colors and icons that match how you think."
            >
              <LabelsVisual />
            </FeatureCard>
            <FeatureCard
              title="Find any transaction"
              text="Filter by month, type, account, category, tag or note, and see the total straight away."
            >
              <SearchVisual />
            </FeatureCard>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="reveal mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-surface shadow-sm ring-1 ring-line/70 lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <Eyebrow>Dashboard</Eyebrow>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                The whole month on <Accent>one screen</Accent>
              </h2>
              <p className="mt-4 text-pretty text-ink-soft">
                Open NiHi and you see what matters first: what you have, what came in, what went out, and where it went.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Net worth across every account",
                  "Income, spending and savings this month",
                  "Top categories and recent activity",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/signup" className="mt-8">
                Try the dashboard <ArrowUpRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
            <div className="relative h-80 bg-primary-soft/40 sm:h-96 lg:h-auto">
              <DashboardMock className="absolute top-10 left-8 w-[46rem] lg:top-14" />
            </div>
          </div>
        </section>

        <section id="how" className="relative isolate scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <Glow className="-top-1/2 -left-[36rem] size-[64rem]" />
          <SectionHeading eyebrow="How it works">
            Up and running in <Accent>three steps</Accent>
          </SectionHeading>
          <ol className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
            {STEPS.map(({ title, text }, i) => (
              <li key={title} className="reveal rounded-3xl bg-primary-soft pb-2">
                <div className="h-full rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line/70">
                  <span className="text-4xl font-semibold tracking-tight text-primary tabular-nums">0{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-pretty text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="faq" className="relative isolate scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <Glow className="top-1/4 left-1/2 h-72 w-[70%] max-w-4xl -translate-x-1/2" />
          <SectionHeading eyebrow="FAQ" text="Everything you might want to know before you start.">
            Frequently asked questions
          </SectionHeading>
          <div className="mx-auto mt-10 max-w-2xl space-y-2.5">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-2xl bg-surface ring-1 ring-line/70 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown
                    className="size-4 shrink-0 text-ink-soft transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="px-5 pb-5 text-sm text-pretty text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-linear-to-br from-primary-soft via-surface to-primary-soft px-6 py-16 text-center ring-1 ring-primary-soft sm:py-20">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Take back <Accent>control</Accent> of your money
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-ink-soft">
              Start tracking today. It&apos;s free, and there&apos;s no card to enter.
            </p>
            <ButtonLink href="/signup" size="lg" className="mt-8">
              Get started free <ArrowUpRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="px-4 pt-8 pb-6 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-surface p-8 shadow-sm ring-1 ring-line/70 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <LogoMark className="size-14" />
              <p className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Your money, <Accent>organized</Accent>
              </p>
            </div>
            <ButtonLink href="/signup">
              Create your free account <ArrowUpRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-8 border-t border-line pt-8 sm:grid-cols-4">
            <div className="col-span-2 text-sm text-ink-soft sm:col-span-1">
              <p className="font-semibold text-ink">NiHi</p>
              <p className="mt-2">A simple personal finance tracker. MIT licensed.</p>
            </div>
            {FOOTER_LINKS.map(({ title, links }) => (
              <div key={title}>
                <p className="text-sm font-semibold">{title}</p>
                <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                  {links.map(({ href, label }) => (
                    <li key={label}>
                      <Link href={href} className="transition-colors hover:text-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Big blurred indigo glow behind a section, like light through frosted glass. */
function Glow({ className }: { className: string }) {
  return <div aria-hidden className={cn("bg-glow pointer-events-none absolute -z-10 rounded-full blur-[120px]", className)} />;
}

function Accent({ children }: { children: React.ReactNode }) {
  return <span className="font-serif font-normal tracking-normal text-primary italic">{children}</span>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-surface px-3 py-1 text-xs font-semibold text-on-primary-soft ring-1 ring-primary-soft-strong">
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, text, children }: { eyebrow: string; text?: string; children: React.ReactNode }) {
  return (
    <div className="reveal mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{children}</h2>
      {text && <p className="mt-4 text-pretty text-ink-soft">{text}</p>}
    </div>
  );
}

function FeatureCard({
  title,
  text,
  className,
  children,
}: {
  title: string;
  text: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <InView
      className={cn(
        "reveal flex flex-col rounded-3xl bg-primary-soft/40 p-6 ring-1 ring-primary-soft transition duration-300",
        "motion-safe:hover:-translate-y-1 hover:bg-primary-soft/55 hover:shadow-xl hover:shadow-primary/10",
        className,
      )}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-pretty text-ink-soft">{text}</p>
      <div className="mt-6 flex flex-1 flex-col justify-center">{children}</div>
    </InView>
  );
}
