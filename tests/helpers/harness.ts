import { mock } from "node:test";
import { FakeDb } from "./fake-db";

export class RedirectError extends Error {
  constructor(public url: string) {
    super(`redirect:${url}`);
  }
}

export type Harness = {
  fake: FakeDb;
  /** The signed-in user the actions see. */
  state: { userId: string | null; redirects: string[]; flashes: { type: string; title: string; description?: string }[]; viewCookie: string | null; mail: boolean; accounts: unknown[] };
  /** Clears every table and recorded call, ready for the next test. */
  reset(): void;
};

/**
 * Replaces everything a Server Action touches outside itself (database, session, Next's cache and
 * redirect) with controllable fakes. Call before importing the action module, in the same test file.
 */
export function installMocks(): Harness {
  const fake = new FakeDb();
  const state: Harness["state"] = { userId: "u1", redirects: [], flashes: [], viewCookie: null, mail: false, accounts: [] };

  const run = async (query: PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  };

  mock.module("server-only", { namedExports: {} });
  mock.module("@/lib/db", { namedExports: { db: () => fake, run, isId: (v: string) => /^[\w-]+$/.test(v), UNIQUE_VIOLATION: "23505" } });
  mock.module("@/lib/auth", {
    namedExports: {
      requireUserId: async () => {
        if (!state.userId) throw new RedirectError("/login");
        return state.userId;
      },
    },
  });
  mock.module("@/lib/flash", { namedExports: { flash: async (m: { type: string; title: string; description?: string }) => state.flashes.push(m) } });
  mock.module("next/cache", { namedExports: { revalidatePath: () => {} } });
  mock.module("next/navigation", {
    namedExports: {
      redirect: (url: string) => {
        state.redirects.push(url);
        throw new RedirectError(url);
      },
    },
  });
  mock.module("@/lib/session", {
    namedExports: {
      getViewCookie: async () => state.viewCookie,
      setViewCookie: async (id: string) => {
        state.viewCookie = id;
      },
      clearViewCookie: async () => {
        state.viewCookie = null;
      },
    },
  });
  mock.module("@/lib/mail", { namedExports: { mailConfigured: () => state.mail, sendMail: async () => {} } });
  mock.module("@/lib/site", { namedExports: { getOrigin: async () => "https://nihi.test" } });
  mock.module("@/lib/data", { namedExports: { getAccounts: async () => state.accounts } });

  return {
    fake,
    state,
    reset() {
      fake.tables = {};
      fake.nextId = 1;
      fake.rpcHandlers = {};
      fake.onInsert = {};
      fake.rpcCalls = [];
      Object.assign(state, { userId: "u1", redirects: [], flashes: [], viewCookie: null, mail: false, accounts: [] });
    },
  };
}

/** Runs an action that ends by redirecting and returns where it went (null when it returned normally). */
export async function redirectOf(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (error) {
    if (error instanceof RedirectError) return error.url;
    throw error;
  }
}

export function form(entries: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}
