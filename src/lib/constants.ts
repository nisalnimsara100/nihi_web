import type { Enums } from "./database.types";

type AccountType = Enums<"AccountType">;
type CategoryType = Enums<"CategoryType">;

export const APP_NAME = "NiHi";

export const CURRENCIES = [
  "LKR", "USD", "EUR", "GBP", "INR", "JPY", "CNY", "AUD", "CAD", "SGD",
  "AED", "CHF", "HKD", "KRW", "MYR", "NZD", "SAR", "SEK", "THB",
] as const;

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank account" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "OTHER", label: "Other" },
];

export function accountTypeLabel(type: AccountType) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type;
}

/**
 * Color choices for accounts, categories and tags. These are the eight
 * categorical hues validated for colorblind separation, plus a neutral.
 */
export const COLORS = [
  "#2a78d6", "#eb6834", "#1baf7a", "#eda100",
  "#e87ba4", "#008300", "#6250d6", "#e34948", "#8a8984",
] as const;

export const DEFAULT_CATEGORIES: { name: string; type: CategoryType; color: string; icon: string }[] = [
  { name: "Food & Dining", type: "EXPENSE", color: "#eb6834", icon: "food" },
  { name: "Groceries", type: "EXPENSE", color: "#1baf7a", icon: "groceries" },
  { name: "Transport", type: "EXPENSE", color: "#2a78d6", icon: "bus" },
  { name: "Housing", type: "EXPENSE", color: "#6250d6", icon: "home" },
  { name: "Utilities", type: "EXPENSE", color: "#eda100", icon: "electricity" },
  { name: "Shopping", type: "EXPENSE", color: "#e87ba4", icon: "shopping" },
  { name: "Health", type: "EXPENSE", color: "#e34948", icon: "health" },
  { name: "Entertainment", type: "EXPENSE", color: "#008300", icon: "movies" },
  { name: "Other", type: "EXPENSE", color: "#8a8984", icon: "other" },
  { name: "Salary", type: "INCOME", color: "#1baf7a", icon: "salary" },
  { name: "Business", type: "INCOME", color: "#2a78d6", icon: "business" },
  { name: "Investments", type: "INCOME", color: "#6250d6", icon: "investments" },
  { name: "Gifts", type: "INCOME", color: "#e87ba4", icon: "gifts" },
  { name: "Other", type: "INCOME", color: "#8a8984", icon: "other" },
];
