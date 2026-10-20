/**
 * Card faces for accounts on the Wallet page. Each one is a stack of CSS
 * gradients (glows on top of a base) plus the ink colour that reads on it.
 * The id is stored in Account.theme, so never rename an existing one. Account.theme
 * can also hold a custom mix; see CustomTheme below.
 */
export const CARD_THEME_IDS = [
  "indigo",
  "lavender",
  "midnight",
  "aurora",
  "sunset",
  "lagoon",
  "candy",
  "holo",
  "ember",
  "forest",
  "peach",
  "gold",
] as const;

export type CardThemeId = (typeof CARD_THEME_IDS)[number];

export type CardTheme = { name: string; background: string; ink: string };

export const DEFAULT_CARD_THEME: CardThemeId = "indigo";

export const CARD_THEMES: Record<CardThemeId, CardTheme> = {
  indigo: {
    name: "Indigo",
    background:
      "radial-gradient(120% 90% at 0% 0%, #8f97ff 0%, transparent 55%), linear-gradient(110deg, #6f79fe, #3938f7)",
    ink: "#ffffff",
  },
  lavender: {
    name: "Lavender",
    background:
      "radial-gradient(90% 120% at 100% 0%, #ffffff 0%, transparent 55%), linear-gradient(135deg, #e4e6ff, #c3c8fb)",
    ink: "#2d2ba6",
  },
  midnight: {
    name: "Midnight",
    background:
      "radial-gradient(80% 120% at 100% 0%, rgb(124 92 255 / 0.45) 0%, transparent 60%), radial-gradient(70% 90% at 0% 100%, rgb(56 189 248 / 0.18) 0%, transparent 60%), linear-gradient(135deg, #1d1f2e, #12131c)",
    ink: "#ffffff",
  },
  aurora: {
    name: "Aurora",
    background:
      "radial-gradient(90% 120% at 0% 100%, #00e0b8 0%, transparent 55%), radial-gradient(80% 100% at 100% 0%, #8a5cff 0%, transparent 60%), linear-gradient(135deg, #0b1b3a, #12324f)",
    ink: "#ffffff",
  },
  sunset: {
    name: "Sunset",
    background:
      "radial-gradient(100% 120% at 0% 0%, #ffb547 0%, transparent 55%), radial-gradient(90% 120% at 100% 100%, #7a2cff 0%, transparent 60%), linear-gradient(135deg, #ff5f6d, #c2185b)",
    ink: "#ffffff",
  },
  lagoon: {
    name: "Lagoon",
    background:
      "radial-gradient(90% 120% at 100% 0%, #6ff7e8 0%, transparent 50%), linear-gradient(140deg, #1fa2ff, #1a5cff 60%, #3c1fd1)",
    ink: "#ffffff",
  },
  candy: {
    name: "Candy",
    background:
      "radial-gradient(70% 90% at 15% 15%, #ff9de2 0%, transparent 60%), radial-gradient(70% 90% at 90% 85%, #7cc8ff 0%, transparent 60%), linear-gradient(135deg, #b06bff, #6a5cff)",
    ink: "#ffffff",
  },
  holo: {
    name: "Holo",
    background:
      "radial-gradient(70% 90% at 15% 10%, rgb(255 255 255 / 0.55) 0%, transparent 60%), linear-gradient(115deg, #ff9de2 0%, #a8b4ff 30%, #7ff0d4 55%, #ffe08a 80%, #ff9a7a 100%)",
    ink: "#1d1640",
  },
  ember: {
    name: "Ember",
    background:
      "radial-gradient(90% 110% at 100% 100%, #ffcf5a 0%, transparent 55%), linear-gradient(135deg, #3a0d0d, #b3261e 55%, #ff6a3d)",
    ink: "#ffffff",
  },
  forest: {
    name: "Forest",
    background:
      "radial-gradient(90% 110% at 0% 0%, #b8f36b 0%, transparent 50%), linear-gradient(150deg, #13704a, #0b3d2e 55%, #062a24)",
    ink: "#ffffff",
  },
  peach: {
    name: "Peach",
    background:
      "radial-gradient(90% 120% at 100% 0%, #ffd1e8 0%, transparent 55%), linear-gradient(135deg, #ffe9d6, #ffbfa3)",
    ink: "#6a2c18",
  },
  gold: {
    name: "Gold",
    background:
      "radial-gradient(80% 100% at 20% 0%, #fff6d8 0%, transparent 55%), linear-gradient(135deg, #f3d38a, #c9a24a 60%, #a37a2c)",
    ink: "#3f2d0c",
  },
};

export function isCardTheme(value: string): value is CardThemeId {
  return value in CARD_THEMES;
}

/** Decorations layered over a custom mix, independent of the account type. */
export const CARD_EFFECTS = ["none", "orbs", "rings", "lines", "dots", "flare"] as const;

export type CardEffect = (typeof CARD_EFFECTS)[number];

