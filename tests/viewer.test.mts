import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { FakeDb } from "./helpers/fake-db";
import { RedirectError } from "./helpers/harness";

const fake = new FakeDb();
const state = { session: "partner" as string | null, view: null as string | null };

mock.module("server-only", { namedExports: {} });
mock.module("react", { namedExports: { cache: <T,>(fn: T) => fn } });
mock.module("next/navigation", { namedExports: { redirect: (url: string) => { throw new RedirectError(url); } } });
mock.module("@/lib/db", {
  namedExports: {
    db: () => fake,
    run: async (q: PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data;
    },
  },
});
mock.module("@/lib/session", { namedExports: { getSessionUserId: async () => state.session, getViewCookie: async () => state.view } });

const auth = await import("@/lib/auth");

const owner = { id: "owner", name: "Owner", email: "owner@x.com", defaultCurrency: "LKR" };
const partner = { id: "partner", name: "Partner", email: "partner@x.com", defaultCurrency: "LKR" };
const accepted = { ownerId: "owner", partnerId: "partner", acceptedAt: "2026-10-01T00:00:00Z", owner };

beforeEach(() => {
  fake.tables = {};
  fake.seed("User", [owner, partner]);
  Object.assign(state, { session: "partner", view: null });
});

describe("getViewer: whose data a signed-in user sees", () => {
  it("shows the user's own data by default", async () => {
    const v = await auth.getViewer();
    assert.equal(v.owner.id, "partner");
    assert.equal(v.readOnly, false);
  });

  it("shows an owner's data, read-only, while a share is accepted", async () => {
    fake.seed("PartnerShare", [accepted]);
    state.view = "owner";
    const v = await auth.getViewer();
    assert.equal(v.owner.id, "owner");
    assert.equal(v.user.id, "partner");
    assert.equal(v.readOnly, true);
  });

  it("falls back to the user's own data when there is no accepted share for this pair", async () => {
    state.view = "owner";
    // no share at all, a share still waiting, or one accepted by somebody else
    for (const rows of [[], [{ ...accepted, acceptedAt: null }], [{ ...accepted, partnerId: "someone-else" }]]) {
      fake.tables.PartnerShare = rows;
      const v = await auth.getViewer();
      assert.equal(v.owner.id, "partner");
      assert.equal(v.readOnly, false);
    }
  });

  it("access ends the moment the owner removes the share, even with the view cookie still set", async () => {
    fake.seed("PartnerShare", [accepted]);
    state.view = "owner";
    assert.equal((await auth.getViewer()).readOnly, true);
    fake.tables.PartnerShare = [];
    assert.equal((await auth.getViewer()).readOnly, false);
  });

  it("sends a signed-out visitor to the login page", async () => {
    state.session = null;
    await assert.rejects(() => auth.getViewer(), (e: unknown) => e instanceof RedirectError && e.url === "/login");
  });
});

describe("requireOwnView and requireUserId", () => {
  it("keeps a partner who is viewing someone else out of create and edit pages", async () => {
    fake.seed("PartnerShare", [accepted]);
    state.view = "owner";
    await assert.rejects(() => auth.requireOwnView(), (e: unknown) => e instanceof RedirectError && e.url === "/dashboard");
    state.view = null;
    assert.equal((await auth.requireOwnView()).readOnly, false);
  });

  it("actions always act as the signed-in user, never the owner being viewed", async () => {
    state.view = "owner";
    assert.equal(await auth.requireUserId(), "partner");
  });
});

describe("the demo account", () => {
  it("cannot be used on the live site, even with an old session", async () => {
    fake.seed("User", [{ id: "demo", name: "Demo", email: "demo@nihi.app", defaultCurrency: "LKR" }]);
    state.session = "demo";
    const before = process.env.VERCEL_ENV;
    try {
      process.env.VERCEL_ENV = "production";
      await assert.rejects(() => auth.getCurrentUser(), (e: unknown) => e instanceof RedirectError && e.url === "/login");
      process.env.VERCEL_ENV = "development";
      assert.equal((await auth.getCurrentUser()).email, "demo@nihi.app");
    } finally {
      if (before === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = before;
    }
  });
});
