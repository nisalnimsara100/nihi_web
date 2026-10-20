import {
  Baby, Banknote, Beer, BookOpen, Briefcase, Building2, Bus, Car, Coffee, CreditCard, Dog, Droplets,
  Dumbbell, Ellipsis, Film, Fuel, Gamepad2, Gift, GraduationCap, HandCoins, HeartPulse, House, Landmark,
  Laptop, Music, Palette, PiggyBank, Pill, Plane, Receipt, Scissors, Shirt, ShoppingBag, ShoppingCart,
  Smartphone, Sparkles, Stethoscope, Ticket, TrainFront, TreePalm, TrendingUp, Utensils, Wallet, Wifi,
  Wrench, Zap, type LucideIcon, type LucideProps,
} from "lucide-react";

/** Icons a category can use, keyed by the name stored in the database. */
export const CATEGORY_ICONS = {
  food: Utensils,
  groceries: ShoppingCart,
  coffee: Coffee,
  drinks: Beer,
  bus: Bus,
  car: Car,
  fuel: Fuel,
  train: TrainFront,
  travel: Plane,
  holiday: TreePalm,
  home: House,
  electricity: Zap,
  water: Droplets,
  internet: Wifi,
  phone: Smartphone,
  shopping: ShoppingBag,
  clothes: Shirt,
  beauty: Scissors,
  health: HeartPulse,
  medicine: Pill,
  doctor: Stethoscope,
  fitness: Dumbbell,
  movies: Film,
  games: Gamepad2,
  music: Music,
  events: Ticket,
  hobbies: Palette,
  education: GraduationCap,
  books: BookOpen,
  kids: Baby,
  pets: Dog,
  gifts: Gift,
  repairs: Wrench,
  tech: Laptop,
  bills: Receipt,
  card: CreditCard,
  bank: Landmark,
  salary: Briefcase,
  business: Building2,
  investments: TrendingUp,
  savings: PiggyBank,
  wallet: Wallet,
  cash: Banknote,
  income: HandCoins,
  bonus: Sparkles,
  other: Ellipsis,
} satisfies Record<string, LucideIcon>;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS) as CategoryIconName[];

export const DEFAULT_CATEGORY_ICON: CategoryIconName = "other";

export function isCategoryIcon(name: string): name is CategoryIconName {
  return name in CATEGORY_ICONS;
}

/** Renders a stored icon name; unknown names fall back to the "other" icon. */
export function CategoryIcon({ name, ...props }: { name: string | null | undefined } & LucideProps) {
  const Icon = name && isCategoryIcon(name) ? CATEGORY_ICONS[name] : CATEGORY_ICONS[DEFAULT_CATEGORY_ICON];
  return <Icon aria-hidden {...props} />;
}
