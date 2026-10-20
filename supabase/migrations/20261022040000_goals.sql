-- A savings goal: "save Rs. 100,000 by December". Progress is the balance of a linked savings
-- account, or, without a link, the amount the user has put in by hand ("savedAmount").
create table public."SavingsGoal" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User" ("id") on delete cascade,
  "name" text not null,
  "currency" text not null,
  "targetAmount" integer not null check ("targetAmount" > 0),
  "targetDate" date,
  "accountId" text references public."Account" ("id") on delete set null,
  "savedAmount" integer not null default 0 check ("savedAmount" >= 0),
  "createdAt" timestamptz not null default now()
);
create index "SavingsGoal_userId_idx" on public."SavingsGoal" ("userId");
alter table public."SavingsGoal" enable row level security;
