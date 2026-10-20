import "server-only";
import { db, isId, run } from "@/lib/db";

/** Options the transaction form needs: active accounts, categories and tags. */
export async function getTransactionFormOptions(userId: string, keepAccountIds: string[] = []) {
  const keep = keepAccountIds.filter(isId);
  const accountsQuery = db().from("Account").select("id, name, color, currency").eq("userId", userId);
  const [accounts, categories, tags, history, cards] = await Promise.all([
    run(
      (keep.length > 0 ? accountsQuery.or(`archived.eq.false,id.in.(${keep.join(",")})`) : accountsQuery.eq("archived", false))
        .order("createdAt"),
    ),
    run(db().from("Category").select("id, name, color, type, icon").eq("userId", userId).order("name")),
    run(db().from("Tag").select("id, name, color").eq("userId", userId).order("name")),
    // Recent notes with their category: lets a scanned merchant reuse the category you already chose for it.
    run(
      db()
        .from("Transaction")
        .select("note, categoryId")
        .eq("userId", userId)
        .not("categoryId", "is", null)
        .neq("note", "")
        .order("date", { ascending: false })
        .limit(300),
    ),
    // Linked cards let a scanned receipt's card number pick the account that pays for it.
    run(db().from("Card").select("accountId, last4, name, network").eq("userId", userId)),
  ]);
  return { accounts, categories, tags, history, cards };
}