export const CARD_EFFECT_NAMES: Record<CardEffect, string> = {
  none: "None",
  orbs: "Orbs",
  rings: "Rings",
  lines: "Lines",
  dots: "Dots",
  flare: "Flare",
};

/**
 * A theme the user mixed themselves. Stored as
 * "custom:<start>,<end>,<glow>,<angle>[,<effect>]", e.g.
 * "custom:ff5f6d,7a2cff,ffb547,135,flare". Values saved before effects existed
 * have no effect part and read as "none".
 */
export type CustomTheme = { start: string; end: string; glow: string; angle: number; effect: CardEffect };

const CUSTOM_PATTERN = /^custom:([0-9a-f]{6}),([0-9a-f]{6}),([0-9a-f]{6}),(\d{1,3})(?:,([a-z]+))?$/i;

export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  start: "#ff5f6d",
  end: "#7a2cff",
  glow: "#ffb547",
  angle: 135,
  effect: "none",
};

const isCardEffect = (value: string): value is CardEffect => (CARD_EFFECTS as readonly string[]).includes(value);

export function parseCustomTheme(value: string | null | undefined): CustomTheme | null {
  const match = value?.match(CUSTOM_PATTERN);
  if (!match || Number(match[4]) > 360) return null;
  const effect = match[5] ?? "none";
  if (!isCardEffect(effect)) return null;
  return { start: `#${match[1]}`, end: `#${match[2]}`, glow: `#${match[3]}`, angle: Number(match[4]), effect };
}

export function encodeCustomTheme({ start, end, glow, angle, effect }: CustomTheme): string {
  const hex = (color: string) => color.replace("#", "").toLowerCase();
  return `custom:${hex(start)},${hex(end)},${hex(glow)},${Math.round(angle)},${effect}`;
}

/** A preset id or a well-formed custom theme. */
export function isValidTheme(value: string): boolean {
  return isCardTheme(value) || parseCustomTheme(value) !== null;
}

/** Relative luminance (0 dark to 1 light) of a #rrggbb colour. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * CSS background layers for an effect, drawn in `tone` (an "r g b" triple):
 * white on dark mixes, black on light ones.
 */
function effectLayers(effect: CardEffect, tone: string): string[] {
  const c = (alpha: number) => `rgb(${tone} / ${alpha})`;
  switch (effect) {
    case "orbs":
      return [
        `radial-gradient(circle at 86% 14%, ${c(0.22)} 0 20%, transparent 20.5%)`,
        `radial-gradient(circle at 8% 96%, ${c(0.14)} 0 26%, transparent 26.5%)`,
        `radial-gradient(circle at 62% 108%, ${c(0.1)} 0 16%, transparent 16.5%)`,
      ];
    case "rings":
      return [
        `repeating-radial-gradient(circle at 100% 100%, transparent 0 18px, ${c(0.16)} 18px 19.5px)`,
      ];
    case "lines":
      return [`repeating-linear-gradient(135deg, ${c(0.1)} 0 2px, transparent 2px 13px)`];
    case "dots":
      return [`radial-gradient(${c(0.24)} 1.2px, transparent 1.7px) 0 0 / 13px 13px`];
    case "flare":
      // A bright source, a light streak and ghost circles along the diagonal.
      return [
        `radial-gradient(circle at 80% 22%, ${c(0.95)} 0 1%, ${c(0.45)} 2.5%, transparent 9%)`,
        `radial-gradient(circle at 64% 40%, ${c(0.16)} 0 3%, transparent 3.4%)`,
        `radial-gradient(circle at 50% 56%, transparent 0 5%, ${c(0.16)} 5.4% 6%, transparent 6.4%)`,
        `radial-gradient(circle at 36% 72%, ${c(0.12)} 0 2%, transparent 2.4%)`,
        `linear-gradient(118deg, transparent 40%, ${c(0.14)} 48%, transparent 56%)`,
      ];
    case "none":
      return [];
  }
}

function customCardTheme({ start, end, glow, angle, effect }: CustomTheme): CardTheme {
  // Dark text on light mixes, white text on everything else.
  const light = (luminance(start) + luminance(end)) / 2 > 0.4;
  return {
    name: "Custom",
    background: [
      // A flare is light, so it stays white even on pale mixes.
      ...effectLayers(effect, light && effect !== "flare" ? "0 0 0" : "255 255 255"),
      `radial-gradient(90% 110% at 100% 0%, ${glow} 0%, transparent 60%)`,
      `linear-gradient(${angle}deg, ${start}, ${end})`,
    ].join(", "),
    ink: light ? "#1d1f2e" : "#ffffff",
  };
}

/** The stored theme, or the default when the value is missing or unknown. */
export function getCardTheme(id: string | null | undefined): CardTheme {
  const custom = parseCustomTheme(id);
  if (custom) return customCardTheme(custom);
  return CARD_THEMES[id && isCardTheme(id) ? id : DEFAULT_CARD_THEME];
}
