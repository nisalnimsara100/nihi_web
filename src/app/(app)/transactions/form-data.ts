import "server-only";
import { db, isId, run } from "@/lib/db";

/** Options the transaction form needs: active accounts, categories and tags. */
export async function getTransactionFormOptions(userId: string, keepAccountIds: string[] = []) {
  const keep = keepAccountIds.filter(isId);
  const accountsQuery = db().from("Account").select("id, name, color, currency").eq("userId", userId);
  const [accounts, categories, tags] = await Promise.all([
    run(
      (keep.length > 0 ? accountsQuery.or(`archived.eq.false,id.in.(${keep.join(",")})`) : accountsQuery.eq("archived", false))
        .order("createdAt"),
    ),
    run(db().from("Category").select("id, name, color, type, icon").eq("userId", userId).order("name")),
    run(db().from("Tag").select("id, name, color").eq("userId", userId).order("name")),
  ]);
  return { accounts, categories, tags };
}
