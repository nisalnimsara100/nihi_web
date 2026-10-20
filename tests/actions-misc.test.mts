import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { form, installMocks, redirectOf } from "./helpers/harness";

const h = installMocks();
const accounts = await import("@/actions/accounts");
const budgets = await import("@/actions/budgets");
const goals = await import("@/actions/goals");
const cards = await import("@/actions/cards");

beforeEach(() => {
  h.reset();
  h.fake
    .seed("Account", [
      { id: "a1", userId: "u1", name: "Bank", currency: "LKR", initialBalance: 100000, sortOrder: 0 },
      { id: "a2", userId: "u1", name: "Savings", currency: "LKR", initialBalance: 0, sortOrder: 1 },
      { id: "x1", userId: "other", name: "Theirs", currency: "LKR", initialBalance: 0, sortOrder: 0 },
    ])
    .seed("Category", [{ id: "c1", userId: "u1", type: "EXPENSE", name: "Food" }, { id: "c2", userId: "u1", type: "INCOME", name: "Salary" }]);
});

describe("accounts", () => {
  it("adjusts the starting balance so the account shows what the bank says, without touching transactions", async () => {
    h.state.accounts = [{ id: "a1", initialBalance: 100000, balance: 90000, currency: "LKR" }];
    const result = await accounts.adjustBalance("a1", "950.00");
    assert.equal(result.ok, true);
    // balance 900.00 -> 950.00 is +50.00, so the starting balance goes from 1000.00 to 1050.00
    assert.equal(h.fake.tables.Account.find((a) => a.id === "a1")?.initialBalance, 105000);
    assert.equal(h.fake.tables.Transaction?.length ?? 0, 0);
  });

  it("can match a credit card that owes money (negative balance)", async () => {
    h.state.accounts = [{ id: "a1", initialBalance: 0, balance: -20000, currency: "LKR" }];
    await accounts.adjustBalance("a1", "-350.00");
    assert.equal(h.fake.tables.Account.find((a) => a.id === "a1")?.initialBalance, -15000);
  });

  it("rejects a non-number, another user's account, and a balance too large to store", async () => {
    h.state.accounts = [{ id: "a1", initialBalance: 0, balance: 0, currency: "LKR" }];
    assert.ok((await accounts.adjustBalance("a1", "lots")).error);
    assert.equal((await accounts.adjustBalance("x1", "5")).error, "Account not found.");
    assert.match((await accounts.adjustBalance("a1", "99999999999")).error ?? "", /too large/);
  });

  it("will not delete an account that has transactions (as source or destination)", async () => {
    h.fake.seed("Transaction", [{ id: "t1", userId: "u1", accountId: "a2", toAccountId: "a1" }]);
    const result = await accounts.deleteAccount("a1");
    assert.match(result.error ?? "", /has transactions/);
    assert.ok(h.fake.tables.Account.some((a) => a.id === "a1"));
  });

  it("deletes an empty account", async () => {
    assert.equal(await redirectOf(() => accounts.deleteAccount("a1")), "/accounts");
    assert.ok(!h.fake.tables.Account.some((a) => a.id === "a1"));
  });

  it("saves a new order only for accounts the user owns", async () => {
    assert.equal((await accounts.reorderAccounts(["a2", "a1"])).ok, true);
    assert.equal(h.fake.tables.Account.find((a) => a.id === "a2")?.sortOrder, 0);
    assert.equal(h.fake.tables.Account.find((a) => a.id === "a1")?.sortOrder, 1);
    assert.ok((await accounts.reorderAccounts(["a1", "x1"])).error);
    assert.equal(h.fake.tables.Account.find((a) => a.id === "x1")?.sortOrder, 0);
  });

  it("puts a new account at the end and clears credit terms on non-credit accounts", async () => {
    const input = { name: "Wallet", type: "CASH", currency: "LKR", initialBalance: "0", color: "#4744f7", theme: "indigo", creditLimit: "5000", interestRate: "3" };
    await redirectOf(() => accounts.saveAccount({}, form(input)));
    const created = h.fake.tables.Account.find((a) => a.name === "Wallet");
    assert.equal(created?.sortOrder, 2);
    assert.equal(created?.creditLimit, null);
    await redirectOf(() => accounts.saveAccount({}, form({ ...input, name: "Visa", type: "CREDIT_CARD" })));
    const card = h.fake.tables.Account.find((a) => a.name === "Visa");
    assert.equal(card?.creditLimit, 500000);
    assert.equal(card?.interestRate, 3);
  });
});

