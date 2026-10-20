import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { form, installMocks, redirectOf } from "./helpers/harness";

const h = installMocks();
const actions = await import("@/actions/recurring");

const rule = { id: "r1", userId: "u1", type: "EXPENSE", amount: 25000, toAmount: null, accountId: "a1", toAccountId: null, categoryId: "c1", note: "Rent", frequency: "MONTHLY", anchorDay: 25, nextDate: "2026-10-25", endDate: null, active: true };

beforeEach(() => {
  h.reset();
  h.fake.seed("Account", [{ id: "a1", userId: "u1", currency: "LKR" }, { id: "a2", userId: "u1", currency: "LKR" }, { id: "x1", userId: "other", currency: "LKR" }]).seed("Category", [{ id: "c1", userId: "u1", type: "EXPENSE" }]);
  h.fake.rpcHandlers.save_transaction = () => "t1";
});

describe("confirm and skip", () => {
  it("adds the waiting occurrence dated on its due day, then moves to the next month", async () => {
    h.fake.seed("Recurring", [{ ...rule }]);
    const result = await actions.confirmRecurring("r1");
    assert.equal(result.ok, true);
    const args = h.fake.rpcCalls[0].args;
    assert.equal(args.p_amount, 25000);
    assert.equal(args.p_date, "2026-10-25T12:00:00.000Z");
    assert.equal(args.p_note, "Rent");
    assert.equal(h.fake.tables.Recurring[0].nextDate, "2026-11-25");
  });

  it("cannot add the same occurrence twice (double tap or two devices)", async () => {
    h.fake.seed("Recurring", [{ ...rule }]);
    await actions.confirmRecurring("r1");
    // The second tap still carries the old date; the rule has already moved on, so it is not a "waiting" occurrence...
    const again = await actions.confirmRecurring("r1");
    assert.equal(again.ok, true, "the next occurrence is a different one");
    assert.equal(h.fake.rpcCalls.length, 2);
    assert.equal(h.fake.rpcCalls[1].args.p_date, "2026-11-25T12:00:00.000Z");
  });

  it("loses a race: if another device moved the rule between the read and the claim, nothing is added", async () => {
    h.fake.seed("Recurring", [{ ...rule }]);
    const original = h.fake.from.bind(h.fake);
    let calls = 0;
    h.fake.from = (table: string) => {
      // The first Recurring call is the read; before the second (the claim) another device gets there first.
      if (table === "Recurring" && ++calls === 2) h.fake.tables.Recurring[0].nextDate = "2026-11-25";
      return original(table);
    };
    const result = await actions.confirmRecurring("r1");
    assert.equal(result.error, "This was already handled.");
    assert.equal(h.fake.rpcCalls.length, 0, "the transaction must not be added twice");
  });

  it("skip moves on without adding anything", async () => {
    h.fake.seed("Recurring", [{ ...rule }]);
    const result = await actions.skipRecurring("r1");
    assert.equal(result.ok, true);
    assert.equal(h.fake.rpcCalls.length, 0);
    assert.equal(h.fake.tables.Recurring[0].nextDate, "2026-11-25");
  });

  it("turns the rule off after its last date", async () => {
    h.fake.seed("Recurring", [{ ...rule, endDate: "2026-10-31" }]);
    await actions.confirmRecurring("r1");
    assert.equal(h.fake.tables.Recurring[0].active, false);
    const again = await actions.confirmRecurring("r1");
    assert.equal(again.error, "This was already handled.");
  });

  it("restores the rule if the transaction could not be saved", async () => {
    h.fake.seed("Recurring", [{ ...rule }]);
    h.fake.rpc = async () => ({ data: null, error: { message: "boom" } });
    await assert.rejects(() => actions.confirmRecurring("r1"), /boom/);
    assert.equal(h.fake.tables.Recurring[0].nextDate, "2026-10-25");
    assert.equal(h.fake.tables.Recurring[0].active, true);
  });

  it("never touches another user's rule", async () => {
    h.fake.seed("Recurring", [{ ...rule, userId: "other" }]);
    assert.equal((await actions.confirmRecurring("r1")).error, "This was already handled.");
    assert.equal(h.fake.rpcCalls.length, 0);
  });

  it("does not add a paused rule", async () => {
    h.fake.seed("Recurring", [{ ...rule, active: false }]);
    assert.equal((await actions.confirmRecurring("r1")).error, "This was already handled.");
  });
});

describe("saveRecurring", () => {
  const input = { type: "EXPENSE", amount: "25,000", accountId: "a1", categoryId: "c1", note: "Rent", frequency: "MONTHLY", nextDate: "2026-10-31", endDate: "" };

  it("creates a rule whose day-of-month anchor is the first date's day", async () => {
    const to = await redirectOf(() => actions.saveRecurring({}, form(input)));
    assert.equal(to, "/recurring");
    const row = h.fake.tables.Recurring[0];
    assert.equal(row.anchorDay, 31);
    assert.equal(row.amount, 2500000);
    assert.equal(row.userId, "u1");
    assert.equal(row.endDate, null);
  });

  it("rejects another user's account, a bad end date, and a transfer to the same account", async () => {
    assert.equal((await actions.saveRecurring({}, form({ ...input, accountId: "x1" }))).error, "Account not found.");
    assert.ok((await actions.saveRecurring({}, form({ ...input, endDate: "2026-10-01" }))).fieldErrors?.endDate);
    assert.ok((await actions.saveRecurring({}, form({ ...input, type: "TRANSFER", toAccountId: "a1" }))).fieldErrors?.toAccountId);
    assert.equal(h.fake.tables.Recurring?.length ?? 0, 0);
  });
});
