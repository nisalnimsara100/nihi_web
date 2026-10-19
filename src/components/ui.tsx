import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

type Variant = "primary" | "lime" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-on-forest hover:bg-forest-soft",
  lime: "bg-lime text-on-lime hover:bg-lime-strong",
  secondary: "bg-muted text-ink hover:bg-line",
  ghost: "text-ink-soft hover:bg-muted hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-14 px-7 text-base gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
    "disabled:pointer-events-none disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/** Round icon button, like the + and back buttons in the screen headers. */
export function IconLink({
  label,
  tone = "outline",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { label: string; tone?: "outline" | "forest" | "lime" }) {
  return (
    <Link
      aria-label={label}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
        tone === "outline" && "border border-line bg-surface text-ink hover:bg-muted",
        tone === "forest" && "bg-forest text-on-forest hover:bg-forest-soft",
        tone === "lime" && "bg-lime text-on-lime hover:bg-lime-strong",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export const inputClass = cn(
  "block w-full rounded-2xl border border-transparent bg-muted px-4 h-12 text-base sm:text-sm text-ink",
  "placeholder:text-ink-faint focus:border-forest focus:bg-surface focus:outline-none focus:ring-4 focus:ring-lime/40",
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20",
);

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error?.length ? (
        <p className="text-sm text-danger">{error[0]}</p>
      ) : hint ? (
        <p className="text-sm text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[28px] bg-surface shadow-[0_1px_3px_rgb(19_42_5/0.06)] ring-1 ring-line/60", className)}
      {...props}
    />
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function SeeAll({ href, children = "See All" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-bold text-ink hover:underline">
      {children}
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <IconLink href={backHref} label="Back" tone="forest" className="size-9">
            <ChevronLeft className="size-5" aria-hidden />
          </IconLink>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description ? <p className="mt-0.5 text-sm text-ink-soft">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-medium",
        tone === "error" ? "bg-danger-soft text-danger" : "bg-lime-pale text-ink",
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-forest text-lime">{icon}</div>
      ) : null}
      <p className="text-lg font-bold">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ColorDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

/** Amount with sign and tone: income green, expense ink with a minus, transfer muted. */
export function Amount({
  minor,
  currency,
  kind,
  className,
}: {
  minor: number;
  currency: string;
  kind?: "INCOME" | "EXPENSE" | "TRANSFER";
  className?: string;
}) {
  const signed = kind === "EXPENSE" ? -Math.abs(minor) : kind === "INCOME" ? Math.abs(minor) : minor;
  return (
    <span
      className={cn(
        "font-bold whitespace-nowrap tabular-nums",
        kind === "INCOME" && "text-income",
        kind === "TRANSFER" && "text-ink-soft",
        className,
      )}
    >
      {formatMoney(signed, currency, { signed: kind === "INCOME" || kind === "EXPENSE" })}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-3xl bg-line/60", className)} />;
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-2 h-8 w-48 rounded-full" />
      <Skeleton className="mb-6 h-4 w-72 max-w-full rounded-full" />
      <Skeleton className="h-44" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-72" />
    </div>
  );
}