describe("budgets", () => {
  it("sets, changes and removes a monthly limit for an expense category", async () => {
    await budgets.saveBudget({}, form({ categoryId: "c1", currency: "LKR", amount: "25,000" }));
    assert.equal(h.fake.tables.Budget[0].amount, 2500000);
    await budgets.saveBudget({}, form({ categoryId: "c1", currency: "LKR", amount: "30000" }));
    assert.equal(h.fake.tables.Budget.length, 1);
    assert.equal(h.fake.tables.Budget[0].amount, 3000000);
    const removed = await budgets.saveBudget({}, form({ categoryId: "c1", currency: "LKR", amount: "" }));
    assert.equal(removed.message, "Budget removed");
    assert.equal(h.fake.tables.Budget.length, 0);
  });

  it("rejects an income category, someone else's category and a bad amount", async () => {
    assert.ok((await budgets.saveBudget({}, form({ categoryId: "c2", currency: "LKR", amount: "100" }))).error);
    h.fake.seed("Category", [{ id: "cx", userId: "other", type: "EXPENSE", name: "Theirs" }]);
    assert.ok((await budgets.saveBudget({}, form({ categoryId: "cx", currency: "LKR", amount: "100" }))).error);
    assert.ok((await budgets.saveBudget({}, form({ categoryId: "c1", currency: "LKR", amount: "abc" }))).fieldErrors?.amount);
    assert.equal(h.fake.tables.Budget?.length ?? 0, 0);
  });
});

describe("goals", () => {
  const input = { name: "Phone", currency: "LKR", targetAmount: "100,000", targetDate: "2026-12-31", accountId: "" };

  it("creates a goal, and a goal that follows a savings account in the same currency", async () => {
    await goals.saveGoal({}, form(input));
    assert.equal(h.fake.tables.SavingsGoal[0].targetAmount, 10000000);
    await goals.saveGoal({}, form({ ...input, name: "Followed", accountId: "a2" }));
    assert.equal(h.fake.tables.SavingsGoal[1].accountId, "a2");
    assert.ok((await goals.saveGoal({}, form({ ...input, accountId: "x1" }))).error, "someone else's account");
    assert.ok((await goals.saveGoal({}, form({ ...input, currency: "USD", accountId: "a2" }))).fieldErrors?.accountId, "currency must match");
  });

  it("adds money by hand, never below zero, and refuses goals that follow an account", async () => {
    h.fake.seed("SavingsGoal", [{ id: "g1", userId: "u1", name: "Phone", currency: "LKR", savedAmount: 1000, accountId: null }, { id: "g2", userId: "u1", name: "Linked", currency: "LKR", savedAmount: 0, accountId: "a2" }]);
    await goals.addToGoal("g1", "50.00");
    assert.equal(h.fake.tables.SavingsGoal[0].savedAmount, 6000);
    await goals.addToGoal("g1", "-9999");
    assert.equal(h.fake.tables.SavingsGoal[0].savedAmount, 0);
    assert.ok((await goals.addToGoal("g2", "10")).error);
    assert.ok((await goals.addToGoal("g1", "0")).error);
  });
});

describe("cards", () => {
  it("links a card to the user's own account only, and never twice", async () => {
    const input = { accountId: "a1", last4: "8663", network: "VISA", name: "Debit" };
    assert.equal((await cards.addCard({}, form(input))).ok, true);
    assert.equal(h.fake.tables.Card[0].userId, "u1");
    assert.equal((await cards.addCard({}, form({ ...input, accountId: "x1" }))).error, "Account not found.");
    assert.ok((await cards.addCard({}, form({ ...input, last4: "12" }))).fieldErrors?.last4);
    assert.ok((await cards.addCard({}, form({ ...input, network: "DINERS" }))).fieldErrors?.network);
  });

  it("removes only the user's own card", async () => {
    h.fake.seed("Card", [{ id: "k1", userId: "u1", accountId: "a1", last4: "1111" }, { id: "k2", userId: "other", accountId: "x1", last4: "2222" }]);
    assert.equal((await cards.deleteCard("k2")).error, "Card not found.");
    assert.equal((await cards.deleteCard("k1")).ok, true);
    assert.equal(h.fake.tables.Card.length, 1);
  });
});
