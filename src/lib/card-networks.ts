/** Card networks a linked card can have. Keys are stored in the database (see the Card migration). */
export const CARD_NETWORKS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "AMEX", label: "Amex" },
  { value: "UNIONPAY", label: "UnionPay" },
  { value: "JCB", label: "JCB" },
  { value: "OTHER", label: "Other" },
] as const;

export type CardNetwork = (typeof CARD_NETWORKS)[number]["value"];

export const CARD_NETWORK_VALUES = CARD_NETWORKS.map((n) => n.value) as [CardNetwork, ...CardNetwork[]];

export function networkLabel(network: string) {
  return CARD_NETWORKS.find((n) => n.value === network)?.label ?? "Card";
}
