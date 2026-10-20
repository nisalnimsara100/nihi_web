import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { form, installMocks, redirectOf } from "./helpers/harness";

const h = installMocks();
const actions = await import("@/actions/transactions");

const base = { type: "EXPENSE", amount: "1,250.50", accountId: "a1", categoryId: "c1", date: "2026-10-19", note: "Keells" };

beforeEach(() => {
  h.reset();
  h.fake
    .seed("Account", [
      { id: "a1", userId: "u1", currency: "LKR" },
      { id: "a2", userId: "u1", currency: "USD" },
      { id: "x1", userId: "other", currency: "LKR" },
    ])
    .seed("Category", [
      { id: "c1", userId: "u1", type: "EXPENSE" },
      { id: "c2", userId: "u1", type: "INCOME" },
    ])
    .seed("Card", [{ id: "k1", userId: "u1", accountId: "a1" }]);
  h.fake.rpcHandlers.save_transaction = () => "t1";
});

describe("saveTransaction", () => {
  it("saves an expense in minor units on the user's own account, then goes to the list", async () => {
    const to = await redirectOf(() => actions.saveTransaction({}, form({ ...base, cardId: "k1" })));
    assert.equal(to, "/transactions");
    const call = h.fake.rpcCalls[0];
    assert.equal(call.name, "save_transaction");
    assert.equal(call.args.p_amount, 125050);
    assert.equal(call.args.p_user_id, "u1");
    assert.equal(call.args.p_account_id, "a1");
    assert.equal(call.args.p_card_id, "k1");
    assert.equal(call.args.p_to_account_id, null);
  });

  it("refuses an account that belongs to someone else", async () => {
    const result = await actions.saveTransaction({}, form({ ...base, accountId: "x1" }));
    assert.equal(result.error, "Account not found.");
    assert.equal(h.fake.rpcCalls.length, 0);
  });

  it("refuses a category of the other type", async () => {
    const result = await actions.saveTransaction({}, form({ ...base, categoryId: "c2" }));
    assert.deepEqual(result.fieldErrors?.categoryId, ["Choose a category of the same type"]);
  });

  it("refuses a card that is not linked to the chosen account", async () => {
    const result = await actions.saveTransaction({}, form({ ...base, accountId: "a2", cardId: "k1" }));
    assert.deepEqual(result.fieldErrors?.cardId, ["Choose a card linked to this account"]);
  });

  it("rejects a zero or invalid amount", async () => {
    for (const amount of ["0", "abc", "-5", ""]) {
      const result = await actions.saveTransaction({}, form({ ...base, amount }));
      assert.ok(result.fieldErrors?.amount, `amount "${amount}" should be rejected`);
    }
    assert.equal(h.fake.rpcCalls.length, 0);
  });

  it("needs a different destination for a transfer", async () => {
    const same = await actions.saveTransaction({}, form({ ...base, type: "TRANSFER", toAccountId: "a1" }));
    assert.deepEqual(same.fieldErrors?.toAccountId, ["Pick a different account"]);
    const none = await actions.saveTransaction({}, form({ ...base, type: "TRANSFER" }));
    assert.deepEqual(none.fieldErrors?.toAccountId, ["Choose where the money goes"]);
  });

  it("sends a transfer's received amount, defaulting to the amount sent, and no category", async () => {
    await redirectOf(() => actions.saveTransaction({}, form({ ...base, type: "TRANSFER", toAccountId: "a2" })));
    const args = h.fake.rpcCalls[0].args;
    assert.equal(args.p_to_account_id, "a2");
    assert.equal(args.p_to_amount, 125050);
    assert.equal(args.p_category_id, null);
    assert.equal(args.p_card_id, null);
    await redirectOf(() => actions.saveTransaction({}, form({ ...base, type: "TRANSFER", toAccountId: "a2", toAmount: "4.00" })));
    assert.equal(h.fake.rpcCalls[1].args.p_to_amount, 400);
  });

  it("does nothing when nobody is signed in", async () => {
    h.state.userId = null;
    const to = await redirectOf(() => actions.saveTransaction({}, form(base)));
    assert.equal(to, "/login");
    assert.equal(h.fake.rpcCalls.length, 0);
  });
});

describe("syncQueuedTransaction (offline queue)", () => {
  it("adds a queued entry without redirecting, and ignores an id so it can only create", async () => {
    const entries = Object.entries({ ...base, id: "existing" }) as [string, string][];
    const result = await actions.syncQueuedTransaction(entries);
    assert.equal(result.ok, true);
    assert.equal(h.fake.rpcCalls[0].args.p_id, null);
  });

  it("reports why an entry could not be added", async () => {
    const result = await actions.syncQueuedTransaction(Object.entries({ ...base, accountId: "x1" }) as [string, string][]);
    assert.equal(result.error, "Account not found.");
  });
});

