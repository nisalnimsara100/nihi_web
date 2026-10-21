import type { Enums } from "./database.types";

/** Everything needed to put a deleted transaction back exactly as it was (the Undo button). */
export type TxSnapshot = {
  id: string;
  type: Enums<"TransactionType">;
  amount: number;
  toAmount: number | null;
  fee: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  cardId: string | null;
  /** ISO timestamp, as stored. */
  date: string;
  note: string;
  createdAt: string;
  tagIds: string[];
};
