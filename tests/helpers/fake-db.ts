/**
 * A tiny in-memory stand-in for the Supabase client, enough for the queries the server actions make:
 * from().select/insert/update/delete/upsert with eq/neq/in/is/not/lt/lte/gt/gte filters, order, limit,
 * single/maybeSingle, plus rpc() handlers. Embedded selects ("owner:User(name)") are not emulated.
 */
export type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;
export type Result = { data: unknown; error: { message: string; code?: string } | null; count?: number };

class Query implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private onConflict: string[] = [];
  private wantRows = false;
  private max: number | null = null;
  private orderBy: { column: string; ascending: boolean }[] = [];
  private mode: "one" | "maybe" | null = null;
  private count = false;
  private head = false;

  constructor(private db: FakeDb, private table: string) {}

  select(_columns?: string, opts?: { count?: string; head?: boolean }) { this.wantRows = true; if (opts?.count) this.count = true; if (opts?.head) this.head = true; return this; }
  insert(payload: Row | Row[]) { this.op = "insert"; this.payload = payload; return this; }
  update(payload: Row) { this.op = "update"; this.payload = payload; return this; }
  delete() { this.op = "delete"; return this; }
  upsert(payload: Row | Row[], opts?: { onConflict?: string }) { this.op = "upsert"; this.payload = payload; this.onConflict = (opts?.onConflict ?? "id").split(","); return this; }

  eq(column: string, value: unknown) { this.filters.push((r) => r[column] === value); return this; }
  neq(column: string, value: unknown) { this.filters.push((r) => r[column] !== value); return this; }
  in(column: string, values: unknown[]) { this.filters.push((r) => values.includes(r[column])); return this; }
  is(column: string, value: unknown) { this.filters.push((r) => (r[column] ?? null) === value); return this; }
  not(column: string, op: string, value: unknown) { if (op === "is") this.filters.push((r) => (r[column] ?? null) !== value); return this; }
  gt(column: string, value: string | number) { this.filters.push((r) => (r[column] as string | number) > value); return this; }
  gte(column: string, value: string | number) { this.filters.push((r) => (r[column] as string | number) >= value); return this; }
  lt(column: string, value: string | number) { this.filters.push((r) => (r[column] as string | number) < value); return this; }
  lte(column: string, value: string | number) { this.filters.push((r) => (r[column] as string | number) <= value); return this; }
  /** PostgREST "a.eq.1,b.eq.2" (only eq and in-free terms): a row passes when any term matches. */
  or(expression: string) {
    const terms = expression.split(",").map((t) => t.split("."));
    this.filters.push((r) => terms.some(([column, op, ...value]) => op === "eq" && String(r[column]) === value.join(".")));
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }) { this.orderBy.push({ column, ascending: opts?.ascending ?? true }); return this; }
  limit(n: number) { this.max = n; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }
  single() { this.mode = "one"; return this; }

  then<A, B>(onfulfilled?: ((value: Result) => A | PromiseLike<A>) | null, onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): Result {
    const rows = this.db.tables[this.table] ?? (this.db.tables[this.table] = []);
    const matching = () => rows.filter((r) => this.filters.every((f) => f(r)));
    let out: Row[] = [];
    if (this.op === "insert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const hook = this.db.onInsert[this.table];
      for (const item of list) {
        const error = hook?.(item, rows);
        if (error) return { data: null, error };
        const row = { id: `${this.table}-${this.db.nextId++}`, ...item };
        rows.push(row);
        out.push(row);
      }
    } else if (this.op === "upsert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      for (const item of list) {
        const existing = rows.find((r) => this.onConflict.every((c) => r[c] === item[c]));
        if (existing) Object.assign(existing, item);
        else rows.push({ id: `${this.table}-${this.db.nextId++}`, ...item });
      }
    } else if (this.op === "update") {
      out = matching();
      for (const r of out) Object.assign(r, this.payload);
    } else if (this.op === "delete") {
      out = matching();
      this.db.tables[this.table] = rows.filter((r) => !out.includes(r));
      // Like ON DELETE CASCADE: rows that point at what was deleted go too.
      for (const [child, column] of this.db.cascades[this.table] ?? []) {
        const ids = out.map((r) => r.id);
        this.db.tables[child] = (this.db.tables[child] ?? []).filter((r) => !ids.includes(r[column]));
      }
    } else {
      out = matching();
    }
    for (const { column, ascending } of [...this.orderBy].reverse()) {
      out = [...out].sort((a, b) => ((a[column] as string) < (b[column] as string) ? -1 : (a[column] as string) > (b[column] as string) ? 1 : 0) * (ascending ? 1 : -1));
    }
    if (this.max !== null) out = out.slice(0, this.max);
    if (this.count) return { data: this.head ? null : out.map((r) => ({ ...r })), error: null, count: out.length };
    if (this.mode) return { data: out[0] ? { ...out[0] } : null, error: null };
    return { data: this.op === "select" || this.wantRows ? out.map((r) => ({ ...r })) : null, error: null };
  }
}

export class FakeDb {
  tables: Record<string, Row[]> = {};
  nextId = 1;
  rpcHandlers: Record<string, (args: Row) => unknown> = {};
  onInsert: Record<string, (row: Row, rows: Row[]) => { message: string; code?: string } | undefined> = {};
  rpcCalls: { name: string; args: Row }[] = [];
  /** table -> [child table, column] pairs removed along with a deleted row. */
  cascades: Record<string, [string, string][]> = { Transaction: [["TransactionTag", "transactionId"]] };

  from(table: string) { return new Query(this, table); }

  rpc(name: string, args: Row) {
    this.rpcCalls.push({ name, args });
    const handler = this.rpcHandlers[name];
    const data = handler ? handler(args) : null;
    return Promise.resolve({ data, error: null } as Result);
  }

  seed(table: string, rows: Row[]) { this.tables[table] = [...(this.tables[table] ?? []), ...rows.map((r) => ({ ...r }))]; return this; }
}