describe("delete, undo and bulk changes", () => {
  const tx = (id: string, extra = {}) => ({ id, userId: "u1", type: "EXPENSE", amount: 1000, toAmount: null, accountId: "a1", toAccountId: null, categoryId: "c1", cardId: null, date: "2026-10-19T12:00:00.000Z", note: id, createdAt: "2026-10-19T12:00:00.000Z", ...extra });

  it("returns what it deleted so the delete can be undone, and only deletes the user's own", async () => {
    h.fake.seed("Transaction", [tx("t1"), tx("t2", { userId: "other" })]).seed("TransactionTag", [{ transactionId: "t1", tagId: "g1" }]);
    const result = await actions.deleteTransactions(["t1", "t2"]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.snapshots?.map((s) => s.id), ["t1"]);
    assert.deepEqual(result.snapshots?.[0].tagIds, ["g1"]);
    assert.deepEqual(h.fake.tables.Transaction.map((r) => r.id), ["t2"]);
  });

  it("restores a deleted transaction with the same id and tags, dropping a category that no longer exists", async () => {
    h.fake.seed("Transaction", [tx("t1", { categoryId: "gone" })]).seed("Tag", [{ id: "g1", userId: "u1" }]).seed("TransactionTag", [{ transactionId: "t1", tagId: "g1" }]);
    const deleted = await actions.deleteTransactions(["t1"]);
    const restored = await actions.restoreTransactions(deleted.snapshots!);
    assert.equal(restored.ok, true);
    const row = h.fake.tables.Transaction.find((r) => r.id === "t1");
    assert.ok(row);
    assert.equal(row.categoryId, null);
    assert.equal(row.userId, "u1");
    assert.deepEqual(h.fake.tables.TransactionTag.map((r) => r.tagId), ["g1"]);
  });

  it("will not restore onto an account the user does not own", async () => {
    const forged = { ...tx("t9"), accountId: "x1", tagIds: [] as string[] };
    const result = await actions.restoreTransactions([forged as never]);
    assert.match(result.error ?? "", /no longer exists/);
    assert.equal(h.fake.tables.Transaction?.length ?? 0, 0);
  });

  it("sets a category on matching transactions and skips transfers and other types", async () => {
    h.fake.seed("Transaction", [tx("t1", { categoryId: null }), tx("t2", { type: "TRANSFER", categoryId: null }), tx("t3", { type: "INCOME", categoryId: null })]);
    const result = await actions.setTransactionsCategory(["t1", "t2", "t3"], "c1");
    assert.equal(result.ok, true);
    assert.equal(h.fake.tables.Transaction.find((r) => r.id === "t1")?.categoryId, "c1");
    assert.equal(h.fake.tables.Transaction.find((r) => r.id === "t2")?.categoryId, null);
    assert.equal(h.fake.tables.Transaction.find((r) => r.id === "t3")?.categoryId, null);
    assert.match(result.detail ?? "", /2 skipped/);
  });
});

describe("splitTransaction", () => {
  beforeEach(() => {
    h.fake.seed("Transaction", [
      { id: "t1", userId: "u1", type: "EXPENSE", amount: 1000 },
      { id: "t2", userId: "u1", type: "TRANSFER", amount: 1000 },
    ]);
    h.fake.rpcHandlers.split_transaction = () => ["n1", "n2"];
  });

  it("splits into parts that add up", async () => {
    const result = await actions.splitTransaction({ id: "t1", parts: [{ amount: 600, categoryId: "c1", note: "a" }, { amount: 400, categoryId: "", note: "b" }] });
    assert.equal(result.ok, true);
    assert.equal(h.fake.rpcCalls[0].name, "split_transaction");
  });

  it("refuses parts that do not add up, a transfer, one part, and a category of the wrong type", async () => {
    const part = (amount: number, categoryId = "") => ({ amount, categoryId, note: "" });
    assert.match((await actions.splitTransaction({ id: "t1", parts: [part(600), part(300)] })).error ?? "", /add up/);
    assert.match((await actions.splitTransaction({ id: "t2", parts: [part(500), part(500)] })).error ?? "", /transfer/i);
    assert.ok((await actions.splitTransaction({ id: "t1", parts: [part(1000)] })).error);
    assert.match((await actions.splitTransaction({ id: "t1", parts: [part(500, "c2"), part(500)] })).error ?? "", /same type/);
    assert.equal(h.fake.rpcCalls.length, 0);
  });

  it("cannot split someone else's transaction", async () => {
    h.fake.seed("Transaction", [{ id: "tx", userId: "other", type: "EXPENSE", amount: 1000 }]);
    const result = await actions.splitTransaction({ id: "tx", parts: [{ amount: 500, categoryId: "", note: "" }, { amount: 500, categoryId: "", note: "" }] });
    assert.equal(result.error, "Transaction not found.");
  });
});

describe("findSimilar", () => {
  it("finds the same amount on the same account within a day, never another user's or another account's", async () => {
    h.fake.seed("Transaction", [
      { id: "t1", userId: "u1", accountId: "a1", type: "EXPENSE", amount: 5000, date: "2026-10-19T12:00:00.000Z", note: "Lunch", category: { name: "Food" } },
      { id: "t2", userId: "u1", accountId: "a1", type: "EXPENSE", amount: 5000, date: "2026-10-10T12:00:00.000Z", note: "old" },
      { id: "t3", userId: "other", accountId: "a1", type: "EXPENSE", amount: 5000, date: "2026-10-19T12:00:00.000Z", note: "theirs" },
      { id: "t4", userId: "u1", accountId: "a2", type: "EXPENSE", amount: 5000, date: "2026-10-19T12:00:00.000Z", note: "other account" },
    ]);
    const found = await actions.findSimilar({ type: "EXPENSE", amount: 5000, accountId: "a1", day: "2026-10-19" });
    assert.deepEqual(found.map((f) => f.id), ["t1"]);
    assert.equal(found[0].category, "Food");
  });
});
