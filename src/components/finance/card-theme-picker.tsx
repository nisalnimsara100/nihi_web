"use client";

import { useState } from "react";
import { Plus } from "@/components/icons";
import {
  CARD_EFFECT_NAMES,
  CARD_EFFECTS,
  CARD_THEME_IDS,
  DEFAULT_CUSTOM_THEME,
  encodeCustomTheme,
  getCardTheme,
  parseCustomTheme,
  type CustomTheme,
} from "@/lib/card-themes";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

const swatchClass =
  "block aspect-[1.7/1] rounded-xl ring-offset-2 ring-offset-surface transition group-hover:-translate-y-0.5 peer-checked:ring-[3px] peer-checked:ring-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary/40";
const swatchLabelClass =
  "mt-1.5 block text-center text-xs font-medium text-ink-soft peer-checked:font-semibold peer-checked:text-ink";

/**
 * Preset themes as mini cards, plus a "Custom" tile that opens a mixer for two
 * gradient colours, a glow, an angle and an effect (orbs, rings, flare...). The chosen value is submitted as
 * `name` through a hidden input; the radios only drive the UI.
 */
export function CardThemePicker({
  value,
  onChange,
  name = "theme",
}: {
  value: string;
  onChange: (theme: string) => void;
  name?: string;
}) {
  const t = useT();
  const savedCustom = parseCustomTheme(value);
  // Remember the last mix, so switching to a preset and back keeps it.
  const [custom, setCustom] = useState<CustomTheme>(savedCustom ?? DEFAULT_CUSTOM_THEME);
  const isCustom = savedCustom !== null;

  const updateCustom = (patch: Partial<CustomTheme>) => {
    const next = { ...custom, ...patch };
    setCustom(next);
    onChange(encodeCustomTheme(next));
  };

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-ink">{t("Card theme")}</legend>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {CARD_THEME_IDS.map((id) => (
          <label key={id} className="group cursor-pointer">
            <input
              type="radio"
              name={`${name}-choice`}
              checked={value === id}
              onChange={() => onChange(id)}
              className="peer sr-only"
            />
            <span aria-hidden className={swatchClass} style={{ background: getCardTheme(id).background }} />
            <span className={swatchLabelClass}>{getCardTheme(id).name}</span>
          </label>
        ))}
        <label className="group cursor-pointer">
          <input
            type="radio"
            name={`${name}-choice`}
            checked={isCustom}
            onChange={() => onChange(encodeCustomTheme(custom))}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(swatchClass, "relative flex items-center justify-center")}
            style={{ background: getCardTheme(encodeCustomTheme(custom)).background }}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm">
              <Plus className="size-4" strokeWidth={2.25} />
            </span>
          </span>
          <span className={swatchLabelClass}>{t("Custom")}</span>
        </label>
      </div>

      {isCustom ? (
        <div className="mt-4 space-y-4 rounded-2xl bg-muted p-4">
          <div className="grid gap-4 sm:grid-cols-[repeat(3,auto)_1fr] sm:items-end">
            <ColorInput label="Start" value={custom.start} onChange={(start) => updateCustom({ start })} />
            <ColorInput label="End" value={custom.end} onChange={(end) => updateCustom({ end })} />
            <ColorInput label="Glow" value={custom.glow} onChange={(glow) => updateCustom({ glow })} />
            <label className="block">
              <span className="mb-1.5 flex justify-between text-xs font-semibold text-ink-soft">
                {t("Angle")} <span className="tabular-nums">{custom.angle}°</span>
              </span>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={custom.angle}
                onChange={(e) => updateCustom({ angle: Number(e.target.value) })}
                className="h-9 w-full accent-primary"
              />
            </label>
          </div>
          <div role="radiogroup" aria-label={t("Effect")}>
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("Effect")}</span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CARD_EFFECTS.map((effect) => (
                <button
                  key={effect}
                  type="button"
                  role="radio"
                  aria-checked={custom.effect === effect}
                  onClick={() => updateCustom({ effect })}
                  className="group text-center"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block aspect-[1.7/1] rounded-lg ring-offset-2 ring-offset-muted transition group-hover:-translate-y-0.5",
                      custom.effect === effect && "ring-[3px] ring-primary",
                    )}
                    style={{ background: getCardTheme(encodeCustomTheme({ ...custom, effect })).background }}
                  />
                  <span
                    className={cn(
                      "mt-1 block text-xs font-medium text-ink-soft",
                      custom.effect === effect && "font-semibold text-ink",
                    )}
                  >
                    {CARD_EFFECT_NAMES[effect]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  return (
    <label className="flex items-center gap-2 sm:block">
      <span className="text-xs font-semibold text-ink-soft sm:mb-1.5 sm:block">{label}</span>
      <span className="relative block size-9 overflow-hidden rounded-full ring-1 ring-line" style={{ background: value }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </span>
    </label>
  );
}
