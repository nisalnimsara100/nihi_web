-- Repeating transactions (rent, salary, subscriptions, card payments). A rule never adds
-- anything by itself: when "nextDate" arrives the app lists it as due, and the user confirms
-- (adds it) or skips it. Either way "nextDate" moves on to the following occurrence.
create table public."Recurring" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User" ("id") on delete cascade,
  "type" public."TransactionType" not null,
  "amount" integer not null check ("amount" > 0),
  "toAmount" integer check ("toAmount" is null or "toAmount" > 0),
  "accountId" text not null references public."Account" ("id") on delete cascade,
  "toAccountId" text references public."Account" ("id") on delete cascade,
  "categoryId" text references public."Category" ("id") on delete set null,
  "note" text not null default '',
  "frequency" text not null check ("frequency" in ('WEEKLY', 'MONTHLY', 'YEARLY')),
  -- Day of the month the rule started on, so a rule that begins on the 31st keeps coming back
  -- on the last day of shorter months and returns to the 31st afterwards.
  "anchorDay" smallint not null check ("anchorDay" between 1 and 31),
  -- The next occurrence waiting to be added or skipped.
  "nextDate" date not null,
  "endDate" date,
  "active" boolean not null default true,
  "createdAt" timestamptz not null default now()
);
create index "Recurring_userId_idx" on public."Recurring" ("userId", "active", "nextDate");
alter table public."Recurring" enable row level security;
