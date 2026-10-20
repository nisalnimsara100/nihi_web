/**
 * Creates a demo user with a year of sample data.
 * Run with `npm run db:seed`. Log in as demo@nihi.app / demo1234.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/constants";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const EMAIL = "demo@nihi.app";

// Small deterministic random generator so every seed run looks the same.
let seed = 42;
function random() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const between = (min: number, max: number) => Math.round(min + random() * (max - min));

async function main() {
  await db.user.deleteMany({ where: { email: EMAIL } });

  const user = await db.user.create({
    data: {
      email: EMAIL,
      name: "Demo User",
      passwordHash: await bcrypt.hash("demo1234", 10),
      defaultCurrency: "LKR",
      categories: { create: DEFAULT_CATEGORIES },
    },
    include: { categories: true },
  });

  const account = (name: string, type: "CASH" | "BANK" | "SAVINGS" | "CREDIT_CARD", color: string, initialBalance: number) =>
    db.account.create({ data: { userId: user.id, name, type, currency: "LKR", color, initialBalance } });

  const [cash, bank, savings, card] = await Promise.all([
    account("Wallet", "CASH", "#1baf7a", 800000),
    account("Main bank", "BANK", "#2a78d6", 35000000),
    account("Savings", "SAVINGS", "#6250d6", 120000000),
    account("Credit card", "CREDIT_CARD", "#eb6834", 0),
  ]);

  const [trip, work] = await Promise.all([
    db.tag.create({ data: { userId: user.id, name: "Trip", color: "#e87ba4" } }),
    db.tag.create({ data: { userId: user.id, name: "Work", color: "#2a78d6" } }),
  ]);

  const cat = (name: string, type: "INCOME" | "EXPENSE") =>
    user.categories.find((c) => c.name === name && c.type === type)!.id;

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

  for (const { tagIds, ...row } of rows) {
    await db.transaction.create({
      data: {
        ...row,
        userId: user.id,
        toAmount: row.type === "TRANSFER" ? row.amount : null,
        ...(tagIds ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
    });
  }

  console.log(`Seeded ${rows.length} transactions for ${EMAIL} (password: demo1234)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
