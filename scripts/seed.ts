/**
 * Creates a demo user with a year of sample data, for local development.
 * Run with `ALLOW_DEMO_SEED=1 npm run db:seed`, then log in as
 * demo@nihi.app / demo1234. Production refuses that account (src/lib/demo.ts).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";
import { DEFAULT_CATEGORIES } from "../src/lib/constants";
import { DEMO_EMAIL } from "../src/lib/demo";

if (process.env.ALLOW_DEMO_SEED !== "1") {
  console.error(
    "Refusing to seed: this creates a demo user with a known password in the database from .env.\n" +
      "Run it as: ALLOW_DEMO_SEED=1 npm run db:seed",
  );
  process.exit(1);
}

const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Returns a query's data, or throws its error. Same as `run` in src/lib/db.ts, which is server-only. */
async function run<R extends { data: unknown; error: { message: string } | null }>(
  query: PromiseLike<R>,
): Promise<Extract<R, { error: null }>["data"]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Extract<R, { error: null }>["data"];
}

const EMAIL = DEMO_EMAIL;

// Small deterministic random generator so every seed run looks the same.
let seed = 42;
function random() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const between = (min: number, max: number) => Math.round(min + random() * (max - min));

async function main() {
  // Deleting the user cascades to all of its accounts, categories, tags and transactions.
  await run(supabase.from("User").delete().eq("email", EMAIL));

  const user = await run(
    supabase
      .from("User")
      .insert({ email: EMAIL, name: "Demo User", passwordHash: await bcrypt.hash("demo1234", 10), defaultCurrency: "LKR" })
      .select("id")
      .single(),
  );
  const categories = await run(
    supabase
      .from("Category")
      .insert(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })))
      .select("id, name, type"),
  );

  const account = (name: string, type: "CASH" | "BANK" | "SAVINGS" | "CREDIT_CARD", color: string, initialBalance: number) =>
    run(
      supabase
        .from("Account")
        .insert({ userId: user.id, name, type, currency: "LKR", color, initialBalance })
        .select("id")
        .single(),
    );

  const [cash, bank, savings, card] = await Promise.all([
    account("Wallet", "CASH", "#1baf7a", 800000),
    account("Main bank", "BANK", "#2a78d6", 35000000),
    account("Savings", "SAVINGS", "#6250d6", 120000000),
    account("Credit card", "CREDIT_CARD", "#eb6834", 0),
  ]);

  const [trip, work] = await Promise.all([
    run(supabase.from("Tag").insert({ userId: user.id, name: "Trip", color: "#e87ba4" }).select("id").single()),
    run(supabase.from("Tag").insert({ userId: user.id, name: "Work", color: "#2a78d6" }).select("id").single()),
  ]);

  const cat = (name: string, type: "INCOME" | "EXPENSE") =>
    categories.find((c) => c.name === name && c.type === type)!.id;

  type Row = {
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    date: Date;
    note?: string;
    tagIds?: string[];
  };
  const rows: Row[] = [];
  const now = new Date();

  for (let m = 11; m >= 0; m--) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() - m;
    const day = (d: number) => new Date(Date.UTC(year, month, d, 12));
    const lastDay = m === 0 ? now.getUTCDate() : 28;

    rows.push({ type: "INCOME", amount: 25000000, accountId: bank.id, categoryId: cat("Salary", "INCOME"), date: day(1), note: "Monthly salary" });
    if (m % 3 === 0) {
      rows.push({ type: "INCOME", amount: between(3000000, 9000000), accountId: bank.id, categoryId: cat("Business", "INCOME"), date: day(Math.min(15, lastDay)), note: "Freelance project", tagIds: [work.id] });
    }
    rows.push({ type: "EXPENSE", amount: 6500000, accountId: bank.id, categoryId: cat("Housing", "EXPENSE"), date: day(2), note: "Rent" });
    rows.push({ type: "TRANSFER", amount: 3000000, accountId: bank.id, toAccountId: savings.id, date: day(3), note: "Monthly saving" });
    rows.push({ type: "TRANSFER", amount: 2500000, accountId: bank.id, toAccountId: cash.id, date: day(4), note: "ATM withdrawal" });

    for (let d = 1; d <= lastDay; d += between(1, 3)) {
      rows.push({ type: "EXPENSE", amount: between(60000, 350000), accountId: random() > 0.5 ? cash.id : card.id, categoryId: cat("Food & Dining", "EXPENSE"), date: day(d) });
      if (random() > 0.6) {
        rows.push({ type: "EXPENSE", amount: between(300000, 1200000), accountId: card.id, categoryId: cat("Groceries", "EXPENSE"), date: day(d) });
      }
      if (random() > 0.7) {
        rows.push({ type: "EXPENSE", amount: between(20000, 250000), accountId: cash.id, categoryId: cat("Transport", "EXPENSE"), date: day(d), note: "Bus / tuk-tuk" });
      }
    }
    rows.push({ type: "EXPENSE", amount: between(800000, 1500000), accountId: bank.id, categoryId: cat("Utilities", "EXPENSE"), date: day(Math.min(10, lastDay)), note: "Electricity & internet" });
    rows.push({ type: "EXPENSE", amount: between(300000, 2500000), accountId: card.id, categoryId: cat("Shopping", "EXPENSE"), date: day(Math.min(18, lastDay)) });
    rows.push({ type: "EXPENSE", amount: between(150000, 600000), accountId: card.id, categoryId: cat("Entertainment", "EXPENSE"), date: day(Math.min(20, lastDay)), note: "Cinema" });
    if (m === 4) {
      rows.push({ type: "EXPENSE", amount: 4500000, accountId: card.id, categoryId: cat("Entertainment", "EXPENSE"), date: day(12), note: "Weekend trip", tagIds: [trip.id] });
    }
    rows.push({ type: "TRANSFER", amount: between(2000000, 4000000), accountId: bank.id, toAccountId: card.id, date: day(Math.min(25, lastDay)), note: "Card payment" });
  }

  // One bulk insert. PostgREST returns the new rows in the order they were sent.
  const inserted = await run(
    supabase
      .from("Transaction")
      .insert(
        // Every row lists every column: a bulk insert sends one shared column list.
        rows.map((row) => ({
          userId: user.id,
          type: row.type,
          amount: row.amount,
          accountId: row.accountId,
          toAccountId: row.toAccountId ?? null,
          toAmount: row.type === "TRANSFER" ? row.amount : null,
          categoryId: row.categoryId ?? null,
          date: row.date.toISOString(),
          note: row.note ?? "",
        })),
      )
      .select("id"),
  );
  const links = rows.flatMap((row, i) => (row.tagIds ?? []).map((tagId) => ({ transactionId: inserted[i].id, tagId })));
  if (links.length > 0) {
    await run(supabase.from("TransactionTag").insert(links));
  }

  console.log(`Seeded ${rows.length} transactions for ${EMAIL} (password: demo1234)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
