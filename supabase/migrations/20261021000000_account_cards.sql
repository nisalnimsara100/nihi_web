-- Bank cards linked to an account. A payment made with a card is recorded on the
-- account it belongs to, so the account balance drops by the amount. Only the last
-- four digits are stored; the app never sees or keeps a full card number.
create table public."Card" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User" ("id") on delete cascade,
  "accountId" text not null references public."Account" ("id") on delete cascade,
  "last4" text not null check ("last4" ~ '^[0-9]{4}$'),
  -- Optional label, such as "Visa debit" or "Mom's card".
  "name" text not null default '',
  "createdAt" timestamptz not null default now(),
  unique ("accountId", "last4")
);
create index "Card_userId_idx" on public."Card" ("userId");
create index "Card_accountId_idx" on public."Card" ("accountId");

-- Same as every other table: the app reaches it only through the server's secret key.
alter table public."Card" enable row level security;
