-- A monthly spending limit for one expense category, in one currency. Spending is counted from
-- accounts in that currency. Amounts are minor units (cents), like the rest of the schema.
create table public."Budget" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User" ("id") on delete cascade,
  "categoryId" text not null references public."Category" ("id") on delete cascade,
  "currency" text not null,
  "amount" integer not null check ("amount" > 0),
  "createdAt" timestamptz not null default now(),
  unique ("userId", "categoryId", "currency")
);
create index "Budget_userId_idx" on public."Budget" ("userId");
alter table public."Budget" enable row level security;
