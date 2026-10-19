import { cn } from "@/lib/cn";

function Coin({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute flex items-center justify-center rounded-full font-display font-black text-forest/70 shadow-lg",
        "bg-[radial-gradient(circle_at_30%_30%,#e9ff8a,#bfe80f_45%,#8fb800)]",
        className,
      )}
    >
      Rs
    </span>
  );
}

function PayCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div aria-hidden className={cn("absolute aspect-[1.6/1] w-[62%] rounded-[22px] shadow-2xl", className)}>
      {children}
    </div>
  );
}

/** Floating cards and coins, drawn with CSS so it scales and themes with the page. */
export function HeroArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-sm", className)}>
      <PayCard className="top-[38%] left-[22%] rotate-[14deg] bg-gradient-to-br from-[#5aa9ff] to-[#2a78d6]" />
      <PayCard className="top-[30%] left-[18%] rotate-[4deg] bg-gradient-to-br from-forest-soft to-forest" />
      <PayCard className="top-[20%] left-[14%] -rotate-[8deg] bg-gradient-to-br from-[#a8e39a] to-[#5fbf5a]">
        <span className="absolute top-[30%] left-[10%] h-[18%] w-[16%] rounded-md bg-gradient-to-br from-[#f3e7b5] to-[#d6c27a]" />
        <span className="absolute bottom-[16%] left-[10%] h-[7%] w-[55%] rounded-full bg-white/50" />
        <span className="absolute bottom-[16%] right-[10%] h-[7%] w-[16%] rounded-full bg-white/50" />
      </PayCard>
      <Coin className="top-[6%] left-[12%] size-14 -rotate-12 text-lg" />
      <Coin className="top-[4%] right-[22%] size-10 rotate-12 text-xs" />
      <Coin className="top-[30%] right-[2%] size-12 rotate-6 text-sm" />
      <Coin className="bottom-[22%] left-[2%] size-10 -rotate-6 text-xs" />
      <Coin className="right-[16%] bottom-[12%] size-16 rotate-12 text-xl" />
      <Coin className="bottom-[4%] left-[26%] size-9 text-[10px]" />
    </div>
  );
}
