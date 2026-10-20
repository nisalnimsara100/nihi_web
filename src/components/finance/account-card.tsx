import { Bank, PiggyBank, TrendUp, type AppIcon } from "@/components/icons";
import { ColorDot } from "@/components/ui";
import { getCardTheme } from "@/lib/card-themes";
import { cn } from "@/lib/cn";
import type { Enums } from "@/lib/database.types";

type AccountType = Enums<"AccountType">;

/** Ink at a given strength, for secondary text, artwork and the watermark. */
const fade = (ink: string, percent: number) => `color-mix(in oklab, ${ink} ${percent}%, transparent)`;

/**
 * The face of an account card. The theme sets the colours; the account type
 * sets the design: a chip card for credit cards, a banknote for cash, and soft
 * abstract artwork with an icon tile for bank, savings and investment accounts.
 * Shared by the Wallet page and the live preview in the account form.
 */
export function AccountCardFace({
  theme,
  type,
  name,
  balance,
  currency,
  color,
  label,
  dimmed = false,
  className,
}: {
  theme: string;
  type: AccountType;
  name: string;
  balance: string;
  currency: string;
  color: string;
  label: string;
  dimmed?: boolean;
  className?: string;
}) {
  const { background, ink } = getCardTheme(theme);
  const isCash = type === "CASH";

  return (
    <div
      className={cn(
        "relative flex aspect-[1.7/1] flex-col justify-between overflow-hidden p-5",
        // Banknotes have tighter corners than plastic cards.
        isCash ? "rounded-2xl" : "rounded-3xl",
        dimmed && "opacity-60",
        className,
      )}
      style={{ background, color: ink }}
    >
      {/* A soft diagonal sheen, like light across the surface. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent mix-blend-soft-light"
      />
      <CardArt type={type} ink={ink} currency={currency} />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-semibold" style={{ color: fade(ink, 75) }}>
            {name}
          </p>
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
            <ColorDot color={color} className="ring-2 ring-white/40" />
            {currency}
          </span>
        </div>
        <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{balance}</p>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <div className="min-w-0">
          {type === "CREDIT_CARD" ? (
            <p className="mb-1 font-mono text-xs tracking-[0.25em]" style={{ color: fade(ink, 60) }}>
              •••• •••• ••••
            </p>
          ) : type === "BANK" ? (
            <p className="mb-1 font-mono text-xs tracking-[0.2em]" style={{ color: fade(ink, 60) }}>
              A/C ••••••
            </p>
          ) : null}
          <p className="truncate text-xs font-semibold" style={{ color: fade(ink, 75) }}>
            {label}
          </p>
        </div>
        {EMBLEMS[type] ? <Emblem icon={EMBLEMS[type]} ink={ink} /> : null}
        {type === "CREDIT_CARD" ? (
          <span className="flex shrink-0 items-center gap-2">
            <Contactless ink={ink} />
            <Chip />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Background artwork behind the text, different for each account type. */
function CardArt({ type, ink, currency }: { type: AccountType; ink: string; currency: string }) {
  switch (type) {
    case "BANK":
      // Two broad curved bands sweeping up from the bottom left.
      return (
        <svg
          aria-hidden
          viewBox="0 0 340 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <path d="M0 200 C90 120 200 150 340 40 L340 200 Z" fill={fade(ink, 7)} />
          <path d="M0 200 C120 160 230 175 340 105 L340 200 Z" fill={fade(ink, 7)} />
        </svg>
      );
    case "CASH":
      return (
        <>
          {/* Engraved wave lines and an inner frame, like a printed note. */}
          <svg
            aria-hidden
            viewBox="0 0 340 200"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full"
          >
            {WAVES.map((d) => (
              <path key={d} d={d} fill="none" stroke={fade(ink, 14)} strokeWidth="1" />
            ))}
          </svg>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-2 rounded-xl border-2 border-double"
            style={{ borderColor: fade(ink, 30) }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-5 bottom-4 flex size-16 items-center justify-center rounded-full border-2 text-sm font-black tracking-tight"
            style={{ borderColor: fade(ink, 30), color: fade(ink, 40) }}
          >
            {currency}
          </span>
        </>
      );
    case "SAVINGS":
      // Nested ripples rising from the bottom-right corner.
      return (
        <svg
          aria-hidden
          viewBox="0 0 340 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full"
        >
          {[230, 170, 110].map((r) => (
            <circle key={r} cx="340" cy="200" r={r} fill={fade(ink, 6)} />
          ))}
        </svg>
      );
    case "INVESTMENT":
      // One smooth rising curve with a faint fill under it.
      return (
        <svg
          aria-hidden
          viewBox="0 0 340 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <path d={`${RISE} L340 200 L0 200 Z`} fill={fade(ink, 8)} />
          <path d={RISE} fill="none" stroke={fade(ink, 24)} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -bottom-8 text-[7rem] leading-none font-black tracking-tighter uppercase italic select-none"
          style={{ color: fade(ink, 10) }}
        >
          NiHi
        </span>
      );
  }
}

/** Account types that carry a small icon tile in the bottom-right corner. */
const EMBLEMS: Partial<Record<AccountType, AppIcon>> = {
  BANK: Bank,
  SAVINGS: PiggyBank,
  INVESTMENT: TrendUp,
};

/** A frosted tile with the account type's icon. */
function Emblem({ icon: Icon, ink }: { icon: AppIcon; ink: string }) {
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-xl backdrop-blur-sm"
      style={{ background: fade(ink, 14), boxShadow: `inset 0 0 0 1px ${fade(ink, 18)}` }}
    >
      <Icon className="size-5" />
    </span>
  );
}

/** Gold contact chip, drawn with CSS so it needs no SVG ids. */
function Chip() {
  return (
    <span
      aria-hidden
      className="relative block h-7 w-9 overflow-hidden rounded-md shadow-sm ring-1 ring-black/10"
      style={{ background: "linear-gradient(135deg, #f7e3a1, #c9a24a 55%, #ead08a)" }}
    >
      <span className="absolute inset-y-0 left-1/3 w-px bg-black/20" />
      <span className="absolute inset-y-0 right-1/3 w-px bg-black/20" />
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
      <span className="absolute inset-x-[33%] inset-y-[28%] rounded-sm border border-black/20" />
    </span>
  );
}

function Contactless({ ink }: { ink: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke={fade(ink, 70)} strokeWidth="2" strokeLinecap="round">
      <path d="M8.5 8.5a5 5 0 0 1 0 7" />
      <path d="M12 6a8.5 8.5 0 0 1 0 12" />
      <path d="M15.5 3.5a12 12 0 0 1 0 17" />
    </svg>
  );
}

/** Six sine waves across the note, computed once. */
const WAVES = Array.from({ length: 6 }, (_, row) => {
  const y = 40 + row * 24;
  const points = Array.from({ length: 35 }, (_, i) => {
    const x = i * 10;
    return `${x} ${(y + Math.sin(i / 2.2 + row) * 8).toFixed(1)}`;
  });
  return `M${points.join(" L")}`;
});

/** The investment curve: flat at first, then climbing to the top-right. */
const RISE = "M0 178 C80 176 130 150 180 128 S270 70 340 34";
