import "server-only";
import { db } from "@/lib/db";

/** Options the transaction form needs: active accounts, categories and tags. */
export async function getTransactionFormOptions(userId: string, keepAccountIds: string[] = []) {
  const [accounts, categories, tags] = await Promise.all([
    db.account.findMany({
      where: { userId, OR: [{ archived: false }, { id: { in: keepAccountIds } }] },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, color: true, currency: true },
    }),
    db.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true, type: true },
    }),
    db.tag.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
  ]);
  return { accounts, categories, tags };
}
