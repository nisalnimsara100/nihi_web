import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { form, installMocks, redirectOf } from "./helpers/harness";

const h = installMocks();
const actions = await import("@/actions/sharing");

const future = () => new Date(Date.now() + 3 * 86_400_000).toISOString();
const past = () => new Date(Date.now() - 86_400_000).toISOString();
const share = (extra = {}) => ({ id: "s1", ownerId: "owner", email: "p@x.com", token: "tok", partnerId: null, acceptedAt: null, expiresAt: future(), ...extra });

beforeEach(() => {
  h.reset();
  h.state.userId = "partner";
  h.fake.seed("User", [{ id: "owner", email: "owner@x.com", name: "Owner" }, { id: "partner", email: "other@x.com", name: "Partner" }]);
});

describe("acceptInvite", () => {
  it("connects whoever opens a valid link first, with any email, and starts viewing the owner", async () => {
    h.fake.seed("PartnerShare", [share()]);
    const to = await redirectOf(() => actions.acceptInvite("tok"));
    assert.equal(to, "/dashboard");
    assert.equal(h.fake.tables.PartnerShare[0].partnerId, "partner");
    assert.ok(h.fake.tables.PartnerShare[0].acceptedAt);
    assert.equal(h.state.viewCookie, "owner");
  });

  it("refuses an expired, used, unknown or own invite", async () => {
    h.fake.seed("PartnerShare", [share({ id: "s1", token: "old", expiresAt: past() }), share({ id: "s2", token: "used", partnerId: "someone-else", email: "q@x.com" }), share({ id: "s3", token: "mine", ownerId: "partner", email: "r@x.com" })]);
    for (const token of ["old", "used", "nope", "mine"]) {
      const to = await redirectOf(() => actions.acceptInvite(token));
      assert.equal(to, `/invite/${token}`, `token ${token} should bounce back to the invite page`);
    }
    assert.match(h.state.flashes.map((f) => f.title).join("|"), /expired/);
    assert.equal(h.fake.tables.PartnerShare.filter((s) => s.partnerId === "partner").length, 0);
    assert.equal(h.state.viewCookie, null);
  });

  it("lets the same partner open an accepted invite again, since the link is theirs", async () => {
    h.fake.seed("PartnerShare", [share({ partnerId: "partner", acceptedAt: past(), expiresAt: past() })]);
    assert.equal(await redirectOf(() => actions.acceptInvite("tok")), "/dashboard");
  });
});

describe("invitePartner and renewInvite", () => {
  it("creates a one-week invite with a fresh secret and never lets you invite yourself", async () => {
    h.state.userId = "owner";
    const own = await actions.invitePartner({}, form({ email: "OWNER@x.com" }));
    assert.deepEqual(own.fieldErrors?.email, ["That's your own email"]);
    const result = await actions.invitePartner({}, form({ email: "Friend@X.com" }));
    assert.equal(result.ok, true);
    const row = h.fake.tables.PartnerShare[0];
    assert.equal(row.email, "friend@x.com");
    assert.equal(row.ownerId, "owner");
    assert.ok((row.token as string).length >= 24);
    const days = (new Date(row.expiresAt as string).getTime() - Date.now()) / 86_400_000;
    assert.ok(days > 6.9 && days <= 7, `expires in ${days} days`);
    assert.match(result.detail ?? "", /WhatsApp/);
  });

  it("inviting again replaces the link, so the old one stops working", async () => {
    h.state.userId = "owner";
    await actions.invitePartner({}, form({ email: "friend@x.com" }));
    const first = h.fake.tables.PartnerShare[0].token;
    await actions.invitePartner({}, form({ email: "friend@x.com" }));
    assert.equal(h.fake.tables.PartnerShare.length, 1);
    assert.notEqual(h.fake.tables.PartnerShare[0].token, first);
  });

  it("renews only the owner's own pending invites", async () => {
    h.fake.seed("PartnerShare", [share({ id: "s1", ownerId: "owner", expiresAt: past() }), share({ id: "s2", ownerId: "someone", token: "t2" }), share({ id: "s3", ownerId: "owner", token: "t3", partnerId: "p", acceptedAt: past() })]);
    h.state.userId = "owner";
    assert.equal((await actions.renewInvite("s1")).ok, true);
    assert.notEqual(h.fake.tables.PartnerShare[0].token, "tok");
    assert.ok(new Date(h.fake.tables.PartnerShare[0].expiresAt as string).getTime() > Date.now());
    assert.ok((await actions.renewInvite("s2")).error, "someone else's invite");
    assert.ok((await actions.renewInvite("s3")).error, "an invite already accepted");
  });
});

describe("leaving and removing", () => {
  it("only the owner can remove a share, and only the partner can leave it", async () => {
    h.fake.seed("PartnerShare", [share({ partnerId: "partner", acceptedAt: past() })]);
    h.state.userId = "stranger";
    await actions.removeShare("s1");
    await actions.leaveShare("s1");
    assert.equal(h.fake.tables.PartnerShare.length, 1);
    h.state.userId = "partner";
    h.state.viewCookie = "owner";
    await actions.leaveShare("s1");
    assert.equal(h.fake.tables.PartnerShare.length, 0);
  });
});

describe("viewAs", () => {
  it("only switches to an owner who really shared with you", async () => {
    h.fake.seed("PartnerShare", [share({ partnerId: "partner", acceptedAt: past() })]);
    assert.equal(await redirectOf(() => actions.viewAs("owner")), "/dashboard");
    assert.equal(h.state.viewCookie, "owner");
    h.state.viewCookie = null;
    await redirectOf(() => actions.viewAs("not-shared"));
    assert.equal(h.state.viewCookie, null);
  });
});
