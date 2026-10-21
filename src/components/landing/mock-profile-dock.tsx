import { ArrowsLeftRight, Check, Eye } from "@/components/icons";
import { cn } from "@/lib/cn";

type Size = "sm" | "md";

const SIZES = {
  sm: { bubble: "size-7", face: "size-6 text-[8px]", badge: "size-3.5", badgeIcon: "size-2", row: "py-0.5 pr-2.5 pl-0.5 gap-1.5", rowFace: "size-6 text-[8px]", name: "text-[9px]", meta: "text-[7px]" },
  md: { bubble: "size-11", face: "size-9 text-xs", badge: "size-5", badgeIcon: "size-3", row: "py-1 pr-4 pl-1 gap-2", rowFace: "size-9 text-xs", name: "text-sm", meta: "text-[11px]" },
} satisfies Record<Size, Record<string, string>>;

/**
 * Static picture of the profile switcher bubble (see shell/profile-dock). With `open` the other
 * profiles fan out above it; with `viewing` the bubble shows the partner's face with the amber
 * ring and eye badge that mark read-only data.
 */
export function MockProfileDock({
  size = "sm",
  open = false,
  viewing = false,
  className,
}: {
  size?: Size;
  open?: boolean;
  viewing?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  const rows = [
    { initials: "DP", name: "Dilini Perera", meta: "Read-only", partner: true },
    { initials: "NP", name: "My account", meta: "Edit", partner: false },
  ];
  return (
    <div aria-hidden className={cn("flex flex-col items-start gap-1.5 select-none", className)}>
      {open &&
        rows.map(({ initials, name, meta, partner }) => {
          const active = partner === viewing;
          return (
            <span
              key={name}
              className={cn(
                "flex items-center rounded-full border bg-surface shadow-[0_6px_20px_rgb(20_21_28/0.14)]",
                s.row,
                active ? "border-primary" : "border-line",
              )}
            >
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full font-semibold",
                  s.rowFace,
                  partner ? "bg-warning-soft text-ink" : "bg-primary-soft text-on-primary-soft",
                )}
              >
                {initials}
              </span>
              <span className="leading-tight">
                <span className={cn("block font-semibold text-ink", s.name)}>{name}</span>
                <span className={cn("flex items-center gap-1 text-ink-soft", s.meta)}>
                  {meta}
                  {active && <Check className="size-2.5 text-primary" />}
                </span>
              </span>
            </span>
          );
        })}
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full bg-surface shadow-[0_6px_20px_rgb(20_21_28/0.18)] ring-2",
          s.bubble,
          viewing ? "ring-warning" : "ring-primary/50",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full font-semibold",
            s.face,
            viewing ? "bg-warning-soft text-ink" : "bg-primary text-on-primary",
          )}
        >
          {viewing ? "DP" : "NP"}
        </span>
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full ring-2 ring-surface",
            s.badge,
            viewing ? "bg-warning text-ink" : "bg-primary text-on-primary",
          )}
        >
          {viewing ? <Eye className={s.badgeIcon} /> : <ArrowsLeftRight className={s.badgeIcon} />}
        </span>
      </span>
    </div>
  );
}
